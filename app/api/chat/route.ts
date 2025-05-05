import { NextRequest, NextResponse } from 'next/server';
import { processConversation } from '@/app/lib/agents/conversation';
import { saveRecommendationHistory } from '@/app/lib/firebase/history';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json();

        // Validate input
        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Process with conversation agent
        const response = await processConversation(message, history || []);

        // If user is authenticated and we have recommendations, save to history
        const user = await getAuthenticatedUser(request);
        if (user && response.recommendations && response.recommendations.length > 0) {
            await saveRecommendationHistory(
                user.uid,
                response.recommendations,
                response.mood
            );
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to process message' },
            { status: 500 }
        );
    }
}
