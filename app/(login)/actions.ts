'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
  invitations,
  verificationCodes,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';
import { generateVerificationCode, send2FACode } from '@/lib/services/twilio';
import { canGenerateCode } from '@/lib/services/cleanup';
import { cleanupExpiredCodes } from '@/lib/services/cleanup';
import { AuthMessageKey } from '@/lib/store/authNotificationStore';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string,
  entityId?: number,
  entityType?: string,
  details?: Record<string, any>
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || '',
    entityId: entityId || null,
    entityType: entityType || null,
    details: details || null,
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  // Clean up expired codes before checking rate limits
  try {
    await cleanupExpiredCodes();
  } catch (error) {
    console.error('Error cleaning up expired codes:', error);
    // Continue with login even if cleanup fails
  }

  const userWithTeam = await db
    .select({
      user: users,
      team: teams,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithTeam.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      messageKey: 'invalid-credentials' as AuthMessageKey,
      email,
      password,
    };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash,
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      messageKey: 'invalid-credentials' as AuthMessageKey,
      email,
      password,
    };
  }

  // Check if account is locked
  if (foundUser.lockedUntil && foundUser.lockedUntil > new Date()) {
    return {
      error: 'Your account has been locked. Please contact support.',
      messageKey: 'account-locked' as AuthMessageKey,
      email,
    };
  }

  // Check if email is verified (if email verification is required)
  if (foundUser.emailVerificationRequired && !foundUser.emailVerified) {
    return {
      error: 'Please verify your email address before signing in.',
      messageKey: 'email-verification' as AuthMessageKey,
      email,
    };
  }

  // Check if 2FA is enabled
  if (foundUser.twoFactorEnabled) {
    // Check rate limiting before generating a new code
    const canGenerate = await canGenerateCode(foundUser.id, '2fa_login');
    if (!canGenerate) {
      return {
        error: 'Too many code requests. Please try again later.',
        messageKey: 'too-many-code-requests' as AuthMessageKey,
        email,
      };
    }
    
    // Generate and send 2FA code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await db.insert(verificationCodes).values({
      userId: foundUser.id,
      code,
      type: '2fa_login',
      expiresAt,
    });
    
    if (foundUser.phoneNumber) {
      await send2FACode(foundUser.phoneNumber, code);
    } else {
      console.error('User has 2FA enabled but no phone number');
    }
    
    // Return success but with 2FA required flag
    return {
      requiresTwoFactor: true,
      messageKey: 'two-factor-required' as AuthMessageKey,
      email,
    };
  }

  // Normal sign-in flow if 2FA is not enabled
  await Promise.all([
    setSession(foundUser),
    logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: foundTeam, priceId });
  }

  redirect('/');
});

const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  inviteId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId, name, phoneNumber } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    name,
    passwordHash,
    phoneNumber,
    role: 'owner', // Default role, will be overridden if there's an invitation
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  let teamId: number;
  let userRole: string;
  let createdTeam: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    // Check if there's a valid invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parseInt(inviteId)),
          eq(invitations.email, email),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1);

    if (invitation) {
      teamId = invitation.teamId;
      userRole = invitation.role;

      await db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id));

      await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION);

      [createdTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);
    } else {
      return { error: 'Invalid or expired invitation.', email, password };
    }
  } else {
    // Create a new team if there's no invitation
    const newTeam: NewTeam = {
      name: `${email}'s Team`,
    };

    [createdTeam] = await db.insert(teams).values(newTeam).returning();

    if (!createdTeam) {
      return {
        error: 'Failed to create team. Please try again.',
        email,
        password,
      };
    }

    teamId = createdTeam.id;
    userRole = 'owner';

    await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM);
  }

  const newTeamMember: NewTeamMember = {
    userId: createdUser.id,
    teamId: teamId,
    role: userRole,
  };

  await Promise.all([
    db.insert(teamMembers).values(newTeamMember),
    logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
    setSession(createdUser),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: createdTeam, priceId });
  }

  redirect('/');
});

export async function signOut() {
  const user = (await getUser()) as User;
  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete('session');
}

// Schema for password reset request
const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

