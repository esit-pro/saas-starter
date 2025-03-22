'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { 
  invoices, 
  invoiceItems, 
  invoiceTickets, 
  serviceTickets, 
  timeEntries, 
  expenses, 
  ActivityType, 
  activityLogs, 
  clients,
  users
} from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { eq, and, or, desc, isNull, sql } from 'drizzle-orm';

// Generate a unique invoice number
async function generateInvoiceNumber(teamId: number): Promise<string> {
  // Get current date info for prefix
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Get the highest invoice number for this team with same prefix
  const prefix = `INV-${year}${month}-`;
  
  const result = await db.execute(
    sql`SELECT MAX(invoice_number) as max_number FROM invoices 
        WHERE team_id = ${teamId} AND invoice_number LIKE ${prefix + '%'}`
  );
  
  // Parse the result to get the counter
  let counter = 1;
  if (result.length > 0 && result[0].max_number) {
    const lastNumber = result[0].max_number as string;
    const lastCounter = parseInt(lastNumber.split('-')[2]);
    if (!isNaN(lastCounter)) {
      counter = lastCounter + 1;
    }
  }
  
  // Format counter as 4 digits with leading zeros
  const counterStr = counter.toString().padStart(4, '0');
  
  return `${prefix}${counterStr}`;
}

// Log invoice-related activities
async function logInvoiceActivity(
  teamId: number,
  userId: number,
  type: ActivityType,
  invoiceId?: number
) {
  const action = `${type}${invoiceId ? ` (Invoice ID: ${invoiceId})` : ''}`;
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action,
    timestamp: new Date(),
  });
}

// Create a draft invoice
const createInvoiceSchema = z.object({
  clientId: z.preprocess(
    (val) => Number(val),
    z.number().positive('Client is required')
  ),
  ticketIds: z.array(
    z.preprocess((val) => Number(val), z.number())
  ).optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  tax: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().min(0).default(0)
  ),
  includeTimeEntries: z.boolean().default(true),
  includeExpenses: z.boolean().default(true),
});

