import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { UserAuthForm } from '../components/user-auth-form';
import { ThemeToggle } from '@/components/theme-toggle';
import AuthNotification from '../components/auth-notification';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
};

export default function SignUpPage() {
  return (
    <Suspense>
      <div className="w-full h-full flex justify-center items-center">
        {/* Responsive container */}
        <div className="w-full max-w-[1200px] min-h-[600px] flex flex-col lg:flex-row lg:h-screen">
          {/* Theme toggle and sign in link in top right for medium/large screens */}
          <div className="absolute right-8 top-8 z-50 hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: 'ghost' })
              )}
            >
              Sign In
            </Link>
          </div>
          
          {/* Left side - brand (visible on lg screens) */}
          <div className="hidden lg:flex lg:w-1/2 relative flex-col bg-muted p-10 text-white dark:border-r">
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
                  &ldquo;Implementing this service desk platform was one of the best decisions we made. Our customer satisfaction has increased dramatically and our resolution times have been cut in half.&rdquo;
                </p>
                <footer className="text-sm">Michael Chen, Support Manager</footer>
              </blockquote>
            </div>
          </div>
          
          {/* Right side - form */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-[350px] mx-auto my-auto">
              <div className="flex flex-col space-y-6">
                <div className="flex flex-col space-y-2 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your details below to create your account
                  </p>
                </div>
                
                <AuthNotification />
                
                <UserAuthForm mode="signup" className="w-full" />
                
                <div className="text-center text-sm text-muted-foreground">
                  By clicking sign up, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Privacy Policy
                  </Link>
                  .
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="hover:text-brand underline underline-offset-4 md:hidden">
                    Sign in
                  </Link>
                  <Link 
                    href="/sign-in" 
                    className="hover:text-brand underline underline-offset-4 hidden md:inline"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}