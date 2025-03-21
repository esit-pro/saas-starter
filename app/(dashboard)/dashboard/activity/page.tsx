import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  Building,
  Ticket,
  Clock,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Partial<Record<ActivityType, LucideIcon>> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.CLIENT_CREATED]: Building,
  [ActivityType.CLIENT_UPDATED]: Building,
  [ActivityType.CLIENT_DELETED]: Building,
  [ActivityType.TICKET_CREATED]: Ticket,
  [ActivityType.TICKET_UPDATED]: Ticket,
  [ActivityType.TICKET_CLOSED]: CheckCircle,
  [ActivityType.TIME_ENTRY_CREATED]: Clock,
  [ActivityType.EXPENSE_CREATED]: Receipt,
  [ActivityType.TEAM_CREATED]: UserPlus,
  [ActivityType.TEAM_UPDATED]: Settings,
  [ActivityType.USER_SIGNED_UP]: UserPlus,
  [ActivityType.USER_INVITED]: Mail,
  [ActivityType.TEAM_INVITE_ACCEPTED]: CheckCircle,
  [ActivityType.TICKET_ASSIGNED]: Ticket,
  [ActivityType.TIME_ENTRY_UPDATED]: Clock,
  [ActivityType.EXPENSE_UPDATED]: Receipt,
  [ActivityType.COMMENT_ADDED]: Mail
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up';
    case ActivityType.SIGN_IN:
      return 'You signed in';
    case ActivityType.SIGN_OUT:
      return 'You signed out';
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password';
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account';
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account';
    case ActivityType.CREATE_TEAM:
      return 'You created a new team';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member';
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation';
    case ActivityType.CLIENT_CREATED:
      return 'You created a new client';
    case ActivityType.CLIENT_UPDATED:
      return 'You updated a client';
    case ActivityType.CLIENT_DELETED:
      return 'You deleted a client';
    case ActivityType.TICKET_CREATED:
      return 'You created a new ticket';
    case ActivityType.TICKET_UPDATED:
      return 'You updated a ticket';
    case ActivityType.TICKET_CLOSED:
      return 'You closed a ticket';
    case ActivityType.TIME_ENTRY_CREATED:
      return 'You created a time entry';
    case ActivityType.EXPENSE_CREATED:
      return 'You created an expense';
    case ActivityType.TEAM_CREATED:
      return 'Team was created';
    case ActivityType.TEAM_UPDATED:
      return 'Team was updated';
    case ActivityType.USER_SIGNED_UP:
      return 'New user signed up';
    case ActivityType.USER_INVITED:
      return 'User was invited';
    case ActivityType.TEAM_INVITE_ACCEPTED:
      return 'User accepted invitation';
    case ActivityType.TICKET_ASSIGNED:
      return 'Ticket was assigned';
    case ActivityType.TIME_ENTRY_UPDATED:
      return 'Time entry was updated';
    case ActivityType.EXPENSE_UPDATED:
      return 'Expense was updated';
    case ActivityType.COMMENT_ADDED:
      return 'Comment was added';
    default:
      return 'Unknown action occurred';
  }
}

interface ActivityLog {
  id: number;
  action: string;
  timestamp: string | Date;
  ipAddress: string | null;
  userName: string | null;
  entityId: number | null;
  entityType: string | null;
  entityName: string | null;
  details: Record<string, any> | null | unknown;
}

// Mark this route as dynamic since it uses cookies
export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  let logs: ActivityLog[] = [];
  try {
    logs = await getActivityLogs();
  } catch (error) {
    // Don't log the error as it's expected during pre-rendering
    // Just continue with empty logs array
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Activity Log
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log: ActivityLog) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType
                );

                // Extract additional information when available
                let entityInfo = '';
                if (log.entityType && log.entityId) {
                  entityInfo = log.entityName 
                    ? ` - ${log.entityName}`
                    : ` - ${log.entityType} #${log.entityId}`;
                }

                // Extract meaningful details from the details JSON
                let detailsInfo = '';
                if (log.details) {
                  const details = log.details as any;
                  if (details.created) {
                    const name = details.created.name || details.created.title;
                    if (name) {
                      detailsInfo = `: "${name}"`;
                    }
                  } else if (details.deleted) {
                    const name = details.deleted.name || details.deleted.title;
                    if (name) {
                      detailsInfo = `: "${name}"`;
                    }
                  } else if (details.before && details.after) {
                    // Show what changed in updates
                    const changes = [];
                    for (const key in details.after) {
                      if (details.before[key] !== details.after[key] && 
                          key !== 'updatedAt' && key !== 'updatedBy') {
                        changes.push(key);
                      }
                    }
                    if (changes.length > 0) {
                      detailsInfo = `: changed ${changes.join(', ')}`;
                    }
                  }
                }

                return (
                  <li key={log.id} className="flex items-start space-x-4">
                    <div className="bg-orange-100 rounded-full p-2 mt-1">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}{entityInfo}{detailsInfo}
                        {log.ipAddress && ` from IP ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        {getRelativeTime(new Date(log.timestamp))}
                        {log.userName && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
                            by {log.userName}
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                When you perform actions like signing in or updating your
                account, they&apos;ll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