export const createInvoice = validatedActionWithUser(
  createInvoiceSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      const teamId = userTeamInfo.teamId;
      
      // Verify client belongs to team
      const client = await db.query.clients.findFirst({
        where: (client, { and, eq: whereEq }) => 
          and(whereEq(client.id, data.clientId), whereEq(client.teamId, teamId))
      });
      
      if (!client) {
        return { error: 'Client not found or not authorized to create invoice' };
      }
      
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(teamId);
      
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Calculate line items based on tickets, time entries, and expenses
        let lineItems = [];
        let subtotal = 0;
        
        // If specific tickets were provided
        if (data.ticketIds && data.ticketIds.length > 0) {
          // Verify all tickets belong to the team and specified client
          const tickets = await tx.query.serviceTickets.findMany({
            where: (ticket, { and, eq: whereEq }) => 
              and(
                whereEq(ticket.teamId, teamId),
                whereEq(ticket.clientId, data.clientId),
                data.ticketIds ? sql`${ticket.id} IN (${data.ticketIds})` : undefined,
                isNull(ticket.deletedAt)
              ),
            with: {
              timeEntries: {
                where: (entry, { and, eq: whereEq, isNull: whereIsNull }) => 
                  and(
                    eq(entry.billable, true),
                    eq(entry.billed, false),
                    isNull(entry.deletedAt)
                  )
              },
              expenses: {
                where: (expense, { and, eq: whereEq, isNull: whereIsNull }) => 
                  and(
                    eq(expense.billable, true),
                    eq(expense.billed, false),
                    isNull(expense.deletedAt)
                  )
              }
            }
          });
          
          // Add time entries for each ticket if includeTimeEntries is true
          if (data.includeTimeEntries) {
            for (const ticket of tickets) {
              for (const entry of ticket.timeEntries) {
                // Duration is in minutes, convert to hours for billing
                const quantity = parseFloat((entry.duration / 60).toFixed(2));
                const unitPrice = entry.billableRate 
                  ? parseFloat(entry.billableRate)
                  : 0; // Default rate or get from team/user settings
                
                const amount = quantity * unitPrice;
                
                lineItems.push({
                  description: `${entry.description} (${ticket.title})`,
                  quantity,
                  unitPrice,
                  amount,
                  type: 'time',
                  timeEntryId: entry.id,
                  ticketId: ticket.id,
                  taxable: false,
                });
                
                subtotal += amount;
                
                // Mark time entry as billed
                await tx.update(timeEntries)
                  .set({ billed: true, updatedAt: new Date() })
                  .where(eq(timeEntries.id, entry.id));
              }
            }
          }
          
          // Add expenses for each ticket if includeExpenses is true
          if (data.includeExpenses) {
            for (const ticket of tickets) {
              for (const expense of ticket.expenses) {
                const amount = parseFloat(expense.amount.toString());
                
                lineItems.push({
                  description: `${expense.description} (${ticket.title})`,
                  quantity: 1,
                  unitPrice: amount,
                  amount,
                  type: 'expense',
                  expenseId: expense.id,
                  ticketId: ticket.id,
                  taxable: false,
                });
                
                subtotal += amount;
                
                // Mark expense as billed
                await tx.update(expenses)
                  .set({ billed: true, updatedAt: new Date() })
                  .where(eq(expenses.id, expense.id));
              }
            }
          }
          
          // Mark tickets as completed (only if they weren't already)
          for (const ticket of tickets) {
            if (ticket.status !== 'completed' && ticket.status !== 'closed') {
              await tx.update(serviceTickets)
                .set({ 
                  status: 'completed', 
                  updatedAt: new Date(),
                  updatedBy: user.id
                })
                .where(eq(serviceTickets.id, ticket.id));
            }
          }
        }
        
        // Calculate tax and total
        const taxAmount = subtotal * (data.tax / 100);
        const total = subtotal + taxAmount;
        
        // Create the invoice
        const [newInvoice] = await tx.insert(invoices)
          .values({
            invoiceNumber,
            clientId: data.clientId,
            subtotal: subtotal.toString(),
            tax: taxAmount.toString(),
            total: total.toString(),
            status: 'draft',
            issueDate: new Date(data.issueDate),
            dueDate: new Date(data.dueDate),
            notes: data.notes || null,
            terms: data.terms || null,
            teamId,
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        // Create invoice items
        if (lineItems.length > 0) {
          await tx.insert(invoiceItems)
            .values(lineItems.map(item => ({
              invoiceId: newInvoice.id,
              description: item.description,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              amount: item.amount.toString(),
              type: item.type,
              timeEntryId: item.timeEntryId || null,
              expenseId: item.expenseId || null,
              ticketId: item.ticketId || null,
              taxable: item.taxable,
              teamId,
              createdBy: user.id,
              updatedBy: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })));
        }
        
        // Link invoice to tickets
        if (data.ticketIds && data.ticketIds.length > 0) {
          await tx.insert(invoiceTickets)
            .values(data.ticketIds.map(ticketId => ({
              invoiceId: newInvoice.id,
              ticketId,
              teamId,
              createdBy: user.id,
              updatedBy: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })));
        }
        
        // Log activity
        await logInvoiceActivity(
          teamId,
          user.id,
          ActivityType.INVOICE_CREATED,
          newInvoice.id
        );
        
        return { 
          success: 'Invoice created successfully',
          invoice: newInvoice
        };
      });
    } catch (error) {
      console.error('Failed to create invoice:', error);
      return { error: 'Failed to create invoice. Please try again.' };
    }
  }
);

// Update a draft invoice
const updateInvoiceSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  tax: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().min(0).default(0)
  ),
});

export const updateInvoice = validatedActionWithUser(
  updateInvoiceSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      const teamId = userTeamInfo.teamId;
      
      // Verify invoice belongs to team and is in draft status
      const existingInvoice = await db.query.invoices.findFirst({
        where: (invoice, { and, eq: whereEq }) => 
          and(
            whereEq(invoice.id, data.id),
            whereEq(invoice.teamId, teamId),
            whereEq(invoice.status, 'draft'), // Only draft invoices can be updated
            isNull(invoice.deletedAt)
          )
      });
      
      if (!existingInvoice) {
        return { 
          error: 'Invoice not found, not authorized to update, or already sent to client'
        };
      }
      
      // Recalculate totals based on tax rate change
      const subtotal = parseFloat(existingInvoice.subtotal.toString());
      const taxAmount = subtotal * (data.tax / 100);
      const total = subtotal + taxAmount;
      
      // Update the invoice
      const [updatedInvoice] = await db.update(invoices)
        .set({
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          notes: data.notes || null,
          terms: data.terms || null,
          tax: taxAmount.toString(),
          total: total.toString(),
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, data.id))
        .returning();
      
      // Log activity
      await logInvoiceActivity(
        teamId,
        user.id,
        ActivityType.INVOICE_UPDATED,
        updatedInvoice.id
      );
      
      return { 
        success: 'Invoice updated successfully',
        invoice: updatedInvoice
      };
    } catch (error) {
      console.error('Failed to update invoice:', error);
      return { error: 'Failed to update invoice. Please try again.' };
    }
  }
);

