'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState, useOptimistic } from 'react';
// Temporary fix until useActionState is stable
import { useFormState } from 'react-dom';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { requestPasswordReset } from '../actions';
import { Loader2, CheckCircle } from 'lucide-react';
import { ActionState } from '@/lib/auth/middleware';


export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(requestPasswordReset, { error: '', success: '' });
  const [isPending, startTransition] = useOptimistic(false);
  const [email, setEmail] = useState('');

  return (
    <>
      {/* Mobile view */}
      <div className="flex w-full flex-col justify-center space-y-6 md:hidden">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>
        <div className="grid gap-6 px-4">
          <form action={formAction}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email-mobile">Email</Label>
                <Input
                  id="email-mobile"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  className="rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!isPending || !!state.success}
                />
              </div>
              
              {state.error && (
                <div className="text-sm font-medium text-destructive">
                  {state.error}
                </div>
              )}
              
              {state.success ? (
                <div className="flex items-center justify-center p-2 text-sm text-primary bg-primary/10 rounded-md">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {state.success}
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  disabled={!!isPending || !email || !!state.success}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
        <div className="px-8 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
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
                &ldquo;Our customer service efficiency has dramatically improved with this platform. We can easily track, manage, and resolve all tickets from a single dashboard.&rdquo;
              </p>
              <footer className="text-sm">Emily Rodriguez, Operations Lead</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>
            <div className="grid gap-6">
              <form action={formAction}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={50}
                      placeholder="name@example.com"
                      className="rounded-md"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!isPending || !!state.success}
                    />
                  </div>
                  
                  {state.error && (
                    <div className="text-sm font-medium text-destructive">
                      {state.error}
                    </div>
                  )}
                  
                  {state.success ? (
                    <div className="flex items-center justify-center p-2 text-sm text-primary bg-primary/10 rounded-md">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {state.success}
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      disabled={!!isPending || !email || !!state.success}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
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
    </>
  );
}