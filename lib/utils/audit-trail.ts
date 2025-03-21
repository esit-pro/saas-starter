import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { ActivityType } from '@/lib/db/schema';
import { logActivity } from '@/lib/utils/activity-logger';

/**
 * Create entity with audit trail
 * @param table The database table
 * @param data The entity data
 * @param userId The ID of the user performing the action
 * @param teamId The team ID
 * @param entityType The type of entity (client, ticket, etc.)
 */
export async function createWithAudit<T extends Record<string, any>>(
  table: any,
  data: T,
  userId: number,
  teamId: number,
  entityType: string
) {
  // Add audit fields
  const entityData = {
    ...data,
    teamId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Insert and return the created entity
  const [createdEntity] = await db.insert(table).values(entityData).returning();
  
  // Log the activity
  await logCreateActivity(teamId, userId, entityType, createdEntity);
  
  return createdEntity;
}

/**
 * Update entity with audit trail
 * @param table The database table
 * @param id The entity ID
 * @param data The entity data to update
 * @param userId The ID of the user performing the action
 * @param teamId The team ID
 * @param entityType The type of entity (client, ticket, etc.)
 */
export async function updateWithAudit<T extends Record<string, any>>(
  table: any,
  id: number,
  data: T,
  userId: number,
  teamId: number,
  entityType: string
) {
  // Get the entity before update for audit trail
  const [entityBefore] = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
  
  if (!entityBefore) {
    throw new Error(`${entityType} not found with ID ${id}`);
  }
  
  // Add audit fields
  const updateData = {
    ...data,
    updatedBy: userId,
    updatedAt: new Date(),
  };
  
  // Update and return the entity
  const [updatedEntity] = await db
    .update(table)
    .set(updateData)
    .where(eq(table.id, id))
    .returning();
  
  // Log the activity
  await logUpdateActivity(teamId, userId, entityType, id, entityBefore, updatedEntity);
  
  return updatedEntity;
}

/**
 * Soft delete entity with audit trail
 * @param table The database table
 * @param id The entity ID
 * @param userId The ID of the user performing the action
 * @param teamId The team ID
 * @param entityType The type of entity (client, ticket, etc.)
 */
export async function softDeleteWithAudit(
  table: any,
  id: number,
  userId: number,
  teamId: number,
  entityType: string
) {
  // Get the entity before delete for audit trail
  const [entityBefore] = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
  
  if (!entityBefore) {
    throw new Error(`${entityType} not found with ID ${id}`);
  }
  
  // Soft delete by setting deletedAt timestamp and deletedBy user
  const [deletedEntity] = await db
    .update(table)
    .set({
      deletedAt: new Date(),
      deletedBy: userId,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(table.id, id))
    .returning();
  
  // Log the activity
  await logDeleteActivity(teamId, userId, entityType, id, entityBefore);
  
  return deletedEntity;
}

/**
 * Helper to determine the correct activity type for creation events
 */
function getCreateActivityType(entityType: string): ActivityType {
  switch(entityType.toLowerCase()) {
    case 'client':
      return ActivityType.CLIENT_CREATED;
    case 'ticket':
      return ActivityType.TICKET_CREATED;
    case 'timeentry':
      return ActivityType.TIME_ENTRY_CREATED;
    case 'expense':
      return ActivityType.EXPENSE_CREATED;
    case 'comment':
      return ActivityType.COMMENT_ADDED;
    case 'documents':
      return ActivityType.CLIENT_UPDATED;
    default:
      return ActivityType.CLIENT_UPDATED;
  }
}

/**
 * Helper to determine the correct activity type for update events
 */
function getUpdateActivityType(entityType: string): ActivityType {
  switch(entityType.toLowerCase()) {
    case 'client':
      return ActivityType.CLIENT_UPDATED;
    case 'ticket':
      return ActivityType.TICKET_UPDATED;
    case 'timeentry':
      return ActivityType.TIME_ENTRY_UPDATED;
    case 'expense':
      return ActivityType.EXPENSE_UPDATED;
    default:
      return ActivityType.TICKET_UPDATED;
  }
}

/**
 * Helper to determine the correct activity type for delete events
 */
function getDeleteActivityType(entityType: string): ActivityType {
  switch(entityType.toLowerCase()) {
    case 'client':
      return ActivityType.CLIENT_DELETED;
    case 'ticket':
      return ActivityType.TICKET_CLOSED; 
    case 'timeentry':
      return ActivityType.TIME_ENTRY_UPDATED;
    case 'expense':
      return ActivityType.EXPENSE_UPDATED;
    default:
      return ActivityType.CLIENT_DELETED;
  }
}

/**
 * Log creation activity
 */
async function logCreateActivity(
  teamId: number,
  userId: number,
  entityType: string,
  entityData: Record<string, any>
) {
  const activityType = getCreateActivityType(entityType);
  
  return logActivity(teamId, userId, activityType, {
    entityId: entityData.id,
    entityType,
    details: {
      created: entityData
    }
  });
}

/**
 * Log update activity
 */
async function logUpdateActivity(
  teamId: number,
  userId: number,
  entityType: string,
  entityId: number,
  beforeData: Record<string, any>,
  afterData: Record<string, any>
) {
  const activityType = getUpdateActivityType(entityType);
  
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
 * Log delete activity
 */
async function logDeleteActivity(
  teamId: number,
  userId: number,
  entityType: string,
  entityId: number,
  entityData: Record<string, any>
) {
  const activityType = getDeleteActivityType(entityType);
  
  return logActivity(teamId, userId, activityType, {
    entityId,
    entityType,
    details: {
      deleted: entityData
    }
  });
} 