// src/components/LostReasonModal.tsx — Mandatory Lost Reason Capture Guard (White & Red Theme)
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface LostReasonModalProps {
  isOpen: boolean;
  leadName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const COMMON_REASONS = [
  'Price / Valuation Too High',
  'Purchased from Competitor Dealership',
  'Financing / Loan Rejected',
  'Customer Postponed Purchase Plan',
  'Vehicle Model / Color Unavailable',
  'Customer Untraceable / Invalid Contact',
];

export default function LostReasonModal({ isOpen, leadName, onConfirm, onCancel }: LostReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() ? `${selectedReason}: ${customReason.trim()}` : selectedReason;
    if (!finalReason) {
      setError('Please provide a specific lost reason.');
      return;
    }
    onConfirm(finalReason);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-gray-200 rounded-3xl w-full max-w-md shadow-2xl p-6 text-gray-900"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#E10613]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Pipeline Guard: Mark Deal as Lost</h3>
                <p className="text-xs text-gray-500 font-medium">Mandatory audit governance for {leadName}</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && <p className="text-xs text-[#E10613] font-semibold">{error}</p>}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Primary Reason <span className="text-[#E10613]">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none font-medium"
              >
                {COMMON_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Additional Context / Executive Notes
              </label>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specific customer feedback, competitor car bought, or negotiation notes..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E10613] hover:bg-[#c70511] text-white shadow-md shadow-red-200"
              >
                Confirm Move to Lost
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
