import { NextRequest, NextResponse } from 'next/server';
import { getTwilioConfigStatus } from '@/lib/services/twilio';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  
  // Verify admin token
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken || token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get Twilio configuration status
  const status = getTwilioConfigStatus();
  
  // Add additional environment information that might help debugging
  const environment = {
    nodeEnv: process.env.NODE_ENV,
    baseUrl: process.env.BASE_URL,
    // Mask credentials partially for security
    twilioAccountSidPrefix: process.env.TWILIO_ACCOUNT_SID 
      ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 4)}...` 
      : null,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  };
  
  return NextResponse.json({ 
    status,
    environment
  });
} 