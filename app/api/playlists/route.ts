import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';
import { getUserPlaylists, createPlaylist } from '@/app/lib/firebase/playlists';

// GET /api/playlists - Get user's playlists
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
    
    // Get playlists
    const result = await getUserPlaylists(user.uid);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Playlists API error:', error);
    return NextResponse.json(
      { error: 'Failed to get playlists' },
      { status: 500 }
    );
  }
}

// POST /api/playlists - Create a new playlist
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
    
    // Get playlist data from request body
    const body = await request.json();
    const name = body.name;
    // Only include description if it's not undefined or empty
    const description = body.description ? body.description : null;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Playlist name is required' },
        { status: 400 }
      );
    }
    
    // Create playlist using the Firebase function
    const result = await createPlaylist(user.uid, { name, description });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Playlists API error:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
