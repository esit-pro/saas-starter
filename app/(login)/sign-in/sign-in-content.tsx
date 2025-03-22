'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { UserAuthForm } from '../components/user-auth-form';
import { ThemeToggle } from '@/components/theme-toggle';
import AuthNotification from '../components/auth-notification';

export default function SignInContent() {
  const searchParams = useSearchParams();
  
  return (
    <div className="w-full h-full flex justify-center items-center">
      {/* Remove max-width constraint to allow full-width spanning */}
      <div className="w-full min-h-[600px] flex flex-col lg:flex-row lg:h-screen">
        {/* Theme toggle and sign up link in top right for medium/large screens */}
        <div className="absolute right-8 top-8 z-50 hidden md:flex items-center gap-4">
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
        
        {/* Left side - brand (visible on lg screens) */}
        <div className="hidden lg:block lg:w-1/2 relative flex-col bg-transparent p-10 text-white dark:border-r">
          {/* Add a max-width container inside for the content */}
          <div className="flex flex-col h-full ml-auto max-w-[600px] pr-16">
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
        </div>
        
        {/* Right side - form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8 lg:bg-background">
          <div className="w-full max-w-[350px] mx-auto my-auto">
            <div className="flex flex-col space-y-6">
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {/* Conditional text based on screen size */}
                  <span className="lg:hidden">Sign in</span>
                  <span className="hidden lg:inline">Sign in to your account</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your credentials below
                  <span className="hidden lg:inline"> to access your account</span>
                </p>
              </div>
              
              <AuthNotification />
              
              <UserAuthForm mode="signin" className="w-full" />
              
              <div className="text-center text-sm text-muted-foreground">
                <Link
                  href="/forgot-password"
                  className="hover:text-brand underline underline-offset-4"
                >
                  Forgot your password?
                </Link>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="hover:text-brand underline underline-offset-4 md:hidden">
                  Sign up
                </Link>
                <Link 
                  href="/sign-up" 
                  className="hover:text-brand underline underline-offset-4 hidden md:inline"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 