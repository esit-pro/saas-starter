'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { serviceTickets, ActivityType, activityLogs, teams, teamMembers, users, clients, ticketComments, timeEntries, expenses } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { hasColumn } from '@/lib/utils/audit-trail';

// Log ticket-related activities
async function logTicketActivity(
  teamId: number,
  userId: number,
  type: ActivityType,
  ticketId?: number
) {
  const action = `${type}${ticketId ? ` (Ticket ID: ${ticketId})` : ''}`;
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action,
    timestamp: new Date(),
  });
}

// Create a ticket
const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  clientId: z.preprocess(
    (val) => Number(val),
    z.number().positive('Client is required')
  ),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().optional(),
  assignedTo: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().optional()
  ),
  dueDate: z.string().optional().nullable(),
});

export const createTicket = validatedActionWithUser(
  createTicketSchema,
  async (data, _, user) => {
    console.log('Creating ticket - authenticated user:', { 
      id: user.id,
      email: user.email,
      role: user.role 
    });
    
    let userTeamInfo = await getUserWithTeam(user.id);
    console.log('User with team:', userTeamInfo);
    
    // If user doesn't have a team, create one
    if (!userTeamInfo?.teamId) {
      console.warn('User has no team association!');
      
      // Let's automatically create a team for this user if they don't have one
      try {
        console.log('Creating a default team for user...');
        const [newTeam] = await db
          .insert(teams)
          .values({
            name: `${user.email}'s Team`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
          
        console.log('Created team:', newTeam);
        
        // Add user to the team
        await db
          .insert(teamMembers)
          .values({
            userId: user.id,
            teamId: newTeam.id,
            role: 'owner',
            joinedAt: new Date(),
          });
          
        // Use the new team ID
        userTeamInfo = { user, teamId: newTeam.id };
      } catch (err) {
        console.error('Failed to create default team:', err);
        return { error: 'User is not part of a team and failed to create a default team' };
      }
    }
    
    // Make sure we have a team ID by this point
    if (!userTeamInfo?.teamId) {
      return { error: 'Could not determine team ID for user' };
    }

    try {
      const teamId = userTeamInfo.teamId;
      
      // Convert string date to Date object if present
      const dueDate = data.dueDate ? new Date(data.dueDate) : null;
      
      console.log('Creating ticket with data:', {
        ...data,
        teamId,
        createdBy: user.id,
        dueDate
      });
      
      // Prepare ticket data with guaranteed fields
      const ticketData: any = {
        title: data.title,
        description: data.description || null,
        clientId: data.clientId,
        assignedTo: data.assignedTo || null,
        priority: data.priority,
        category: data.category || null,
        dueDate,
        teamId,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Conditionally add updatedBy if column exists
      try {
        if (await hasColumn(serviceTickets, 'updatedBy')) {
          ticketData.updatedBy = user.id;
        }
      } catch (error) {
        console.error("Error checking for updatedBy column:", error);
      }
      
      const [newTicket] = await db
        .insert(serviceTickets)
        .values(ticketData)
        .returning();
        
      console.log('Ticket created successfully:', newTicket);

      await logTicketActivity(
        teamId,
        user.id,
        ActivityType.TICKET_CREATED,
        newTicket.id
      );

      return { 
        success: 'Ticket created successfully',
        ticket: newTicket
      };
    } catch (error) {
      console.error('Failed to create ticket:', error);
      return { error: 'Failed to create ticket. Please try again.' };
    }
  }
);

// Update a ticket
const updateTicketSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  clientId: z.preprocess(
    (val) => Number(val),
    z.number().positive('Client is required')
  ),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().optional(),
  assignedTo: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().optional()
  ),
  status: z.enum(['open', 'in-progress', 'on-hold', 'completed', 'closed']),
  dueDate: z.string().optional().nullable(),
});

