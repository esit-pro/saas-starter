'use client';

import { useParams } from 'next/navigation';
import { ClientEditForm } from './client-edit-form';

export default function ClientEditPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id) : Array.isArray(params.id) ? parseInt(params.id[0]) : 0;
  
  return <ClientEditForm clientId={id} />;
}