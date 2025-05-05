'use client';

import { useState } from 'react';
import { Recommendation } from '@/app/types';

interface SongSearchProps {
  onSelectSong: (song: Recommendation, results: Recommendation[]) => void;
}

export default function SongSearch({ onSelectSong }: SongSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recommendation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch('/api/search/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, maxResults: 5 }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search YouTube');
      }
      
      const data = await response.json();
      setResults(data.results || []);
      
      if (data.results.length === 0) {
        setError('No songs found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      setError('Failed to search YouTube. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSong = (song: Recommendation) => {
    if (onSelectSong) {
      onSelectSong(song, results);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a song or artist..."
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Results:</h3>
          <ul className="divide-y">
            {results.map((song) => (
              <li key={song.youtubeId} className="py-2">
                <div className="flex justify-between items-center">
                  <div className="pr-2">
                    <p className="font-medium text-sm">{song.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{song.artist}</p>
                  </div>
                  <button
                    onClick={() => handleSelectSong(song)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex-shrink-0"
                  >
                    Play
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
