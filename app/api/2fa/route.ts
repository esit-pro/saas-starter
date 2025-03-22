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
    try {
      await db.update(verificationCodes)
        .set({ used: true })
        .where(eq(verificationCodes.id, verificationCode.id));
      console.log(`Marked verification code ${verificationCode.id} as used`);
    } catch (updateError) {
      console.error('Error marking verification code as used:', updateError);
      // Continue despite this error - this shouldn't block authentication
    }
    
    // Create session for the user
    try {
      // Make sure we have a valid user object with ID
      if (!user || typeof user.id !== 'number') {
        console.error('Invalid user object for session creation:', user);
        return NextResponse.json({ error: 'Invalid user data' }, { status: 500 });
      }
      
      await setSession(user);
      console.log(`Successfully created session for user ID: ${user.id}`);
      
      let teamId = null;
      try {
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
          
        teamId = userWithTeam?.team?.id || null;
      } catch (teamError) {
        console.error('Error finding user team:', teamError);
        // Continue anyway - this is not critical
      }
      
      // Log the sign in activity
      if (teamId) {
        try {
          // Only use fields that are defined in the schema
          await db.insert(activityLogs).values({
            teamId: teamId,
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

// Admin-only route to check 2FA status 
export async function GET(request: NextRequest) {
  try {
    // Check for admin access
    const url = new URL(request.url);
    const adminToken = url.searchParams.get('admin_token');
    
    // This is a simple check - in production you would use a more secure method
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if there's an action to perform
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');
    
    if (action === 'disable' && userId) {
      // Disable 2FA for the specified user
      await db.update(users)
        .set({ twoFactorEnabled: false })
        .where(eq(users.id, parseInt(userId)));
      
      return NextResponse.json({ 
        success: true,
        message: `Two-factor authentication has been disabled for user ID ${userId}`
      });
    }
    
    // Get all users with 2FA enabled
    const usersWithTwoFactor = await db.select({
      id: users.id,
      email: users.email,
      phoneNumber: users.phoneNumber,
      phoneVerified: users.phoneVerified,
      twoFactorEnabled: users.twoFactorEnabled
    })
    .from(users)
    .where(eq(users.twoFactorEnabled, true));
    
    // Get all users for reference
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      twoFactorEnabled: users.twoFactorEnabled
    })
    .from(users)
    .limit(10);
    
    return NextResponse.json({ 
      usersWithTwoFactor,
      allUsers,
      message: 'Use ?action=disable&userId=X to disable 2FA for a user'
    });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Import for getUser missing - add it
import { getUser } from '@/lib/db/queries'; 