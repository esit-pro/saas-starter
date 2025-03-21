import { getClientById } from '../../actions';
import { Client } from '@/lib/db/schema';
import ClientEditForm from './client-edit-form';

export default async function EditClientPage({ params }: { params: { id: string } }) {
  // Get client data on the server
  const clientId = parseInt(params.id);
  if (isNaN(clientId)) {
    return <div className="text-center py-8">Invalid client ID</div>;
  }

  try {
    const result = await getClientById(clientId);
    
    if (result.error || !result.client) {
      return <div className="text-center py-8">{result.error || 'Client not found'}</div>;
    }

    // Pass client data to the client component
    return <ClientEditForm initialClient={result.client} />;
  } catch (error) {
    console.error('Error fetching client:', error);
    return <div className="text-center py-8">Failed to load client data</div>;
  }
}