import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';
import { addSongToPlaylist, removeSongFromPlaylist } from '@/app/lib/firebase/playlists';

// POST /api/playlists/[playlistId]/songs - Add song to playlist
export async function POST(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
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
    
    // Get playlist ID from params - await the params object
    const playlistParams = await params;
    const playlistId = playlistParams.playlistId;
    
    // Get song data from request body
    const data = await request.json();
    
    // Ensure we have a valid song object with at least youtubeId and title
    if (!data || !data.youtubeId) {
      return NextResponse.json(
        { success: false, message: 'Valid song data is required' },
        { status: 400 }
      );
    }
    
    // Create a standardized song object
    const song = {
      youtubeId: data.youtubeId,
      title: data.title || 'Untitled',
      artist: data.artist || '',
      addedAt: data.addedAt || new Date().toISOString()
    };
    
    // Add song to playlist
    const result = await addSongToPlaylist(user.uid, playlistId, song);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Playlist API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add song to playlist' },
      { status: 500 }
    );
  }
}

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
