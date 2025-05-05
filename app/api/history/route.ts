import { NextRequest, NextResponse } from 'next/server';
import { saveRecommendationHistory, getRecommendationHistory, deleteHistoryItem } from '@/app/lib/firebase/history';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';

// GET /api/history - Get user's history
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get limit from query params
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    
    // Get history
    const result = await getRecommendationHistory(user.uid, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to get history' },
      { status: 500 }
    );
  }
}

// POST /api/history - Save to history
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get recommendations and mood from request body
    const { recommendations, mood } = await request.json();
    
    if (!recommendations || !mood) {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      );
    }
    
    // Save to history
    const result = await saveRecommendationHistory(user.uid, recommendations, mood);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to save history' },
      { status: 500 }
    );
  }
}

// DELETE /api/history - Delete history item
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get historyId from request body
    const { historyId } = await request.json();
    
    if (!historyId) {
      return NextResponse.json(
        { error: 'Invalid historyId' },
        { status: 400 }
      );
    }
    
    // Delete history item
    const result = await deleteHistoryItem(user.uid, historyId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete history item' },
      { status: 500 }
    );
  }
}