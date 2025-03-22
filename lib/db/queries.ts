import { desc, and, eq, isNull, sql, or, not, gte, lte } from 'drizzle-orm';
import { db } from './drizzle';
import { 
  activityLogs, 
  teamMembers, 
  teams, 
  users, 
  clients, 
  serviceTickets, 
  ticketComments, 
  timeEntries, 
  expenses 
} from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { hasColumn } from '@/lib/utils/audit-trail';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    return []; // Return empty array instead of throwing error
  }

  try {
    // First, try to get the user's team
    const userWithTeam = await getUserWithTeam(user.id);
    const teamId = userWithTeam?.teamId;

    // Build conditions
    let conditions = [];
    if (teamId) {
      conditions.push(
        or(
          eq(activityLogs.userId, user.id),
          eq(activityLogs.teamId, teamId)
        )
      );
    } else {
      conditions.push(eq(activityLogs.userId, user.id));
    }

    // Get activity logs with related entity information
    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userName: users.name,
        entityId: activityLogs.entityId,
        entityType: activityLogs.entityType,
        details: activityLogs.details,
        entityName: sql<string | null>`null`.as('entityName'), // Add default null value for entityName
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(conditions.length > 0 ? conditions[0] : sql`1=1`)
      .orderBy(desc(activityLogs.timestamp))
      .limit(30);

    // Enhance logs with related entity names where possible
    const enhancedLogs = await Promise.all(logs.map(async (log) => {
      if (!log.entityId || !log.entityType) {
        return log;
      }

      let entityName = null;
      
      // Get related entity name based on entityType
      try {
        switch(log.entityType.toLowerCase()) {
          case 'client': {
            const client = await db.query.clients.findFirst({
              where: eq(clients.id, log.entityId),
              columns: { name: true }
            });
            entityName = client?.name || null;
            break;
          }
          case 'ticket': {
            const ticket = await db.query.serviceTickets.findFirst({
              where: eq(serviceTickets.id, log.entityId),
              columns: { title: true }
            });
            entityName = ticket?.title || null;
            break;
          }
          // Add other entity types as needed
        }
      } catch (error) {
        console.error(`Error fetching entity name for ${log.entityType}#${log.entityId}:`, error);
      }

      return {
        ...log,
        entityName
      };
    }));
    
    return enhancedLogs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}

export async function getTeamForUser(userId: number) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMembers: {
        with: {
          team: {
            with: {
              teamMembers: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.teamMembers[0]?.team || null;
}

// Client queries

export async function getClients(teamId: number) {
  return await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.teamId, teamId),
      isNull(clients.deletedAt)
    ))
    .orderBy(clients.name);
}

export async function getClient(clientId: number) {
  return await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.id, clientId),
      isNull(clients.deletedAt)
    ))
    .limit(1)
    .then(result => result[0] || null);
}

export async function createClient(clientData: Omit<typeof clients.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const insertData = {
    ...clientData,
    createdAt: new Date(),
    updatedAt: new Date(),
    // We now know exactly which audit columns exist in the clients table
    // createdBy and updatedBy are intentionally omitted if they don't exist
  };

  // Only add audit fields that exist in the table
  if (clientData.createdBy !== undefined) {
    insertData.createdBy = clientData.createdBy;
  }
  
  if (clientData.updatedBy !== undefined) {
    insertData.updatedBy = clientData.updatedBy;
  }
  
  return await db
    .insert(clients)
    .values(insertData)
    .returning();
}

export async function updateClient(clientId: number, clientData: Partial<Omit<typeof clients.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>) {
  return await db
    .update(clients)
    .set({
      ...clientData,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId))
    .returning();
}

export async function deleteClient(clientId: number) {
  // In production, consider using soft delete by setting a deletedAt timestamp
  return await db
    .delete(clients)
    .where(eq(clients.id, clientId))
    .returning();
}

// Service ticket queries

