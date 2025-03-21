import { db } from './drizzle';
import { hashPassword } from '@/lib/auth/session';
import { 
  users, 
  teams, 
  teamMembers, 
  clients, 
  serviceTickets, 
  ticketComments, 
  timeEntries, 
  expenses
} from './schema';
import { eq, SQL } from 'drizzle-orm';

/**
 * This script migrates hardcoded sample data from the frontend components
 * into the Postgres database configured in .env
 */

// Sample data from dashboard page
const revenueChartData = [
  { month: 'Jan', Revenue: 8450, Expenses: 3200 },
  { month: 'Feb', Revenue: 9271, Expenses: 3500 },
  { month: 'Mar', Revenue: 12090, Expenses: 4100 },
  { month: 'Apr', Revenue: 10893, Expenses: 3800 },
  { month: 'May', Revenue: 9050, Expenses: 3300 },
  { month: 'Jun', Revenue: 11500, Expenses: 4000 },
  { month: 'Jul', Revenue: 15000, Expenses: 4900 },
  { month: 'Aug', Revenue: 14200, Expenses: 4600 },
  { month: 'Sep', Revenue: 11600, Expenses: 4100 },
  { month: 'Oct', Revenue: 13200, Expenses: 4500 },
  { month: 'Nov', Revenue: 12500, Expenses: 4200 },
  { month: 'Dec', Revenue: 17500, Expenses: 5900 },
];

