'use client';

import { useSearchParams } from 'next/navigation';
import { UserAuthForm } from './components/user-auth-form';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');

  // Always return signin form regardless of mode
  return <UserAuthForm mode="signin" />;
}