export const updateTicket = validatedActionWithUser(
  updateTicketSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      // Verify ticket belongs to this team
      const teamId = userTeamInfo.teamId;
      const existingTicket = await db.query.serviceTickets.findFirst({
        where: (ticket, { and, eq: whereEq }) => 
          and(whereEq(ticket.id, data.id), whereEq(ticket.teamId, teamId))
      });

      if (!existingTicket) {
        return { error: 'Ticket not found or not authorized to modify' };
      }

      // Convert string date to Date object if present
      const dueDate = data.dueDate ? new Date(data.dueDate) : null;
      
      // If status is changing to closed, set closedAt
      const closedAt = data.status === 'closed' ? new Date() : existingTicket.closedAt;

      // Prepare update data with guaranteed fields
      const updateData: any = {
        title: data.title,
        description: data.description || null,
        clientId: data.clientId,
        assignedTo: data.assignedTo || null,
        priority: data.priority,
        category: data.category || null,
        status: data.status,
        dueDate,
        closedAt,
        updatedAt: new Date(),
      };
      
      // Conditionally add updatedBy if column exists
      try {
        if (await hasColumn(serviceTickets, 'updatedBy')) {
          updateData.updatedBy = user.id;
        }
      } catch (error) {
        console.error("Error checking for updatedBy column:", error);
      }

      const [updatedTicket] = await db
        .update(serviceTickets)
        .set(updateData)
        .where(eq(serviceTickets.id, data.id))
        .returning();

      await logTicketActivity(
        teamId,
        user.id,
        data.status === 'closed' ? ActivityType.TICKET_CLOSED : ActivityType.TICKET_UPDATED,
        updatedTicket.id
      );

      return { 
        success: 'Ticket updated successfully',
        ticket: updatedTicket
      };
    } catch (error) {
      console.error('Failed to update ticket:', error);
      return { error: 'Failed to update ticket. Please try again.' };
    }
  }
);

// Delete a ticket
const deleteTicketSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
});

export const deleteTicket = validatedActionWithUser(
  deleteTicketSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      // Verify ticket belongs to this team
      const teamId = userTeamInfo.teamId;
      const existingTicket = await db.query.serviceTickets.findFirst({
        where: (ticket, { and, eq: whereEq, isNull: whereIsNull }) => 
          and(
            whereEq(ticket.id, data.id), 
            whereEq(ticket.teamId, teamId),
            whereIsNull(ticket.deletedAt)
          )
      });

      if (!existingTicket) {
        return { error: 'Ticket not found or not authorized to delete' };
      }

      // Check for billable unbilled time entries and expenses - but just for logging/notification
      const billableTimeEntries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.ticketId, data.id),
            eq(timeEntries.billable, true),
            eq(timeEntries.billed, false),
            isNull(timeEntries.deletedAt)
          )
        );

      const billableExpenses = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.ticketId, data.id),
            eq(expenses.billable, true),
            eq(expenses.billed, false),
            isNull(expenses.deletedAt)
          )
        );

      // Soft delete the ticket by setting the deletedAt timestamp
      // This preserves all relationships while hiding the ticket from active views
      const updateData: any = {
        deletedAt: new Date(),
        updatedAt: new Date()
      };

      // Conditionally add updatedBy and deletedBy if columns exist
      try {
        if (await hasColumn(serviceTickets, 'updatedBy')) {
          updateData.updatedBy = user.id;
        }
        if (await hasColumn(serviceTickets, 'deletedBy')) {
          updateData.deletedBy = user.id;
        }
      } catch (error) {
        console.error("Error checking for audit columns:", error);
      }

      const [deletedTicket] = await db
        .update(serviceTickets)
        .set(updateData)
        .where(eq(serviceTickets.id, data.id))
        .returning();

      // Log the activity
      await logTicketActivity(
        teamId,
        user.id,
        ActivityType.TICKET_DELETED,
        deletedTicket.id
      );

      // Return information about associated items
      if (billableTimeEntries.length > 0 || billableExpenses.length > 0) {
        return { 
          success: 'Ticket deleted successfully. Note that there are still unbilled time entries and/or expenses associated with this ticket that can be billed to the client.',
          hasUnbilledItems: true,
          unbilledTimeEntries: billableTimeEntries.length,
          unbilledExpenses: billableExpenses.length
        };
      }

      return { success: 'Ticket deleted successfully' };
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      return { error: 'Failed to delete ticket. Please try again.' };
    }
  }
);

