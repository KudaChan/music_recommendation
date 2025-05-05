import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeUser } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { success: false, message: 'No endpoint provided' },
        { status: 400 }
      );
    }
    
    const result = await unsubscribeUser(endpoint);
    
    return NextResponse.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to unsubscribe from notifications',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}