import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get the generative model
const getModel = () => {
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

// Generate a response from Gemini with safety settings
export async function generateChatResponse(
    prompt: string,
    history: { role: string; content: string }[]
) {
    try {
        const model = getModel();

        // Convert our history format to Gemini's format
        const formattedHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Start a chat session with appropriate safety settings
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 1024,
            },
        });

        // Generate the response
        const result = await chat.sendMessage(prompt);
        const response = result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to generate response from Gemini');
    }
}

// Generate a structured response for specific tasks with retry logic
export async function generateStructuredResponse(
    task: string,
    context: any,
    format: any,
    retries = 2
) {
    try {
        const model = getModel();

        // Create a structured prompt with clear instructions
        const prompt = `
Task: ${task}

Context:
${JSON.stringify(context, null, 2)}

IMPORTANT INSTRUCTIONS:
1. You must provide a response in the exact JSON format specified below.
2. Do not include any explanations, notes, or markdown formatting.
3. Only include songs that are appropriate for all audiences.
4. Focus on well-known songs that are likely to be available on YouTube.
5. Do not include any songs with explicit content.

Required JSON format:
${JSON.stringify(format, null, 2)}

Response:
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extract JSON from the response
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
            text.match(/```\n([\s\S]*?)\n```/) ||
            text.match(/{[\s\S]*?}/);

        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch (e) {
                console.error('Failed to parse JSON response:', e);
                
                // If we have retries left, try again
                if (retries > 0) {
                    console.log(`Retrying structured response generation. Retries left: ${retries}`);
                    return generateStructuredResponse(task, context, format, retries - 1);
                }
                
                return { error: 'Invalid JSON response' };
            }
        }

        // If we have retries left, try again
        if (retries > 0) {
            console.log(`No JSON found in response. Retrying. Retries left: ${retries}`);
            return generateStructuredResponse(task, context, format, retries - 1);
        }

        return { error: 'No structured data found in response' };
    } catch (error) {
        console.error('Gemini structured response error:', error);
        
        // If we have retries left, try again
        if (retries > 0) {
            console.log(`Error generating structured response. Retrying. Retries left: ${retries}`);
            return generateStructuredResponse(task, context, format, retries - 1);
        }
        
        throw new Error('Failed to generate structured response from Gemini');
    }
}
