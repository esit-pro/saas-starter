import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen flex-col">
        {/* Mobile view */}
        <div className="flex-grow md:hidden">
          <header className="absolute right-6 top-6 z-10">
            <ThemeToggle />
          </header>
          <div className="flex h-screen flex-col items-center justify-center px-6 py-10">
            {children}
          </div>
        </div>
        
        {/* Desktop view - children handles the layout */}
        <div className="hidden md:block md:flex-grow">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}