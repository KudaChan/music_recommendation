import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';
import { removeSongFromPlaylist } from '@/app/lib/firebase/playlists';

// DELETE /api/playlists/[playlistId]/songs/[songId] - Remove song from playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string, songId: string } }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get playlist ID and song ID from params - await the params object
    const routeParams = await params;
    const playlistId = routeParams.playlistId;
    const songId = routeParams.songId;
    
    // Remove song from playlist
    const result = await removeSongFromPlaylist(user.uid, playlistId, songId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Playlist API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove song from playlist' },
      { status: 500 }
    );
  }
}