// Send an invoice to client
const sendInvoiceSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
});

export const sendInvoice = validatedActionWithUser(
  sendInvoiceSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      const teamId = userTeamInfo.teamId;
      
      // Verify invoice belongs to team and is in draft status
      const existingInvoice = await db.query.invoices.findFirst({
        where: (invoice, { and, eq: whereEq }) => 
          and(
            whereEq(invoice.id, data.id),
            whereEq(invoice.teamId, teamId),
            whereEq(invoice.status, 'draft'), // Only draft invoices can be sent
            isNull(invoice.deletedAt)
          )
      });
      
      if (!existingInvoice) {
        return { 
          error: 'Invoice not found, not authorized to send, or already sent to client'
        };
      }
      
      // Update the invoice to sent status
      const [sentInvoice] = await db.update(invoices)
        .set({
          status: 'sent',
          sentAt: new Date(),
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, data.id))
        .returning();
      
      // Log activity
      await logInvoiceActivity(
        teamId,
        user.id,
        ActivityType.INVOICE_SENT,
        sentInvoice.id
      );
      
      return { 
        success: 'Invoice sent successfully',
        invoice: sentInvoice
      };
    } catch (error) {
      console.error('Failed to send invoice:', error);
      return { error: 'Failed to send invoice. Please try again.' };
    }
  }
);

// Void an invoice
const voidInvoiceSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
  reason: z.string().min(1, 'Reason is required'),
  voidTickets: z.boolean().default(false),
});

export const voidInvoice = validatedActionWithUser(
  voidInvoiceSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      const teamId = userTeamInfo.teamId;
      
      // Verify invoice belongs to team and is not already voided
      const existingInvoice = await db.query.invoices.findFirst({
        where: (invoice, { and, eq: whereEq, not }) => 
          and(
            whereEq(invoice.id, data.id),
            whereEq(invoice.teamId, teamId),
            not(whereEq(invoice.status, 'voided')), // Cannot void already voided invoice
            isNull(invoice.deletedAt)
          ),
        with: {
          tickets: {
            with: {
              ticket: true
            }
          },
          items: true
        }
      });
      
      if (!existingInvoice) {
        return { 
          error: 'Invoice not found, not authorized to void, or already voided'
        };
      }

      // Start a transaction
      return await db.transaction(async (tx) => {
        // Void the invoice
        const [voidedInvoice] = await tx.update(invoices)
          .set({
            status: 'voided',
            voidedAt: new Date(),
            notes: existingInvoice.notes 
              ? `${existingInvoice.notes}\n\nVOIDED: ${data.reason}`
              : `VOIDED: ${data.reason}`,
            updatedBy: user.id,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, data.id))
          .returning();
        
        // Unmark the billed status of time entries and expenses
        for (const item of existingInvoice.items) {
          if (item.timeEntryId) {
            await tx.update(timeEntries)
              .set({ 
                billed: false, 
                updatedAt: new Date(),
                updatedBy: user.id
              })
              .where(eq(timeEntries.id, item.timeEntryId));
          }
          
          if (item.expenseId) {
            await tx.update(expenses)
              .set({ 
                billed: false, 
                updatedAt: new Date(),
                updatedBy: user.id
              })
              .where(eq(expenses.id, item.expenseId));
          }
        }
        
        // If voidTickets is true, void associated tickets
        if (data.voidTickets && existingInvoice.tickets.length > 0) {
          for (const invoiceTicket of existingInvoice.tickets) {
            await tx.update(serviceTickets)
              .set({
                status: 'closed',
                closedAt: new Date(),
                updatedAt: new Date(),
                updatedBy: user.id,
                // Add void reason to notes
                description: invoiceTicket.ticket.description
                  ? `${invoiceTicket.ticket.description}\n\nVOIDED: Associated with voided invoice #${existingInvoice.invoiceNumber}. Reason: ${data.reason}`
                  : `VOIDED: Associated with voided invoice #${existingInvoice.invoiceNumber}. Reason: ${data.reason}`
              })
              .where(eq(serviceTickets.id, invoiceTicket.ticketId));
          }
        }
        
        // Log activity
        await logInvoiceActivity(
          teamId,
          user.id,
          ActivityType.INVOICE_VOIDED,
          voidedInvoice.id
        );
        
        return { 
          success: 'Invoice voided successfully',
          invoice: voidedInvoice
        };
      });
    } catch (error) {
      console.error('Failed to void invoice:', error);
      return { error: 'Failed to void invoice. Please try again.' };
    }
  }
);

