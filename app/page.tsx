'use client';

import { useEffect, useState } from 'react';
import { AuthUser } from '@/lib/types/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import InvoiceForm from '@/components/InvoiceForm';
// import DriveConnectionBanner from '@/components/DriveConnectionBanner';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onToggle={setIsSidebarCollapsed} />
      
      {/* Main Content - Dynamic margin based on sidebar state */}
      <div
        className={`transition-all duration-300 min-h-screen ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Top Bar for Mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Invoice Generator</h2>
            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
              ✓ Connected
            </span>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* <DriveConnectionBanner /> */}
            <InvoiceForm userId={user.id} />
          </div>
        </main>
      </div>
    </div>
  );
}
