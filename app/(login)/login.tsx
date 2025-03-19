'use client';

import { useSearchParams } from 'next/navigation';
import { UserAuthForm } from './components/user-auth-form';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');

  // Redirect user to appropriate page with query params
  if (mode === 'signin') {
    return <UserAuthForm mode="signin" />;
  } else {
    return <UserAuthForm mode="signup" />;
  }
}