// Mark invoice as paid
const markInvoicePaidSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
  paidAmount: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().positive('Paid amount must be positive')
  ),
  paidDate: z.string().min(1, 'Paid date is required'),
  paidMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

export const markInvoicePaid = validatedActionWithUser(
  markInvoicePaidSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      const teamId = userTeamInfo.teamId;
      
      // Verify invoice belongs to team and is in sent or overdue status
      const existingInvoice = await db.query.invoices.findFirst({
        where: (invoice, { and, eq: whereEq, or: whereOr }) => 
          and(
            whereEq(invoice.id, data.id),
            whereEq(invoice.teamId, teamId),
            whereOr(
              whereEq(invoice.status, 'sent'),
              whereEq(invoice.status, 'overdue')
            ),
            isNull(invoice.deletedAt)
          )
      });
      
      if (!existingInvoice) {
        return { 
          error: 'Invoice not found, not authorized to mark as paid, or in invalid status'
        };
      }
      
      // Update invoice as paid
      const [paidInvoice] = await db.update(invoices)
        .set({
          status: 'paid',
          paidDate: new Date(data.paidDate),
          paidAmount: data.paidAmount.toString(),
          paidMethod: data.paidMethod,
          notes: data.notes 
            ? existingInvoice.notes
              ? `${existingInvoice.notes}\n\nPayment Notes: ${data.notes}`
              : `Payment Notes: ${data.notes}`
            : existingInvoice.notes,
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, data.id))
        .returning();
      
      // Log activity
      await logInvoiceActivity(
        teamId,
        user.id,
        ActivityType.INVOICE_PAID,
        paidInvoice.id
      );
      
      return { 
        success: 'Invoice marked as paid successfully',
        invoice: paidInvoice
      };
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      return { error: 'Failed to mark invoice as paid. Please try again.' };
    }
  }
);

// Get invoices for client
export async function getInvoicesForClient(clientId: number, _formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team' };
  }

  try {
    const teamId = userTeamInfo.teamId;
    
    // Verify client belongs to team
    const client = await db.query.clients.findFirst({
      where: (client, { and, eq: whereEq }) => 
        and(whereEq(client.id, clientId), whereEq(client.teamId, teamId))
    });
    
    if (!client) {
      return { error: 'Client not found or not authorized to view invoices' };
    }
    
    // Get invoices for this client
    const invoiceList = await db.query.invoices.findMany({
      where: (invoice, { and, eq: whereEq }) => 
        and(
          whereEq(invoice.clientId, clientId),
          whereEq(invoice.teamId, teamId),
          isNull(invoice.deletedAt)
        ),
      orderBy: [desc(invoices.createdAt)]
    });
    
    return { invoices: invoiceList };
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return { error: 'Failed to fetch invoices. Please try again.' };
  }
}

// Get all invoices for team
export async function getInvoicesForTeam(_formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team' };
  }

  try {
    const teamId = userTeamInfo.teamId;
    
    // Get all invoices for team
    const invoiceList = await db.query.invoices.findMany({
      where: (invoice, { and, eq: whereEq }) => 
        and(
          whereEq(invoice.teamId, teamId),
          isNull(invoice.deletedAt)
        ),
      with: {
        client: true,
        createdByUser: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [desc(invoices.createdAt)]
    });
    
    return { invoices: invoiceList };
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return { error: 'Failed to fetch invoices. Please try again.' };
  }
}

// Get invoice by ID with details
export async function getInvoiceById(id: number, _formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team' };
  }

  try {
    const teamId = userTeamInfo.teamId;
    
    // Get invoice with related data
    const invoice = await db.query.invoices.findFirst({
      where: (invoice, { and, eq: whereEq }) => 
        and(
          whereEq(invoice.id, id),
          whereEq(invoice.teamId, teamId),
          isNull(invoice.deletedAt)
        ),
      with: {
        client: true,
        createdByUser: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          with: {
            timeEntry: true,
            expense: true,
            ticket: true
          }
        },
        tickets: {
          with: {
            ticket: true
          }
        }
      }
    });
    
    if (!invoice) {
      return { error: 'Invoice not found' };
    }
    
    return { invoice };
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return { error: 'Failed to fetch invoice. Please try again.' };
  }
}

