import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from './components/dashboard-sidebar';
import { DashboardHeader } from './components/dashboard-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader user={user} />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
