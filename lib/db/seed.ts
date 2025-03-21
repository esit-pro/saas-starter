import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { 
  users, 
  teams, 
  teamMembers, 
  clients, 
  serviceTickets, 
  ticketComments,
  expenses,
  timeEntries
} from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seedServiceData(userId: number, teamId: number) {
  console.log('Seeding service data (clients, tickets, comments)...');
  
  // Create sample clients
  const clientsData = [
    { name: 'Acme Corporation', contactName: 'John Smith', email: 'jsmith@acme.com' },
    { name: 'Globex Inc', contactName: 'Jane Doe', email: 'jane@globex.com' },
    { name: 'Wayne Enterprises', contactName: 'Bruce Wayne', email: 'bruce@wayne.com' },
  ];
  
  const createdClients = [];
  
  for (const clientData of clientsData) {
    const [client] = await db.insert(clients).values({
      teamId,
      name: clientData.name,
      contactName: clientData.contactName,
      email: clientData.email,
      isActive: true,
    }).returning();
    
    createdClients.push(client);
    console.log(`Created client: ${client.name}`);
  }
  
  // Create sample tickets for each client
  for (const client of createdClients) {
    const ticketsData = [
      { 
        title: `Website downtime issue for ${client.name}`, 
        description: 'Client reported their website is down since this morning',
        status: 'open',
        priority: 'high'
      },
      { 
        title: `Email configuration for ${client.name}`, 
        description: 'Setup new email accounts for the marketing team',
        status: 'in-progress',
        priority: 'medium'
      }
    ];
    
    for (const ticketData of ticketsData) {
      const [ticket] = await db.insert(serviceTickets).values({
        teamId,
        clientId: client.id,
        assignedTo: userId,
        createdBy: userId,
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status,
        priority: ticketData.priority,
        category: 'Technical Support',
      }).returning();
      
      console.log(`Created ticket: ${ticket.title}`);
      
      // Add comments to each ticket
      const commentsData = [
        {
          content: 'Initial assessment complete. Will need to check server logs.',
          isInternal: true
        },
        {
          content: 'Contacted client for more information about the issue.',
          isInternal: false
        },
        {
          content: 'Found potential solution, implementing now.',
          isInternal: true
        }
      ];
      
      for (const commentData of commentsData) {
        await db.insert(ticketComments).values({
          ticketId: ticket.id,
          teamId,
          createdBy: userId,
          updatedBy: userId,
          content: commentData.content,
          isInternal: commentData.isInternal,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      console.log(`Added comments to ticket #${ticket.id}`);
      
      // Add a time entry for the ticket
      await db.insert(timeEntries).values({
        ticketId: ticket.id,
        clientId: client.id,
        userId,
        teamId,
        description: 'Initial troubleshooting and analysis',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        duration: 45, // 45 minutes
        billable: true,
      });
      
      // Add an expense for the ticket (only for first ticket of each client)
      if (ticketData.status === 'open') {
        await db.insert(expenses).values({
          ticketId: ticket.id,
          clientId: client.id,
          userId,
          teamId,
          description: 'Software license purchase',
          amount: '149.99',
          category: 'Software',
          billable: true,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }
  
  console.log('Service data seeded successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        name: 'Test User',
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  await createStripeProducts();
  
  // Seed service data
  await seedServiceData(user.id, team.id);
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