// New table definition for password reset tokens
const passwordResetTokens = {
  id: sql`SERIAL PRIMARY KEY`,
  userId: sql`INTEGER NOT NULL REFERENCES users(id)`,
  token: sql`TEXT NOT NULL`,
  expiresAt: sql`TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')`,
  used: sql`BOOLEAN NOT NULL DEFAULT FALSE`,
};

// Function to send password reset email using smtp2go
async function sendPasswordResetEmail(email: string, resetLink: string) {
  // This is a placeholder - in a real implementation, you would use smtp2go's API
  // Here's an example of how you might implement it:
  
  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.SMTP2GO_API_KEY,
        to: [email],
        sender: 'noreply@yourdomain.com',
        subject: 'Password Reset Request',
        html_body: `
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset your password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      }),
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('Failed to send email:', result);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Action to request a password reset
export const requestPasswordReset = validatedAction(requestPasswordResetSchema, async (data) => {
  const { email } = data;
  
  // Find the user by email
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always return success to prevent email enumeration attacks
  if (existingUser.length === 0) {
    return { success: 'If an account with that email exists, we have sent password reset instructions.' };
  }

  const user = existingUser[0];
  
  // Generate a secure token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store the token in the database
  // Note: This is a placeholder for the actual implementation
  // In a real implementation, you would have a table for password reset tokens
  const resetTokens = 'password_reset_tokens'; // Placeholder for the actual table name
  
  // Example of how you might store the token
  // await db.insert(resetTokens).values({
  //   userId: user.id,
  //   token,
  //   expiresAt: new Date(Date.now() + 3600000), // 1 hour
  // });
  
  // Generate the reset link
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
  // Send the email
  const emailSent = await sendPasswordResetEmail(email, resetLink);
  
  if (!emailSent) {
    return { error: 'Failed to send password reset email. Please try again later.' };
  }
  
  return { success: 'If an account with that email exists, we have sent password reset instructions.' };
});

// Schema for resetting password
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Action to reset password
export const resetPassword = validatedAction(resetPasswordSchema, async (data) => {
  const { token, password } = data;
  
  // This is a placeholder - in a real implementation, you would:
  // 1. Find the token in the database
  // 2. Check if it's expired or used
  // 3. Find the user associated with the token
  // 4. Update the user's password
  // 5. Mark the token as used
  
  // Placeholder for finding the token
  const foundToken = null; // You would query your database for the token
  
  if (!foundToken) {
    return { error: 'Invalid or expired token. Please request a new password reset.' };
  }
  
  // Placeholder for finding the user
  const user = null; // You would get the user from the token
  
  if (!user) {
    return { error: 'User not found. Please request a new password reset.' };
  }
  
  // Hash the new password
  const passwordHash = await hashPassword(password);
  
  // Update the user's password
  // await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  
  // Mark the token as used
  // await db.update(resetTokens).set({ used: true }).where(eq(resetTokens.token, token));
  
  return { success: 'Your password has been reset. You can now log in with your new password.' };
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return { error: 'Current password is incorrect.' };
    }

    if (currentPassword === newPassword) {
      return {
        error: 'New password must be different from the current password.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD),
    ]);

    return { success: 'Password updated successfully.' };
  },
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return { error: 'Incorrect password. Account deletion failed.' };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT,
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`, // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    if (userWithTeam?.teamId) {
      await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, user.id),
            eq(teamMembers.teamId, userWithTeam.teamId),
          ),
        );
    }

    (await cookies()).delete('session');
    redirect('/sign-in');
  },
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT),
    ]);

    return { success: 'Account updated successfully.' };
  },
);

const removeTeamMemberSchema = z.object({
  memberId: z.number(),
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.teamId, userWithTeam.teamId),
        ),
      );

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER,
    );

    return { success: 'Team member removed successfully' };
  },
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner']),
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(
        and(
          eq(users.email, email),
          eq(teamMembers.teamId, userWithTeam.teamId),
        ),
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'User is already a member of this team' };
    }

    // Check if there's an existing invitation
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.teamId, userWithTeam.teamId),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email' };
    }

    // Create a new invitation
    await db.insert(invitations).values({
      teamId: userWithTeam.teamId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending',
    });

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER,
    );

    // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
    // await sendInvitationEmail(email, userWithTeam.team.name, role)

    return { success: 'Invitation sent successfully' };
  },
);
