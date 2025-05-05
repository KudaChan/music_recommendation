'use client';

import { useState, useEffect } from 'react';
import { IoMusicalNotes, IoAdd, IoEllipsisVertical, IoChevronBack, IoChevronForward, IoTrash } from 'react-icons/io5';
import Link from 'next/link';
import { useWindowSize } from '@/app/hooks/useWindowSize';

// Define types if not imported from elsewhere
interface Recommendation {
  youtubeId: string;
  title: string;
  artist: string;
  onNext?: () => void;
  // Add other properties as needed
}

interface Playlist {
  id: string;
  name: string;
  songCount: number;
  // Add other properties as needed
}

interface CollectionContainerProps {
  collectionView: 'favorites' | 'playlists';
  onToggleView: (view: 'favorites' | 'playlists') => void;
  onPlaySong: (song: Recommendation) => void;
  onCreatePlaylist?: () => void;
  onViewPlaylist?: (playlistId: string) => void;
  showHeader?: boolean; // New prop
}

export default function CollectionContainer({
  collectionView,
  onToggleView,
  onPlaySong,
  onCreatePlaylist,
  onViewPlaylist,
  showHeader = false // Default to false
}: CollectionContainerProps) {
  'use memo';
  const [favorites, setFavorites] = useState<Recommendation[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { width, height } = useWindowSize();
  const isCompactView = height < 400; // Adjust this threshold as needed

  // Add state to track the currently selected playlist
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistView, setPlaylistView] = useState<boolean>(false);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data based on current view
    if (collectionView === 'favorites') {
      fetchFavorites();
    } else {
      fetchPlaylists();
    }
  }, [collectionView]);

  // Reset pagination when view changes
  useEffect(() => {
    setCurrentPage(0);
  }, [collectionView]);

  const fetchFavorites = async () => {
    setIsLoadingFavorites(true);
    setError(null);

    try {
      const response = await fetch('/api/favorites');
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data = await response.json();
      
      if (data.success && data.favorites) {
        setFavorites(data.favorites);
      } else {
        setError(data.message || 'Failed to load favorites');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorites');
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const fetchPlaylists = async () => {
    setIsLoadingPlaylists(true);
    setError(null);

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
      setIsLoadingPlaylists(false);
    }
  };

  const handleCreatePlaylist = () => {
    if (onCreatePlaylist) {
      onCreatePlaylist();
    }
  };

  const handleViewPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setPlaylistView(true);
    
    if (onViewPlaylist) {
      onViewPlaylist(playlistId);
    }
  };

  // Add a function to go back to the playlists list
  const handleBackToPlaylists = () => {
    setPlaylistView(false);
    setSelectedPlaylistId(null);
  };

  const handleNextPage = () => {
    if (collectionView === 'favorites') {
      const totalPages = Math.ceil(favorites.length / 8);
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }
  };
  
  const handlePrevPage = () => {
    if (collectionView === 'favorites') {
      const totalPages = Math.ceil(favorites.length / 8);
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    }
  };

  // Add a function to handle playing the next song in favorites
  const handleNextFavoriteSong = (currentSongId: string) => {
    console.log("handleNextFavoriteSong called with", currentSongId);
    if (favorites.length <= 1) {
      console.log("Not enough favorites to go to next");
      return;
    }
    
    // Find the current song index
    const currentIndex = favorites.findIndex(song => song.youtubeId === currentSongId);
    console.log("Current index:", currentIndex);
    if (currentIndex === -1) {
      console.log("Song not found in favorites");
      return;
    }
    
    // Get the next song
    const nextIndex = (currentIndex + 1) % favorites.length;
    console.log("Next index:", nextIndex);
    const nextSong = favorites[nextIndex];
    
    // Play the next song
    if (onPlaySong && typeof onPlaySong === 'function') {
      console.log("Playing next song:", nextSong.title);
      onPlaySong({
        ...nextSong,
        onNext: () => handleNextFavoriteSong(nextSong.youtubeId)
      });
    } else {
      console.log("onPlaySong is not available");
    }
  };

  // Update the onPlaySong handler for favorites
  const handlePlayFavoriteSong = (song: Recommendation) => {
    console.log("Playing favorite song:", song.title);
    // Create a copy of the song with the onNext property
    const songWithNext: Recommendation = {
      ...song,
      onNext: () => handleNextFavoriteSong(song.youtubeId)
    };
    
    if (onPlaySong && typeof onPlaySong === 'function') {
      onPlaySong(songWithNext);
    } else {
      console.log("onPlaySong is not available");
    }
  };

  // Add this function to handle playlist deletion
  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (deletingPlaylistId) return;
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${playlistName}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingPlaylistId(playlistId);
    
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the playlist from the list
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
        
        // If this was the selected playlist, reset the selection
        if (selectedPlaylistId === playlistId) {
          setSelectedPlaylistId(null);
          setPlaylistView(false);
        }
      } else {
        console.error('Failed to delete playlist:', data.message);
        alert('Failed to delete playlist: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Error deleting playlist. Please try again.');
    } finally {
      setDeletingPlaylistId(null);
    }
  };

  // Render loading state
  if ((collectionView === 'favorites' && isLoadingFavorites) || 
      (collectionView === 'playlists' && isLoadingPlaylists)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div>
          <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
          <button 
            onClick={collectionView === 'favorites' ? fetchFavorites : fetchPlaylists}
            className="btn-secondary text-xs px-3 py-1.5 rounded-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state for favorites
  if (collectionView === 'favorites' && favorites.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div>
          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <IoMusicalNotes className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">No favorites yet</p>
          <Link 
            href="/search"
            className="btn-secondary text-xs px-3 py-1.5 rounded-full inline-block"
          >
            Discover Music
          </Link>
        </div>
      </div>
    );
  }

  // Render empty state for playlists
  if (collectionView === 'playlists' && playlists.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div>
          <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <IoMusicalNotes className="w-6 h-6 text-accent-600 dark:text-accent-400" />
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">No playlists yet</p>
          <button 
            onClick={handleCreatePlaylist}
            className="btn-accent text-xs px-3 py-1.5 rounded-full"
          >
            Create Playlist
          </button>
        </div>
      </div>
    );
  }

  // Render favorites content with tile layout, horizontal scrolling and pagination
  if (collectionView === 'favorites') {
    // Adjust grid based on available space
    const itemsPerRow = isCompactView ? 2 : 4;
    const rowsToShow = isCompactView ? 1 : 2;
    const itemsPerPage = itemsPerRow * rowsToShow;
    const totalPages = Math.ceil(favorites.length / itemsPerPage);
    
    const paginatedFavorites = favorites.slice(
      currentPage * itemsPerPage, 
      (currentPage + 1) * itemsPerPage
    );

    return (
      <div className="h-full flex flex-col">
        {showHeader && (
          <div className="flex justify-between items-center p-2 border-b border-[var(--neutral-200)] dark:border-[var(--neutral-800)]">
            <h3 className="font-medium text-sm">Your Favorites</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => onToggleView('playlists')}
                className="text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] hover:bg-[var(--neutral-200)] dark:hover:bg-[var(--neutral-700)] transition-colors"
              >
                View Playlists
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3">
              {paginatedFavorites.map((song) => (
                <div 
                  key={song.youtubeId}
                  onClick={() => handlePlayFavoriteSong(song)}
                  className="flex flex-col cursor-pointer group"
                >
                  <div className="aspect-video bg-[var(--neutral-200)] dark:bg-[var(--neutral-800)] rounded-lg overflow-hidden relative mb-2 shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:translate-y-[-3px]">
                    <img 
                      src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`} 
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium line-clamp-1">{song.title}</p>
                  <p className="text-xs text-[var(--neutral-500)] dark:text-[var(--neutral-400)] line-clamp-1">{song.artist}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Simplified pagination for compact view */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-2 border-t border-[var(--neutral-200)] dark:border-[var(--neutral-800)]">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="p-1 rounded-full hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-800)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoChevronBack className="h-5 w-5" />
            </button>
            
            <div className="flex space-x-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentPage === i 
                      ? 'bg-[var(--primary-600)] w-4' 
                      : 'bg-[var(--neutral-300)] dark:bg-[var(--neutral-700)] hover:bg-[var(--neutral-400)] dark:hover:bg-[var(--neutral-600)]'
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
            
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded-full hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-800)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoChevronForward className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render playlists content with improved layout
  return (
    <div className="h-full overflow-hidden">
      {showHeader && (
        <div className="flex justify-between items-center p-2 border-b border-[var(--neutral-200)] dark:border-[var(--neutral-800)]">
          <h3 className="font-medium text-sm">Your Playlists</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onToggleView('favorites')}
              className="text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] hover:bg-[var(--neutral-200)] dark:hover:bg-[var(--neutral-700)] transition-colors"
            >
              View Favorites
            </button>
          </div>
        </div>
      )}
      <div className="h-full overflow-y-auto py-2 px-2">
        <div className="space-y-3">
          <button
            onClick={handleCreatePlaylist}
            className="w-full p-3 bg-[var(--accent-50)] dark:bg-[var(--accent-900)]/30 text-[var(--accent-700)] dark:text-[var(--accent-400)] rounded-lg flex items-center text-sm hover:bg-[var(--accent-100)] dark:hover:bg-[var(--accent-900)]/50 transition-colors shadow-sm hover:shadow"
          >
            <IoAdd className="w-5 h-5 mr-2" />
            Create New Playlist
          </button>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playlists.map((playlist) => (
              <div 
                key={playlist.id}
                onClick={() => handleViewPlaylist(playlist.id)}
                className="p-3 bg-white/50 dark:bg-white/5 rounded-lg cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors shadow-sm hover:shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[var(--accent-100)] dark:bg-[var(--accent-900)] rounded-lg flex items-center justify-center mr-3 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent-600)] dark:text-[var(--accent-400)]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{playlist.name}</p>
                    <p className="text-xs text-[var(--neutral-500)] dark:text-[var(--neutral-400)]">
                      {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                  <button 
                    className="p-1.5 text-[var(--neutral-400)] hover:text-[var(--neutral-600)] dark:hover:text-[var(--neutral-200)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add playlist options menu here
                    }}
                  >
                    <IoEllipsisVertical className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-1.5 text-[var(--neutral-400)] hover:text-red-500 dark:hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(playlist.id, playlist.name);
                    }}
                    title="Delete playlist"
                  >
                    <IoTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
