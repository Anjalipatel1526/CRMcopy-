// src/components/AddFollowUpModal.tsx — Quick Action: Add Follow-up Modal
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MessageSquare, Phone, UserCheck, CheckCircle2 } from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Lead, FollowUpType, FollowUpPriority } from '@/types/crm';

interface AddFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFollowUpAdded?: () => void;
  preselectedLeadId?: string;
}

export default function AddFollowUpModal({
  isOpen,
  onClose,
  onFollowUpAdded,
  preselectedLeadId,
}: AddFollowUpModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(preselectedLeadId || '');
  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [priority, setPriority] = useState<FollowUpPriority>('normal');
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

      await crmService.createFollowUp({
        lead_id: selectedLeadId,
        follow_up_type: followUpType,
        scheduled_at: scheduledAt,
        priority,
        notes: notes.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onFollowUpAdded?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Error creating follow-up');
    } finally {
      setLoading(false);
    }
  };

  const types: { id: FollowUpType; label: string }[] = [
    { id: 'call', label: 'Phone Call' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'meeting', label: 'Showroom Visit' },
    { id: 'test_drive', label: 'Test Drive' },
    { id: 'email', label: 'Email' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#EAEFF5] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#F0F4F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#173B67]">Create Client Follow-Up</h3>
              <p className="text-[11px] text-[#8298B8]">Schedule upcoming sales touchpoint</p>
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
            <h4 className="text-base font-bold text-[#173B67]">Follow-up Scheduled!</h4>
            <p className="text-xs text-[#8298B8]">Added to your task queue with automated tracking.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Target Lead / Prospect
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                required
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#F59E0B]"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.customer_name} ({l.phone}) — {l.interested_car || 'Luxury Prospect'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Follow-up Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {types.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFollowUpType(t.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                      followUpType === t.id
                        ? 'bg-amber-50 text-[#F59E0B] border-amber-300'
                        : 'border-[#E2E8F0] text-[#8298B8] hover:bg-[#F5F8FC]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                  Target Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
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
                          ? 'bg-amber-50 text-[#F59E0B] border-amber-200'
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
                Task Description / Objective
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Send updated brochure and quotation for AMG package..."
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#F59E0B] placeholder-[#8298B8]"
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
                className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D98706] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Follow-up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
