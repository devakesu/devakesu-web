import { NextResponse } from 'next/server';
import { sendAnalyticsEvent, getClientId, getSessionId } from '@/lib/analytics';

export async function POST(request) {
  try {
    const body = await request.json();
    const { eventName, pageLocation, pageTitle, referrer, customParams } = body;

    // Get client ID from request
    const clientId = getClientId(request);
    const sessionId = getSessionId();

    // Send event to Google Analytics
    await sendAnalyticsEvent({
      eventName,
      pageLocation,
      pageTitle,
      referrer,
      clientId,
      sessionId,
      customParams,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
