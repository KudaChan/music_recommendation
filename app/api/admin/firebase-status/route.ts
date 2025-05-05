import { NextRequest, NextResponse } from 'next/server';
import { checkFirebaseAdmin } from '@/app/lib/firebase/admin';

// GET /api/admin/firebase-status - Check Firebase Admin status
export async function GET(request: NextRequest) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }
    
    const status = await checkFirebaseAdmin();
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Firebase status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check Firebase status',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}