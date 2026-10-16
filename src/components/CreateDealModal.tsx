// src/components/CreateDealModal.tsx — Quick Action: Create Deal / Booking Modal
'use client';

import React, { useState, useEffect } from 'react';
import { X, Handshake, DollarSign, Calendar, Car, CheckCircle2, ShieldCheck } from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Lead } from '@/types/crm';
import { Car as CarType } from '@/types/database';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealCreated?: () => void;
  preselectedLeadId?: string;
}

export default function CreateDealModal({
  isOpen,
  onClose,
  onDealCreated,
  preselectedLeadId,
}: CreateDealModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(preselectedLeadId || '');
  const [selectedCarName, setSelectedCarName] = useState('Mercedes-Benz S-Class S 350d');
  const [tokenAmount, setTokenAmount] = useState('500000');
  const [totalAmount, setTotalAmount] = useState('13500000');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [financeStatus, setFinanceStatus] = useState<'self' | 'in_progress' | 'approved'>('self');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([crmService.getLeads(), crmService.getCars()]).then(([lData, cData]) => {
        setLeads(lData);
        setCars(cData);
        if (!selectedLeadId && lData.length > 0) {
          const l = lData.find((x) => x.id === preselectedLeadId) || lData[0];
          setSelectedLeadId(l.id);
          if (l.interested_car) setSelectedCarName(l.interested_car);
          if (l.budget) setTotalAmount(String(l.budget));
        }
      });
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDeliveryDate(d.toISOString().split('T')[0]);
      setSuccess(false);
    }
  }, [isOpen, preselectedLeadId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !totalAmount) return;

    try {
      setLoading(true);
      const lead = leads.find((l) => l.id === selectedLeadId);

      await crmService.createBooking({
        lead_id: selectedLeadId,
        car_name: selectedCarName,
        token_amount: parseInt(tokenAmount.replace(/\D/g, '')) || 0,
        total_amount: parseInt(totalAmount.replace(/\D/g, '')) || 0,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        loan_status: financeStatus === 'self' ? 'na' : financeStatus === 'approved' ? 'approved' : 'applied',
        notes: `[Booking Created] ${notes}`.trim(),
      });

      // Advance lead status to booking_done
      await crmService.updateLeadStatus(selectedLeadId, 'booking_done');

      setSuccess(true);
      setTimeout(() => {
        onDealCreated?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Error creating deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#EAEFF5] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#F0F4F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#173B67]">Create Deal & Lock Inventory</h3>
              <p className="text-[11px] text-[#8298B8]">Record advance token and delivery schedule</p>
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
            <h4 className="text-base font-bold text-[#173B67]">Deal Successfully Created!</h4>
            <p className="text-xs text-[#8298B8]">Vehicle reserved in inventory and lead moved to Booking Done stage.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Customer / Lead
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => {
                  setSelectedLeadId(e.target.value);
                  const l = leads.find((x) => x.id === e.target.value);
                  if (l?.interested_car) setSelectedCarName(l.interested_car);
                  if (l?.budget) setTotalAmount(String(l.budget));
                }}
                required
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#8B5CF6]"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.customer_name} ({l.phone}) — Current Stage: {l.lead_status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Selected Luxury Vehicle
              </label>
              <input
                type="text"
                value={selectedCarName}
                onChange={(e) => setSelectedCarName(e.target.value)}
                placeholder="e.g. Porsche 911 Carrera S"
                required
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                  Advance Token (₹)
                </label>
                <input
                  type="text"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="500000"
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                  Total Deal Value (₹)
                </label>
                <input
                  type="text"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="13500000"
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                  Target Handover Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                  Financing
                </label>
                <select
                  value={financeStatus}
                  onChange={(e: any) => setFinanceStatus(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="self">100% Self-Financed / Cash</option>
                  <option value="in_progress">Bank Loan In Documentation</option>
                  <option value="approved">Bank Loan Approved</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1.5">
                Special Delivery Notes / Accessories
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Red ribbon delivery ceremony, Ceramic coating included..."
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#173B67] focus:outline-none focus:border-[#8B5CF6] placeholder-[#8298B8]"
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
                className="px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Create Deal & Reserve Car'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
