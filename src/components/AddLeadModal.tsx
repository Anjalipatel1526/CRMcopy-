// src/components/AddLeadModal.tsx — Inbound Lead Registration Modal (White & Red Luxury Theme)
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Phone, User, Mail, MapPin, Briefcase, Car, IndianRupee, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { crmService, normalizePhone } from '@/lib/crm-service';
import { LeadSource, SOURCE_LABELS } from '@/types/crm';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
}

const BRANDS = [
  'Mercedes-Benz',
  'Porsche',
  'BMW',
  'Audi',
  'Land Rover',
  'Volvo',
  'Jaguar',
  'Lexus',
  'Lamborghini',
  'Bentley',
  'Rolls-Royce',
  'Other',
];

const TIMELINES = [
  'Immediate',
  'Within 1 week',
  '1–2 weeks',
  '1 month',
  '1–3 months',
  '3–6 months',
];

export default function AddLeadModal({ isOpen, onClose, onLeadAdded }: AddLeadModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Chennai');
  const [state, setState] = useState('Tamil Nadu');
  const [occupation, setOccupation] = useState('');
  const [source, setSource] = useState<LeadSource>('manual');
  const [preferredBrand, setPreferredBrand] = useState('Mercedes-Benz');
  const [interestedCar, setInterestedCar] = useState('');
  const [budget, setBudget] = useState('');
  const [purchaseTimeline, setPurchaseTimeline] = useState('Within 1 week');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultBanner, setResultBanner] = useState<{ isDuplicate: boolean; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResultBanner(null);

    if (!customerName.trim() || !phone.trim()) {
      setErrorMsg('Customer name and phone number are required.');
      return;
    }

    const norm = normalizePhone(phone);
    if (norm.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await crmService.ingestLead({
        customer_name: customerName,
        phone,
        email,
        city,
        state,
        occupation,
        source,
        preferred_brand: preferredBrand,
        interested_car: interestedCar,
        budget: budget ? parseInt(budget.replace(/\D/g, '')) : undefined,
        purchase_timeline: purchaseTimeline,
        notes,
      });

      setResultBanner({
        isDuplicate: res.isDuplicate,
        message: res.message,
      });

      setTimeout(() => {
        onLeadAdded();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register lead.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-gray-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 text-gray-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#FAFAFA]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#E10613]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Ingest New Luxury Prospect</h3>
                <p className="text-xs text-gray-500 font-medium">Automatic phone normalization & deduplication engine active</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#E10613]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {resultBanner && (
              <div
                className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold ${
                  resultBanner.isDuplicate
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resultBanner.message}</span>
              </div>
            )}

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Customer Name <span className="text-[#E10613]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singhania"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Phone Number <span className="text-[#E10613]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 98401 23456"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>
                {phone && (
                  <span className="text-[10px] text-gray-400 font-semibold mt-1 block">
                    Normalized: +91 {normalizePhone(phone)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@luxury.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">City / Region</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chennai"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Occupation / Profile</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Surgeon / Industrialist"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Inbound Source & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Inbound Channel</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none font-medium"
                >
                  {Object.entries(SOURCE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Preferred Brand</label>
                <select
                  value={preferredBrand}
                  onChange={(e) => setPreferredBrand(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none font-medium"
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehicle & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Interested Vehicle</label>
                <div className="relative">
                  <Car className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={interestedCar}
                    onChange={(e) => setInterestedCar(e.target.value)}
                    placeholder="e.g. Mercedes-Benz S-Class S 350d Luxury"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Budget (INR)</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="1,50,00,000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Purchase Timeline</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <select
                  value={purchaseTimeline}
                  onChange={(e) => setPurchaseTimeline(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none font-medium"
                >
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Initial Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Initial Client Note / Requirement</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific color, variant, exchange car details, or consultation notes..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E10613] hover:bg-[#c70511] text-white shadow-md shadow-red-200 transition-all disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Register Prospect'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