// Get all tickets for the team
export async function getTicketsForTeam(_formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  console.log('Get tickets - user team info:', userTeamInfo);
  
  // If user doesn't have a team, create one
  if (!userTeamInfo?.teamId) {
    console.log('User has no team - creating one for tickets listing');
    
    try {
      // Create a default team
      const [newTeam] = await db
        .insert(teams)
        .values({
          name: `${user.email}'s Team`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
        
      console.log('Created team for ticket list:', newTeam);
      
      // Add user to the team
      await db
        .insert(teamMembers)
        .values({
          userId: user.id,
          teamId: newTeam.id,
          role: 'owner',
          joinedAt: new Date(),
        });
        
      // Use the new team ID
      userTeamInfo = { user, teamId: newTeam.id };
    } catch (err) {
      console.error('Failed to create default team for ticket list:', err);
      return { error: 'Failed to create a team for your account', tickets: [] };
    }
  }

  try {
    const teamId = userTeamInfo.teamId;
    console.log('Fetching tickets for teamId:', teamId);
    
    const ticketList = await db.query.serviceTickets.findMany({
      where: (ticket, { and, eq: whereEq, isNull: whereIsNull }) => 
        and(whereEq(ticket.teamId, teamId as number), whereIsNull(ticket.deletedAt)),
      with: {
        client: true,
        assignedUser: true,
        createdByUser: true,
      },
      orderBy: (ticket, { desc }) => [desc(ticket.createdAt)]
    });
    
    console.log('Fetched tickets:', ticketList);

    return { tickets: ticketList };
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return { error: 'Failed to fetch tickets. Please try again.' };
  }
}

// Get a specific ticket by ID
export async function getTicketById(id: number, _formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  console.log('Get ticket by ID - user team info:', userTeamInfo);
  
  // Skip team creation for read operations
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team' };
  }

  try {
    const teamId = userTeamInfo.teamId;
    console.log(`Fetching ticket with ID: ${id} for team: ${teamId}`);
    
    // Get ticket with related data
    const ticket = await db.query.serviceTickets.findFirst({
      where: (ticket, { and, eq: whereEq, isNull: whereIsNull }) => 
        and(
          whereEq(ticket.id, id), 
          whereEq(ticket.teamId, teamId as number),
          isNull(ticket.deletedAt)
        ),
      with: {
        client: true,
        assignedUser: true,
        createdByUser: true,
      }
    });

    if (!ticket) {
      return { error: 'Ticket not found' };
    }

    // Get comments for this ticket
    const comments = await db.query.ticketComments.findMany({
      where: eq(ticketComments.ticketId, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [desc(ticketComments.createdAt)]
    });

    // Get time entries for this ticket, excluding deleted ones
    const timeEntriesData = await db
      .select({
        timeEntry: timeEntries,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(timeEntries)
      .leftJoin(users, eq(timeEntries.userId, users.id))
      .where(
        and(
          eq(timeEntries.ticketId, id),
          isNull(timeEntries.deletedAt)
        )
      )
      .orderBy(desc(timeEntries.startTime));

    // Get expenses for this ticket
    const expensesData = await db
      .select()
      .from(expenses)
      .where(eq(expenses.ticketId, id))
      .orderBy(desc(expenses.createdAt));

    return { 
      ticket,
      comments,
      timeEntries: timeEntriesData.map(item => ({
        ...item.timeEntry,
        user: item.user
      })),
      expenses: expensesData
    };
  } catch (error) {
    console.error('Failed to fetch ticket:', error);
    return { error: 'Failed to fetch ticket. Please try again.' };
  }
}

// Add comment to ticket
const addCommentSchema = z.object({
  ticketId: z.preprocess((val) => Number(val), z.number()),
  content: z.string().min(1, 'Comment text is required'),
  isInternal: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(false)
  ),
});

export const addTicketComment = validatedActionWithUser(
  addCommentSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      // Verify ticket belongs to this team
      const teamId = userTeamInfo.teamId;
      const existingTicket = await db.query.serviceTickets.findFirst({
        where: (ticket, { and, eq: whereEq }) => 
          and(whereEq(ticket.id, data.ticketId), whereEq(ticket.teamId, teamId))
      });

      if (!existingTicket) {
        return { error: 'Ticket not found or not authorized to comment' };
      }

      // Prepare insert data with guaranteed fields
      const commentData: any = {
        ticketId: data.ticketId,
        teamId,
        content: data.content,
        isInternal: data.isInternal,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Conditionally add updatedBy if column exists
      try {
        if (await hasColumn(ticketComments, 'updatedBy')) {
          commentData.updatedBy = user.id;
        }
      } catch (error) {
        console.error("Error checking for updatedBy column:", error);
      }

      const [newComment] = await db
        .insert(ticketComments)
        .values(commentData)
        .returning();

      // Get the user info for the response
      const commentWithUser = {
        ...newComment,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };

      await logTicketActivity(
        teamId,
        user.id,
        ActivityType.TICKET_UPDATED,
        data.ticketId
      );

      return { 
        success: 'Comment added successfully',
        comment: commentWithUser
      };
    } catch (error) {
      console.error('Failed to add comment:', error);
      return { error: 'Failed to add comment. Please try again.' };
    }
  }
);

// Log time on a ticket
const logTimeSchema = z.object({
  ticketId: z.preprocess((val) => Number(val), z.number()),
  clientId: z.preprocess((val) => Number(val), z.number()),
  description: z.string().min(1, 'Description is required'),
  duration: z.preprocess((val) => Number(val), z.number().min(1, 'Duration must be at least 1 minute')),
  startTime: z.string().min(1, 'Start time is required'),
  billable: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(true)
  ),
  billed: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(false)
  ),
  billableRate: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().optional()
  ),
});

