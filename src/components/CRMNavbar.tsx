// src/components/CRMNavbar.tsx — Pure White & Red Luxury Navigation Bar
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Users2, CalendarClock, TrendingUp, Sparkles,
  Smartphone, Database, RefreshCw, ChevronDown, Plus,
  Layers, CheckCircle2, Award
} from 'lucide-react';
import { crmService } from '@/lib/crm-service';

interface CRMNavbarProps {
  onOpenAddLead?: () => void;
}

export default function CRMNavbar({ onOpenAddLead }: CRMNavbarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setRole(crmService.getCurrentRole());
    setIsLiveDb(crmService.isLiveDbEnabled());
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRoleChange = (newRole: 'admin' | 'employee') => {
    crmService.setCurrentRole(newRole);
    setRole(newRole);
    setIsRoleDropdownOpen(false);
    showNotification(`Switched role view to: ${newRole === 'admin' ? 'Super Admin / Management' : 'Sales Executive'}`);
  };

  const toggleDataSource = () => {
    const nextState = !isLiveDb;
    crmService.setLiveDbEnabled(nextState);
    setIsLiveDb(nextState);
    showNotification(nextState ? 'Switched to Live Supabase Backend' : 'Switched to Interactive Offline/Demo Data Mode');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleResetData = () => {
    if (confirm('Reset CRM data to luxury default seed records?')) {
      crmService.resetToSeed();
      showNotification('CRM data reset to default seed!');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const navLinks = [
    { label: 'Pipeline & Kanban', href: '/dashboard/crm/leads', icon: Layers, badge: '9 Stages' },
    { label: 'Follow-ups', href: '/dashboard/crm/follow-ups', icon: CalendarClock },
    { label: 'Test Drives', href: '/dashboard/crm/test-drives', icon: Car },
    { label: 'Bookings', href: '/dashboard/crm/bookings', icon: Award },
    { label: 'Analytics', href: '/dashboard/crm/analytics', icon: TrendingUp },
    { label: 'Employee Console', href: '/employee/crm', icon: Smartphone, highlight: true },
    { label: 'Lead Ingestion', href: '/lead-capture', icon: Sparkles },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs text-gray-900">
        {/* Top utility ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-xs border-b border-gray-100 bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-gray-700">
              <span className="w-2 h-2 rounded-full bg-[#E10613] animate-pulse" />
              AUTO BOURN PRESTIGE MOTORS CRM
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="hidden sm:inline text-gray-500">Velachery Flagship Showroom, Chennai</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live DB / Demo Mode Toggle */}
            <button
              onClick={toggleDataSource}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold transition-all ${
                isLiveDb
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
              title="Click to toggle between Live Supabase and Demo Fallback"
            >
              <Database className="w-3 h-3" />
              <span>{isLiveDb ? 'Live Supabase DB' : 'Interactive Demo Mode'}</span>
            </button>

            {/* Reset Data Button */}
            <button
              onClick={handleResetData}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              title="Reset sample data"
            >
              <RefreshCw className="w-3 h-3" />
            </button>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 font-medium text-xs transition-colors"
              >
                <Users2 className="w-3 h-3 text-[#E10613]" />
                <span className="capitalize">{role === 'admin' ? 'Super Admin' : 'Sales RM'}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              <AnimatePresence>
                {isRoleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 text-xs"
                  >
                    <button
                      onClick={() => handleRoleChange('admin')}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 ${
                        role === 'admin' ? 'text-[#E10613] font-bold bg-red-50/50' : 'text-gray-700'
                      }`}
                    >
                      <span>Super Admin / Management</span>
                      {role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-[#E10613]" />}
                    </button>
                    <button
                      onClick={() => handleRoleChange('employee')}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 ${
                        role === 'employee' ? 'text-[#E10613] font-bold bg-red-50/50' : 'text-gray-700'
                      }`}
                    >
                      <span>Sales Executive / RM</span>
                      {role === 'employee' && <CheckCircle2 className="w-3.5 h-3.5 text-[#E10613]" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Main navigation row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E10613] to-[#B3050F] flex items-center justify-center shadow-md shadow-red-200 group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-wider text-gray-900">AUTO BOURN</span>
                <span className="text-[10px] tracking-widest text-[#E10613] font-bold block uppercase">PRESTIGE CRM</span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-red-50 text-[#E10613] border border-red-200/80 shadow-xs'
                        : link.highlight
                        ? 'bg-gray-100 text-gray-800 hover:bg-red-50 hover:text-[#E10613]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E10613]' : 'text-gray-400'}`} />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/lead-capture"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Dedupe</span>
              </Link>

              {onOpenAddLead ? (
                <button
                  onClick={onOpenAddLead}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#E10613] hover:bg-[#c70511] text-white shadow-md shadow-red-200 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Lead</span>
                </button>
              ) : (
                <Link
                  href="/dashboard/crm/leads?action=add"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#E10613] hover:bg-[#c70511] text-white shadow-md shadow-red-200 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Lead</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="lg:hidden flex items-center overflow-x-auto gap-2 px-4 py-2 border-t border-gray-100 bg-[#FAFAFA] text-xs no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold ${
                  isActive
                    ? 'bg-red-50 text-[#E10613] border border-red-200'
                    : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Floating toast notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs max-w-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#E10613]" />
            <span className="font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
