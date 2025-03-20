import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { ModernSidebar } from '@/components/modern-sidebar';

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
    <div className="min-h-screen w-full bg-background text-foreground flex">
      <ModernSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SiteHeader user={user} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:rounded-tl-lg bg-background lg:mt-1 lg:ml-1 shadow-md shadow-black/5 dark:shadow-black/10">
          {children}
        </main>
      </div>
    </div>
  );
}
