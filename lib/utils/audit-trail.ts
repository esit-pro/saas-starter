import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { ActivityType } from '@/lib/db/schema';
import { logActivity } from '@/lib/utils/activity-logger';

// Cache to store which columns exist in each table
const tableColumnsMap = new Map<any, Set<string>>();

// Known audit fields that may or may not exist in tables
const COMMON_AUDIT_FIELDS = ['createdBy', 'updatedBy', 'deletedBy', 'teamId', 'createdAt', 'updatedAt', 'deletedAt'];

/**
 * Check if a column exists in a table by examining a sample row
 * @param table The database table
 * @param columnName The column name to check
 */
export async function hasColumn(table: any, columnName: string): Promise<boolean> {
  // Get the table name safely
  let tableName = "unknown";
  try {
    // Try different ways to access the table name
    if (table._ && table._.name) {
      tableName = table._.name;
    } else if (table.$type && table.$type.name) {
      tableName = table.$type.name;
    } else if (typeof table.name === 'string') {
      tableName = table.name;
    } else {
      // Try to infer table name from structure
      if (table.id && table.name && table.contactName) {
        tableName = "clients";
      } else if (table.id && table.title && table.status) {
        tableName = "service_tickets";
      }
    }
  } catch (error) {
    console.error('Error getting table name:', error);
  }
  
  // For sensitive audit fields, we need to be more careful
  if (['createdBy', 'updatedBy', 'deletedBy'].includes(columnName)) {
    // Specific checks for audit columns that are causing issues
    try {
      // Tables with complete audit support
      if (['expenses', 'time_entries', 'ticket_comments'].includes(tableName)) {
        // These tables support all audit columns
        return true;
      }
      
      // These tables have createdBy, updatedBy but not deletedBy
      if (tableName === 'clients') {
        // Only return true for columns that actually exist
        return columnName !== 'deletedBy'; // clients has createdBy and updatedBy but not deletedBy
      }
      
      // These tables don't have any of the audit columns
      if (['service_tickets', 'users', 'teams', 'team_members', 'activity_logs', 'invitations', 'verification_codes'].includes(tableName)) {
        return false;
      }
    } catch (error) {
      console.error(`Error in hardcoded column check for ${tableName}.${columnName}:`, error);
      return false;
    }
  }
  
  // Check if we've already cached the column structure
  if (tableColumnsMap.has(tableName)) {
    const hasCol = tableColumnsMap.get(tableName)!.has(columnName);
    return hasCol;
  }
  
  try {
    // Instead of querying data, let's check the schema directly if possible
    // This is a safer approach that doesn't depend on data existing
    
    // First try to get the column info from the table schema
    if (table[columnName]) {
      // Cache positive result
      if (!tableColumnsMap.has(tableName)) {
        tableColumnsMap.set(tableName, new Set());
      }
      tableColumnsMap.get(tableName)!.add(columnName);
      return true;
    }
    
    // If it's not in the schema directly, we have to fall back to sample data
    // Get a sample row to examine the column structure
    const [sampleRow] = await db.select().from(table).limit(1);
    
    // If no rows exist, we take a more conservative approach
    if (!sampleRow) {
      // If it's a common audit field that might not exist, return false for safety
      if (COMMON_AUDIT_FIELDS.includes(columnName)) {
        return false;
      }
      // For other fields, default to true (assuming they should exist)
      return true;
    }
    
    // Cache all column names for this table
    const columns = new Set(Object.keys(sampleRow));
    tableColumnsMap.set(tableName, columns);
    
    const hasCol = columns.has(columnName);
    return hasCol;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error);
    // Default to false on error for safety
    return false;
  }
}

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
  // Base entity data with guaranteed fields
  const entityData: Record<string, any> = {
    ...data,
    teamId,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Only add updatedBy if it exists in the table schema
  if (await hasColumn(table, 'updatedBy')) {
    entityData.updatedBy = userId;
  }

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
  
  // Base update data with guaranteed fields
  const updateData: Record<string, any> = {
    ...data,
    updatedAt: new Date(),
  };
  
  // Only add updatedBy if it exists in the table schema
  if (await hasColumn(table, 'updatedBy')) {
    updateData.updatedBy = userId;
  }
  
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
  
  // Base delete data with guaranteed fields
  const deleteData: Record<string, any> = {
    deletedAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Only add deletedBy if it exists in the table schema
  if (await hasColumn(table, 'deletedBy')) {
    deleteData.deletedBy = userId;
  }
  
  // Only add updatedBy if it exists in the table schema
  if (await hasColumn(table, 'updatedBy')) {
    deleteData.updatedBy = userId;
  }
  
  // Soft delete by setting timestamps
  const [deletedEntity] = await db
    .update(table)
    .set(deleteData)
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

// Create a named export object
const auditTrailUtils = {
  createWithAudit,
  updateWithAudit,
  softDeleteWithAudit,
  hasColumn,
};

export default auditTrailUtils;
