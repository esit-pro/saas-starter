import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users, verificationCodes, teams, teamMembers, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateVerificationCode, send2FACode } from '@/lib/services/twilio';
import { setSession } from '@/lib/auth/session';
import { canAttemptVerification, cleanupExpiredCodes } from '@/lib/services/cleanup';

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
    // Clean up expired codes first
    await cleanupExpiredCodes();
    
    const body = await request.json();
    const parsedBody = verify2FASchema.safeParse(body);
    
    if (!parsedBody.success) {
      console.log('Invalid request data:', body);
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const { code, email } = parsedBody.data;
    console.log(`Verifying 2FA code for email: ${email}`);
    
    // Find the user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check rate limiting for verification attempts
    const canAttempt = await canAttemptVerification(user.id, '2fa_login');
    if (!canAttempt) {
      console.log(`Too many verification attempts for user ID: ${user.id}`);
      return NextResponse.json({ 
        error: 'Too many verification attempts. Please try again later.' 
      }, { status: 429 });
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
      console.log(`Invalid or missing verification code for user ID: ${user.id}, code: ${code}`);
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }
    
    // Check if the code is expired
    if (new Date(verificationCode.expiresAt) < new Date()) {
      console.log(`Verification code expired for user ID: ${user.id}, code: ${code}`);
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }
    
    // Mark the code as used
    await db.update(verificationCodes)
      .set({ used: true })
      .where(eq(verificationCodes.id, verificationCode.id));
    
    // Create session for the user
    try {
      // Make sure we have a valid user object with ID
      if (!user || typeof user.id !== 'number') {
        console.error('Invalid user object for session creation:', user);
        return NextResponse.json({ error: 'Invalid user data' }, { status: 500 });
      }
      
      await setSession(user);
      console.log(`Successfully created session for user ID: ${user.id}`);
      
      // Find the user's team for activity logging
      const [userWithTeam] = await db
        .select({
          team: {
            id: teams.id,
          },
        })
        .from(users)
        .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(eq(users.id, user.id))
        .limit(1);
      
      // Log the sign in activity
      if (userWithTeam?.team?.id) {
        try {
          // Only use fields that are defined in the schema
          await db.insert(activityLogs).values({
            teamId: userWithTeam.team.id,
            userId: user.id,
            action: ActivityType.SIGN_IN,
            // Safely add IP address if available
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            // Add timestamp explicitly
            timestamp: new Date(),
          });
          console.log(`Activity log created for user ${user.id} sign in`);
        } catch (logError) {
          console.error('Failed to log activity:', logError);
          // Continue anyway - logging failure shouldn't prevent sign in
        }
      }
    } catch (sessionError) {
      console.error('Error creating user session:', sessionError);
      return NextResponse.json({ error: 'Failed to create user session' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      redirectUrl: '/' // Include redirect URL in the response
    });
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