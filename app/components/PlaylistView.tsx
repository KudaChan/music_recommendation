'use client';

import { useState, useEffect } from 'react';
import { Recommendation, Playlist } from '@/app/types';
import { IoArrowBack, IoRefresh, IoMusicalNotes, IoClose, IoTrash } from 'react-icons/io5';

interface PlaylistViewProps {
  playlistId: string;
  onBack: () => void;
  onPlaySong: (song: Recommendation) => void;
}

export default function PlaylistView({
  playlistId,
  onBack,
  onPlaySong
}: PlaylistViewProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingSongId, setRemovingSongId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist();
    }
  }, [playlistId]);

  const fetchPlaylist = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlists/${playlistId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlist');
      }
      
      const data = await response.json();
      
      if (data.success && data.playlist) {
        setPlaylist(data.playlist);
      } else {
        setError(data.message || 'Failed to load playlist');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setError('Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSong = async (youtubeId: string) => {
    if (!playlist) return;
    
    setRemovingSongId(youtubeId);
    
    try {
      const response = await fetch(`/api/playlists/${playlistId}/songs/${youtubeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove song');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the playlist by removing the song
        setPlaylist(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            songs: prev.songs.filter(song => song.youtubeId !== youtubeId),
            songCount: prev.songCount - 1
          };
        });
      } else {
        setError(data.message || 'Failed to remove song');
      }
    } catch (error) {
      console.error('Error removing song:', error);
      setError('Failed to remove song from playlist');
    } finally {
      setRemovingSongId(null);
    }
  };

  // Update the handleNextSong function
  const handleNextSong = (currentSongId: string) => {
    console.log("handleNextSong called with", currentSongId);
    if (!playlist || !playlist.songs || playlist.songs.length <= 1) {
      console.log("Not enough songs in playlist to go to next");
      return;
    }
    
    // Find the current song index
    const currentIndex = playlist.songs.findIndex(song => song.youtubeId === currentSongId);
    console.log("Current index:", currentIndex);
    if (currentIndex === -1) {
      console.log("Song not found in playlist");
      return;
    }
    
    // Get the next song
    const nextIndex = (currentIndex + 1) % playlist.songs.length;
    console.log("Next index:", nextIndex);
    const nextSong = playlist.songs[nextIndex];
    
    // Play the next song
    if (onPlaySong && typeof onPlaySong === 'function') {
      console.log("Playing next song:", nextSong.title);
      onPlaySong({
        ...nextSong,
        onNext: () => handleNextSong(nextSong.youtubeId)
      });
    } else {
      console.log("onPlaySong is not available");
    }
  };

  // Update the handlePlaySong function
  const handlePlaySong = (song: Recommendation) => {
    console.log("Playing playlist song:", song.title);
    setCurrentPlayingSong(song.youtubeId);
    
    // Create a copy of the song with the onNext property
    const songWithNext: Recommendation = {
      ...song,
      onNext: () => handleNextSong(song.youtubeId)
    };
    
    if (onPlaySong && typeof onPlaySong === 'function') {
      onPlaySong(songWithNext);
    } else {
      console.log("onPlaySong is not available");
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle error state
  if (error || !playlist) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-2 border-b border-[var(--neutral-200)] dark:border-[var(--neutral-700)] flex items-center">
          <button 
            onClick={onBack}
            className="p-1 rounded-full hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-800)] transition-colors"
          >
            <IoArrowBack className="w-5 h-5" />
          </button>
          <h3 className="ml-2 font-medium text-sm">Error</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Failed to load playlist'}</p>
            <button
              onClick={fetchPlaylist}
              className="px-4 py-2 bg-[var(--primary-600)] dark:bg-[var(--primary-400)] text-white rounded-md hover:bg-[var(--primary-700)] dark:hover:bg-[var(--primary-300)] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add this function to handle playlist deletion
  const handleDeletePlaylist = async () => {
    if (!playlist || isDeleting) return;
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Show success message briefly
        setSuccessMessage('Playlist deleted successfully');
        
        // Navigate back after a short delay
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        setError(data.message || 'Failed to delete playlist');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      setError('Failed to delete playlist');
    } finally {
      setIsDeleting(false);
    }
  };

  // Render playlist with songs
  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-[var(--neutral-200)] dark:border-[var(--neutral-700)] flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="p-1 rounded-full hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-800)] transition-colors"
          >
            <IoArrowBack className="w-5 h-5" />
          </button>
          <h3 className="ml-2 font-medium text-sm">{playlist.name}</h3>
        </div>
        <div className="flex items-center">
          <button 
            onClick={fetchPlaylist}
            className="p-1 rounded-full hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-800)] transition-colors mr-2"
            aria-label="Refresh playlist"
          >
            <IoRefresh className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDeletePlaylist}
            className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
            aria-label="Delete playlist"
          >
            <IoTrash className="w-5 h-5" />
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {playlist.songs && playlist.songs.length > 0 ? (
          <ul className="divide-y divide-[var(--neutral-200)] dark:divide-[var(--neutral-700)]">
            {playlist.songs.map((song) => (
              <li key={song.youtubeId} className="p-2 hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-800)] transition-colors">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 bg-[var(--neutral-200)] dark:bg-[var(--neutral-700)] rounded overflow-hidden mr-3 cursor-pointer"
                    onClick={() => handlePlaySong(song)}
                  >
                    <img 
                      src={`https://img.youtube.com/vi/${song.youtubeId}/default.jpg`}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handlePlaySong(song)}
                  >
                    <p className="text-xs font-medium line-clamp-1">{song.title}</p>
                    {song.artist && <p className="text-xs text-[var(--neutral-500)] dark:text-[var(--neutral-400)] line-clamp-1">{song.artist}</p>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSong(song.youtubeId);
                    }}
                    disabled={removingSongId === song.youtubeId}
                    className="p-1.5 text-[var(--neutral-400)] hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                    title="Remove from playlist"
                  >
                    {removingSongId === song.youtubeId ? (
                      <div className="w-4 h-4 border-2 border-[var(--neutral-400)] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <IoClose className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <IoMusicalNotes className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
              This playlist is empty. Add songs to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
