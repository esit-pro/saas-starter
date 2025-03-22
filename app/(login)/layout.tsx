'use client';

import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthNotificationProvider } from '@/lib/context/auth-notification-context';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthNotificationProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen flex-col lg:bg-zinc-900">
          {/* Header for mobile/tablet - fixed positioning */}
          <header className="fixed right-6 top-6 z-50 md:hidden">
            <ThemeToggle />
          </header>
          
          {/* Content area - centered for all screen sizes */}
          <div className="flex-grow flex items-center justify-center">
            {children}
          </div>
        </div>
      </ThemeProvider>
    </AuthNotificationProvider>
  );
}