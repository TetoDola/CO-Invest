import { NextRequest, NextResponse } from 'next/server';

// Types for Base webhook events
interface WebhookPayload {
  type: 'frame_added' | 'frame_removed' | 'notifications_enabled' | 'notifications_disabled';
  event: {
    fid: number;
    notificationDetails?: {
      url: string;
      token: string;
    };
  };
}

interface MiniKitUser {
  fid: number;
  username?: string;
  walletAddress?: string;
  lastActive: string;
}

// In-memory user cache (replace with database in production)
const userCache = new Map<number, MiniKitUser>();

export async function POST(req: NextRequest) {
  try {
    const payload: WebhookPayload = await req.json();
    
    console.log('📥 Webhook received:', {
      type: payload.type,
      fid: payload.event.fid,
      timestamp: new Date().toISOString()
    });

    // Verify webhook signature (optional but recommended)
    // const signature = req.headers.get('x-webhook-signature');
    // if (!verifyWebhookSignature(signature, payload)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Handle different event types
    switch (payload.type) {
      case 'frame_added':
        await handleFrameAdded(payload.event.fid);
        break;
        
      case 'frame_removed':
        await handleFrameRemoved(payload.event.fid);
        break;
        
      case 'notifications_enabled':
        await handleNotificationsEnabled(payload.event);
        break;
        
      case 'notifications_disabled':
        await handleNotificationsDisabled(payload.event.fid);
        break;
        
      default:
        console.log('⚠️ Unknown webhook type:', payload.type);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Processed ${payload.type} for FID ${payload.event.fid}`
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle when user adds the mini app
async function handleFrameAdded(fid: number) {
  console.log(`✅ User ${fid} added the app`);
  
  // Store user in cache/database
  const user: MiniKitUser = {
    fid,
    lastActive: new Date().toISOString()
  };
  
  userCache.set(fid, user);
  
  // In production: Store in database
  // await db.users.upsert({
  //   where: { fid },
  //   update: { lastActive: new Date() },
  //   create: user
  // });
  
  // Optionally: Fetch user's vault positions from blockchain
  // await syncUserVaults(fid);
}

// Handle when user removes the mini app
async function handleFrameRemoved(fid: number) {
  console.log(`❌ User ${fid} removed the app`);
  
  userCache.delete(fid);
  
  // In production: Update database
  // await db.users.update({
  //   where: { fid },
  //   data: { appInstalled: false, removedAt: new Date() }
  // });
}

// Handle when user enables notifications
async function handleNotificationsEnabled(event: WebhookPayload['event']) {
  console.log(`🔔 User ${event.fid} enabled notifications`);
  
  if (event.notificationDetails) {
    const user = userCache.get(event.fid);
    if (user) {
      // Store notification token for sending push notifications later
      userCache.set(event.fid, {
        ...user,
        // notificationToken: event.notificationDetails.token
      });
    }
  }
  
  // In production: Store notification details
  // await db.users.update({
  //   where: { fid: event.fid },
  //   data: { 
  //     notificationsEnabled: true,
  //     notificationToken: event.notificationDetails?.token
  //   }
  // });
}

// Handle when user disables notifications
async function handleNotificationsDisabled(fid: number) {
  console.log(`🔕 User ${fid} disabled notifications`);
  
  // In production: Update database
  // await db.users.update({
  //   where: { fid },
  //   data: { notificationsEnabled: false, notificationToken: null }
  // });
}

// Helper function to verify webhook signature (implement in production)
function verifyWebhookSignature(signature: string | null, payload: any): boolean {
  // Implement HMAC verification using WEBHOOK_SECRET
  // const secret = process.env.WEBHOOK_SECRET;
  // const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  // return hash === signature;
  return true; // Skip verification in development
}