export const logTimeEntry = validatedActionWithUser(
  logTimeSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      // Verify ticket belongs to this team
      const teamId = userTeamInfo.teamId;
      if (data.ticketId) {
        const existingTicket = await db.query.serviceTickets.findFirst({
          where: (ticket, { and, eq: whereEq }) => 
            and(whereEq(ticket.id, data.ticketId), whereEq(ticket.teamId, teamId))
        });

        if (!existingTicket) {
          return { error: 'Ticket not found or not authorized to log time' };
        }
      }

      // Verify client belongs to this team
      const existingClient = await db.query.clients.findFirst({
        where: (client, { and, eq: whereEq }) => 
          and(whereEq(client.id, data.clientId), whereEq(client.teamId, teamId))
      });

      if (!existingClient) {
        return { error: 'Client not found or not authorized to log time' };
      }

      // Prepare time entry data with guaranteed fields
      const timeEntryData: any = {
        ticketId: data.ticketId || null,
        clientId: data.clientId,
        userId: user.id,
        teamId: teamId,
        description: data.description,
        startTime: new Date(data.startTime),
        duration: data.duration,
        billable: data.billable,
        billed: data.billed,
        billableRate: data.billableRate ? data.billableRate.toString() : null,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Conditionally add updatedBy if column exists
      try {
        if (await hasColumn(timeEntries, 'updatedBy')) {
          timeEntryData.updatedBy = user.id;
        }
      } catch (error) {
        console.error("Error checking for updatedBy column:", error);
      }

      const [newTimeEntry] = await db
        .insert(timeEntries)
        .values(timeEntryData)
        .returning();

      // Get the user info for the response
      const timeEntryWithUser = {
        ...newTimeEntry,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };

      await logTicketActivity(
        teamId,
        user.id,
        ActivityType.TIME_ENTRY_CREATED,
        data.ticketId
      );

      return { 
        success: 'Time logged successfully',
        timeEntry: timeEntryWithUser
      };
    } catch (error) {
      console.error('Failed to log time:', error);
      return { error: 'Failed to log time. Please try again.' };
    }
  }
);

