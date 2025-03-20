'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signIn, signUp } from '../actions';
import { ActionState } from '@/lib/auth/middleware';

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: 'signin' | 'signup';
}

export function UserAuthForm({ 
  className, 
  mode = 'signin',
  ...props 
}: UserAuthFormProps) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' },
  );

  // Password validation state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [formIsValid, setFormIsValid] = useState(mode === 'signin');

  // Update validation status when passwords change
  useEffect(() => {
    if (mode === 'signup') {
      const match = password === confirmPassword;
      setPasswordsMatch(match);
      
      // Form is valid if passwords match and both are at least 8 characters
      setFormIsValid(match && password.length >= 8);
    }
  }, [password, confirmPassword, mode]);

  // Handler for password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  // Handler for confirm password input changes
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form action={formAction}>
        <input type="hidden" name="redirect" value={redirect || ''} />
        <input type="hidden" name="priceId" value={priceId || ''} />
        <input type="hidden" name="inviteId" value={inviteId || ''} />
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.email}
              required
              maxLength={50}
              placeholder="name@example.com"
              disabled={pending}
              className="rounded-md"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={handlePasswordChange}
              required
              minLength={8}
              maxLength={100}
              placeholder="Enter your password"
              disabled={pending}
              className="rounded-md"
            />
            <div className="h-5">
              {mode === 'signup' && password && password.length < 8 && (
                <p className="text-xs text-amber-500 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Password must be at least 8 characters
                </p>
              )}
            </div>
          </div>
          
          {mode === 'signup' && (
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword" className="flex justify-between">
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
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                minLength={8}
                maxLength={100}
                placeholder="Confirm your password"
                disabled={pending}
                className={cn(
                  "rounded-md",
                  confirmPassword && !passwordsMatch && "border-red-500 focus-visible:ring-red-500"
                )}
              />
            </div>
          )}
          
          {state?.error && (
            <div className="text-sm font-medium text-destructive">{state.error}</div>
          )}
          
          <Button 
            disabled={pending || (mode === 'signup' && !formIsValid)} 
            className="w-full"
            type="submit"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Sign Up'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}