export async function getServiceTicketsByFilters(teamId: number, filters?: {
  clientId?: number;
  status?: string;
  assignedTo?: number;
}, limit?: number) {
  let conditions = [
    eq(serviceTickets.teamId, teamId),
    isNull(serviceTickets.deletedAt)
  ];
  
  if (filters?.clientId) {
    conditions.push(eq(serviceTickets.clientId, filters.clientId));
  }

  if (filters?.status) {
    conditions.push(eq(serviceTickets.status, filters.status));
  }

  if (filters?.assignedTo) {
    conditions.push(eq(serviceTickets.assignedTo, filters.assignedTo));
  }

  let baseQuery = db
    .select({
      ticket: {
        id: serviceTickets.id,
        title: serviceTickets.title,
        description: serviceTickets.description,
        status: serviceTickets.status,
        priority: serviceTickets.priority,
        clientId: serviceTickets.clientId,
        assignedTo: serviceTickets.assignedTo,
        dueDate: serviceTickets.dueDate,
        createdAt: serviceTickets.createdAt,
        updatedAt: serviceTickets.updatedAt,
        createdBy: serviceTickets.createdBy,
        updatedBy: serviceTickets.updatedBy,
        teamId: serviceTickets.teamId
      },
      client: clients,
      assignedUser: users,
    })
    .from(serviceTickets)
    .leftJoin(clients, eq(serviceTickets.clientId, clients.id))
    .leftJoin(users, eq(serviceTickets.assignedTo, users.id))
    .where(and(...conditions))
    .orderBy(desc(serviceTickets.createdAt));
    
  // Apply limit if provided
  const result = limit ? baseQuery.limit(limit) : baseQuery;
  
  return await result;
}

export async function getServiceTicket(ticketId: number) {
  return await db.query.serviceTickets.findFirst({
    where: (tickets, { and, eq: whereEq, isNull: whereIsNull }) => 
      and(whereEq(tickets.id, ticketId), whereIsNull(tickets.deletedAt)),
    with: {
      client: true,
      assignedUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: desc(ticketComments.createdAt),
      },
    },
  });
}

