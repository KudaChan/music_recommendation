'use client';

import { useState } from 'react';
import { IoClose } from 'react-icons/io5';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlistId: string, playlistName: string) => void;
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onSuccess
}: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || isCreating) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }
      
      const data = await response.json();
      
      if (data.success && data.playlist) {
        // Reset form
        setName('');
        setDescription('');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(data.playlist.id, data.playlist.name);
        }
        
        // Close modal
        onClose();
      } else {
        setError(data.message || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      setError('An error occurred while creating the playlist');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium">Create New Playlist</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="playlist-name" className="block text-sm font-medium mb-1">
              Playlist Name <span className="text-red-500">*</span>
            </label>
            <input
              id="playlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              disabled={isCreating}
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="playlist-description" className="block text-sm font-medium mb-1">
              Description <span className="text-gray-500 dark:text-gray-400">(optional)</span>
            </label>
            <textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this playlist about?"
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] h-20 resize-none"
              disabled={isCreating}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="px-4 py-2 text-sm bg-[var(--primary-600)] dark:bg-[var(--primary-400)] text-white rounded-md hover:bg-[var(--primary-700)] dark:hover:bg-[var(--primary-300)] transition-colors disabled:opacity-50"
              // className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}