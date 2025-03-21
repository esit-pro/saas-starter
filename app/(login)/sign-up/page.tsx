import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { UserAuthForm } from '../components/user-auth-form';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
};

export default function SignUpPage() {
  return (
    <Suspense>
      {/* Mobile view */}
      <div className="flex w-full flex-col justify-center space-y-6 md:hidden">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details below to create your account
          </p>
        </div>
        <UserAuthForm mode="signup" className="w-full px-4" />
        <div className="px-8 text-center text-sm text-muted-foreground">
          By clicking sign up, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms
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
        <div className="px-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="hover:text-brand underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </div>

      {/* Desktop view */}
      <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="absolute right-8 top-8 z-50 flex items-center gap-4">
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
                &ldquo;Implementing this service desk platform was one of the best decisions we made. Our customer satisfaction has increased dramatically and our resolution times have been cut in half.&rdquo;
              </p>
              <footer className="text-sm">Michael Chen, Support Manager</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email below to create your account
              </p>
            </div>
            <UserAuthForm mode="signup" />
            <p className="px-8 text-center text-sm text-muted-foreground">
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
            </p>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}