// Delete a time entry (soft delete)
const deleteTimeEntrySchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
});

export const deleteTimeEntry = validatedActionWithUser(
  deleteTimeEntrySchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      // Verify time entry belongs to this team and user
      const teamId = userTeamInfo.teamId;
      const existingTimeEntry = await db.query.timeEntries.findFirst({
        where: (entry, { and, eq: whereEq, isNull: whereIsNull }) => 
          and(
            whereEq(entry.id, data.id), 
            whereEq(entry.teamId, teamId),
            isNull(entry.deletedAt)
          )
      });

      if (!existingTimeEntry) {
        return { error: 'Time entry not found or not authorized to delete' };
      }

      // Soft delete by setting the deletedAt timestamp
      const updateData: any = {
        deletedAt: new Date(),
        updatedAt: new Date()
      };

      // Conditionally add updatedBy and deletedBy if columns exist
      try {
        if (await hasColumn(timeEntries, 'updatedBy')) {
          updateData.updatedBy = user.id;
        }
        if (await hasColumn(timeEntries, 'deletedBy')) {
          updateData.deletedBy = user.id;
        }
      } catch (error) {
        console.error("Error checking for audit columns:", error);
      }

      const [deletedTimeEntry] = await db
        .update(timeEntries)
        .set(updateData)
        .where(eq(timeEntries.id, data.id))
        .returning();

      await logTicketActivity(
        teamId,
        user.id,
        ActivityType.TIME_ENTRY_UPDATED,  // Using updated as there's no specific delete type
        existingTimeEntry.ticketId || undefined
      );

      return { success: 'Time entry deleted successfully' };
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      return { error: 'Failed to delete time entry. Please try again.' };
    }
  }
);

// Add expense to a ticket
const addExpenseSchema = z.object({
  ticketId: z.preprocess((val) => Number(val), z.number()),
  clientId: z.preprocess((val) => Number(val), z.number()),
  description: z.string().min(1, 'Description is required'),
  amount: z.preprocess((val) => Number(val), z.number().positive('Amount must be positive')),
  date: z.string().min(1, 'Date is required'),
  category: z.string().optional(),
  billable: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(true)
  ),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const addExpense = validatedActionWithUser(
  addExpenseSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      // Verify ticket belongs to this team
      const teamId = userTeamInfo.teamId;
      if (data.ticketId) {
        const existingTicket = await db.query.serviceTickets.findFirst({
          where: (ticket, { and, eq: whereEq }) => 
            and(whereEq(ticket.id, data.ticketId), whereEq(ticket.teamId, teamId))
        });

        if (!existingTicket) {
          return { error: 'Ticket not found or not authorized to add expense' };
        }
      }

      // Verify client belongs to this team
      const existingClient = await db.query.clients.findFirst({
        where: (client, { and, eq: whereEq }) => 
          and(whereEq(client.id, data.clientId), whereEq(client.teamId, teamId))
      });

      if (!existingClient) {
        return { error: 'Client not found or not authorized to add expense' };
      }

      const [newExpense] = await db
        .insert(expenses)
        .values({
          ticketId: data.ticketId || null,
          clientId: data.clientId,
          userId: user.id,
          teamId,
          description: data.description,
          amount: data.amount.toString(),
          category: data.category || null,
          billable: data.billable,
          notes: data.notes || null,
          receiptUrl: data.receiptUrl || null,
          createdBy: user.id,
          updatedBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await logTicketActivity(
        teamId,
        user.id,
        ActivityType.EXPENSE_CREATED,
        data.ticketId
      );

      return { 
        success: 'Expense added successfully',
        expense: newExpense
      };
    } catch (error) {
      console.error('Failed to add expense:', error);
      return { error: 'Failed to add expense. Please try again.' };
    }
  }
);

// Get clients for selection in forms
export async function getClientsForSelection(_formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team', clients: [] };
  }

  try {
    const teamId = userTeamInfo.teamId;
    
    const clientList = await db
      .select({
        id: clients.id,
        name: clients.name,
      })
      .from(clients)
      .where(and(
        eq(clients.teamId, teamId),
        isNull(clients.deletedAt)
      ))
      .orderBy(clients.name);

    return { clients: clientList };
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return { error: 'Failed to fetch clients. Please try again.', clients: [] };
  }
}

