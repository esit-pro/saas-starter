import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { timeEntries, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { desc, eq, and, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId');
  const clientId = searchParams.get('clientId');
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
  
  if (!teamId) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
  }
  
  try {
    // Build query conditions
    const conditions = [eq(timeEntries.teamId, parseInt(teamId))];
    
    if (clientId) {
      conditions.push(eq(timeEntries.clientId, parseInt(clientId)));
    }
    
    // Get time entries with client data
    const entries = await db.query.timeEntries.findMany({
      where: and(...conditions),
      with: {
        client: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: [desc(timeEntries.startTime)],
      limit,
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
} 