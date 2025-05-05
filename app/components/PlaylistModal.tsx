'use client';

import { useState, useEffect } from 'react';
import { Recommendation } from '@/app/types';
import { IoClose, IoAdd } from 'react-icons/io5';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToPlaylist: (playlistId: string) => void;
  recommendation: Recommendation;
}

export default function PlaylistModal({ 
  isOpen, 
  onClose, 
  onAddToPlaylist,
  recommendation
}: PlaylistModalProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/playlists');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlaylists(data.playlists || []);
        } else {
          setError(data.message || 'Failed to fetch playlists');
        }
      } else {
        setError('Failed to fetch playlists');
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('An error occurred while fetching playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || isCreating) return;

    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPlaylistName }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlaylists([data.playlist, ...playlists]);
          setNewPlaylistName('');
          setShowCreateForm(false);
        } else {
          setError(data.message || 'Failed to create playlist');
        }
      } else {
        setError('Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      setError('An error occurred while creating the playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (addingToPlaylist) return;
    
    setAddingToPlaylist(playlistId);
    setError(null);
    
    try {
      // Prepare the song data
      const songData = {
        youtubeId: recommendation.youtubeId,
        title: recommendation.title || '',
        artist: recommendation.artist || '',
        addedAt: new Date().toISOString()
      };
      
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to playlist');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Call the callback function
        if (onAddToPlaylist) {
          onAddToPlaylist(playlistId);
        }
        
        // Close the modal
        onClose();
      } else if (data.message === 'Song already exists in playlist') {
        setError('This song is already in the playlist');
        setTimeout(() => setAddingToPlaylist(null), 1500);
      } else {
        setError(data.message || 'Failed to add to playlist');
        setAddingToPlaylist(null);
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      setError('An error occurred while adding to playlist');
      setAddingToPlaylist(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium">Add to Playlist</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Song:</p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mr-3">
                <img 
                  src={`https://img.youtube.com/vi/${recommendation.youtubeId}/default.jpg`}
                  alt={recommendation.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-sm line-clamp-1">{recommendation.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{recommendation.artist}</p>
              </div>
            </div>
          </div>
          
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2 px-3 mb-4 text-sm bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/30 text-[var(--primary-700)] dark:text-[var(--primary-400)] hover:bg-[var(--primary-100)] dark:hover:bg-[var(--primary-900)]/50 rounded-md flex items-center justify-center"
            >
              <IoAdd className="w-4 h-4 mr-1.5" />
              Create New Playlist
            </button>
          ) : (
            <form onSubmit={handleCreatePlaylist} className="mb-4">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  disabled={isCreating}
                />
                <button
                  type="submit"
                  disabled={isCreating || !newPlaylistName.trim()}
                  className="py-2 px-3 bg-[var(--primary-600)] dark:bg-[var(--primary-400)] text-white rounded-r-md hover:bg-[var(--primary-700)] dark:hover:bg-[var(--primary-300)] disabled:opacity-50 text-sm"
                >
                  Create
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </form>
          )}
          
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : playlists.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No playlists yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={addingToPlaylist === playlist.id}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
                  >
                    <p className="font-medium text-sm">{playlist.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {addingToPlaylist === playlist.id ? 'Adding...' : `${playlist.songCount || 0} songs`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
