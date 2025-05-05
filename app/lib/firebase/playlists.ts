import { db } from './config';
import { Recommendation } from '@/app/types';
import { firestore } from 'firebase-admin';

// Get user's playlists
export async function getUserPlaylists(userId: string) {
  try {
    const playlistsRef = db.collection('users').doc(userId).collection('playlists');
    const snapshot = await playlistsRef.orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return { success: true, playlists: [] };
    }
    
    const playlists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null
    }));
    
    return { success: true, playlists };
  } catch (error) {
    console.error('Error getting playlists:', error);
    return { success: false, message: 'Failed to get playlists' };
  }
}

// Create a new playlist
export async function createPlaylist(userId: string, data: { name: string, description?: string }) {
  try {
    // Validate input
    if (!data.name.trim()) {
      return { success: false, message: 'Playlist name is required' };
    }
    
    const playlistsRef = db.collection('users').doc(userId).collection('playlists');
    
    // Create playlist document
    const newPlaylist = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      songCount: 0,
      songs: [],
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await playlistsRef.add(newPlaylist);
    
    return { 
      success: true, 
      message: 'Playlist created successfully',
      playlist: {
        id: docRef.id,
        ...newPlaylist,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    return { success: false, message: 'Failed to create playlist' };
  }
}

// Get a single playlist with songs
export async function getPlaylist(userId: string, playlistId: string) {
  try {
    const playlistRef = db.collection('users').doc(userId).collection('playlists').doc(playlistId);
    const doc = await playlistRef.get();
    
    if (!doc.exists) {
      return { success: false, message: 'Playlist not found' };
    }
    
    const data = doc.data() || {};
    
    // Ensure songs array exists
    const songs = data.songs || [];
    
    // Format the playlist data
    const playlist = {
      id: doc.id,
      name: data.name || 'Untitled Playlist',
      description: data.description || '',
      songCount: data.songCount || songs.length,
      songs: songs,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || null
    };
    
    return { success: true, playlist };
  } catch (error) {
    console.error('Error getting playlist:', error);
    return { success: false, message: 'Failed to get playlist' };
  }
}

// Add a song to a playlist
export async function addSongToPlaylist(userId: string, playlistId: string, song: Recommendation) {
  try {
    const playlistRef = db.collection('users').doc(userId).collection('playlists').doc(playlistId);
    
    // Check if playlist exists
    const doc = await playlistRef.get();
    if (!doc.exists) {
      return { success: false, message: 'Playlist not found' };
    }
    
    // Check if song already exists in playlist
    const playlist = doc.data();
    const songs = playlist?.songs || [];
    
    if (songs.some((s: any) => s.youtubeId === song.youtubeId)) {
      return { success: false, message: 'Song already exists in playlist' };
    }
    
    // Ensure song has all required fields
    const songToAdd = {
      youtubeId: song.youtubeId,
      title: song.title || 'Untitled',
      artist: song.artist || '',
      addedAt: song.addedAt || new Date().toISOString()
    };
    
    // Add song to playlist
    await playlistRef.update({
      songs: firestore.FieldValue.arrayUnion(songToAdd),
      songCount: firestore.FieldValue.increment(1),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Song added to playlist' };
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return { success: false, message: 'Failed to add song to playlist' };
  }
}

// Remove a song from a playlist
export async function removeSongFromPlaylist(userId: string, playlistId: string, youtubeId: string) {
  try {
    const playlistRef = db.collection('users').doc(userId).collection('playlists').doc(playlistId);
    
    // Check if playlist exists
    const doc = await playlistRef.get();
    if (!doc.exists) {
      return { success: false, message: 'Playlist not found' };
    }
    
    // Get current songs
    const playlist = doc.data();
    const songs = playlist?.songs || [];
    
    // Find the song to remove
    const songToRemove = songs.find((s: any) => s.youtubeId === youtubeId);
    
    if (!songToRemove) {
      return { success: false, message: 'Song not found in playlist' };
    }
    
    // Remove song from playlist
    const updatedSongs = songs.filter((s: any) => s.youtubeId !== youtubeId);
    
    await playlistRef.update({
      songs: updatedSongs,
      songCount: firestore.FieldValue.increment(-1),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Song removed from playlist' };
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return { success: false, message: 'Failed to remove song from playlist' };
  }
}

// Update playlist details
export async function updatePlaylist(userId: string, playlistId: string, updates: { name?: string, description?: string }) {
  try {
    const playlistRef = db.collection('users').doc(userId).collection('playlists').doc(playlistId);
    
    // Check if playlist exists
    const doc = await playlistRef.get();
    if (!doc.exists) {
      return { success: false, message: 'Playlist not found' };
    }
    
    // Prepare updates
    const updateData: any = {
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    
    if (updates.description !== undefined) {
      updateData.description = updates.description.trim() || null;
    }
    
    // Update playlist
    await playlistRef.update(updateData);
    
    return { success: true, message: 'Playlist updated successfully' };
  } catch (error) {
    console.error('Error updating playlist:', error);
    return { success: false, message: 'Failed to update playlist' };
  }
}

// Delete a playlist
export async function deletePlaylist(userId: string, playlistId: string) {
  try {
    const playlistRef = db.collection('users').doc(userId).collection('playlists').doc(playlistId);
    
    // Check if playlist exists
    const doc = await playlistRef.get();
    if (!doc.exists) {
      return { success: false, message: 'Playlist not found' };
    }
    
    // Delete playlist
    await playlistRef.delete();
    
    return { success: true, message: 'Playlist deleted successfully' };
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return { success: false, message: 'Failed to delete playlist' };
  }
}
