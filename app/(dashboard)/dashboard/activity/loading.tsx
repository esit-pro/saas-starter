import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ActivityLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Activity Log
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center py-12">
            <Loader2 className="h-12 w-12 text-orange-500 mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading activity...
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Please wait while we fetch your recent activities.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}