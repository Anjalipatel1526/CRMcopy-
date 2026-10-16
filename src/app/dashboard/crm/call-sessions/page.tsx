// src/app/dashboard/crm/call-sessions/page.tsx — Executive Rapid Call & Outreach Desk
'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall, Phone, MessageSquare, Clock, User, Car,
  CheckCircle2, ArrowRight, Calendar, Sparkles, AlertCircle
} from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Lead, formatBudget } from '@/types/crm';

export default function CallSessionsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callOutcome, setCallOutcome] = useState('interested');
  const [callNotes, setCallNotes] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const l = await crmService.getLeads();
      const active = l.filter((x) => x.lead_status !== 'sold' && x.lead_status !== 'lost');
      setLeads(active);
      if (active.length > 0) setSelectedLead(active[0]);
    }
    load();
  }, []);

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    await crmService.logActivity({
      lead_id: selectedLead.id,
      activity_type: 'call',
      title: `Call Session Completed (${callOutcome.replace('_', ' ').toUpperCase()})`,
      description: callNotes || `Completed client touchpoint. Outcome: ${callOutcome}`,
      created_by: 'Vikram Mehta',
    });

    setToast(`Logged call touchpoint for ${selectedLead.customer_name}`);
    setCallNotes('');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1360px] mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#E10613] text-xs font-bold mb-2">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>High-Touch Outreach Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Call Scheduler
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
          Rapid outbound calling desk with instant WhatsApp trigger and automated CRM activity logging.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue of Leads to Call (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Outreach Priority Queue ({leads.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {leads.map((l) => {
              const isSelected = selectedLead?.id === l.id;
              return (
                <div
                  key={l.id}
                  onClick={() => setSelectedLead(l)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#E10613] bg-red-50/40 shadow-xs'
                      : 'border-gray-100 bg-[#FAFAFA] hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-gray-900">{l.customer_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                      {l.lead_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{l.interested_car || 'Luxury Vehicle'}</span>
                    <span className="font-mono text-gray-600">{l.phone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Calling Console (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedLead ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              {/* Profile Card Hero */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold text-[#E10613] uppercase tracking-wider">Active Prospect</span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedLead.customer_name}</h2>
                  <p className="text-xs text-gray-500">Interested in: <strong className="text-gray-800">{selectedLead.interested_car}</strong> ({formatBudget(selectedLead.budget)})</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E10613] hover:bg-[#C70511] text-white text-xs font-bold shadow-md shadow-red-200 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Dial Call</span>
                  </a>

                  <a
                    href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, '').slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Log Outcome Form */}
              <form onSubmit={handleLogCall} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Call Outcome
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'interested', label: 'Very Interested' },
                      { key: 'callback', label: 'Requested Callback' },
                      { key: 'test_drive', label: 'Wants Test Drive' },
                      { key: 'not_interested', label: 'Not Interested' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setCallOutcome(opt.key)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          callOutcome === opt.key
                            ? 'border-[#E10613] bg-red-50 text-[#E10613]'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Discussion Summary & Notes
                  </label>
                  <textarea
                    rows={4}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Enter key talking points, vehicle color preference, financing requirements..."
                    className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl p-3 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#E10613] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#E10613] hover:bg-[#C70511] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-200 transition-all"
                >
                  Save Call Session Record
                </button>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-400">
              Select a lead from the outreach queue to start a call session.
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E10613]" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
