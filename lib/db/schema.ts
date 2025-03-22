import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  primaryKey,
  json,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  phoneVerified: boolean('phone_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const verificationCodes = pgTable('verification_codes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  code: varchar('code', { length: 10 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'phone_verification' or '2fa_login'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  used: boolean('used').notNull().default(false),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityId: integer('entity_id'),  // ID of the entity being modified (client, ticket, etc.)
  entityType: varchar('entity_type', { length: 50 }), // Type of entity (client, ticket, timeEntry, etc.)
  details: json('details'), // JSON object containing before/after values or additional context
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// Common audit fields for all entities
const auditFields = {
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
  deletedBy: integer('deleted_by').references(() => users.id),
  teamId: integer('team_id').notNull().references(() => teams.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
};

// Update clients table with standard audit fields
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  ...auditFields
});

// Update service tickets table with standard audit fields
export const serviceTickets = pgTable('service_tickets', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  clientId: integer('client_id').references(() => clients.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  dueDate: timestamp('due_date'),
  closedAt: timestamp('closed_at'),
  ...auditFields
});

// Update ticket comments with standard audit fields
export const ticketComments = pgTable('ticket_comments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => serviceTickets.id),
  content: text('content').notNull(),
  attachments: json('attachments'),
  isInternal: boolean('is_internal').notNull().default(false),
  ...auditFields
});

// Update time entries with standard audit fields
export const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => serviceTickets.id),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  description: text('description').notNull(),
  startTime: timestamp('start_time').notNull(),
  duration: integer('duration').notNull(), // Duration in minutes
  billable: boolean('billable').notNull().default(true),
  billed: boolean('billed').notNull().default(false),
  billableRate: varchar('billable_rate', { length: 50 }),
  ...auditFields
});

// Update expenses with standard audit fields
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => serviceTickets.id),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
  billable: boolean('billable').notNull().default(true),
  billed: boolean('billed').notNull().default(false),
  notes: text('notes'),
  receiptUrl: varchar('receipt_url', { length: 255 }),
  receipt: json('receipt'),
  ...auditFields
});

// Relations

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  clients: many(clients),
  serviceTickets: many(serviceTickets),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  assignedTickets: many(serviceTickets, { relationName: 'assignedTickets' }),
  createdTickets: many(serviceTickets, { relationName: 'createdTickets' }),
  ticketComments: many(ticketComments),
  timeEntries: many(timeEntries),
  expenses: many(expenses),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  team: one(teams, {
    fields: [clients.teamId],
    references: [teams.id],
  }),
  serviceTickets: many(serviceTickets),
  timeEntries: many(timeEntries),
  expenses: many(expenses),
  invoices: many(invoices)
}));

