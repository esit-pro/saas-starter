'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { clients, ActivityType, activityLogs, teams, teamMembers } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { logDeleteActivity } from '@/lib/utils/activity-logger';
import { createWithAudit, updateWithAudit, softDeleteWithAudit } from '@/lib/utils/audit-trail';

// Log client-related activities
async function logClientActivity(
  teamId: number,
  userId: number,
  type: ActivityType,
  clientId?: number
) {
  const action = `${type}${clientId ? ` (Client ID: ${clientId})` : ''}`;
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action,
    timestamp: new Date(),
  });
}

// Create a client
const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(true)
  ),
});

export const createClient = validatedActionWithUser(
  createClientSchema,
  async (data, _, user) => {
    console.log('Creating client - authenticated user:', { 
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
      
      console.log('Creating client with data:', {
        ...data,
        teamId,
      });
      
      // Use the audit trail utility for creation
      const newClient = await createWithAudit(
        clients,
        data,
        user.id,
        teamId,
        'client'
      );
        
      console.log('Client created successfully:', newClient);

      return { 
        success: 'Client created successfully',
        client: newClient
      };
    } catch (error) {
      console.error('Failed to create client:', error);
      return { error: 'Failed to create client. Please try again.' };
    }
  }
);

// Update a client
const updateClientSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(true)
  ),
});

export const updateClient = validatedActionWithUser(
  updateClientSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      // Verify client belongs to this team
      const teamId = userTeamInfo.teamId;
      const existingClient = await db.query.clients.findFirst({
        where: (client, { and, eq: whereEq }) => 
          and(whereEq(client.id, data.id), whereEq(client.teamId, teamId))
      });

      if (!existingClient) {
        return { error: 'Client not found or not authorized to modify' };
      }

      // Use the audit trail utility for updates
      const updatedClient = await updateWithAudit(
        clients,
        data.id,
        data,
        user.id,
        teamId,
        'client'
      );

      return { 
        success: 'Client updated successfully',
        client: updatedClient
      };
    } catch (error) {
      console.error('Failed to update client:', error);
      return { error: 'Failed to update client. Please try again.' };
    }
  }
);

// Delete a client (soft delete)
const deleteClientSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
});

export const deleteClient = validatedActionWithUser(
  deleteClientSchema,
  async (data, _, user) => {
    let userTeamInfo = await getUserWithTeam(user.id);
    if (!userTeamInfo?.teamId) {
      return { error: 'User is not part of a team' };
    }

    try {
      // Verify client belongs to this team
      const teamId = userTeamInfo.teamId;
      const existingClient = await db.query.clients.findFirst({
        where: (client, { and, eq: whereEq, isNull: whereIsNull }) => 
          and(
            whereEq(client.id, data.id), 
            whereEq(client.teamId, teamId),
            whereIsNull(client.deletedAt)
          )
      });

      if (!existingClient) {
        return { error: 'Client not found or not authorized to delete' };
      }

      // Use the audit trail utility for soft deletion
      await softDeleteWithAudit(
        clients,
        data.id,
        user.id,
        teamId,
        'client'
      );

      return { success: 'Client deleted successfully' };
    } catch (error) {
      console.error('Failed to delete client:', error);
      return { error: 'Failed to delete client. Please try again.' };
    }
  }
);

// Get all clients for the team
export async function getClientsForTeam(_formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  console.log('Get clients - user team info:', userTeamInfo);
  
  // If user doesn't have a team, create one
  if (!userTeamInfo?.teamId) {
    console.log('User has no team - creating one for clients listing');
    
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
        
      console.log('Created team for client list:', newTeam);
      
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
      console.error('Failed to create default team for client list:', err);
      return { error: 'Failed to create a team for your account', clients: [] };
    }
  }

  try {
    const teamId = userTeamInfo.teamId;
    console.log('Fetching clients for teamId:', teamId);
    
    const clientList = await db.query.clients.findMany({
      where: (client, { and, eq: whereEq, isNull: whereIsNull }) => 
        and(whereEq(client.teamId, teamId as number), whereIsNull(client.deletedAt)),
      orderBy: (client, { desc }) => [desc(client.createdAt)]
    });
    
    console.log('Fetched clients:', clientList);

    return { clients: clientList };
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return { error: 'Failed to fetch clients. Please try again.' };
  }
}

// Get a specific client by ID
export async function getClientById(id: number, _formData?: FormData) {
  const user = await getUser();
  if (!user) return { error: 'User not authenticated' };

  let userTeamInfo = await getUserWithTeam(user.id);
  console.log('Get client by ID - user team info:', userTeamInfo);
  
  // Skip team creation for read operations - this should already be created from other operations
  if (!userTeamInfo?.teamId) {
    return { error: 'User is not part of a team' };
  }

  try {
    const teamId = userTeamInfo.teamId;
    console.log(`Fetching client with ID: ${id} for team: ${teamId}`);
    
    const client = await db.query.clients.findFirst({
      where: (client, { and, eq: whereEq, isNull: whereIsNull }) => 
        and(
          whereEq(client.id, id), 
          whereEq(client.teamId, teamId as number),
          whereIsNull(client.deletedAt)
        )
    });

    if (!client) {
      return { error: 'Client not found' };
    }

    return { client };
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return { error: 'Failed to fetch client. Please try again.' };
  }
}