import { NextRequest, NextResponse } from 'next/server';
import { searchVideos } from '@/app/lib/youtube/client';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';

// POST /api/search/youtube - Search for videos on YouTube
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (optional - you can remove this if you want to allow unauthenticated searches)
    const user = await getAuthenticatedUser(request);
    
    // Get search query from request body
    const { query, maxResults = 5 } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Search for videos on YouTube
    const results = await searchVideos(query, maxResults);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('YouTube search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search YouTube' },
      { status: 500 }
    );
  }
}