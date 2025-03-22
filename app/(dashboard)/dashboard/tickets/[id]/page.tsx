'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    // Extract the ID from params (it could be a string or array)
    const id = params?.id;
    const ticketId = Array.isArray(id) ? id[0] : id;
    
    if (ticketId) {
      // Redirect to the edit page
      router.replace(`/dashboard/tickets/${ticketId}/edit`);
    }
  }, [params, router]);
  
  // Return null while redirecting
  return null;
} 