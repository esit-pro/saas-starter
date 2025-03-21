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
import { useRouter } from 'next/navigation';
import { useAuthNotification, type AuthMessageKey } from '@/lib/context/auth-notification-context';

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
  const { setMessageKey } = useAuthNotification();
  
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' },
  );

  // Password validation state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [formIsValid, setFormIsValid] = useState(mode === 'signin');
  
  // 2FA state
  const [showTwoFactorForm, setShowTwoFactorForm] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [resendingCode, setResendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();

  // Update notification context when auth state changes
  useEffect(() => {
    if (state.messageKey) {
      setMessageKey(state.messageKey as AuthMessageKey);
    } else if (state.error) {
      // If there's an error but no message key, clear the notification
      setMessageKey(null);
    }
  }, [state, setMessageKey]);

  // Handle 2FA verification
  const handleVerifyTwoFactor = async () => {
    if (twoFactorCode.length !== 6) {
      setTwoFactorError("Please enter a valid 6-digit code");
      return;
    }
    
    setVerifyingCode(true);
    setTwoFactorError("");
    
    try {
      const response = await fetch('/api/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: twoFactorCode,
          email: state.email,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Redirect after successful 2FA with a small delay to ensure session is properly set
        console.log('2FA verification successful, redirecting to home page...');
        
        // Get the redirect URL from the response or use the default
        const redirectUrl = data.redirectUrl || '/';
        
        // Use a combination of client-side and server-side redirect for reliability
        try {
          // Allow a small delay for session to be fully established
          setTimeout(() => {
            window.location.href = redirectUrl;  // Force a full page navigation instead of client routing
          }, 500);
        } catch (redirectError) {
          console.error('Redirect error:', redirectError);
          // Fallback to React Router if the direct navigation fails
          router.push(redirectUrl);
        }
      } else {
        // Provide more specific error messages based on error type
        if (data.error === 'Invalid or expired verification code') {
          setTwoFactorError("Invalid code. Please check and try again.");
        } else if (data.error === 'Verification code has expired') {
          setTwoFactorError("Code has expired. Please request a new code.");
        } else if (data.error === 'Failed to create user session') {
          setTwoFactorError("Authentication succeeded but we couldn't log you in. Please try again.");
        } else if (data.error === 'Too many verification attempts. Please try again later.') {
          setTwoFactorError("Too many failed attempts. Please try again later.");
        } else {
          setTwoFactorError(data.error || "Verification failed. Please try again.");
        }
        
        console.error("2FA verification error:", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      setTwoFactorError("Network error. Please check your connection and try again.");
    } finally {
      setVerifyingCode(false);
    }
  };

  // Handle 2FA code resend
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setResendingCode(true);
    setTwoFactorError("");
    
    try {
      const response = await fetch('/api/2fa/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Start cooldown timer (60 seconds)
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Display specific error from server or fallback message
        const errorMessage = data.error || "Failed to resend verification code";
        console.error("Code resend error response:", errorMessage);
        
        // Show more user-friendly error messages for specific issues
        if (errorMessage.includes("invalid phone number")) {
          setTwoFactorError("Your phone number appears to be invalid. Please update your profile settings.");
        } else if (errorMessage.includes("Too many")) {
          setTwoFactorError("Too many code requests. Please wait before trying again.");
        } else {
          setTwoFactorError(errorMessage);
        }
      }
    } catch (error) {
      console.error("Code resend network error:", error);
      setTwoFactorError("Network error. Please check your connection and try again.");
    } finally {
      setResendingCode(false);
    }
  };

  // Update validation status when passwords change
  useEffect(() => {
    if (mode === 'signup') {
      const match = password === confirmPassword;
      setPasswordsMatch(match);
      
      // Form is valid if passwords match and both are at least 8 characters
      setFormIsValid(match && password.length >= 8);
    }
  }, [password, confirmPassword, mode]);

  // Check if 2FA is required after form submission
  useEffect(() => {
    if (state.requiresTwoFactor) {
      setShowTwoFactorForm(true);
    }
  }, [state]);

  // Helper to check if the error is likely a Twilio issue
  const isTwilioError = () => {
    return state.error && (
      state.error.includes('verification code') || 
      state.error.includes('Twilio') || 
      state.error.includes('phone')
    );
  };

  // Handler for password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  // Handler for confirm password input changes
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  if (showTwoFactorForm) {
    return (
      <div className={cn('grid gap-6', className)} {...props}>
        <div className="grid gap-2 text-center">
          <h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Enter the verification code sent to your phone
          </p>
        </div>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              maxLength={6}
              pattern="[0-9]*"
              placeholder="6-digit code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              autoComplete="one-time-code"
              className="rounded-md text-center text-xl tracking-widest"
            />
          </div>
          
          {twoFactorError && (
            <div className="p-3 text-sm rounded-md bg-red-50 border border-red-200 text-red-800 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
              <div>{twoFactorError}</div>
            </div>
          )}
          
          <Button 
            onClick={handleVerifyTwoFactor}
            disabled={verifyingCode || twoFactorCode.length !== 6} 
            className="w-full"
          >
            {verifyingCode ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>
          
          <Button 
            type="button"
            variant="outline"
            onClick={handleResendCode}
            disabled={resendingCode || resendCooldown > 0} 
            className="w-full"
          >
            {resendingCode ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend Code (${resendCooldown}s)`
            ) : (
              'Resend Code'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form action={formAction}>
        <input type="hidden" name="redirect" value={redirect || ''} />
        <input type="hidden" name="priceId" value={priceId || ''} />
        <input type="hidden" name="inviteId" value={inviteId || ''} />
        
        <div className="grid gap-4">
          {mode === 'signup' && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                placeholder="Your full name"
                disabled={pending}
                className="rounded-md"
              />
            </div>
          )}
          
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
            <>
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
              
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+1 (555) 555-5555"
                  disabled={pending}
                  className="rounded-md"
                />
                <p className="text-xs text-muted-foreground">
                  Required for two-factor authentication
                </p>
              </div>
            </>
          )}
          
          {state.error && (
            <div className="p-3 text-sm rounded-md bg-red-50 border border-red-200 text-red-800 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
              <div>
                <p>{state.error}</p>
                {isTwilioError() && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold">
                      Troubleshooting Info
                    </summary>
                    <div className="mt-2 text-xs space-y-1 p-2 bg-red-100 rounded">
                      <p>Possible Twilio configuration issues:</p>
                      <ul className="list-disc list-inside">
                        <li>Twilio account credentials (SID/Auth Token) may be incorrect</li>
                        <li>Twilio phone number may not be configured properly</li>
                        <li>Phone number format might be invalid or not supported</li>
                        <li>Twilio service may be experiencing disruptions</li>
                      </ul>
                      <p className="font-semibold pt-1">Contact site administrator with this error message.</p>
                    </div>
                  </details>
                )}
              </div>
            </div>
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