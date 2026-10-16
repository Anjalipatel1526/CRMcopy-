// src/components/CRMSidebar.tsx — Auto Bourn Dealership CRM Exact Reference Sidebar
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, CalendarCheck, Headphones,
  FileText, BarChart2, ChevronRight
} from 'lucide-react';

interface CRMSidebarProps {
  onCloseMobile?: () => void;
  onOpenSettings?: () => void;
}

export default function CRMSidebar({ onCloseMobile, onOpenSettings }: CRMSidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard/crm') {
      return pathname === '/dashboard/crm';
    }
    return pathname.startsWith(href);
  };

  const navItems = [
    {
      label: 'CRM Overview',
      href: '/dashboard/crm',
      icon: Home,
    },
    {
      label: 'Leads',
      href: '/dashboard/crm/leads',
      icon: Users,
    },
    {
      label: 'Follow-ups',
      href: '/dashboard/crm/follow-ups',
      icon: CalendarCheck,
    },
    {
      label: 'Call Scheduler',
      href: '/dashboard/crm/call-sessions',
      icon: Headphones,
    },
    {
      label: 'Customer Details',
      href: '/dashboard/crm/customer-details',
      icon: FileText,
    },
    {
      label: 'CRM Analytics',
      href: '/dashboard/crm/analytics',
      icon: BarChart2,
    },
  ];

  return (
    <aside
      className="w-[220px] min-w-[220px] max-w-[220px] bg-white border-r border-[#EAEFF5] flex flex-col justify-between h-full select-none shadow-[1px_0_4px_rgba(0,0,0,0.015)]"
      style={{
        width: '220px',
        minWidth: '220px',
        maxWidth: '220px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #EAEFF5',
      }}
    >
      <div>
        {/* Navigation Links */}
        <div className="pt-6 pb-5 px-3 space-y-1">
          {navItems.map((item) => {
            const active = isLinkActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                style={{
                  backgroundColor: active ? '#FFF0F2' : 'transparent',
                  color: active ? '#F5223B' : '#8298B8',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontWeight: active ? '700' : '500',
                  fontSize: '12px',
                  transition: 'all 0.15s ease',
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${active
                    ? 'bg-[#FFF0F2] text-[#F5223B] font-bold shadow-xs'
                    : 'text-[#8298B8] hover:text-[#173B67] hover:bg-[#F5F8FC] font-medium'
                  }`}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{
                    width: '16px',
                    height: '16px',
                    color: active ? '#F5223B' : '#8298B8',
                  }}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-4 border-t border-[#F0F4F8]">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-[11px] font-medium text-[#8298B8]">Online</span>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-[#F5F8FC] transition-colors group cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-1 ring-[#EAEFF5] overflow-hidden flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Alex Johnson"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col text-left truncate">
              <span className="text-xs font-bold text-[#173B67] leading-tight truncate">
                Alex Johnson
              </span>
              <span className="text-[10px] text-[#8298B8] font-medium truncate mt-0.5">
                Sales Manager
              </span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#8298B8] group-hover:text-[#173B67] transition-colors flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}
