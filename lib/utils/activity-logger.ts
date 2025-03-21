import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';
import type { NewActivityLog } from '@/lib/db/schema';

/**
 * Log an activity performed by a user
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
  }
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: options?.ipAddress || '',
    entityId: options?.entityId || null,
    entityType: options?.entityType || null,
    details: options?.details || null,
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
  entityData: Record<string, any>
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
    default:
      activityType = ActivityType.CLIENT_UPDATED;
  }
  
  return logActivity(teamId, userId, activityType, {
    entityId,
    entityType,
    details: {
      created: entityData
    }
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
  afterData: Record<string, any>
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
    default:
      activityType = ActivityType.TICKET_UPDATED; // fallback
  }
  
  return logActivity(teamId, userId, activityType, {
    entityId,
    entityType,
    details: {
      before: beforeData,
      after: afterData
    }
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
  entityData: Record<string, any>
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
      activityType = ActivityType.TIME_ENTRY_UPDATED; // We have no specific delete type yet
      break;
    case 'expense':
      activityType = ActivityType.EXPENSE_UPDATED; // We have no specific delete type yet
      break;
    default:
      activityType = ActivityType.CLIENT_DELETED; // fallback
  }
  
  return logActivity(teamId, userId, activityType, {
    entityId,
    entityType,
    details: {
      deleted: entityData
    }
  });
} 