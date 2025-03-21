'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { UserAuthForm } from '../components/user-auth-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function SignInContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  
  return (
    <>
      {/* Mobile view */}
      <div className="flex w-full flex-col justify-center space-y-6 md:hidden">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials below
          </p>
        </div>
        
        {message && (
          <Alert variant="destructive" className="mx-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        <UserAuthForm mode="signin" className="w-full px-4" />
        <div className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="hover:text-brand underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="px-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="hover:text-brand underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </div>

      {/* Desktop view */}
      <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="absolute right-8 top-8 z-50 flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ variant: 'ghost' })
            )}
          >
            Sign Up
          </Link>
        </div>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-2">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            ESIT
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This platform has streamlined our IT workflow, making service desk management effortless and increasing our team&apos;s productivity.&rdquo;
              </p>
              <footer className="text-sm">Sarah Johnson, IT Director</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials below to access your account
              </p>
            </div>
            
            {message && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
            <UserAuthForm mode="signin" />
            <p className="px-8 text-center text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="underline underline-offset-4 hover:text-primary"
              >
                Forgot your password?
              </Link>
            </p>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 