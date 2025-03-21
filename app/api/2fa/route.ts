import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users, verificationCodes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateVerificationCode, send2FACode } from '@/lib/services/twilio';
import { setSession } from '@/lib/auth/session';

// Schema for verifying a 2FA code
const verify2FASchema = z.object({
  code: z.string().length(6),
  email: z.string().email(),
});

// Schema for enabling/disabling 2FA
const toggle2FASchema = z.object({
  enabled: z.boolean(),
});

// Verify 2FA code for login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = verify2FASchema.safeParse(body);
    
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const { code, email } = parsedBody.data;
    
    // Find the user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Find the verification code
    const [verificationCode] = await db.select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.code, code),
          eq(verificationCodes.type, '2fa_login'),
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
    
    // Create session for the user
    await setSession(user);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Toggle 2FA setting
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const parsedBody = toggle2FASchema.safeParse(body);
    
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const { enabled } = parsedBody.data;
    
    // Check if phone is verified when enabling 2FA
    if (enabled && !user.phoneVerified) {
      return NextResponse.json({ 
        error: 'Phone number must be verified before enabling 2FA' 
      }, { status: 400 });
    }
    
    // Update 2FA setting
    await db.update(users)
      .set({ twoFactorEnabled: enabled })
      .where(eq(users.id, user.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Import for getUser missing - add it
import { getUser } from '@/lib/db/queries'; 