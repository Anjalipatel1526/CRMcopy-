// src/components/ScheduleCallModal.tsx — Quick Action: Schedule Call Modal
'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, Calendar, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Lead } from '@/types/crm';

interface ScheduleCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallScheduled?: () => void;
  preselectedLeadId?: string;
}

export default function ScheduleCallModal({
  isOpen,
  onClose,
  onCallScheduled,
  preselectedLeadId,
}: ScheduleCallModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(preselectedLeadId || '');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [callPurpose, setCallPurpose] = useState('Requirement Discovery & Vehicle Match');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      crmService.getLeads().then((data) => {
        setLeads(data);
        if (!selectedLeadId && data.length > 0) {
          setSelectedLeadId(preselectedLeadId || data[0].id);
        }
      });
      // Set default tomorrow date
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setScheduledDate(d.toISOString().split('T')[0]);
      setSuccess(false);
    }
  }, [isOpen, preselectedLeadId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !scheduledDate) return;

    try {
      setLoading(true);
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime || '10:00'}:00`).toISOString();
      const lead = leads.find((l) => l.id === selectedLeadId);

      await crmService.createFollowUp({
        lead_id: selectedLeadId,
        follow_up_type: 'call',
        scheduled_at: scheduledAt,
        priority,
        notes: `[Call Purpose: ${callPurpose}] ${notes}`.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onCallScheduled?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Error scheduling call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#EAEFF5] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#F0F4F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#173B67]">Schedule Client Call</h3>
              <p className="text-[11px] text-[#8298B8]">Set up direct phone consultation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-[#8298B8] hover:text-[#173B67] hover:bg-[#F5F8FC] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#173B67]">Call Successfully Scheduled!</h4>
            <p className="text-xs text-[#8298B8]">Added to Today&apos;s Follow-up scrum queue with automated reminder.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Select Customer / Lead
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                required
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.customer_name} ({l.phone}) — {l.interested_car || 'Luxury Prospect'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                  Call Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                  Time Slot
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Call Purpose / Agenda
              </label>
              <select
                value={callPurpose}
                onChange={(e) => setCallPurpose(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#10B981]"
              >
                <option value="Requirement Discovery & Vehicle Match">Requirement Discovery & Vehicle Match</option>
                <option value="Test Drive Booking Confirmation">Test Drive Booking Confirmation</option>
                <option value="Price Negotiation & Trade-in Appraisal">Price Negotiation & Trade-in Appraisal</option>
                <option value="Finance & Loan Documentation">Finance & Loan Documentation</option>
                <option value="Delivery Ceremony Scheduling">Delivery Ceremony Scheduling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'normal', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-50 text-[#F5223B] border-red-200'
                          : p === 'normal'
                          ? 'bg-emerald-50 text-[#10B981] border-emerald-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                        : 'border-[#E2E8F0] text-[#8298B8] hover:bg-[#F5F8FC]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Notes / Special Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Customer prefers WhatsApp call if unavailable on phone..."
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#10B981] placeholder-[#8298B8]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#8298B8] hover:text-[#173B67] hover:bg-[#F5F8FC] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#10B981] hover:bg-[#0EA574] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Call'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