export async function createServiceTicket(ticketData: Omit<typeof serviceTickets.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'closedAt'>) {
  return await db
    .insert(serviceTickets)
    .values({
      ...ticketData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
}

export async function updateServiceTicket(
  ticketId: number, 
  ticketData: Partial<Omit<typeof serviceTickets.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'closedAt'>>
) {
  const updates: any = { ...ticketData, updatedAt: new Date() };
  
  // If status is being changed to closed, set closedAt timestamp
  if (ticketData.status === 'closed') {
    updates.closedAt = new Date();
  }
  
  return await db
    .update(serviceTickets)
    .set(updates)
    .where(eq(serviceTickets.id, ticketId))
    .returning();
}

export async function deleteServiceTicket(ticketId: number, userId?: number) {
  // Basic update fields that are guaranteed to exist
  const updateData: any = {
    deletedAt: new Date(),
    updatedAt: new Date()
  };
  
  // We know the service_tickets table doesn't have a deletedBy column
  // so we skip the check and don't try to set it
  
  return await db
    .update(serviceTickets)
    .set(updateData)
    .where(eq(serviceTickets.id, ticketId))
    .returning();
}

// Comment queries

/**
 * Get all comments for a specific ticket
 * @param ticketId - The ID of the ticket
 * @param includeInternal - Whether to include internal comments (default: true)
 * @param currentUserId - Optional: If provided, will include internal comments only if they belong to this user
 */
export async function getTicketComments(
  ticketId: number,
  includeInternal: boolean = true,
  currentUserId?: number
) {
  // Base query setup
  let query = db.query.ticketComments.findMany({
    where: (commentTable, { eq, and, or }) => {
      const baseCondition = eq(commentTable.ticketId, ticketId);
      
      if (!includeInternal) {
        // Only public comments
        return and(baseCondition, eq(commentTable.isInternal, false));
      } else if (currentUserId !== undefined) {
        // Public comments and internal comments by current user
        return and(
          baseCondition,
          or(
            eq(commentTable.isInternal, false),
            eq(commentTable.createdBy, currentUserId)
          )
        );
      } else {
        // All comments including all internal ones
        return baseCondition;
      }
    },
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: desc(ticketComments.createdAt),
  });
  
  return query;
}

export async function createTicketComment(commentData: Omit<typeof ticketComments.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  return await db
    .insert(ticketComments)
    .values({
      ...commentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
}

// Time tracking queries

export async function getTimeEntries(filters: {
  teamId?: number;
  userId?: number;
  clientId?: number;
  ticketId?: number;
  startDate?: Date;
  endDate?: Date;
  billable?: boolean;
  billed?: boolean;
}) {
  let conditions = [isNull(timeEntries.deletedAt)];
  
  // Apply filters
  if (filters.teamId) {
    conditions.push(eq(clients.teamId, filters.teamId));
  }
  if (filters.userId) {
    conditions.push(eq(timeEntries.userId, filters.userId));
  }
  if (filters.clientId) {
    conditions.push(eq(timeEntries.clientId, filters.clientId));
  }
  if (filters.ticketId) {
    conditions.push(eq(timeEntries.ticketId, filters.ticketId));
  }
  if (filters.startDate) {
    conditions.push(sql`${timeEntries.startTime} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${timeEntries.startTime} <= ${filters.endDate}`);
  }
  if (filters.billable !== undefined) {
    conditions.push(eq(timeEntries.billable, filters.billable));
  }
  if (filters.billed !== undefined) {
    conditions.push(eq(timeEntries.billed, filters.billed));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select({
      timeEntry: timeEntries,
      client: clients,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      ticket: {
        id: serviceTickets.id,
        title: serviceTickets.title,
      },
    })
    .from(timeEntries)
    .leftJoin(clients, eq(timeEntries.clientId, clients.id))
    .leftJoin(users, eq(timeEntries.userId, users.id))
    .leftJoin(serviceTickets, eq(timeEntries.ticketId, serviceTickets.id))
    .where(whereClause ? whereClause : sql`1=1`)
    .orderBy(desc(timeEntries.startTime));
}

export async function createTimeEntry(timeEntryData: Omit<typeof timeEntries.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  return await db
    .insert(timeEntries)
    .values({
      ...timeEntryData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
}

export async function updateTimeEntry(
  timeEntryId: number,
  timeEntryData: Partial<Omit<typeof timeEntries.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>
) {
  return await db
    .update(timeEntries)
    .set({
      ...timeEntryData,
      updatedAt: new Date(),
    })
    .where(eq(timeEntries.id, timeEntryId))
    .returning();
}

// Expense queries

export async function getExpenses(filters: {
  teamId?: number;
  userId?: number;
  clientId?: number;
  ticketId?: number;
  startDate?: Date;
  endDate?: Date;
  billable?: boolean;
  billed?: boolean;
  category?: string;
}) {
  let conditions = [isNull(expenses.deletedAt)];
  
  // Apply filters
  if (filters.teamId) {
    conditions.push(eq(clients.teamId, filters.teamId));
  }
  if (filters.userId) {
    conditions.push(eq(expenses.userId, filters.userId));
  }
  if (filters.clientId) {
    conditions.push(eq(expenses.clientId, filters.clientId));
  }
  if (filters.ticketId) {
    conditions.push(eq(expenses.ticketId, filters.ticketId));
  }
  if (filters.startDate) {
    conditions.push(sql`${expenses.createdAt} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${expenses.createdAt} <= ${filters.endDate}`);
  }
  if (filters.billable !== undefined) {
    conditions.push(eq(expenses.billable, filters.billable));
  }
  if (filters.billed !== undefined) {
    conditions.push(eq(expenses.billed, filters.billed));
  }
  if (filters.category) {
    conditions.push(eq(expenses.category, filters.category));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select({
      expense: expenses,
      client: clients,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      ticket: {
        id: serviceTickets.id,
        title: serviceTickets.title,
      },
    })
    .from(expenses)
    .leftJoin(clients, eq(expenses.clientId, clients.id))
    .leftJoin(users, eq(expenses.userId, users.id))
    .leftJoin(serviceTickets, eq(expenses.ticketId, serviceTickets.id))
    .where(whereClause ? whereClause : sql`1=1`)
    .orderBy(desc(expenses.createdAt));
}

export async function createExpense(expenseData: Omit<typeof expenses.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  return await db
    .insert(expenses)
    .values({
      ...expenseData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
}

export async function updateExpense(
  expenseId: number,
  expenseData: Partial<Omit<typeof expenses.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>
) {
  return await db
    .update(expenses)
    .set({
      ...expenseData,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, expenseId))
    .returning();
}

// Dashboard & reporting queries

/**
 * Get client summary data for dashboard
 */
export async function getClientSummary(teamId: number) {
  // Fetch all clients for the team
  const clientsResult = await db
    .select({
      id: clients.id,
      name: clients.name,
      isActive: clients.isActive,
    })
    .from(clients)
    .where(eq(clients.teamId, teamId));
  
  // Count total clients and active clients
  const totalClients = clientsResult.length;
  const activeClients = clientsResult.filter(c => c.isActive).length;
  
  // Count active tickets
  const activeTicketsCount = await db
    .select({ count: sql`count(*)` })
    .from(serviceTickets)
    .where(
      and(
        eq(serviceTickets.teamId, teamId),
        not(eq(serviceTickets.status, 'closed')),
        not(eq(serviceTickets.status, 'completed'))
      )
    )
    .then(result => Number(result[0]?.count || 0));
  
  return {
    totalClients,
    activeClients,
    activeTicketsCount
  };
}

/**
 * Get time tracking summary data for dashboard
 */
export async function getTimeTrackingSummary(
  teamId: number, 
  dateRange: { startDate: Date; endDate: Date }
) {
  // Get all time entries in date range
  const timeEntriesData = await db
    .select({
      duration: timeEntries.duration,
      billable: timeEntries.billable,
      billed: timeEntries.billed,
      billableRate: timeEntries.billableRate
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.teamId, teamId),
        gte(timeEntries.startTime, dateRange.startDate),
        lte(timeEntries.startTime, dateRange.endDate)
      )
    );
  
  // Calculate total hours (convert minutes to hours)
  const totalMinutes = timeEntriesData.reduce((sum: number, entry) => sum + entry.duration, 0);
  const totalHours = Math.round(totalMinutes / 60);
  
  // Calculate billable hours
  const billableMinutes = timeEntriesData
    .filter(entry => entry.billable)
    .reduce((sum: number, entry) => sum + entry.duration, 0);
  const billableHours = Math.round(billableMinutes / 60);
  
  // Calculate billed hours
  const billedMinutes = timeEntriesData
    .filter(entry => entry.billable && entry.billed)
    .reduce((sum: number, entry) => sum + entry.duration, 0);
  const billedHours = Math.round(billedMinutes / 60);
  
  // Calculate billable amount (if rates are set)
  const totalBillableAmount = timeEntriesData
    .filter(entry => entry.billable)
    .reduce((sum: number, entry) => {
      const rate = entry.billableRate ? parseFloat(entry.billableRate.toString()) : 0;
      return sum + (rate * (entry.duration / 60));
    }, 0);
  
  return {
    totalHours,
    billableHours,
    billedHours,
    totalBillableAmount
  };
}

/**
 * Get expense summary data for dashboard
 */
export async function getExpenseSummary(
  teamId: number, 
  dateRange: { startDate: Date; endDate: Date }
) {
  // Get all expenses in date range
  const expenseData = await db
    .select({
      amount: expenses.amount,
      billable: expenses.billable,
      billed: expenses.billed
    })
    .from(expenses)
    .innerJoin(clients, eq(expenses.clientId, clients.id))
    .where(
      and(
        eq(clients.teamId, teamId),
        gte(expenses.createdAt, dateRange.startDate),
        lte(expenses.createdAt, dateRange.endDate)
      )
    );
  
  // Calculate totals
  const totalExpenses = expenseData.reduce((sum, expense) => {
    return sum + parseFloat(expense.amount.toString());
  }, 0);
  
  const billableExpenses = expenseData
    .filter(expense => expense.billable)
    .reduce((sum, expense) => {
      return sum + parseFloat(expense.amount.toString());
    }, 0);
  
  const billedExpenses = expenseData
    .filter(expense => expense.billable && expense.billed)
    .reduce((sum, expense) => {
      return sum + parseFloat(expense.amount.toString());
    }, 0);
  
  return {
    totalExpenses,
    billableExpenses,
    billedExpenses,
    totalBillableAmount: billableExpenses
  };
}

export async function getTimeByClient(teamId: number, period: { startDate: Date, endDate: Date }) {
  return await db
    .select({
      clientId: clients.id,
      clientName: clients.name,
      hours: sql<number>`sum(${timeEntries.duration}) / 60.0`,
    })
    .from(timeEntries)
    .innerJoin(clients, eq(timeEntries.clientId, clients.id))
    .where(and(
      eq(clients.teamId, teamId),
      sql`${timeEntries.startTime} >= ${period.startDate}`,
      sql`${timeEntries.startTime} <= ${period.endDate}`
    ))
    .groupBy(clients.id, clients.name)
    .orderBy(desc(sql<number>`sum(${timeEntries.duration})`));
}

export async function getTimeByUser(teamId: number, period: { startDate: Date, endDate: Date }) {
  return await db
    .select({
      userId: users.id,
      userName: users.name,
      hours: sql<number>`sum(${timeEntries.duration}) / 60.0`,
    })
    .from(timeEntries)
    .innerJoin(clients, eq(timeEntries.clientId, clients.id))
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .where(and(
      eq(clients.teamId, teamId),
      sql`${timeEntries.startTime} >= ${period.startDate}`,
      sql`${timeEntries.startTime} <= ${period.endDate}`
    ))
    .groupBy(users.id, users.name)
    .orderBy(desc(sql<number>`sum(${timeEntries.duration})`));
}

/**
 * Get monthly revenue data for dashboard charts
 * Combines time entries and expenses to calculate revenue by month
 */
export async function getRevenueByMonth(teamId: number, year: number) {
  // Get all months for the given year
  const startDate = new Date(year, 0, 1); // January 1st
  const endDate = new Date(year, 11, 31); // December 31st
  
  // Get billable time entries grouped by month
  const timeEntryRevenue = await db
    .select({
      month: sql<string>`to_char(${timeEntries.startTime}, 'Mon')`,
      revenue: sql<number>`sum(${timeEntries.duration} * 
        CASE WHEN ${timeEntries.billableRate} IS NULL THEN 0 
        ELSE ${timeEntries.billableRate}::numeric END / 60.0)`,
    })
    .from(timeEntries)
    .innerJoin(clients, eq(timeEntries.clientId, clients.id))
    .where(and(
      eq(clients.teamId, teamId),
      eq(timeEntries.billable, true),
      sql`EXTRACT(YEAR FROM ${timeEntries.startTime}) = ${year}`
    ))
    .groupBy(sql`to_char(${timeEntries.startTime}, 'Mon')`)
    .orderBy(sql`to_char(${timeEntries.startTime}, 'Mon')`);
    
  // Get expenses grouped by month
  const expenseRevenue = await db
    .select({
      month: sql<string>`to_char(${expenses.createdAt}, 'Mon')`,
      expenses: sql<number>`sum(${expenses.amount}::numeric)`,
    })
    .from(expenses)
    .innerJoin(clients, eq(expenses.clientId, clients.id))
    .where(and(
      eq(clients.teamId, teamId),
      sql`EXTRACT(YEAR FROM ${expenses.createdAt}) = ${year}`
    ))
    .groupBy(sql`to_char(${expenses.createdAt}, 'Mon')`)
    .orderBy(sql`to_char(${expenses.createdAt}, 'Mon')`);
    
  // Create a map for all months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = months.map(month => ({
    month,
    Revenue: 0,
    Expenses: 0
  }));
  
  // Fill in time entry revenue
  timeEntryRevenue.forEach(entry => {
    const monthIndex = months.findIndex(m => m === entry.month);
    if (monthIndex >= 0) {
      revenueData[monthIndex].Revenue = Number(entry.revenue);
    }
  });
  
  // Fill in expense data
  expenseRevenue.forEach(entry => {
    const monthIndex = months.findIndex(m => m === entry.month);
    if (monthIndex >= 0) {
      revenueData[monthIndex].Expenses = Number(entry.expenses);
    }
  });
  
  return revenueData;
}