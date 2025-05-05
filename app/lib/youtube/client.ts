import axios from 'axios';
import { Recommendation } from '@/app/types';

// YouTube API client
const youtubeClient = axios.create({
    baseURL: 'https://www.googleapis.com/youtube/v3',
    params: {
        key: process.env.YOUTUBE_API_KEY
    }
});

// Define types for search options
interface YouTubeSearchOptions {
    order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
    publishedAfter?: string; // ISO 8601 date string, e.g., '2023-01-01T00:00:00Z'
    isSpecificSearchRetry?: boolean; // Custom flag for internal use
}

// Search for videos on YouTube with retry logic and customizable options
export async function searchVideos(query: string, maxResults = 5, options: YouTubeSearchOptions = {}, retries = 2): Promise<Recommendation[]> {
    try {
        // Validate API key
        if (!process.env.YOUTUBE_API_KEY) {
            throw new Error('YouTube API key is missing');
        }

        console.log(`Attempting YouTube search with query: "${query}" and options: ${JSON.stringify(options)}`);

        // Make the request
        const response = await youtubeClient.get('/search', {
            params: {
                part: 'snippet',
                maxResults,
                q: query,
                type: 'video',
                videoCategoryId: '10', // Music category
                safeSearch: 'moderate', // Filter out explicit content
                ...options // Spread the provided options here
            }
        });

        if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
            throw new Error('Invalid YouTube API response');
        }

        // Filter out any items without required fields
        const validItems = response.data.items.filter(
            (item: any) => item && item.id && item.id.videoId && item.snippet && item.snippet.title && item.snippet.channelTitle
            // Added check for channelTitle as it's used for artist
        );

        if (validItems.length === 0) {
            console.warn(`YouTube search for query "${query}" with options ${JSON.stringify(options)} returned no valid videos.`);
            throw new Error('No valid videos found');
        }

        return validItems.map((item: any) => ({
            title: item.snippet.title,
            artist: item.snippet.channelTitle, // Using channelTitle as artist
            youtubeId: item.id.videoId
        }));
    } catch (error) {
        console.error('YouTube API search error:', error);

        // If we have retries left, try again with a more generic query and default options
        // NOTE: This retry logic is primarily for general mood-based searches.
        // The searchSpecificSong function will handle its own retry variations.
        if (retries > 0 && !options.isSpecificSearchRetry) { // Added flag to prevent double retry
            console.log(`Retrying YouTube search with more generic query and default options. Retries left: ${retries}`);

            // Make the query more generic
            const genericQuery = query
                .replace(/official/i, '')
                .replace(/explicit/i, '')
                .split(' ')
                .slice(0, 5) // Taking first 5 words
                .join(' ');

            // Avoid retrying with the exact same query if the generic one is the same
            if (genericQuery.trim() !== query.trim()) {
                // Retry with the generic query and default options (no specific order)
                return searchVideos(genericQuery, maxResults, {}, retries - 1);
            } else {
                console.warn(`Generic query is the same as the original. Not retrying.`);
            }
        }

        // If retries exhausted or not attempted, re-throw the original error
        throw error;
    }
}

// Get video details with retry logic
export async function getVideoDetails(videoId: string, retries = 2): Promise<any> {
    try {
        // Validate API key
        if (!process.env.YOUTUBE_API_KEY) {
            throw new Error('YouTube API key is missing');
        }

        const response = await youtubeClient.get('/videos', {
            params: {
                part: 'snippet,contentDetails,statistics',
                id: videoId
            }
        });

        if (!response.data || !response.data.items || !response.data.items[0]) {
            throw new Error('Invalid YouTube API response');
        }

        return response.data.items[0];
    } catch (error) {
        console.error('YouTube API video details error:', error);

        // If we have retries left, try again
        if (retries > 0) {
            console.log(`Retrying YouTube video details. Retries left: ${retries}`);
            return new Promise(resolve => {
                // Wait a bit before retrying
                setTimeout(() => {
                    resolve(getVideoDetails(videoId, retries - 1));
                }, 1000);
            });
        }

        throw error;
    }
}

// Get related videos
export async function getRelatedVideos(videoId: string, maxResults = 5): Promise<Recommendation[]> {
    try {
        // Validate API key
        if (!process.env.YOUTUBE_API_KEY) {
            throw new Error('YouTube API key is missing');
        }

        const response = await youtubeClient.get('/search', {
            params: {
                part: 'snippet',
                maxResults,
                relatedToVideoId: videoId,
                type: 'video'
            }
        });

        if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
            throw new Error('Invalid YouTube API response');
        }

        // Filter out any items without required fields
        const validItems = response.data.items.filter(
            (item: any) => item && item.id && item.id.videoId && item.snippet && item.snippet.title && item.snippet.channelTitle
        );


        return validItems.map((item: any) => ({
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            youtubeId: item.id.videoId
        }));
    } catch (error) {
        console.error('YouTube API related videos error:', error);
        throw error;
    }
}

// Direct search for a specific song with multiple query variations
export async function searchSpecificSong(title: string, artist?: string): Promise<Recommendation | null> {
    // Define a list of query variations to try
    const queryVariations = [
        `${title} ${artist || ''} official video`, // Title, Artist, official video
        `${title} official video`,                 // Title, official video
        `${title} ${artist || ''} music video`,    // Title, Artist, music video
        `${title} music video`,                    // Title, music video
        `${title} ${artist || ''}`,                // Title, Artist
        `${title}`,                                // Just Title
        `${title} full song`,                      // Title, full song
        `${title} audio`                           // Title, audio
    ].map(q => q.trim()).filter(q => q !== ''); // Clean up and remove empty queries

    console.log(`Attempting to find specific song: "${title}" by "${artist || 'any'}"`);

    for (const query of queryVariations) {
        try {
            // Use searchVideos with specific options for finding a single, relevant video
            // Prioritize relevance and ask for only 1 result
            const results = await searchVideos(query, 1, { order: 'relevance', isSpecificSearchRetry: true }); // Added flag

            if (results && results.length > 0) {
                console.log(`Found specific song for query "${query}"`);
                return results[0]; // Return the first valid result found
            }
        } catch (error) {
            // Log the error but continue trying other variations
            console.warn(`Search variation failed for "${query}":`, (error as Error).message);
        }
    }

    console.warn(`Could not find specific song "${title}" by "${artist || 'any'}" after trying all variations.`);
    return null; // Return null if no valid video is found after all variations
}
