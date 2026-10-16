// src/app/dashboard/crm/layout.tsx — Dedicated Dashboard Layout Shell matching reference
'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import CRMSidebar from '@/components/CRMSidebar';
import CRMTopBar from '@/components/CRMTopBar';
import AddLeadModal from '@/components/AddLeadModal';
import SettingsModal from '@/components/SettingsModal';

export default function CRMDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // When on overview page (/dashboard/crm), the page renders the exact 3-column reference layout
  const isOverviewPage = pathname === '/dashboard/crm';

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#173B67] flex selection:bg-[#F5223B]/10 selection:text-[#F5223B] antialiased font-sans overflow-x-hidden">
      {/* Desktop Persistent Sidebar (220px consistent desktop width) */}
      <div className="hidden md:block w-[220px] min-w-[220px] max-w-[220px] flex-shrink-0 h-screen sticky top-0 z-30">
        <CRMSidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 animate-slide-left">
            <CRMSidebar
              onCloseMobile={() => setMobileSidebarOpen(false)}
              onOpenSettings={() => {
                setMobileSidebarOpen(false);
                setIsSettingsOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {!isOverviewPage && (
          <CRMTopBar
            onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          />
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Universal Quick Add Modal */}
      <AddLeadModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onLeadAdded={() => {
          window.dispatchEvent(new Event('lead-added'));
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

