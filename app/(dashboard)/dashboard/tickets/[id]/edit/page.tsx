'use client';

import { useParams } from 'next/navigation';
import { TicketEditForm } from './ticket-edit-form';

export default function TicketEditPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id) : Array.isArray(params.id) ? parseInt(params.id[0]) : 0;
  
  return <TicketEditForm ticketId={id} />;
}