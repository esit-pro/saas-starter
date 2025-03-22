'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define allowed messages and their corresponding text content
export const AUTH_MESSAGES = {
  'registration-disabled': 'Registration is temporarily disabled for private testing',
  'invalid-credentials': 'Invalid email or password',
  'account-locked': 'Your account has been locked. Please contact support',
  'email-verification': 'Please verify your email address before signing in',
  'password-reset-sent': 'Password reset instructions have been sent to your email',
  'password-reset-success': 'Your password has been reset successfully',
  'too-many-code-requests': 'Too many code requests. Please try again later',
  'two-factor-required': 'Two-factor authentication is required. Please check your phone',
};

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;

type AuthNotificationContextType = {
  message: string | null;
  messageKey: AuthMessageKey | null;
  setMessageKey: (key: AuthMessageKey | null) => void;
};

const AuthNotificationContext = createContext<AuthNotificationContextType | undefined>(undefined);

export function AuthNotificationProvider({ children }: { children: ReactNode }) {
  const [messageKey, setMessageKeyState] = useState<AuthMessageKey | null>(null);
  const message = messageKey ? AUTH_MESSAGES[messageKey] : null;

  const setMessageKey = (key: AuthMessageKey | null) => {
    setMessageKeyState(key);
  };

  return (
    <AuthNotificationContext.Provider value={{ message, messageKey, setMessageKey }}>
      {children}
    </AuthNotificationContext.Provider>
  );
}

export function useAuthNotification() {
  const context = useContext(AuthNotificationContext);
  if (context === undefined) {
    throw new Error('useAuthNotification must be used within an AuthNotificationProvider');
  }
  return context;
} 