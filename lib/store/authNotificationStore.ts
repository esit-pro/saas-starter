import { create } from 'zustand';

// Define allowed message keys and their corresponding text content
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

interface AuthNotificationStore {
  messageKey: AuthMessageKey | null;
  setMessageKey: (key: AuthMessageKey | null) => void;
  message: string | null;
}

export const useAuthNotificationStore = create<AuthNotificationStore>((set) => ({
  messageKey: null,
  message: null,
  setMessageKey: (key) => 
    set({
      messageKey: key,
      message: key ? AUTH_MESSAGES[key] : null,
    }),
})); 