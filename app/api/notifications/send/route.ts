import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getAuthenticatedUser } from '@/app/lib/firebase/auth';

// Configure web-push
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// In-memory storage for subscriptions (use a database in production)
let subscriptions: webpush.PushSubscription[] = [];

// GET subscriptions from server-side action
export async function GET() {
  try {
    // This is just for testing/admin purposes
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ subscriptionCount: subscriptions.length });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    );
  }
}

// POST to send a notification
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user - only admins should be able to send notifications
    const user = await getAuthenticatedUser(request);
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { title, body, icon, url } = await request.json();
    
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }
    
    // Get subscriptions from server-side action
    const { subscriptions } = await import('@/app/actions');
    
    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(subscription => 
        webpush.sendNotification(
          subscription,
          JSON.stringify({
            title,
            body,
            icon: icon || '/icons/icon-192.png',
            url: url || '/'
          })
        )
      )
    );
    
    // Count successful and failed notifications
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return NextResponse.json({
      success: true,
      message: `Sent ${successful} notifications (${failed} failed)`
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send notifications',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}