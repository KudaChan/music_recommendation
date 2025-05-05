'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import ChatWindow from '@/app/components/ChatWindow';
import ChatInput from '@/app/components/ChatInput';
import MusicPlayer from '@/app/components/MusicPlayer';
import SongSearch from '@/app/components/SongSearch';
import PlaylistModal from '@/app/components/PlaylistModal';
import { Message, Recommendation } from '@/app/types';
import { IoSearch, IoChatbubble, IoHeart, IoMusicalNotes } from 'react-icons/io5';
import CollectionContainer from './components/CollectionContainer';
import PlaylistView from './components/PlaylistView';

// Define the possible container views
type ContainerView = 'chat' | 'search' | 'favorites' | 'playlists';

export default function Home() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRecommendation, setCurrentRecommendation] = useState<Recommendation | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mood, setMood] = useState<string>('');
  const [containerView, setContainerView] = useState<ContainerView>('chat');
  const [favorites, setFavorites] = useState<Recommendation[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [collectionView, setCollectionView] = useState<'favorites' | 'playlists'>('favorites');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Recommendation | null>(null);
  const [chatMode, setChatMode] = useState<'chat' | 'search'>('chat');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showingPlaylist, setShowingPlaylist] = useState<boolean>(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Fetch favorites and playlists when component mounts
    if (user) {
      fetchFavorites();
      fetchPlaylists();
    }
  }, [user, loading, router]);

  const fetchFavorites = async () => {
    setIsLoadingFavorites(true);

    try {
      const response = await fetch('/api/favorites');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.favorites) {
          setFavorites(data.favorites);
        }
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const fetchPlaylists = async () => {
    setIsLoadingPlaylists(true);

    try {
      const response = await fetch('/api/playlists');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.playlists) {
          setPlaylists(data.playlists);
        }
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handlePlaySong = (song: Recommendation) => {
    setCurrentRecommendation(song);
  };

  const handleSendMessage = async (message: string) => {
    if (isProcessing) return;

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Call our API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Update state with response
      setMessages(data.history);
      setMood(data.mood.primaryMood);
      setRecommendations(data.recommendations);
      setCurrentRecommendationIndex(0);
      setCurrentRecommendation(data.recommendations[0]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLikeCallback = () => {
    // Update the favorites list with the current recommendation
    setFavorites(prev => {
      // Check if it's already in the list to avoid duplicates
      const exists = prev.some(fav => 
        typeof fav === 'object' && currentRecommendation?.youtubeId === fav.youtubeId
      );
      
      if (!currentRecommendation || exists) return prev;
      return [...prev, currentRecommendation];
    });
  };

  const handleNext = () => {
    console.log("handleNext called");
    console.log("Current recommendation:", currentRecommendation?.title);
    console.log("Recommendations length:", recommendations.length);
    
    // If there are no recommendations (e.g., when playing from favorites/playlists),
    // use the song's built-in onNext handler if available
    if ((!recommendations || recommendations.length === 0) && currentRecommendation?.onNext) {
      console.log("Using currentRecommendation.onNext");
      currentRecommendation.onNext();
      return;
    }
    
    // Only proceed with the standard next logic if we have recommendations
    if (recommendations && recommendations.length > 0) {
      console.log("Using standard next logic");
      // Move to next recommendation in the list
      const nextIndex = (currentRecommendationIndex + 1) % recommendations.length;
      console.log("Next index:", nextIndex);
      setCurrentRecommendationIndex(nextIndex);
      setCurrentRecommendation({
        ...recommendations[nextIndex],
        onNext: () => handleNext()
      });
      
      setMessages(prev => [...prev, {
        role: 'user',
        content: 'Show me something different'
      }, {
        role: 'assistant',
        content: `How about "${recommendations[nextIndex].title}" by ${recommendations[nextIndex].artist}?`
      }]);
    } else {
      console.log("No recommendations and no onNext handler");
    }
  };

  const handleSelectSong = (song: Recommendation) => {
    console.log("Selected song:", song.title);
    
    // Create a copy of the song with the onNext property if it doesn't already have one
    const songWithNext: Recommendation = {
      ...song,
      // Only add our own onNext if the song doesn't already have one
      onNext: song.onNext || (() => handleNext())
    };
    
    setCurrentRecommendation(songWithNext);
    setChatMode('chat');
    
    // Add message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: `I want to listen to "${song.title}" by ${song.artist}`
    }, {
      role: 'assistant',
      content: `Here's "${song.title}" by ${song.artist}. Enjoy!`
    }]);
  };

  const toggleChatMode = () => {
    setChatMode(chatMode === 'chat' ? 'search' : 'chat');
  };

  const handleAddToPlaylist = (recommendation: Recommendation) => {
    setSelectedSong(recommendation);
    setShowPlaylistModal(true);
  };

  const handleAddSongToPlaylist = async (playlistId: string) => {
    if (!selectedSong) return;
    
    try {
      // Prepare the song data with all required fields
      const songData = {
        youtubeId: selectedSong.youtubeId,
        title: selectedSong.title || '',
        artist: selectedSong.artist || '',
        addedAt: new Date().toISOString()
      };
      
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songData),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Show success message or notification
          console.log('Song added to playlist successfully');
          
          // Update playlists if needed
          fetchPlaylists();
        } else {
          console.error('Failed to add song to playlist:', result.message);
        }
        setShowPlaylistModal(false);
      } else {
        const errorData = await response.json();
        console.error('Error adding song to playlist:', errorData);
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error);
    }
  };

  const handleViewPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowingPlaylist(true);
    
    // If we're not already in playlists view, switch to it
    if (containerView !== 'playlists') {
      setContainerView('playlists');
    }
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylistId(null);
    setShowingPlaylist(false);
  };

  // Render functions for different container views
  const renderChatView = () => (
    <>
      <div className="absolute inset-0 flex flex-col">
        <ChatWindow messages={messages} isProcessing={isProcessing} />
        <div className="h-14"></div> {/* Space for the fixed input */}
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isProcessing={isProcessing} 
          placeholder="Ask for music recommendations..."
        />
      </div>
    </>
  );

  const renderSearchView = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <SongSearch onSelectSong={handleSelectSong} />
      </div>
    </div>
  );

  const renderFavoritesView = () => (
    <div className="flex-1 overflow-hidden">
      <CollectionContainer
        collectionView="favorites"
        onToggleView={setCollectionView}
        onPlaySong={handleSelectSong}
        onCreatePlaylist={() => setShowPlaylistModal(true)}
        onViewPlaylist={(playlistId) => {
          console.log('View playlist:', playlistId);
        }}
      />
    </div>
  );

  const renderPlaylistsView = () => (
    <>
      {showingPlaylist && selectedPlaylistId ? (
        <PlaylistView
          playlistId={selectedPlaylistId}
          onBack={handleBackToPlaylists}
          onPlaySong={handleSelectSong}
        />
      ) : (
        <CollectionContainer
          collectionView="playlists"
          onToggleView={() => {}}
          onPlaySong={handleSelectSong}
          onCreatePlaylist={() => setShowPlaylistModal(true)}
          onViewPlaylist={handleViewPlaylist}
        />
      )}
    </>
  );

  if (loading || isLoadingFavorites) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900">
        <div className="tile p-8 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header title="Music Recommendation" />

      {/* Main Content - Split View */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* YouTube Player (3/5 width) */}
          <div className="w-3/5 flex flex-col gap-4">
            {/* Player takes 3.5/5 of the height instead of 3/5 */}
            <div className="h-[70%] tile overflow-hidden">
              {currentRecommendation ? (
                <MusicPlayer 
                  recommendation={currentRecommendation}
                  onLike={handleLikeCallback}
                  onNext={handleNext}
                  onAddToPlaylist={handleAddToPlaylist}
                  isFavorite={favorites.some(fav => 
                    typeof fav === 'object' && fav.youtubeId === currentRecommendation.youtubeId
                  )}
                  autoplay={true}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900 dark:to-secondary-900 rounded-lg">
                  <div className="text-center p-8 max-w-md">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent-100 dark:bg-accent-900 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-primary-800 dark:text-primary-300">Welcome to Music Recommendation</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      Chat with our AI to get personalized music recommendations based on your mood,
                      or search directly for songs you want to hear.
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-500 text-sm">
                      Your recommended songs will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Collection tile takes 1.5/5 of the height instead of 2/5 */}
            <div className="h-[30%] tile overflow-hidden flex flex-col">
              {/* Toggle Header */}
              <div className="bg-gradient-to-r from-secondary-600 to-accent-600 p-2 flex justify-between items-center">
                <h3 className="text-white font-medium text-sm">Your Music Collection</h3>
                <div className="flex bg-white/20 rounded-full p-0.5">
                  <button 
                    onClick={() => setCollectionView('favorites')}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                      collectionView === 'favorites' 
                        ? 'bg-blue-600 text-secondary-700' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Favorites
                  </button>
                  <button 
                    onClick={() => setCollectionView('playlists')}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                      collectionView === 'playlists' 
                        ? 'bg-blue-600 text-accent-700' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Playlists
                  </button>
                </div>
              </div>
              
              {/* Content Area - Replace with CollectionContainer */}
              <div className="flex-1 overflow-hidden">
                <CollectionContainer
                  collectionView={collectionView}
                  onToggleView={setCollectionView}
                  onPlaySong={handleSelectSong}
                  onCreatePlaylist={() => setShowPlaylistModal(true)}
                  onViewPlaylist={(playlistId) => {
                    // Handle viewing playlist
                    console.log('View playlist:', playlistId);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Chat/Search/Favorites/Playlists Area (2/5 width) */}
          <div className="w-2/5 tile flex flex-col overflow-hidden">
            {/* Mode Toggle - Centered Tabs */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2">
              <div className="flex justify-center">
                <div className="flex bg-white/10 rounded-full p-1">
                  <button 
                    onClick={() => setContainerView('chat')}
                    className={`px-3 py-1.5 rounded-full flex items-center transition-colors ${
                      containerView === 'chat' 
                        ? 'bg-blue-600 text-primary-700' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <IoChatbubble className="w-4 h-4 mr-1.5" />
                    <span className="text-sm">Chat</span>
                  </button>
                  <button 
                    onClick={() => setContainerView('search')}
                    className={`px-3 py-1.5 rounded-full flex items-center transition-colors ${
                      containerView === 'search' 
                        ? 'bg-blue-600 text-primary-700' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <IoSearch className="w-4 h-4 mr-1.5" />
                    <span className="text-sm">Search</span>
                  </button>
                  <button 
                    onClick={() => setContainerView('favorites')}
                    className={`px-3 py-1.5 rounded-full flex items-center transition-colors ${
                      containerView === 'favorites' 
                        ? 'bg-blue-600 text-primary-700' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <IoHeart className="w-4 h-4 mr-1.5" />
                    <span className="text-sm">Favorites</span>
                  </button>
                  <button 
                    onClick={() => setContainerView('playlists')}
                    className={`px-3 py-1.5 rounded-full flex items-center transition-colors ${
                      containerView === 'playlists' 
                        ? 'bg-blue-600 text-primary-700' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <IoMusicalNotes className="w-4 h-4 mr-1.5" />
                    <span className="text-sm">Playlists</span>
                  </button>
                </div>
              </div>
              
              {/* Optional: Display current mood if in chat view */}
              {mood && containerView === 'chat' && (
                <div className="mt-2 text-center">
                  <span className="text-white text-sm">Mood: <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{mood}</span></span>
                </div>
              )}
            </div>
            
            {/* Container Content */}
            <div className="flex-1 overflow-hidden bg-card-bg flex flex-col relative">
              {containerView === 'chat' && renderChatView()}
              {containerView === 'search' && renderSearchView()}
              {containerView === 'favorites' && renderFavoritesView()}
              {containerView === 'playlists' && renderPlaylistsView()}
            </div>
          </div>
        </div>
      </div>
      {/* Playlist Modal */}
      {showPlaylistModal && selectedSong && (
        <PlaylistModal
          isOpen={showPlaylistModal}
          onClose={() => setShowPlaylistModal(false)}
          onAddToPlaylist={handleAddSongToPlaylist}
          recommendation={selectedSong}
        />
      )}
    </div>
  );
}
