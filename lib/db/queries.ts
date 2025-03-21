import { desc, and, eq, isNull, sql, or } from 'drizzle-orm';
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

    return await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userName: users.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(conditions.length > 0 ? conditions[0] : sql`1=1`)
      .orderBy(desc(activityLogs.timestamp))
      .limit(10);
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
  return await db
    .insert(clients)
    .values({
      ...clientData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
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

export async function getServiceTickets(teamId: number, filters?: {
  clientId?: number;
  status?: string;
  assignedTo?: number;
}) {
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

  return await db
    .select({
      ticket: serviceTickets,
      client: clients,
      assignedUser: users,
    })
    .from(serviceTickets)
    .leftJoin(clients, eq(serviceTickets.clientId, clients.id))
    .leftJoin(users, eq(serviceTickets.assignedTo, users.id))
    .where(and(...conditions))
    .orderBy(desc(serviceTickets.createdAt));
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

export async function deleteServiceTicket(ticketId: number) {
  return await db
    .update(serviceTickets)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date()
    })
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
            and(
              eq(commentTable.isInternal, true),
              eq(commentTable.userId, currentUserId)
            )
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
    conditions.push(sql`${expenses.date} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${expenses.date} <= ${filters.endDate}`);
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
    .orderBy(desc(expenses.date));
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

export async function getClientSummary(teamId: number) {
  const clientCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(eq(clients.teamId, teamId))
    .then(result => result[0].count);

  const activeTicketsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(serviceTickets)
    .where(and(
      eq(serviceTickets.teamId, teamId),
      sql`${serviceTickets.status} != 'closed'`
    ))
    .then(result => result[0].count);

  return { clientCount, activeTicketsCount };
}

export async function getTimeTrackingSummary(teamId: number, period: { startDate: Date, endDate: Date }) {
  const result = await db
    .select({
      totalHours: sql<number>`sum(${timeEntries.duration}) / 60.0`,
      billableHours: sql<number>`sum(case when ${timeEntries.billable} = true then ${timeEntries.duration} else 0 end) / 60.0`,
      billedHours: sql<number>`sum(case when ${timeEntries.billed} = true then ${timeEntries.duration} else 0 end) / 60.0`,
    })
    .from(timeEntries)
    .innerJoin(clients, eq(timeEntries.clientId, clients.id))
    .where(and(
      eq(clients.teamId, teamId),
      sql`${timeEntries.startTime} >= ${period.startDate}`,
      sql`${timeEntries.startTime} <= ${period.endDate}`
    ));

  return result[0];
}

export async function getExpenseSummary(teamId: number, period: { startDate: Date, endDate: Date }) {
  const result = await db
    .select({
      totalExpenses: sql<number>`sum(${expenses.amount})`,
      billableExpenses: sql<number>`sum(case when ${expenses.billable} = true then ${expenses.amount} else 0 end)`,
      billedExpenses: sql<number>`sum(case when ${expenses.billed} = true then ${expenses.amount} else 0 end)`,
    })
    .from(expenses)
    .innerJoin(clients, eq(expenses.clientId, clients.id))
    .where(and(
      eq(clients.teamId, teamId),
      sql`${expenses.date} >= ${period.startDate}`,
      sql`${expenses.date} <= ${period.endDate}`
    ));

  return result[0];
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