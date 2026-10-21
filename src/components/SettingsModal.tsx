// src/components/SettingsModal.tsx — Settings & Role Switcher Modal
'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Database, RefreshCw, CheckCircle2, User, Key, ExternalLink } from 'lucide-react';
import { crmService } from '@/lib/crm-service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSettingsChanged,
}: SettingsModalProps) {
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRole(crmService.getCurrentRole());
      setIsLiveDb(crmService.isLiveDbEnabled());
      setSavedMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleToggle = (newRole: 'admin' | 'employee') => {
    crmService.setCurrentRole(newRole);
    setRole(newRole);
    setSavedMsg(`Role updated to ${newRole === 'admin' ? 'Super Admin / Management' : 'Sales Executive'}`);
    setTimeout(() => {
      onSettingsChanged?.();
      window.location.reload();
    }, 600);
  };

  const handleBackendToggle = () => {
    const nextState = !isLiveDb;
    crmService.setLiveDbEnabled(nextState);
    setIsLiveDb(nextState);
    setSavedMsg(nextState ? 'Switched to Live Supabase PostgreSQL' : 'Switched to Interactive Offline/Demo Data');
    setTimeout(() => {
      onSettingsChanged?.();
      window.location.reload();
    }, 600);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all CRM leads and activities to default seed data?')) {
      setResetting(true);
      crmService.resetToSeed();
      setSavedMsg('CRM data reset successfully!');
      setTimeout(() => {
        setResetting(false);
        onSettingsChanged?.();
        window.location.reload();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#EAEFF5] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#F0F4F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#475569]/15 text-[#475569] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#173B67]">CRM System Settings</h3>
              <p className="text-[11px] text-[#8298B8]">Dealership Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-[#8298B8] hover:text-[#173B67] hover:bg-[#F5F8FC] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {savedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{savedMsg}</span>
            </div>
          )}

          {/* Role Mode */}
          <div>
            <label className="block text-xs font-semibold text-[#173B67] mb-2">
              Current Access Role (RBAC)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleToggle('admin')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'admin'
                    ? 'border-[#F5223B] bg-red-50/50 text-[#F5223B]'
                    : 'border-[#E2E8F0] text-[#8298B8] hover:bg-[#F5F8FC]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-bold">Super Admin</span>
                </div>
                <p className="text-[10px] text-[#8298B8] mt-1">Full pipeline, revenue & management access</p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleToggle('employee')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'employee'
                    ? 'border-[#F5223B] bg-red-50/50 text-[#F5223B]'
                    : 'border-[#E2E8F0] text-[#8298B8] hover:bg-[#F5F8FC]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold">Sales Rep</span>
                </div>
                <p className="text-[10px] text-[#8298B8] mt-1">Assigned leads & daily follow-up queue</p>
              </button>
            </div>
          </div>

          {/* Backend Data Source */}
          <div className="pt-2 border-t border-[#F0F4F8]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-semibold text-[#173B67]">
                  Data Persistence Mode
                </label>
                <p className="text-[11px] text-[#8298B8]">
                  {isLiveDb ? 'Connected to live Supabase PostgreSQL' : 'Local storage demo mode with zero latency'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleBackendToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isLiveDb ? 'bg-[#10B981]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isLiveDb ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 border-t border-[#F0F4F8] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#173B67] block">Reset Demo Data</span>
              <span className="text-[11px] text-[#8298B8] block">Restore default luxury inventory and lead seeds</span>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              disabled={resetting}
              className="px-3 py-1.5 border border-[#E2E8F0] hover:bg-red-50 hover:border-red-200 hover:text-[#F5223B] rounded-xl text-xs font-semibold text-[#8298B8] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
          </div>

          {/* Version / About */}
          <div className="pt-3 border-t border-[#F0F4F8] text-center text-[10px] text-[#8298B8]">
            <span>CRM Production Build v2.4 • Dealership Operations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
