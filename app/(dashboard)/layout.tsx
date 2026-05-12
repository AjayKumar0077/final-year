'use client';

import { DashboardNav } from '@/components/layout/DashboardNav';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <main className="pt-16 px-4 sm:px-6 lg:px-8 pb-8">
        {children}
      </main>
    </div>
  );
}
