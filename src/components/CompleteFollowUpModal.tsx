// src/components/CompleteFollowUpModal.tsx — Complete & Schedule Next Follow-up (White & Red Theme)
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, CalendarPlus, X, Clock, MessageSquare } from 'lucide-react';
import { FollowUp, FollowUpType, FollowUpPriority, FOLLOW_UP_TYPE_LABELS } from '@/types/crm';
import { crmService } from '@/lib/crm-service';

interface CompleteFollowUpModalProps {
  isOpen: boolean;
  followUp: FollowUp | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function CompleteFollowUpModal({
  isOpen,
  followUp,
  onSuccess,
  onClose,
}: CompleteFollowUpModalProps) {
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextType, setNextType] = useState<FollowUpType>('call');
  const [nextScheduledAt, setNextScheduledAt] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [nextPriority, setNextPriority] = useState<FollowUpPriority>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!outcomeNotes.trim()) {
      setError('Please provide outcome notes for this completed follow-up.');
      return;
    }

    try {
      setSubmitting(true);
      await crmService.completeAndScheduleNext(
        followUp.id,
        outcomeNotes.trim(),
        scheduleNext && nextScheduledAt
          ? {
              follow_up_type: nextType,
              scheduled_at: new Date(nextScheduledAt).toISOString(),
              notes: nextNotes || `Follow-up following: ${outcomeNotes.slice(0, 50)}`,
              priority: nextPriority,
            }
          : undefined
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 text-gray-900"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Complete & Schedule Next Action</h3>
                <p className="text-xs text-gray-500 font-medium">For {followUp.lead?.customer_name || 'Customer'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {error && <p className="text-xs text-[#E10613] bg-red-50 p-2.5 rounded-xl border border-red-200 font-semibold">{error}</p>}

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium">
              <span className="text-gray-400 block mb-0.5">Task Being Completed:</span>
              <span className="font-bold text-gray-800">
                {FOLLOW_UP_TYPE_LABELS[followUp.follow_up_type]} — {followUp.notes || 'No description'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Call / Interaction Outcome <span className="text-[#E10613]">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                placeholder="e.g. Spoke with client. Confirmed budget at ₹1.4 Cr. Requested brochure of Porsche 911 Carrera S and callback tomorrow at 3 PM..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 select-none">
                <input
                  type="checkbox"
                  checked={scheduleNext}
                  onChange={(e) => setScheduleNext(e.target.checked)}
                  className="rounded border-gray-300 text-[#E10613] focus:ring-[#E10613]"
                />
                <CalendarPlus className="w-4 h-4 text-[#E10613]" />
                <span>Schedule Next Follow-up in Same Step</span>
              </label>
            </div>

            {scheduleNext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 p-4 rounded-2xl bg-gray-50 border border-gray-200/80"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Next Action Type</label>
                    <select
                      value={nextType}
                      onChange={(e) => setNextType(e.target.value as FollowUpType)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none font-medium"
                    >
                      {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                    <select
                      value={nextPriority}
                      onChange={(e) => setNextPriority(e.target.value as FollowUpPriority)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none font-medium"
                    >
                      <option value="high">High Priority</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Next Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={nextScheduledAt}
                    onChange={(e) => setNextScheduledAt(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Next Action Notes</label>
                  <input
                    type="text"
                    value={nextNotes}
                    onChange={(e) => setNextNotes(e.target.value)}
                    placeholder="e.g. Send valuation calculation on WhatsApp"
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                  />
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Complete & Schedule'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
