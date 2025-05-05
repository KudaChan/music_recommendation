import { detectMoodAndPreferences } from './mood';
import { getRecommendations } from './music';
import { Message, MoodAnalysis, Recommendation, ChatResponse } from '@/app/types';
import { generateChatResponse } from '@/app/lib/gemini/client';

// Main conversation agent that coordinates with other agents
export async function processConversation(message: string, history: Message[]): Promise<ChatResponse | null> {
  try {
    // 1. Add user message to history
    const updatedHistory = [...history, { role: 'user', content: message }];
    
    // 2. Determine conversation stage based on history
    const conversationStage = determineConversationStage(updatedHistory as Message[]);
    
    // 3. Process based on conversation stage
    if (conversationStage === 'initial' || conversationStage === 'gathering') {
      // Initial conversation or still gathering information
      return await handleGatheringStage(message, updatedHistory as Message[]);
    } else {
      // We have enough context to provide recommendations
      return await handleRecommendationStage(message, updatedHistory as Message[]);
    }
  } catch (error) {
    console.error('Conversation agent error:', error);
    throw error;
  }
}

// Determine what stage of the conversation we're in
function determineConversationStage(history: Message[]): 'initial' | 'gathering' | 'recommendation' {
  // If this is the first message, we're in the initial stage
  if (history.length <= 1) {
    return 'initial';
  }
  
  // If we have 2-3 exchanges, we're still gathering information
  if (history.length <= 5) {
    return 'gathering';
  }
  
  // Otherwise, we have enough context to make recommendations
  return 'recommendation';
}

// Handle the initial conversation and information gathering stage
async function handleGatheringStage(message: string, history: Message[]): Promise<ChatResponse> {
  try {
    // Generate a response that engages the user and gathers more information
    const promptForGathering = `
You are a friendly music recommendation assistant having a conversation with a user.
This is ${history.length <= 1 ? 'your first interaction' : 'an early interaction'} with them.

Your goal is to engage them in a brief conversation to better understand their mood and music preferences.
Ask them a question about how they're feeling, what kind of day they're having, or what music they typically enjoy.
Keep your response conversational, friendly, and concise (2-3 sentences).
Don't make any specific music recommendations yet.
`;

    // Generate conversational response
    const responseContent = await generateChatResponse(promptForGathering, history);
    
    // Perform a preliminary mood analysis (but don't use it for recommendations yet)
    const preliminaryMood = await detectMoodAndPreferences(message, history.slice(0, -1));
    
    // Get some default recommendations based on the preliminary mood
    // (we won't show these to the user yet)
    const defaultRecommendations = await getRecommendations(preliminaryMood);
    
    // Create response object
    const response: ChatResponse = {
      message: {
        role: 'assistant',
        content: responseContent
      },
      mood: preliminaryMood,
      recommendations: defaultRecommendations,
      history: [
        ...history,
        {
          role: 'assistant',
          content: responseContent
        }
      ]
    };
    
    return response;
  } catch (error) {
    console.error('Error in gathering stage:', error);
    throw error;
  }
}

// Handle the recommendation stage
async function handleRecommendationStage(message: string, history: Message[]): Promise<ChatResponse> {
  try {
    // 1. Start parallel processing of mood detection and initial chat response
    const [moodAnalysis, initialChatPromise] = await Promise.all([
      detectMoodAndPreferences(message, history.slice(0, -1)),
      generateInitialResponse(message, history)
    ]);
    
    // 2. Get music recommendations based on mood (can start as soon as mood is detected)
    const recommendationsPromise = getRecommendations(moodAnalysis);
    
    // 3. Wait for both initial chat and recommendations
    const [initialChat, recommendations] = await Promise.all([
      initialChatPromise,
      recommendationsPromise
    ]);
    
    // 4. Generate final response with recommendations
    const responseContent = await generateFinalResponse(
      initialChat,
      message, 
      history, 
      moodAnalysis, 
      recommendations
    );
    
    // 5. Create final response object
    const response: ChatResponse = {
      message: {
        role: 'assistant',
        content: responseContent
      },
      mood: moodAnalysis,
      recommendations,
      history: [
        ...history,
        {
          role: 'assistant',
          content: responseContent
        }
      ]
    };
    
    return response;
  } catch (error) {
    console.error('Error in recommendation stage:', error);
    throw error;
  }
}

// Generate an initial response without recommendations
async function generateInitialResponse(
  message: string,
  history: Message[]
): Promise<string> {
  try {
    if (process.env.USE_GEMINI === 'true') {
      const systemPrompt = `
You are a friendly music recommendation assistant. The user has just sent you this message.
Respond in a conversational way, acknowledging their message and indicating that you're 
finding music recommendations for them. Keep your response friendly and concise (1-2 sentences).
Don't recommend any specific songs yet - just acknowledge their message and indicate you're finding music.
`;
      return await generateChatResponse(systemPrompt, history);
    } else {
      return `I'm analyzing your message to find the perfect music for you...`;
    }
  } catch (error) {
    console.error('Error generating initial response:', error);
    return `I'm looking for some music recommendations for you...`;
  }
}

// Generate the final response with recommendations
async function generateFinalResponse(
  initialResponse: string,
  message: string, 
  history: Message[], 
  mood: MoodAnalysis, 
  recommendations: Recommendation[]
): Promise<string> {
  try {
    if (process.env.USE_GEMINI === 'true') {
      // Create a system prompt to guide Gemini's response
      const systemPrompt = `
You are a friendly music recommendation assistant. 
The user's current mood has been detected as: ${mood.primaryMood} (confidence: ${mood.confidence}).
Based on this mood, you have the following song recommendations:
${recommendations.map((rec, i) => `${i+1}. "${rec.title}" by ${rec.artist}`).join('\n')}

You previously responded with: "${initialResponse}"

Now, provide a more complete response that:
1. Builds on your initial response
2. Mentions their detected mood in a natural way
3. Recommends the first song in the list as your top pick
4. Keeps your response friendly and concise (2-3 sentences)
5. Doesn't list all songs, just mentions the top recommendation
`;

      // Get response from Gemini
      return await generateChatResponse(systemPrompt, history);
    } else {
      // Fallback to template response if Gemini is not enabled
      return `Based on our conversation, I sense you're feeling ${mood.primaryMood}. 
Here are some songs that might match your mood. My top recommendation is "${recommendations[0].title}" by ${recommendations[0].artist}.`;
    }
  } catch (error) {
    console.error('Error generating final response:', error);
    // Fallback response if Gemini fails
    return `I think you might enjoy "${recommendations[0].title}" by ${recommendations[0].artist} based on your current mood.`;
  }
}