// Recent tickets from dashboard
const recentTickets = [
  {
    id: 1,
    title: 'Website downtime issue',
    client: 'Acme Corp',
    status: 'open',
    priority: 'high',
    created: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 2,
    title: 'Email configuration',
    client: 'Globex Inc',
    status: 'in-progress',
    priority: 'medium',
    created: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: 'Backup failure',
    client: 'Wayne Enterprises',
    status: 'open',
    priority: 'high',
    created: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: 4,
    title: 'New user setup',
    client: 'Stark Industries',
    status: 'completed',
    priority: 'low',
    created: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

// Recent time logs from time-logs-widget
const recentTimeLogs = [
  {
    id: 1,
    description: 'Server maintenance',
    client: 'Acme Corp',
    duration: 2.5,
    billed: false,
    billable: true,
    created: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    description: 'Email troubleshooting',
    client: 'Globex Inc',
    duration: 1.25,
    billed: true,
    billable: true,
    created: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: 3,
    description: 'Backup system setup',
    client: 'Wayne Enterprises',
    duration: 3.5,
    billed: false,
    billable: true,
    created: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    description: 'Team training',
    client: 'Stark Industries',
    duration: 4.0,
    billed: false,
    billable: false,
    created: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

// Demo data from tickets page
const demoTickets = [
  {
    id: 1,
    title: 'Website downtime issue',
    client: 'Acme Corporation',
    clientId: 1,
    assignedTo: 'Jane Smith',
    status: 'open',
    priority: 'high',
    category: 'Website',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: 'Email configuration issue',
    client: 'Globex Inc',
    clientId: 2,
    assignedTo: 'John Doe',
    status: 'in-progress',
    priority: 'medium',
    category: 'Email',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: 'Server backup failure',
    client: 'Wayne Enterprises',
    clientId: 3,
    assignedTo: 'Jane Smith',
    status: 'open',
    priority: 'critical',
    category: 'Server',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    title: 'New user setup request',
    client: 'Stark Industries',
    clientId: 4,
    assignedTo: 'John Doe',
    status: 'completed',
    priority: 'low',
    category: 'User Management',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    dueDate: null,
  },
  {
    id: 5,
    title: 'VPN connection issues',
    client: 'Oscorp',
    clientId: 5,
    assignedTo: 'Jane Smith',
    status: 'on-hold',
    priority: 'medium',
    category: 'Networking',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 6,
    title: 'Data recovery request',
    client: 'Umbrella Corporation',
    clientId: 6,
    assignedTo: 'John Doe',
    status: 'in-progress',
    priority: 'high',
    category: 'Data Services',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 7,
    title: 'Software license renewal',
    client: 'Cyberdyne Systems',
    clientId: 7,
    assignedTo: 'Jane Smith',
    status: 'open',
    priority: 'medium',
    category: 'Licensing',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 8,
    title: 'Hardware replacement request',
    client: 'LexCorp',
    clientId: 8,
    assignedTo: 'John Doe',
    status: 'completed',
    priority: 'low',
    category: 'Hardware',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    dueDate: null,
  },
  {
    id: 9,
    title: 'Cloud storage expansion',
    client: 'Weyland-Yutani Corp',
    clientId: 9,
    assignedTo: 'Jane Smith',
    status: 'closed',
    priority: 'medium',
    category: 'Cloud Services',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    dueDate: null,
  },
  {
    id: 10,
    title: 'Network security audit',
    client: 'Tyrell Corporation',
    clientId: 10,
    assignedTo: 'John Doe',
    status: 'in-progress',
    priority: 'high',
    category: 'Security',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
];

const demoClients = [
  { id: 1, name: 'Acme Corporation' },
  { id: 2, name: 'Globex Inc' },
  { id: 3, name: 'Wayne Enterprises' },
  { id: 4, name: 'Stark Industries' },
  { id: 5, name: 'Oscorp' },
  { id: 6, name: 'Umbrella Corporation' },
  { id: 7, name: 'Cyberdyne Systems' },
  { id: 8, name: 'LexCorp' },
  { id: 9, name: 'Weyland-Yutani Corp' },
  { id: 10, name: 'Tyrell Corporation' },
];

const demoComments = [
  {
    id: 1,
    ticketId: 1,
    content: 'Called the client and they reported that the website is down since this morning.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    isInternal: false,
    user: {
      id: 1,
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
  {
    id: 2,
    ticketId: 1,
    content: 'Checked server logs, found spike in traffic before outage.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isInternal: true,
    user: {
      id: 2,
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
  {
    id: 3,
    ticketId: 1,
    content: 'Restarted web server and service is back online.',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isInternal: false,
    user: {
      id: 1,
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
];

// Demo time entries
const demoTimeEntries = [
  {
    id: 1,
    ticketId: 1,
    clientId: 1,
    description: 'Initial troubleshooting',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    duration: 45, // in minutes
    billable: true,
    user: {
      id: 1,
      name: 'Jane Smith',
    },
  },
  {
    id: 2,
    ticketId: 1,
    clientId: 1,
    description: 'Server restart and verification',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    duration: 30,
    billable: true,
    user: {
      id: 1,
      name: 'Jane Smith',
    },
  },
  {
    id: 3,
    ticketId: 2,
    clientId: 2,
    description: 'Email configuration analysis',
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    duration: 60,
    billable: true,
    user: {
      id: 2,
      name: 'John Doe',
    },
  },
];

// Demo expenses
const demoExpenses = [
  {
    id: 1,
    ticketId: 1,
    description: 'Server monitoring software license',
    amount: 99.99,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    category: 'Software',
    billable: true,
  },
  {
    id: 2,
    ticketId: 3,
    description: 'External hard drive for backup',
    amount: 149.99,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    category: 'Hardware',
    billable: true,
  },
];

/**
 * Creates users needed for sample data
 */
async function ensureUsers() {
  console.log('Ensuring users exist...');
  
  // Check if we already have a Jane Smith
  const existingJane = await db
    .select()
    .from(users)
    .where(eq(users.email, 'jane@example.com'))
    .limit(1);
  
  let janeId: number;
  if (existingJane.length > 0) {
    janeId = existingJane[0].id;
    console.log(`Using existing Jane Smith user with id ${janeId}`);
  } else {
    const [jane] = await db
      .insert(users)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com',
        passwordHash: await hashPassword('password123'),
        role: 'member',
      })
      .returning();
    janeId = jane.id;
    console.log(`Created Jane Smith user with id ${janeId}`);
  }
  
  // Check if we already have a John Doe
  const existingJohn = await db
    .select()
    .from(users)
    .where(eq(users.email, 'john@example.com'))
    .limit(1);
    
  let johnId: number;
  if (existingJohn.length > 0) {
    johnId = existingJohn[0].id;
    console.log(`Using existing John Doe user with id ${johnId}`);
  } else {
    const [john] = await db
      .insert(users)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: await hashPassword('password123'),
        role: 'member',
      })
      .returning();
    johnId = john.id;
    console.log(`Created John Doe user with id ${johnId}`);
  }
  
  return { janeId, johnId };
}

/**
 * Gets current team ID or creates a new team
 */
async function ensureTeam(userIds: { janeId: number, johnId: number }) {
  console.log('Ensuring team exists...');
  
  // Check if users already belong to a team
  const existingTeam = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, userIds.janeId),
    with: {
      team: true,
    },
  });
  
  if (existingTeam) {
    console.log(`Using existing team: ${existingTeam.team.name} (ID: ${existingTeam.team.id})`);
    return existingTeam.team.id;
  }
  
  // Create a new team
  const [team] = await db
    .insert(teams)
    .values({
      name: 'Service Team',
    })
    .returning();
  
  // Add Jane and John to the team
  await db.insert(teamMembers).values([
    {
      teamId: team.id,
      userId: userIds.janeId,
      role: 'admin',
    },
    {
      teamId: team.id,
      userId: userIds.johnId,
      role: 'member',
    },
  ]);
  
  console.log(`Created new team: ${team.name} (ID: ${team.id})`);
  return team.id;
}

/**
 * Creates clients from demo data
 */
async function migrateClients(teamId: number) {
  console.log('Migrating clients...');
  const clientMap: Record<number, number> = {};
  
  for (const demoClient of demoClients) {
    // Check if client already exists
    const existingClient = await db
      .select()
      .from(clients)
      .where(eq(clients.name, demoClient.name))
      .limit(1);
    
    if (existingClient.length > 0) {
      clientMap[demoClient.id] = existingClient[0].id;
      console.log(`Using existing client: ${demoClient.name} (ID: ${existingClient[0].id})`);
      continue;
    }
    
    // Create new client
    const [client] = await db
      .insert(clients)
      .values({
        teamId,
        name: demoClient.name,
        contactName: `Contact for ${demoClient.name}`,
        email: `contact@${demoClient.name.toLowerCase().replace(/\s+/g, '')}.com`,
        isActive: true,
      })
      .returning();
    
    clientMap[demoClient.id] = client.id;
    console.log(`Created client: ${client.name} (ID: ${client.id})`);
  }
  
  return clientMap;
}

/**
 * Migrates service tickets from demo data
 */
async function migrateTickets(teamId: number, clientMap: Record<number, number>, userIds: { janeId: number, johnId: number }) {
  console.log('Migrating service tickets...');
  const ticketMap: Record<number, number> = {};
  
  for (const demoTicket of demoTickets) {
    // Get the actual client ID from our mapping
    const clientId = clientMap[demoTicket.clientId];
    
    if (!clientId) {
      console.log(`Warning: Client ID ${demoTicket.clientId} not found in mapping. Skipping ticket: ${demoTicket.title}`);
      continue;
    }
    
    // Determine assigned user ID
    const assignedTo = demoTicket.assignedTo === 'Jane Smith' ? userIds.janeId : userIds.johnId;
    const createdBy = assignedTo; // Same user creates and is assigned for simplicity
    
    // Check if ticket with same title and client already exists
    const existingTicket = await db
      .select()
      .from(serviceTickets)
      .where(
        eq(serviceTickets.title, demoTicket.title) && 
        eq(serviceTickets.clientId, clientId)
      )
      .limit(1);
    
    if (existingTicket.length > 0) {
      ticketMap[demoTicket.id] = existingTicket[0].id;
      console.log(`Using existing ticket: ${demoTicket.title} (ID: ${existingTicket[0].id})`);
      continue;
    }
    
    // Create new ticket
    const [ticket] = await db
      .insert(serviceTickets)
      .values({
        teamId,
        clientId,
        assignedTo,
        createdBy,
        title: demoTicket.title,
        description: `Detailed description for: ${demoTicket.title}`,
        status: demoTicket.status,
        priority: demoTicket.priority,
        category: demoTicket.category,
        createdAt: demoTicket.createdAt,
        dueDate: demoTicket.dueDate,
      })
      .returning();
    
    ticketMap[demoTicket.id] = ticket.id;
    console.log(`Created ticket: ${ticket.title} (ID: ${ticket.id})`);
  }
  
  return ticketMap;
}

/**
 * Migrates ticket comments from demo data
 */
async function migrateComments(ticketMap: Record<number, number>, userIds: { janeId: number, johnId: number }, teamId: number) {
  console.log('Migrating ticket comments...');
  
  for (const demoComment of demoComments) {
    const ticketId = ticketMap[demoComment.ticketId];
    
    if (!ticketId) {
      console.log(`Warning: Ticket ID ${demoComment.ticketId} not found in mapping. Skipping comment: ${demoComment.content.substring(0, 30)}...`);
      continue;
    }
    
    // Determine user ID
    const userId = demoComment.user.name === 'Jane Smith' ? userIds.janeId : userIds.johnId;
    
    // Check if comment already exists
    const existingComment = await db
      .select()
      .from(ticketComments)
      .where(
        eq(ticketComments.ticketId, ticketId) && 
        eq(ticketComments.content, demoComment.content)
      )
      .limit(1);
    
    if (existingComment.length > 0) {
      console.log(`Comment already exists: ${demoComment.content.substring(0, 30)}...`);
      continue;
    }
    
    // Create comment
    await db
      .insert(ticketComments)
      .values({
        teamId,
        ticketId,
        createdBy: userId,
        content: demoComment.content,
        isInternal: demoComment.isInternal,
        createdAt: demoComment.createdAt,
      });
    
    console.log(`Created comment for ticket ${ticketId}: ${demoComment.content.substring(0, 30)}...`);
  }
}

/**
 * Migrates time entries from demo data
 */
async function migrateTimeEntries(clientMap: Record<number, number>, ticketMap: Record<number, number>, userIds: { janeId: number, johnId: number }, teamId: number) {
  console.log('Migrating time entries...');
  
  // First migrate demo time entries associated with tickets
  for (const demoEntry of demoTimeEntries) {
    const ticketId = ticketMap[demoEntry.ticketId];
    const clientId = clientMap[demoEntry.clientId];
    
    if (!ticketId || !clientId) {
      console.log(`Warning: Ticket ID ${demoEntry.ticketId} or Client ID ${demoEntry.clientId} not found in mapping. Skipping time entry: ${demoEntry.description}`);
      continue;
    }
    
    // Determine user ID
    const userId = demoEntry.user.name === 'Jane Smith' ? userIds.janeId : userIds.johnId;
    
    // Check if time entry already exists
    const existingEntry = await db
      .select()
      .from(timeEntries)
      .where(
        eq(timeEntries.ticketId, ticketId) && 
        eq(timeEntries.description, demoEntry.description)
      )
      .limit(1);
    
    if (existingEntry.length > 0) {
      console.log(`Time entry already exists: ${demoEntry.description}`);
      continue;
    }
    
    // Calculate end time
    const endTime = new Date(demoEntry.startTime.getTime() + demoEntry.duration * 60 * 1000);
    
    // Create time entry
    await db
      .insert(timeEntries)
      .values({
        teamId,
        ticketId,
        clientId,
        userId,
        description: demoEntry.description,
        startTime: demoEntry.startTime,
        duration: demoEntry.duration,
        billable: demoEntry.billable,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    
    console.log(`Created time entry: ${demoEntry.description} (${demoEntry.duration} minutes)`);
  }
  
  // Now migrate recent time logs from widget
  for (const timeLog of recentTimeLogs) {
    // Find matching client
    let clientId: number | null = null;
    
    for (const [demoId, actualId] of Object.entries(clientMap)) {
      const demoClientName = demoClients.find(c => c.id === Number(demoId))?.name;
      
      if (demoClientName?.includes(timeLog.client) || timeLog.client.includes(demoClientName || '')) {
        clientId = actualId;
        break;
      }
    }
    
    if (!clientId) {
      console.log(`Warning: Could not find client ID for ${timeLog.client}. Skipping time log: ${timeLog.description}`);
      continue;
    }
    
    // Choose a random user ID for this entry
    const userId = Math.random() > 0.5 ? userIds.janeId : userIds.johnId;
    
    // Check if time entry already exists
    const existingEntry = await db
      .select()
      .from(timeEntries)
      .where(
        eq(timeEntries.clientId, clientId) && 
        eq(timeEntries.description, timeLog.description)
      )
      .limit(1);
    
    if (existingEntry.length > 0) {
      console.log(`Time log already exists: ${timeLog.description}`);
      continue;
    }
    
    // Convert hours to minutes for duration
    const durationMinutes = Math.round(timeLog.duration * 60);
    
    // Calculate end time
    const endTime = new Date(timeLog.created.getTime() + durationMinutes * 60 * 1000);
    
    // Create time entry
    await db
      .insert(timeEntries)
      .values({
        teamId,
        ticketId: null,
        clientId,
        userId,
        description: timeLog.description,
        startTime: timeLog.created,
        duration: durationMinutes,
        billable: timeLog.billable,
        billed: timeLog.billed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    
    console.log(`Created time log: ${timeLog.description} (${timeLog.duration} hours)`);
  }
}

/**
 * Migrates expenses from demo data
 */
async function migrateExpenses(clientMap: Record<number, number>, ticketMap: Record<number, number>, userIds: { janeId: number, johnId: number }, teamId: number) {
  console.log('Migrating expenses...');
  
  for (const demoExpense of demoExpenses) {
    const ticketId = ticketMap[demoExpense.ticketId];
    
    if (!ticketId) {
      console.log(`Warning: Ticket ID ${demoExpense.ticketId} not found in mapping. Skipping expense: ${demoExpense.description}`);
      continue;
    }
    
    // Get client ID from ticket
    const ticket = await db
      .select()
      .from(serviceTickets)
      .where(eq(serviceTickets.id, ticketId))
      .limit(1);
    
    if (!ticket.length) {
      console.log(`Warning: Could not find ticket with ID ${ticketId}. Skipping expense: ${demoExpense.description}`);
      continue;
    }
    
    const clientId = ticket[0].clientId;
    
    // Alternate user IDs for variety
    const userId = demoExpense.id % 2 === 0 ? userIds.janeId : userIds.johnId;
    
    // Check if expense already exists
    const existingExpense = await db
      .select()
      .from(expenses)
      .where(
        eq(expenses.ticketId, ticketId) && 
        eq(expenses.description, demoExpense.description)
      )
      .limit(1);
    
    if (existingExpense.length > 0) {
      console.log(`Expense already exists: ${demoExpense.description}`);
      continue;
    }
    
    // Create expense
    if (!clientId) {
      console.log(`Error: Client ID is null for expense: ${demoExpense.description}`);
      continue;
    }

    // Use direct inline values with type assertions
    await db
      .insert(expenses)
      .values({
        teamId,
        ticketId,
        clientId, 
        userId,
        description: demoExpense.description,
        amount: demoExpense.amount.toString(),
        category: demoExpense.category || '',
        billable: demoExpense.billable,
        billed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        notes: '',
        receiptUrl: ''
      });
    
    console.log(`Created expense: ${demoExpense.description} ($${demoExpense.amount})`);
  }
}

/**
 * Main migration function
 */
async function migrateSampleData() {
  console.log('Starting sample data migration...');
  
  try {
    // Step 1: Ensure we have users
    const userIds = await ensureUsers();
    
    // Step 2: Ensure we have a team
    const teamId = await ensureTeam(userIds);
    
    // Step 3: Create all clients
    const clientMap = await migrateClients(teamId);
    
    // Step 4: Create service tickets
    const ticketMap = await migrateTickets(teamId, clientMap, userIds);
    
    // Step 5: Create ticket comments
    await migrateComments(ticketMap, userIds, teamId);
    
    // Step 6: Create time entries - pass teamId
    await migrateTimeEntries(clientMap, ticketMap, userIds, teamId);
    
    // Step 7: Create expenses
    await migrateExpenses(clientMap, ticketMap, userIds, teamId);
    
    console.log('✅ Sample data migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Don't try to call db.client.end() as it doesn't exist in the latest version
    // Just exit the process when done
    if (require.main === module) {
      process.exit(0);
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateSampleData();
}

export { migrateSampleData }; 