import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users, verificationCodes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateVerificationCode, sendVerificationSMS } from '@/lib/services/twilio';
import { getUser } from '@/lib/db/queries';

// Schema for sending a verification code
const sendCodeSchema = z.object({
  phoneNumber: z.string().min(10),
});

// Schema for verifying a code
const verifyCodeSchema = z.object({
  code: z.string().length(6),
});

// Send verification code endpoint
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = sendCodeSchema.safeParse(body);
    
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const { phoneNumber } = parsedBody.data;
    
    // Update user's phone number
    await db.update(users)
      .set({ phoneNumber })
      .where(eq(users.id, user.id));
      
    // Generate a verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store the code in the database
    await db.insert(verificationCodes).values({
      userId: user.id,
      code,
      type: 'phone_verification',
      expiresAt,
    });
    
    // Send the code via SMS
    const sent = await sendVerificationSMS(phoneNumber, code);
    
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify code endpoint
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const parsedBody = verifyCodeSchema.safeParse(body);
    
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const { code } = parsedBody.data;
    
    // Find the verification code
    const [verificationCode] = await db.select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.code, code),
          eq(verificationCodes.type, 'phone_verification'),
          eq(verificationCodes.used, false)
        )
      )
      .limit(1);
    
    if (!verificationCode) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }
    
    // Check if the code is expired
    if (new Date(verificationCode.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }
    
    // Mark the code as used
    await db.update(verificationCodes)
      .set({ used: true })
      .where(eq(verificationCodes.id, verificationCode.id));
    
    // Mark the phone as verified
    await db.update(users)
      .set({ phoneVerified: true })
      .where(eq(users.id, user.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 