// Get billable items for client
export async function getBillableItemsForClient(clientId: number, _formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team' };
  }

  try {
    const teamId = userTeamInfo.teamId;
    
    // Verify client belongs to team
    const client = await db.query.clients.findFirst({
      where: (client, { and, eq: whereEq }) => 
        and(whereEq(client.id, clientId), whereEq(client.teamId, teamId))
    });
    
    if (!client) {
      return { error: 'Client not found or not authorized to view billable items' };
    }
    
    // Get all service tickets for this client that are not deleted
    const tickets = await db.query.serviceTickets.findMany({
      where: (ticket, { and, eq: whereEq }) => 
        and(
          whereEq(ticket.clientId, clientId),
          whereEq(ticket.teamId, teamId),
          isNull(ticket.deletedAt)
        ),
      with: {
        timeEntries: {
          where: (entry, { and, eq: whereEq, isNull: whereIsNull }) => 
            and(
              eq(entry.billable, true),
              eq(entry.billed, false),
              isNull(entry.deletedAt)
            ),
          with: {
            user: {
              columns: {
                id: true,
                name: true
              }
            }
          }
        },
        expenses: {
          where: (expense, { and, eq: whereEq, isNull: whereIsNull }) => 
            and(
              eq(expense.billable, true),
              eq(expense.billed, false),
              isNull(expense.deletedAt)
            ),
          with: {
            user: {
              columns: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    // Get orphaned time entries and expenses (associated with deleted tickets)
    const orphanedTimeEntries = await db
      .select({
        entry: timeEntries,
        user: {
          id: timeEntries.userId,
          name: users.name
        },
        ticket: {
          id: serviceTickets.id,
          title: serviceTickets.title,
          deletedAt: serviceTickets.deletedAt
        }
      })
      .from(timeEntries)
      .leftJoin(users, eq(timeEntries.userId, users.id))
      .leftJoin(serviceTickets, eq(timeEntries.ticketId, serviceTickets.id))
      .where(
        and(
          eq(timeEntries.teamId, teamId),
          eq(timeEntries.clientId, clientId),
          eq(timeEntries.billable, true),
          eq(timeEntries.billed, false),
          isNull(timeEntries.deletedAt),
          or(
            isNull(timeEntries.ticketId),
            and(
              sql`${timeEntries.ticketId} IS NOT NULL`,
              sql`EXISTS (SELECT 1 FROM ${serviceTickets} WHERE ${serviceTickets.id} = ${timeEntries.ticketId} AND ${serviceTickets.deletedAt} IS NOT NULL)`
            )
          )
        )
      );
    
    const orphanedExpenses = await db
      .select({
        expense: expenses,
        user: {
          id: expenses.userId,
          name: users.name
        },
        ticket: {
          id: serviceTickets.id,
          title: serviceTickets.title,
          deletedAt: serviceTickets.deletedAt
        }
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id))
      .leftJoin(serviceTickets, eq(expenses.ticketId, serviceTickets.id))
      .where(
        and(
          eq(expenses.teamId, teamId),
          eq(expenses.clientId, clientId),
          eq(expenses.billable, true),
          eq(expenses.billed, false),
          isNull(expenses.deletedAt),
          or(
            isNull(expenses.ticketId),
            and(
              sql`${expenses.ticketId} IS NOT NULL`,
              sql`EXISTS (SELECT 1 FROM ${serviceTickets} WHERE ${serviceTickets.id} = ${expenses.ticketId} AND ${serviceTickets.deletedAt} IS NOT NULL)`
            )
          )
        )
      );
    
    return { 
      tickets,
      orphanedTimeEntries: orphanedTimeEntries.map(item => ({
        ...item.entry,
        user: item.user,
        ticket: item.ticket ? {
          ...item.ticket,
          isDeleted: item.ticket.deletedAt !== null
        } : null
      })),
      orphanedExpenses: orphanedExpenses.map(item => ({
        ...item.expense,
        user: item.user,
        ticket: item.ticket ? {
          ...item.ticket,
          isDeleted: item.ticket.deletedAt !== null
        } : null
      }))
    };
  } catch (error) {
    console.error('Failed to fetch billable items:', error);
    return { 
      error: 'Failed to fetch billable items. Please try again.',
      tickets: [],
      orphanedTimeEntries: [],
      orphanedExpenses: []
    };
  }
} 