import { NextRequest, NextResponse } from 'next/server';
import { saveFavorite, getFavorites, removeFavorite } from '@/app/lib/firebase/favorites';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';

// GET /api/favorites - Get user's favorites
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
    
    // Get favorites
    const result = await getFavorites(user.uid);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json(
      { error: 'Failed to get favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add to favorites
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
    
    // Get song from request body
    const body = await request.json();
    console.log('Received favorite request body:', body);
    
    const song = body.song || body;
    
    console.log('Extracted song data:', song);
    
    if (!song || !song.youtubeId) {
      return NextResponse.json(
        { error: 'Invalid song data: missing youtubeId', received: song },
        { status: 400 }
      );
    }
    
    if (!song.title) {
      console.log('Warning: Song title is missing, but continuing with empty title');
      song.title = '';
    }
    
    // Save to favorites
    const result = await saveFavorite(user.uid, song);
    console.log('Save favorite result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json(
      { error: `Failed to add to favorites: ${error}` },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove from favorites
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
    
    // Get youtubeId from request body
    const { youtubeId } = await request.json();
    
    if (!youtubeId) {
      return NextResponse.json(
        { error: 'YouTube ID is required' },
        { status: 400 }
      );
    }
    
    // Remove from favorites
    const result = await removeFavorite(user.uid, youtubeId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from favorites' },
      { status: 500 }
    );
  }
}
