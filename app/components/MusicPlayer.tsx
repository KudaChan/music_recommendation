'use client';

import { useState, useEffect, useRef } from 'react';
import { Recommendation } from '@/app/types';
import { motion } from 'framer-motion';
import { IoHeart, IoHeartOutline, IoPlaySkipForward, IoVolumeHigh, IoVolumeMute, IoList, IoPause, IoPlay } from 'react-icons/io5';
import MusicVisualizer from './MusicVisualizer';

interface MusicPlayerProps {
  recommendation: Recommendation;
  onLike?: () => void;
  onNext?: () => void;
  onAddToPlaylist?: (recommendation: Recommendation) => void;
  isFavorite?: boolean;
  autoplay?: boolean; // Add autoplay prop
}

// Define YouTube Player interface
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function MusicPlayer({ 
  recommendation, 
  onLike, 
  onNext,
  onAddToPlaylist,
  isFavorite = false,
  autoplay = false // Add autoplay prop, default to false
}: MusicPlayerProps) {
  const [liked, setLiked] = useState(isFavorite);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const playerReadyRef = useRef<boolean>(false);
  
  useEffect(() => {
    setLiked(isFavorite);
  }, [recommendation.youtubeId, isFavorite]);

  // Load YouTube API
  useEffect(() => {
    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      // Clean up player on unmount
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [recommendation.youtubeId]);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player) {
      setTimeout(initializePlayer, 100);
      return;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(`youtube-player-${recommendation.youtubeId}`, {
      videoId: recommendation.youtubeId,
      playerVars: {
        autoplay: autoplay ? 1 : 0, // Use autoplay prop
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        mute: muted ? 1 : 0,
      },
      events: {
        onReady: (event: any) => {
          playerReadyRef.current = true;
          if (muted) {
            event.target.mute();
          } else {
            event.target.unMute();
          }
          // If autoplay is enabled, ensure the player starts playing
          if (autoplay) {
            event.target.playVideo();
            setIsPlaying(true);
          }
        },
        onStateChange: (event: any) => {
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          
          // Auto-advance to next song when current song ends
          if (event.data === window.YT.PlayerState.ENDED) {
            // First try to use the onNext from the recommendation
            if (recommendation.onNext) {
              recommendation.onNext();
            } 
            // Fall back to the onNext prop
            else if (onNext) {
              onNext();
            }
          }
        },
      },
    });
  };

  const handleLike = async () => {
    if (!recommendation) return;
    
    try {
      // Prepare the song data with all required fields
      const songData = {
        title: recommendation.title || '',
        artist: recommendation.artist || '',
        youtubeId: recommendation.youtubeId,
        // Add any other fields that might be needed
      };
      
      // Send the request
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ song: songData }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Successfully added to favorites');
        // Update local state first
        setLiked(true);
        // Then call the parent component's onLike function to update parent state
        if (onLike) onLike();
      } else {
        console.error('Failed to add to favorites:', data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (playerRef.current && playerReadyRef.current) {
      if (muted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current && playerReadyRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  const handleNextClick = () => {
    console.log("Next button clicked");
    // First try to use the onNext from the recommendation object
    if (recommendation.onNext && typeof recommendation.onNext === 'function') {
      console.log("Using recommendation.onNext");
      recommendation.onNext();
    } 
    // Fall back to the onNext prop if available
    else if (onNext && typeof onNext === 'function') {
      console.log("Using onNext prop");
      onNext();
    } else {
      console.log("No next handler available");
    }
  };

  return (
    <div className="w-full h-[calc(100%-10px)] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* YouTube Embed with Hover Controls */}
      <div 
        className="relative w-full pt-[56.25%]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          id={`youtube-player-${recommendation.youtubeId}`}
          className="absolute top-0 left-0 w-full h-full"
        ></div>
        
        {/* Hover Controls Overlay */}
        <motion.div 
          className="absolute inset-0 bg-black/30 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex space-x-4">
            <button 
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
            >
              {isPlaying ? (
                <IoPause className="w-6 h-6 text-gray-800" />
              ) : (
                <IoPlay className="w-6 h-6 text-gray-800" />
              )}
            </button>
            
            <button 
              onClick={toggleMute}
              className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
            >
              {muted ? (
                <IoVolumeMute className="w-6 h-6 text-gray-800" />
              ) : (
                <IoVolumeHigh className="w-6 h-6 text-gray-800" />
              )}
            </button>
            
            <button
              onClick={handleNextClick}
              className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
            >
              <IoPlaySkipForward className="w-6 h-6 text-gray-800" />
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Song Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="text-lg font-bold truncate">{recommendation.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{recommendation.artist}</p>
        
        {/* Controls - Compact Layout */}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button
            onClick={handleLike}
            disabled={liked}
            className={`flex-1 px-2 py-1.5 text-sm rounded-full flex items-center justify-center transition-colors ${
              liked 
                ? 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-pink-900 dark:hover:text-pink-300'
            }`}
          >
            {liked ? (
              <IoHeart className="w-5 h-5 mr-1.5" />
            ) : (
              <IoHeartOutline className="w-5 h-5 mr-1.5" />
            )}
            {liked ? 'Favorited' : 'Favorite'}
          </button>
          
          {onAddToPlaylist && (
            <button
              onClick={() => onAddToPlaylist(recommendation)}
              className="flex-1 px-2 py-1.5 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 rounded-full flex items-center justify-center transition-colors"
            >
              <IoList className="w-5 h-5 mr-1.5" />
              Playlist
            </button>
          )}
          
          <button
            onClick={handleNextClick}
            className="flex-1 px-2 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          >
            <IoPlaySkipForward className="w-5 h-5 mr-1.5" />
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
