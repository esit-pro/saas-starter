import { Metadata } from 'next';
import { Suspense } from 'react';
import SignInContent from './sign-in-content';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}