export const serviceTicketsRelations = relations(serviceTickets, ({ one, many }) => ({
  team: one(teams, {
    fields: [serviceTickets.teamId],
    references: [teams.id],
  }),
  client: one(clients, {
    fields: [serviceTickets.clientId],
    references: [clients.id],
  }),
  assignedUser: one(users, {
    fields: [serviceTickets.assignedTo],
    references: [users.id],
    relationName: 'assignedTickets',
  }),
  createdByUser: one(users, {
    fields: [serviceTickets.createdBy],
    references: [users.id],
    relationName: 'createdTickets',
  }),
  comments: many(ticketComments),
  timeEntries: many(timeEntries),
  expenses: many(expenses),
  invoiceTickets: many(invoiceTickets)
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(serviceTickets, {
    fields: [ticketComments.ticketId],
    references: [serviceTickets.id],
  }),
  user: one(users, {
    fields: [ticketComments.createdBy],
    references: [users.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  ticket: one(serviceTickets, {
    fields: [timeEntries.ticketId],
    references: [serviceTickets.id],
  }),
  client: one(clients, {
    fields: [timeEntries.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  ticket: one(serviceTickets, {
    fields: [expenses.ticketId],
    references: [serviceTickets.id],
  }),
  client: one(clients, {
    fields: [expenses.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ServiceTicket = typeof serviceTickets.$inferSelect;
export type NewServiceTicket = typeof serviceTickets.$inferInsert;
export type TicketComment = typeof ticketComments.$inferSelect;
export type NewTicketComment = typeof ticketComments.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  // Authentication events
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  
  // Team events
  CREATE_TEAM = 'CREATE_TEAM',
  TEAM_CREATED = 'TEAM_CREATED',
  TEAM_UPDATED = 'TEAM_UPDATED',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  TEAM_INVITE_ACCEPTED = 'TEAM_INVITE_ACCEPTED',
  TEAM_INVITE_REJECTED = 'TEAM_INVITE_REJECTED',
  USER_INVITED = 'USER_INVITED',
  USER_SIGNED_UP = 'USER_SIGNED_UP',
  USER_JOINED_TEAM = 'USER_JOINED_TEAM',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  
  // Ticket events
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_UPDATED = 'TICKET_UPDATED',
  TICKET_DELETED = 'TICKET_DELETED',
  TICKET_CLOSED = 'TICKET_CLOSED',
  TICKET_REOPENED = 'TICKET_REOPENED',
  TICKET_STATUS_UPDATED = 'TICKET_STATUS_UPDATED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  
  // Comment events
  COMMENT_ADDED = 'COMMENT_ADDED',
  
  // Time tracking events
  TIME_ENTRY_CREATED = 'TIME_ENTRY_CREATED',
  TIME_ENTRY_UPDATED = 'TIME_ENTRY_UPDATED',
  TIME_ENTRY_DELETED = 'TIME_ENTRY_DELETED',
  
  // Expense events
  EXPENSE_CREATED = 'EXPENSE_CREATED',
  EXPENSE_UPDATED = 'EXPENSE_UPDATED',
  EXPENSE_DELETED = 'EXPENSE_DELETED',
  
  // Client events
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  CLIENT_DELETED = 'CLIENT_DELETED',
  
  // Subscription events
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  
  // Invoice events
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_UPDATED = 'INVOICE_UPDATED',
  INVOICE_SENT = 'INVOICE_SENT',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_VOIDED = 'INVOICE_VOIDED',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE'
}

// Invoice status types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'voided';

// Invoices table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  clientId: integer('client_id').notNull().references(() => clients.id),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  notes: text('notes'),
  terms: text('terms'),
  paidDate: timestamp('paid_date'),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }),
  paidMethod: varchar('paid_method', { length: 50 }),
  sentAt: timestamp('sent_at'),
  voidedAt: timestamp('voided_at'),
  ...auditFields
});

// Invoice items table for line items on invoices
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'time', 'expense', 'product', 'service'
  timeEntryId: integer('time_entry_id').references(() => timeEntries.id),
  expenseId: integer('expense_id').references(() => expenses.id),
  ticketId: integer('ticket_id').references(() => serviceTickets.id),
  taxable: boolean('taxable').notNull().default(false),
  ...auditFields
});

// Table to track which service tickets are included in which invoices
export const invoiceTickets = pgTable('invoice_tickets', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  ticketId: integer('ticket_id').notNull().references(() => serviceTickets.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Add relations for invoices
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id]
  }),
  items: many(invoiceItems),
  tickets: many(invoiceTickets),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id]
  }),
  team: one(teams, {
    fields: [invoices.teamId],
    references: [teams.id]
  })
}));

// Add relations for invoice items
export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id]
  }),
  timeEntry: one(timeEntries, {
    fields: [invoiceItems.timeEntryId],
    references: [timeEntries.id]
  }),
  expense: one(expenses, {
    fields: [invoiceItems.expenseId],
    references: [expenses.id]
  }),
  ticket: one(serviceTickets, {
    fields: [invoiceItems.ticketId],
    references: [serviceTickets.id]
  })
}));

// Add relations for invoice tickets
export const invoiceTicketsRelations = relations(invoiceTickets, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceTickets.invoiceId],
    references: [invoices.id]
  }),
  ticket: one(serviceTickets, {
    fields: [invoiceTickets.ticketId],
    references: [serviceTickets.id]
  })
}));