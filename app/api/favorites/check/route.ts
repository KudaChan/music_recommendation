import { NextRequest, NextResponse } from 'next/server';
import { checkFavorite } from '@/app/lib/firebase/favorites';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';

// GET /api/favorites/check?youtubeId=xyz - Check if a song is in favorites
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
    
    // Get youtubeId from query params
    const { searchParams } = new URL(request.url);
    const youtubeId = searchParams.get('youtubeId');
    
    if (!youtubeId) {
      return NextResponse.json(
        { error: 'YouTube ID is required' },
        { status: 400 }
      );
    }
    
    // Check if song is in favorites
    const result = await checkFavorite(user.uid, youtubeId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}