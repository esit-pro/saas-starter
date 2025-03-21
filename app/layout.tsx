import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeScript } from '@/components/theme-script';
import { ThemeEffect } from './theme-effect';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'ESIT Service Management',
  description: 'ESIT Service Management',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userPromise = getUser();

  return (
    <html
      lang="en"
      className={`${manrope.className}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeEffect />
      </head>
      <body className="min-h-[100dvh] bg-background text-foreground">
        <ThemeProvider defaultTheme="dark">
          <ThemeScript />
          <UserProvider userPromise={userPromise}>{children}</UserProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
