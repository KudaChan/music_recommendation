'use client';

import { useState, useEffect } from 'react';
import { IoClose, IoAdd, IoCheckmark } from 'react-icons/io5';
import CreatePlaylistModal from './CreatePlaylistModal';

interface Playlist {
  id: string;
  name: string;
  songCount: number;
}

interface PlaylistSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeId: string;
  songTitle: string;
  songArtist?: string; // Add artist property
}

export default function PlaylistSelector({
  isOpen,
  onClose,
  youtubeId,
  songTitle,
  songArtist = '' // Default to empty string
}: PlaylistSelectorProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(null);
  const [addedToPlaylistIds, setAddedToPlaylistIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    setError(null);
    setAddedToPlaylistIds([]);
    setInitialLoading(true);

    try {
      const response = await fetch('/api/playlists');
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
      
      const data = await response.json();
      
      if (data.success && data.playlists) {
        setPlaylists(data.playlists);
      } else {
        setError(data.message || 'Failed to load playlists');
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists');
    } finally {
      setIsLoading(false);
      setInitialLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (addedToPlaylistIds.includes(playlistId)) {
      return; // Already added to this playlist
    }
    
    setAddingToPlaylistId(playlistId);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeId,
          title: songTitle,
          artist: songArtist || '',
          // Add timestamp for sorting
          addedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to playlist');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Mark as added
        setAddedToPlaylistIds(prev => [...prev, playlistId]);
        
        // Update playlist song count
        setPlaylists(prev => 
          prev.map(p => 
            p.id === playlistId 
              ? { ...p, songCount: p.songCount + 1 } 
              : p
          )
        );
        
        // Show success message
        const playlist = playlists.find(p => p.id === playlistId);
        setSuccessMessage(`Added to "${playlist?.name}"`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else if (data.message === 'Song already exists in playlist') {
        // If song already exists, mark as added
        setAddedToPlaylistIds(prev => [...prev, playlistId]);
      } else {
        setError(data.message || 'Failed to add to playlist');
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      setError('Failed to add to playlist');
    } finally {
      setAddingToPlaylistId(null);
    }
  };

  const handleCreatePlaylistSuccess = (playlistId: string, playlistName: string) => {
    // Add the new playlist to the list
    setPlaylists(prev => [
      { id: playlistId, name: playlistName, songCount: 0 },
      ...prev
    ]);
    
    // Close the create modal
    setShowCreateModal(false);
    
    // Automatically add the song to the new playlist
    handleAddToPlaylist(playlistId);
  };

  if (!isOpen) return null;

  return (
    <>
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
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-sm flex items-center">
                <IoCheckmark className="w-5 h-5 mr-1" />
                {successMessage}
              </div>
            )}
            
            <div className="mb-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-md flex items-center justify-center text-sm hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              >
                <IoAdd className="w-5 h-5 mr-2" />
                Create New Playlist
              </button>
            </div>
            
            {initialLoading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : isLoading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : playlists.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p>No playlists yet</p>
                <p className="text-sm mt-1">Create a playlist to add this song</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {playlists.map((playlist) => (
                    <li key={playlist.id} className="py-2">
                      <button
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        disabled={addingToPlaylistId === playlist.id}
                        className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{playlist.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
                          </p>
                        </div>
                        {addingToPlaylistId === playlist.id ? (
                          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : addedToPlaylistIds.includes(playlist.id) ? (
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <IoCheckmark className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <IoAdd className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreatePlaylistSuccess}
      />
    </>
  );
}
