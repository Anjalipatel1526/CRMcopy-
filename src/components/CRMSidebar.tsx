// src/components/CRMSidebar.tsx — Dealership CRM Sidebar
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, CalendarCheck, Headphones,
  FileText, BarChart2, ChevronLeft, ChevronRight
} from 'lucide-react';

interface CRMSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export default function CRMSidebar({
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
  onClose,
  onOpenSettings,
}: CRMSidebarProps) {
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
      className={`${
        isCollapsed
          ? 'w-[64px] min-w-[64px] max-w-[64px]'
          : 'w-[200px] min-w-[200px] max-w-[200px]'
      } bg-white border-r border-[#EAEFF5] flex flex-col justify-between h-full select-none shadow-[1px_0_4px_rgba(0,0,0,0.015)] transition-all duration-200`}
      style={{
        width: isCollapsed ? '64px' : '200px',
        minWidth: isCollapsed ? '64px' : '200px',
        maxWidth: isCollapsed ? '64px' : '200px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #EAEFF5',
      }}
    >
      <div>
        {/* Top Header: Collapsed Expand Arrow Button OR Expanded Collapse Arrow Button */}
        {isCollapsed ? (
          <div className="h-[60px] flex items-center justify-center border-b border-[#F0F4F8]">
            <button
              onClick={onToggleCollapse}
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
              className="w-8 h-8 rounded-xl hover:bg-[#F5F8FC] text-[#8298B8] hover:text-[#173B67] flex items-center justify-center transition-colors cursor-pointer group"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="h-[60px] flex items-center justify-end px-3.5 border-b border-[#F0F4F8]">
            <button
              onClick={onToggleCollapse || onClose || onCloseMobile}
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
              className="w-8 h-8 rounded-xl hover:bg-[#F5F8FC] text-[#8298B8] hover:text-[#173B67] flex items-center justify-center transition-colors cursor-pointer group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Navigation Links with generous vertical breathing room from CRM Connect */}
        {isCollapsed ? (
          <div className="pt-6 pb-5 px-2 flex flex-col items-center gap-2.5">
            {navItems.map((item) => {
              const active = isLinkActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    active
                      ? 'bg-[#FFF0F2] text-[#F5223B] shadow-xs'
                      : 'text-[#8298B8] hover:text-[#173B67] hover:bg-[#F5F8FC]'
                  }`}
                  style={{
                    backgroundColor: active ? '#FFF0F2' : 'transparent',
                    color: active ? '#F5223B' : '#8298B8',
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="pt-6 pb-5 px-3 space-y-2">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                    active
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
        )}
      </div>
    </aside>
  );
}
