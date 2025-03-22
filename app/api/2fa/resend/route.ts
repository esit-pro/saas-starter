import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users, verificationCodes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateVerificationCode, send2FACode } from '@/lib/services/twilio';
import { canGenerateCode, cleanupExpiredCodes } from '@/lib/services/cleanup';

// Schema for resending a 2FA code
const resendSchema = z.object({
  email: z.string().email(),
});

// Resend 2FA code endpoint
export async function POST(request: NextRequest) {
  try {
    console.log('Received 2FA code resend request');
    
    // Clean up expired codes before checking rate limits
    await cleanupExpiredCodes();

    const body = await request.json();
    const parsedBody = resendSchema.safeParse(body);
    
    if (!parsedBody.success) {
      console.error('Invalid resend request body:', body, parsedBody.error);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { email } = parsedBody.data;
    console.log(`Processing 2FA code resend for email: ${email}`);
    
    // Find the user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user) {
      console.error(`User not found for email: ${email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if 2FA is enabled for the user
    if (!user.twoFactorEnabled) {
      console.log(`Two-factor authentication is not enabled for user: ${user.id}`);
      return NextResponse.json({ error: 'Two-factor authentication is not enabled' }, { status: 400 });
    }
    
    // Check if the user has a phone number
    if (!user.phoneNumber) {
      console.error(`No phone number associated with account for user: ${user.id}`);
      return NextResponse.json({ error: 'No phone number associated with this account' }, { status: 400 });
    }
    
    // Validate phone number format
    const phoneNumber = user.phoneNumber;
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      console.error(`Invalid phone number format for user: ${user.id}, phone: ${phoneNumber}`);
      return NextResponse.json({ 
        error: 'Your phone number appears to be invalid. Please update your profile with a valid phone number.' 
      }, { status: 400 });
    }
    
    // Check rate limiting
    const canGenerate = await canGenerateCode(user.id, '2fa_login');
    if (!canGenerate) {
      console.log(`Rate limit exceeded for user: ${user.id}`);
      return NextResponse.json({ 
        error: 'Too many code requests. Please try again later.' 
      }, { status: 429 });
    }
    
    // Generate a new verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    console.log(`Generated new 2FA code for user: ${user.id}`);
    
    try {
      // Store the code in the database first
      await db.insert(verificationCodes).values({
        userId: user.id,
        code,
        type: '2fa_login',
        expiresAt,
      });
      
      console.log(`Saved verification code to database for user: ${user.id}`);
    } catch (dbError) {
      console.error(`Failed to save verification code to database:`, dbError);
      return NextResponse.json({ 
        error: 'There was a problem generating your verification code. Please try again.' 
      }, { status: 500 });
    }
    
    // Send the code via SMS
    try {
      const sent = await send2FACode(user.phoneNumber, code);
      
      if (!sent) {
        console.error(`Failed to send 2FA code to user ${user.id} with phone ${user.phoneNumber}`);
        return NextResponse.json({ 
          error: 'Unable to send verification code. Twilio service may not be configured properly or the phone number format is incorrect. Check server logs for details.' 
        }, { status: 500 });
      }
      
      console.log(`Successfully sent 2FA code to user: ${user.id}`);
      return NextResponse.json({ success: true });
    } catch (smsError) {
      console.error(`SMS sending error:`, smsError);
      const errorDetails = smsError instanceof Error ? smsError.message : 'Unknown error';
      return NextResponse.json({ 
        error: `Failed to send verification code: ${errorDetails}. This might be due to Twilio configuration issues.` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unhandled error in 2FA code resend:', error);
    
    // Provide more specific error message if possible
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', errorMessage);
    }
    
    return NextResponse.json({ 
      error: `Error sending verification code: ${errorMessage}. Please contact support if this issue persists.` 
    }, { status: 500 });
  }
} 