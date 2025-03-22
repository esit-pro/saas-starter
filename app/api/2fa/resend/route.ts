import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users, verificationCodes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateVerificationCode, send2FACode } from '@/lib/services/twilio';
import { canGenerateCode } from '@/lib/services/cleanup';

// Schema for resending a 2FA code
const resendSchema = z.object({
  email: z.string().email(),
});

// Resend 2FA code endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = resendSchema.safeParse(body);
    
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const { email } = parsedBody.data;
    
    // Find the user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if 2FA is enabled for the user
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: 'Two-factor authentication is not enabled' }, { status: 400 });
    }
    
    // Check if the user has a phone number
    if (!user.phoneNumber) {
      return NextResponse.json({ error: 'No phone number associated with this account' }, { status: 400 });
    }
    
    // Check rate limiting
    const canGenerate = await canGenerateCode(user.id, '2fa_login');
    if (!canGenerate) {
      return NextResponse.json({ 
        error: 'Too many code requests. Please try again later.' 
      }, { status: 429 });
    }
    
    // Generate a new verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store the code in the database
    await db.insert(verificationCodes).values({
      userId: user.id,
      code,
      type: '2fa_login',
      expiresAt,
    });
    
    // Send the code via SMS
    const sent = await send2FACode(user.phoneNumber, code);
    
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resending 2FA code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 