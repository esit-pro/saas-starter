'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect, useOptimistic } from 'react';
import { useSearchParams } from 'next/navigation';
// Temporary fix until useActionState is stable
import { useFormState } from 'react-dom';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { resetPassword } from '../actions';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ActionState } from '@/lib/auth/middleware';


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

// Client component for reset password functionality
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [state, formAction] = useFormState<ActionState, FormData>(resetPassword, { error: '', success: '' });
  const [isPending, startTransition] = useOptimistic(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [formIsValid, setFormIsValid] = useState(false);

  // Redirect if no token is provided
  useEffect(() => {
    if (!token) {
      window.location.href = '/forgot-password';
    }
  }, [token]);

  // Update validation status when passwords change
  useEffect(() => {
    const match = password === confirmPassword;
    setPasswordsMatch(match);
    
    // Form is valid if passwords match and both are at least 8 characters
    setFormIsValid(match && password.length >= 8);
  }, [password, confirmPassword]);

  if (!token) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      {/* Mobile view */}
      <div className="flex w-full flex-col justify-center space-y-6 md:hidden">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
          <p className="text-sm text-muted-foreground">
            Create a new password for your account
          </p>
        </div>
        <div className="grid gap-6 px-4">
          <form action={formAction}>
            <input type="hidden" name="token" value={token} />
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password-mobile">Password</Label>
                <Input
                  id="password-mobile"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  placeholder="Enter your new password"
                  className="rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!isPending || !!state.success}
                />
                <div className="h-5">
                  {password && password.length < 8 && (
                    <p className="text-xs text-amber-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label 
                  htmlFor="confirmPassword-mobile" 
                  className="flex justify-between"
                >
                  <span>Confirm Password</span>
                  <div className="h-4 inline-flex items-center">
                    {confirmPassword && (
                      passwordsMatch ? (
                        <span className="text-xs text-green-500 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Passwords match
                        </span>
                      ) : (
                        <span className="text-xs text-destructive flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Passwords don&apos;t match
                        </span>
                      )
                    )}
                  </div>
                </Label>
                <Input
                  id="confirmPassword-mobile"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  maxLength={100}
                  placeholder="Confirm your new password"
                  className={cn(
                    "rounded-md",
                    confirmPassword && !passwordsMatch && "border-red-500 focus-visible:ring-red-500"
                  )}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!!isPending || !!state.success}
                />
              </div>
              
              {state.error && (
                <div className="text-sm font-medium text-destructive">
                  {state.error}
                </div>
              )}
              
              {state.success ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="flex items-center justify-center p-2 text-sm text-primary bg-primary/10 rounded-md">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {state.success}
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    asChild
                  >
                    <Link href="/sign-in">
                      Go to Sign In
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  disabled={!!isPending || !formIsValid}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              )}
            </div>
          </form>
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
                &ldquo;Our team&apos;s productivity improved dramatically after implementing this platform. We can now focus on solving problems instead of managing tickets.&rdquo;
              </p>
              <footer className="text-sm">David Peterson, Technical Lead</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
              <p className="text-sm text-muted-foreground">
                Create a new password for your account
              </p>
            </div>
            <div className="grid gap-6">
              <form action={formAction}>
                <input type="hidden" name="token" value={token} />
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={100}
                      placeholder="Enter your new password"
                      className="rounded-md"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!!isPending || !!state.success}
                    />
                    <div className="h-5">
                      {password && password.length < 8 && (
                        <p className="text-xs text-amber-500 flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Password must be at least 8 characters
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label 
                      htmlFor="confirmPassword" 
                      className="flex justify-between"
                    >
                      <span>Confirm Password</span>
                      <div className="h-4 inline-flex items-center">
                        {confirmPassword && (
                          passwordsMatch ? (
                            <span className="text-xs text-green-500 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Passwords match
                            </span>
                          ) : (
                            <span className="text-xs text-destructive flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Passwords don&apos;t match
                            </span>
                          )
                        )}
                      </div>
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      maxLength={100}
                      placeholder="Confirm your new password"
                      className={cn(
                        "rounded-md",
                        confirmPassword && !passwordsMatch && "border-red-500 focus-visible:ring-red-500"
                      )}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={!!isPending || !!state.success}
                    />
                  </div>
                  
                  {state.error && (
                    <div className="text-sm font-medium text-destructive">
                      {state.error}
                    </div>
                  )}
                  
                  {state.success ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="flex items-center justify-center p-2 text-sm text-primary bg-primary/10 rounded-md">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {state.success}
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        asChild
                      >
                        <Link href="/sign-in">
                          Go to Sign In
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      disabled={!!isPending || !formIsValid}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}