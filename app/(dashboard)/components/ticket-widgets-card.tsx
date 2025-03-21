'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';

interface TicketWidgetsCardProps {
  leftWidget: React.ReactNode;
  rightWidget: React.ReactNode;
  leftTitle: string;
  rightTitle: string;
}

export function TicketWidgetsCard({
  leftWidget,
  rightWidget,
  leftTitle,
  rightTitle,
}: TicketWidgetsCardProps) {
  return (
    <Card className="w-full shadow-sm mb-6 dark:bg-primary/5">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x md:divide-border">
        <div className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">{leftTitle}</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {leftWidget}
          </CardContent>
        </div>
        <div className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">{rightTitle}</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {rightWidget}
          </CardContent>
        </div>
      </div>
    </Card>
  );
} 