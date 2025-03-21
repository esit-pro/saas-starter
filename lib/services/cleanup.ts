import { db } from '@/lib/db/drizzle';
import { verificationCodes } from '@/lib/db/schema';
import { lt, or, eq, and, gt, sql } from 'drizzle-orm';

/**
 * Removes expired verification codes from the database
 * This should be run periodically as a background task
 */
export async function cleanupExpiredCodes(): Promise<number> {
  try {
    // Delete verification codes that are expired or used
    const result = await db.delete(verificationCodes)
      .where(
        or(
          lt(verificationCodes.expiresAt, new Date()),
          eq(verificationCodes.used, true)
        )
      );
    
    return result.count || 0;
  } catch (error) {
    console.error('Error cleaning up expired verification codes:', error);
    return 0;
  }
}

/**
 * Rate limit verification code generation by counting recent codes for a user
 * Returns true if the user can generate a new code, false if they are rate limited
 */
export async function canGenerateCode(userId: number, type: string): Promise<boolean> {
  try {
    // Check how many codes were generated in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentCodes = await db.select({ count: sql<number>`count(*)` })
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.type, type),
          eq(verificationCodes.used, false),
          gt(verificationCodes.createdAt, oneHourAgo)
        )
      );
    
    const count = recentCodes[0]?.count || 0;
    
    // Allow up to 10 codes per hour
    return count < 10;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Default to allowing the code in case of error
    return true;
  }
}

/**
 * Rate limit verification code submission attempts to prevent brute force attacks
 * Returns true if the user can attempt to verify a code, false if they are rate limited
 */
export async function canAttemptVerification(userId: number, type: string): Promise<boolean> {
  try {
    // Check how many failed attempts in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    // Count recent failed attempts by looking at unused codes that were generated recently
    // This is an approximation since we don't directly track failed attempts
    const recentAttempts = await db.select({ count: sql<number>`count(*)` })
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.type, type),
          eq(verificationCodes.used, false),
          gt(verificationCodes.createdAt, fifteenMinutesAgo)
        )
      );
    
    const count = recentAttempts[0]?.count || 0;
    
    // Allow up to 10 attempts in 15 minutes
    return count < 10;
  } catch (error) {
    console.error('Error checking verification attempt rate limit:', error);
    // Default to allowing the attempt in case of error
    return true;
  }
} 