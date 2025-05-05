import { Message, MoodAnalysis } from '@/app/types'; // Assuming MoodAnalysis type is defined here
import { generateStructuredResponse } from '@/app/lib/gemini/client';

// Mood detection and preference extraction agent
export async function detectMoodAndPreferences(message: string, history: Message[]): Promise<MoodAnalysis> {
  try {
    // Use Gemini for analysis if enabled
    if (process.env.USE_GEMINI === 'true') {
      return await analyzeWithGemini(message, history);
    }

    // Fallback to keyword-based detection (will only provide basic mood)
    // NOTE: This fallback will not provide the enhanced genre/keyword data.
    // Consider enhancing this fallback or ensuring Gemini is enabled for better results.
    return keywordBasedMoodDetection(message);
  } catch (error) {
    console.error('Mood and preference analysis error:', error);
    // Return neutral mood as fallback with empty preferences
    return {
      primaryMood: 'neutral',
      moodScores: {},
      confidence: 0.5,
      moodKeywords: '',
      suggestedGenres: '',
      extractedKeywords: '',
      era: '' // Added era as a potential field
    };
  }
}

// Analyze mood and extract preferences using Gemini
async function analyzeWithGemini(message: string, history: Message[]): Promise<MoodAnalysis> {
  try {
    // Prepare conversation context
    const conversationContext = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const currentMessage = message;

    // Define the task for Gemini - now includes extracting preferences
    const task = `
Analyze the user's mood and music preferences based on their messages in this conversation.
Extract the primary mood, and also suggest relevant music genres, keywords, or even a specific era that match their request and mood.
If the user mentions a specific artist, genre, song title, or era, extract that information explicitly.

Conversation History:
${conversationContext}
Current Message:
${currentMessage}

Provide your analysis in the following JSON format:
`;

    // Define the expected response format - now includes more fields
    const format = {
      primaryMood: "string (one of: happy, sad, energetic, relaxed, angry, neutral, or a more specific mood if detected)",
      moodScores: {
        happy: "number (0-1)",
        sad: "number (0-1)",
        energetic: "number (0-1)",
        relaxed: "number (0-1)",
        angry: "number (0-1)",
        neutral: "number (0-1)"
      },
      confidence: "number (0-1, confidence in the overall analysis)",
      moodKeywords: "string (comma-separated keywords describing the mood, e.g., 'upbeat', 'chill', 'melancholy')",
      suggestedGenres: "string (comma-separated relevant music genres suggested by you based on mood/context, e.g., 'Pop', 'Electronic', 'Classical', 'Hip Hop')",
      extractedKeywords: "string (comma-separated keywords or phrases directly extracted from the user's message relevant to music, e.g., 'workout playlist', 'song like X', 'music from the 80s')",
      era: "string (detected music era if mentioned or implied, e.g., '80s', '90s', 'current hits')",
      reasoning: "string (brief explanation for the analysis)"
    };

    // Get structured response from Gemini
    const response = await generateStructuredResponse(task, { conversation: conversationContext, currentMessage: currentMessage }, format);

    // Extract and return enhanced analysis
    return {
      primaryMood: response.primaryMood || 'neutral',
      moodScores: response.moodScores || {},
      confidence: response.confidence || 0.5,
      moodKeywords: response.moodKeywords || '',
      suggestedGenres: response.suggestedGenres || '',
      extractedKeywords: response.extractedKeywords || '',
      era: response.era || ''
    };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    // Fallback to keyword-based detection (will not provide enhanced data)
    return keywordBasedMoodDetection(message);
  }
}

// Simple keyword-based mood detection (fallback - does not provide enhanced data)
function keywordBasedMoodDetection(message: string): MoodAnalysis {
  // Simple keyword-based mood detection
  const moodKeywords = {
    happy: ['happy', 'joy', 'excited', 'great', 'wonderful'],
    sad: ['sad', 'depressed', 'down', 'unhappy', 'miserable'],
    energetic: ['energetic', 'pumped', 'workout', 'exercise', 'active'],
    relaxed: ['relaxed', 'calm', 'peaceful', 'chill', 'quiet'],
    angry: ['angry', 'frustrated', 'annoyed', 'mad']
  };

  // Count keyword matches
  const moodScores: Record<string, number> = {
    happy: 0,
    sad: 0,
    energetic: 0,
    relaxed: 0,
    angry: 0
  };

  const lowercaseMessage = message.toLowerCase();

  Object.entries(moodKeywords).forEach(([mood, keywords]) => {
    keywords.forEach(keyword => {
      if (lowercaseMessage.includes(keyword)) {
        moodScores[mood] += 1;
      }
    });
  });

  // Find primary mood (highest score)
  let primaryMood = 'neutral';
  let highestScore = 0;

  Object.entries(moodScores).forEach(([mood, score]) => {
    if (score > highestScore) {
      highestScore = score;
      primaryMood = mood;
    }
  });

  // If no mood detected, default to neutral
  if (highestScore === 0) {
    primaryMood = 'neutral';
  }

  // Return basic MoodAnalysis (without enhanced fields)
  return {
    primaryMood,
    moodScores,
    confidence: highestScore > 0 ? 0.5 + (highestScore * 0.1) : 0.5,
    moodKeywords: '', // Not available in fallback
    suggestedGenres: '', // Not available in fallback
    extractedKeywords: '', // Not available in fallback
    era: '' // Not available in fallback
  };
}

// NOTE: You will need to update your '@/app/types' file
// to include the new fields in the MoodAnalysis type:
/*
export type MoodAnalysis = {
  primaryMood: string;
  moodScores: Record<string, number>;
  confidence: number;
  moodKeywords: string; // Added
  suggestedGenres: string; // Added
  extractedKeywords: string; // Added
  era: string; // Added
  reasoning?: string; // Optional, from Gemini response
};
*/
