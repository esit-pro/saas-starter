import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';
import type { NewActivityLog } from '@/lib/db/schema';

/**
 * Enhanced activity logger that captures more detailed information
 * 
 * @param teamId The team ID
 * @param userId The user ID who performed the action
 * @param type The type of activity from ActivityType enum
 * @param options Additional options including entity info and details
 */
export async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  options?: {
    ipAddress?: string;
    entityId?: number;
    entityType?: string;
    details?: Record<string, any>;
    actionCategory?: string;
    status?: 'success' | 'failure' | 'pending';
    serverAction?: string;
    durationMs?: number;
    userAgent?: string;
    route?: string;
  }
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  
  // Determine action category if not provided
  let actionCategory = options?.actionCategory;
  if (!actionCategory) {
    // Auto-categorize based on action type
    if (type.includes('SIGN_') || type.includes('PASSWORD') || type.includes('ACCOUNT')) {
      actionCategory = 'authentication';
    } else if (type.includes('TEAM_') || type.includes('INVITE')) {
      actionCategory = 'team';
    } else if (type.includes('CLIENT_')) {
      actionCategory = 'client';
    } else if (type.includes('TICKET_')) {
      actionCategory = 'ticket';
    } else if (type.includes('TIME_') || type.includes('EXPENSE_')) {
      actionCategory = 'finance';
    } else if (type.includes('INVOICE_') || type.includes('SUBSCRIPTION_')) {
      actionCategory = 'billing';
    }
  }
  
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: options?.ipAddress || '',
    entityId: options?.entityId || null,
    entityType: options?.entityType || null,
    details: options?.details || null,
    // New fields
    actionCategory: actionCategory || null,
    status: options?.status || 'success',
    serverAction: options?.serverAction || null,
    durationMs: options?.durationMs || null,
    userAgent: options?.userAgent || null,
    route: options?.route || null
  };
  
  return db.insert(activityLogs).values(newActivity);
}

/**
 * Log a create operation
 */
export async function logCreateActivity(
  teamId: number,
  userId: number,
  entityType: string,
  entityId: number,
  entityData: Record<string, any>,
  options?: {
    ipAddress?: string;
    serverAction?: string;
    durationMs?: number;
    userAgent?: string;
    route?: string;
  }
) {
  let activityType: ActivityType;
  
  switch(entityType.toLowerCase()) {
    case 'client':
      activityType = ActivityType.CLIENT_CREATED;
      break;
    case 'ticket':
      activityType = ActivityType.TICKET_CREATED;
      break;
    case 'timeentry':
      activityType = ActivityType.TIME_ENTRY_CREATED;
      break;
    case 'expense':
      activityType = ActivityType.EXPENSE_CREATED;
      break;
    case 'comment':
      activityType = ActivityType.COMMENT_ADDED;
      break;
    case 'invoice':
      activityType = ActivityType.INVOICE_CREATED;
      break;
    default:
      activityType = ActivityType.CLIENT_CREATED;
  }
  
  return logActivity(teamId, userId, activityType, {
    entityId,
    entityType,
    details: {
      created: entityData
    },
    actionCategory: 'data_creation',
    status: 'success',
    serverAction: options?.serverAction,
    durationMs: options?.durationMs,
    userAgent: options?.userAgent,
    route: options?.route
  });
}

/**
 * Log an update operation
 */
export async function logUpdateActivity(
  teamId: number,
  userId: number,
  entityType: string,
  entityId: number,
  beforeData: Record<string, any>,
  afterData: Record<string, any>,
  options?: {
    ipAddress?: string;
    serverAction?: string;
    durationMs?: number;
    userAgent?: string;
    route?: string;
  }
) {
  let activityType: ActivityType;
  
  switch(entityType.toLowerCase()) {
    case 'client':
      activityType = ActivityType.CLIENT_UPDATED;
      break;
    case 'ticket':
      activityType = ActivityType.TICKET_UPDATED;
      break;
    case 'timeentry':
      activityType = ActivityType.TIME_ENTRY_UPDATED;
      break;
    case 'expense':
      activityType = ActivityType.EXPENSE_UPDATED;
      break;
    case 'invoice':
      activityType = ActivityType.INVOICE_UPDATED;
      break;
    default:
      activityType = ActivityType.TICKET_UPDATED; // fallback
  }
  
  return logActivity(teamId, userId, activityType, {
    entityId,
    entityType,
    details: {
      before: beforeData,
      after: afterData
    },
    actionCategory: 'data_modification',
    status: 'success',
    serverAction: options?.serverAction,
    durationMs: options?.durationMs,
    userAgent: options?.userAgent,
    route: options?.route
  });
}

/**
 * Log a delete operation
 */
export async function logDeleteActivity(
  teamId: number,
  userId: number,
  entityType: string,
  entityId: number,
  entityData: Record<string, any>,
  options?: {
    ipAddress?: string;
    serverAction?: string;
    durationMs?: number;
    userAgent?: string;
    route?: string;
  }
) {
  let activityType: ActivityType;
  
  switch(entityType.toLowerCase()) {
    case 'client':
      activityType = ActivityType.CLIENT_DELETED;
      break;
    case 'ticket':
      activityType = ActivityType.TICKET_CLOSED; // Using TICKET_CLOSED for deleted tickets
      break;
    case 'timeentry':
      activityType = ActivityType.TIME_ENTRY_DELETED; 
      break;
    case 'expense':
      activityType = ActivityType.EXPENSE_DELETED;
      break;
    case 'invoice':
      activityType = ActivityType.INVOICE_UPDATED; // We should add a specific INVOICE_DELETED type
      break;
    default:
      activityType = ActivityType.CLIENT_DELETED; // fallback
  }
  
  return logActivity(teamId, userId, activityType, {
    entityId,
    entityType,
    details: {
      deleted: entityData
    },
    actionCategory: 'data_deletion',
    status: 'success',
    serverAction: options?.serverAction,
    durationMs: options?.durationMs,
    userAgent: options?.userAgent,
    route: options?.route
  });
} 