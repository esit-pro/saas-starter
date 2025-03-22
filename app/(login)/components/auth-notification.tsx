'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAuthNotification } from '@/lib/context/auth-notification-context';

export default function AuthNotification() {
  const { message } = useAuthNotification();

  if (!message) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
} 