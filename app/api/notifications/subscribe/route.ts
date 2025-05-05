import { NextRequest, NextResponse } from 'next/server';
import { subscribeUser } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'No subscription data provided' },
        { status: 400 }
      );
    }
    
    const result = await subscribeUser(subscription);
    
    return NextResponse.json({ success: true, message: 'Subscription successful' });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to subscribe to notifications',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}