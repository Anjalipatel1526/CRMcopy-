// src/components/CRMTopBar.tsx — Header bar matching Master Prompt specifications
'use client';

import React, { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, User } from 'lucide-react';

interface CRMTopBarProps {
  onToggleSidebar?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onOpenQuickAdd?: () => void;
  onOpenSettings?: () => void;
}

export default function CRMTopBar({
  onToggleSidebar,
  searchQuery = '',
  onSearchChange,
  onOpenQuickAdd,
  onOpenSettings,
}: CRMTopBarProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="h-[72px] flex items-center sticky top-0 z-20 backdrop-blur-md bg-[#F5F8FC]/95 border-b border-[#EAEFF5]">
      <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-8 flex items-center justify-between">
        {/* Left: Mobile Toggle + Search Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
            className="p-2 -ml-2 text-[#8298B8] hover:text-[#173B67] hover:bg-white rounded-xl transition-colors md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search pill container */}
          <div className="flex items-center gap-2.5 bg-white rounded-full border border-[#EAEFF5] px-4 h-[40px] w-64 sm:w-80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all focus-within:border-[#F5223B] focus-within:ring-2 focus-within:ring-red-100">
            <Search className="w-4 h-4 text-[#8298B8] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search leads, customers..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-transparent text-[#173B67] placeholder-[#8298B8] text-xs w-full outline-none border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        {/* Right: Notifications, + Quick Add, User Profile */}
        <div className="flex items-center gap-3 relative">
          {/* Notification Bell with red badge '3' */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="Notifications"
              className="w-10 h-10 rounded-full bg-white border border-[#EAEFF5] text-[#8298B8] hover:text-[#173B67] flex items-center justify-center transition-colors cursor-pointer relative shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 bg-[#F5223B] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                3
              </span>
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#EAEFF5] p-3 z-30 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="font-bold text-[#173B67] pb-2 border-b border-[#F0F4F8] mb-2 flex items-center justify-between">
                  <span>Notifications</span>
                  <span className="text-[10px] text-[#F5223B] font-bold bg-red-50 px-2 py-0.5 rounded-full">3 Unread</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 bg-red-50/50 rounded-xl">
                    <p className="font-bold text-[#173B67] text-[11px]">3 Overdue Follow-ups</p>
                    <p className="text-[10px] text-[#8298B8]">Scheduled calls pending action</p>
                  </div>
                  <div className="p-2 bg-emerald-50/50 rounded-xl">
                    <p className="font-bold text-[#173B67] text-[11px]">New Lead Assigned</p>
                    <p className="text-[10px] text-[#8298B8]">Sarah Miller — Honda Civic</p>
                  </div>
                  <div className="p-2 bg-purple-50/50 rounded-xl">
                    <p className="font-bold text-[#173B67] text-[11px]">Test Drive Today</p>
                    <p className="text-[10px] text-[#8298B8]">Priya Sharma — 11:30 AM</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* + Quick Add button */}
          <button
            onClick={onOpenQuickAdd}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#F5223B] hover:bg-[#E01B33] text-white text-xs font-bold shadow-[0_2px_6px_rgba(245,34,59,0.25)] transition-all cursor-pointer active:scale-95"
          >
            <span>+ Quick Add</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-90" />
          </button>

          {/* User profile circular avatar */}
          <button
            onClick={onOpenSettings}
            aria-label="User Profile"
            className="w-10 h-10 rounded-full bg-[#EBF0F7] text-[#8298B8] flex items-center justify-center hover:bg-gray-100 transition-colors border border-[#EAEFF5] cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Alex Johnson"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <User className="w-4 h-4 text-[#8298B8]" />
          </button>
        </div>
      </div>
    </header>
  );
}

