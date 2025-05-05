import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';
import { getPlaylist, updatePlaylist, deletePlaylist } from '@/app/lib/firebase/playlists';

// GET /api/playlists/[playlistId] - Get a single playlist
export async function GET(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get playlist ID from params - await the params object
    const playlistParams = await params;
    const playlistId = playlistParams.playlistId;
    
    // Get playlist
    const result = await getPlaylist(user.uid, playlistId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Playlist API error:', error);
    return NextResponse.json(
      { error: 'Failed to get playlist' },
      { status: 500 }
    );
  }
}

// PATCH /api/playlists/[playlistId] - Update playlist details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get playlist ID from params - await the params object
    const playlistParams = await params;
    const playlistId = playlistParams.playlistId;
    
    // Get update data from request body
    const updates = await request.json();
    
    // Update playlist
    const result = await updatePlaylist(user.uid, playlistId, updates);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Playlist API error:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[playlistId] - Delete a playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get playlist ID from params - await the params object
    const playlistParams = await params;
    const playlistId = playlistParams.playlistId;
    
    // Delete playlist
    const result = await deletePlaylist(user.uid, playlistId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Playlist API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
