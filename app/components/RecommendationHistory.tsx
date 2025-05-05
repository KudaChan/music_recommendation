'use client';

import { useState, useEffect } from 'react';
import { IoCalendarOutline, IoTimeOutline } from 'react-icons/io5';

interface HistoryItem {
  id: string;
  date: string;
  mood: string;
  recommendations: {
    title: string;
    artist: string;
    youtubeId: string;
  }[];
}

interface RecommendationHistoryProps {
  onPlaySong: (song: any) => void;
}

export default function RecommendationHistory({ onPlaySong }: RecommendationHistoryProps) {
  'use memo';
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const data = await response.json();
      
      if (data.success && data.history) {
        setHistory(data.history);
      } else {
        setError(data.message || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  // Group history by date
  const groupedHistory = history.reduce((groups: Record<string, HistoryItem[]>, item) => {
    const date = new Date(item.date).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div>
          <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
          <button 
            onClick={fetchHistory}
            className="btn-secondary text-xs px-3 py-1.5 rounded-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div>
          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <IoTimeOutline className="w-6 h-6 text-secondary-500" />
          </div>
          <h3 className="font-medium mb-1">No History Yet</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Your recommendation history will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {Object.entries(groupedHistory).map(([date, items]) => (
        <div key={date} className="mb-6">
          <div className="flex items-center mb-3">
            <IoCalendarOutline className="w-4 h-4 mr-2 text-[var(--neutral-500)]" />
            <h3 className="text-sm font-medium">{date}</h3>
          </div>
          
          <div className="space-y-3">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-[var(--neutral-800)] rounded-lg shadow-sm p-3"
              >
                <div className="flex items-center mb-2">
                  <div className="px-2 py-1 bg-[var(--primary-100)] dark:bg-[var(--primary-900)] text-[var(--primary-700)] dark:text-[var(--primary-300)] text-xs rounded-full">
                    Mood: {item.mood}
                  </div>
                  <div className="ml-auto text-xs text-[var(--neutral-500)]">
                    {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {item.recommendations.map((rec, index) => (
                    <div 
                      key={`${item.id}-${index}`}
                      className="flex items-center p-2 hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-700)] rounded-md cursor-pointer transition-colors"
                      onClick={() => onPlaySong(rec)}
                    >
                      <div className="w-8 h-8 bg-[var(--neutral-200)] dark:bg-[var(--neutral-600)] rounded overflow-hidden mr-3">
                        <img 
                          src={`https://img.youtube.com/vi/${rec.youtubeId}/default.jpg`}
                          alt={rec.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rec.title}</p>
                        <p className="text-xs text-[var(--neutral-500)] dark:text-[var(--neutral-400)] truncate">{rec.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}