// Get team members for assignment
export async function getTeamMembersForAssignment(_formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team', members: [] };
  }

  try {
    const teamId = userTeamInfo.teamId;
    
    const memberList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    return { members: memberList };
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return { error: 'Failed to fetch team members. Please try again.', members: [] };
  }
}

// Get all unbilled billable time entries and expenses for a team
// This includes entries associated with deleted tickets
export async function getUnbilledItemsForTeam(_formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team' };
  }

  try {
    const teamId = userTeamInfo.teamId;
    
    // Get all unbilled billable time entries
    const timeEntriesData = await db
      .select({
        timeEntry: timeEntries,
        user: {
          id: users.id,
          name: users.name,
        },
        ticket: {
          id: serviceTickets.id,
          title: serviceTickets.title,
          deletedAt: serviceTickets.deletedAt
        },
        client: {
          id: clients.id,
          name: clients.name
        }
      })
      .from(timeEntries)
      .leftJoin(users, eq(timeEntries.userId, users.id))
      .leftJoin(serviceTickets, eq(timeEntries.ticketId, serviceTickets.id))
      .leftJoin(clients, eq(timeEntries.clientId, clients.id))
      .where(
        and(
          eq(timeEntries.teamId, teamId),
          eq(timeEntries.billable, true),
          eq(timeEntries.billed, false),
          isNull(timeEntries.deletedAt)
        )
      )
      .orderBy(desc(timeEntries.startTime));

    // Get all unbilled billable expenses
    const expensesData = await db
      .select({
        expense: expenses,
        user: {
          id: users.id,
          name: users.name,
        },
        ticket: {
          id: serviceTickets.id,
          title: serviceTickets.title,
          deletedAt: serviceTickets.deletedAt
        },
        client: {
          id: clients.id,
          name: clients.name
        }
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id))
      .leftJoin(serviceTickets, eq(expenses.ticketId, serviceTickets.id))
      .leftJoin(clients, eq(expenses.clientId, clients.id))
      .where(
        and(
          eq(expenses.teamId, teamId),
          eq(expenses.billable, true),
          eq(expenses.billed, false),
          isNull(expenses.deletedAt)
        )
      )
      .orderBy(desc(expenses.createdAt));

    // Process the results
    const formattedTimeEntries = timeEntriesData.map(item => ({
      ...item.timeEntry,
      user: item.user,
      ticket: item.ticket ? {
        ...item.ticket,
        isDeleted: item.ticket.deletedAt !== null
      } : null,
      client: item.client
    }));

    const formattedExpenses = expensesData.map(item => ({
      ...item.expense,
      user: item.user,
      ticket: item.ticket ? {
        ...item.ticket,
        isDeleted: item.ticket.deletedAt !== null
      } : null,
      client: item.client
    }));

    return { 
      timeEntries: formattedTimeEntries,
      expenses: formattedExpenses
    };
  } catch (error) {
    console.error('Failed to fetch unbilled items:', error);
    return { 
      error: 'Failed to fetch unbilled items. Please try again.',
      timeEntries: [],
      expenses: []
    };
  }
}