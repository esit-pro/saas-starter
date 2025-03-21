"use client"

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Demo data for time logs
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

const billingStatusColors = {
  'not-billable': 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  'unbilled': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'billed': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
};

export function TimeLogsWidget() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Recent Time Logs</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/time" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              View all
              <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="px-6">
          <ul className="divide-y divide-border">
            {recentTimeLogs.map((log) => (
              <li key={log.id} className="py-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Link 
                        href={`/dashboard/time/${log.id}`}
                        className="text-sm font-medium text-foreground hover:text-primary"
                      >
                        {log.description}
                      </Link>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{log.client}</span>
                      <span className="text-muted">•</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(log.created, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex flex-col gap-2 items-end">
                    <span className="text-sm font-medium">{log.duration}h</span>
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                        ${!log.billable 
                            ? billingStatusColors['not-billable'] 
                            : log.billed 
                              ? billingStatusColors['billed'] 
                              : billingStatusColors['unbilled']
                        }`}
                    >
                      {!log.billable 
                        ? 'Non-billable' 
                        : log.billed 
                          ? 'Billed' 
                          : 'Billable'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 