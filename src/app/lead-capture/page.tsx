// src/app/lead-capture/page.tsx — Module 1: Inbound Lead Capture & Deduplication (White & Red Theme)
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ShieldCheck, Phone, CheckCircle2, AlertTriangle, ArrowRight,
  Car, MessageSquare, Send, Calendar, RefreshCw, Info, Check, User, Activity
} from 'lucide-react';
import CRMNavbar from '@/components/CRMNavbar';
import AddLeadModal from '@/components/AddLeadModal';
import { crmService, normalizePhone } from '@/lib/crm-service';
import { LeadSource } from '@/types/crm';

export default function LeadCapturePage() {
  const [activeForm, setActiveForm] = useState<'vehicle' | 'testdrive' | 'sell' | 'contact'>('vehicle');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [carName, setCarName] = useState('Mercedes-Benz S-Class S 350d');
  const [budget, setBudget] = useState('13500000');
  const [city, setCity] = useState('Chennai');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    isDuplicate: boolean;
    message: string;
    lead: any;
  } | null>(null);

  const fillExistingLead = () => {
    setCustomerName('Raghavendra Rao');
    setPhone('9840192831');
    setEmail('raghav.rao@chennaitech.in');
    setCarName('Porsche 911 Carrera S');
    setBudget('18200000');
    setNotes('Also interested in exchanging existing BMW 330i with Carrera S.');
    setResult(null);
  };

  const fillNewLead = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setCustomerName(`Aditya Birla ${randomSuffix}`);
    setPhone(`98405${randomSuffix}`);
    setEmail(`aditya.${randomSuffix}@birlacorp.com`);
    setCarName('Audi RS e-tron GT');
    setBudget('16500000');
    setNotes('Urgent purchase requirement. Would like showroom visit this Saturday.');
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) return;

    setLoading(true);
    setResult(null);

    const sourceMap: Record<string, LeadSource> = {
      vehicle: 'website',
      testdrive: 'website',
      sell: 'website',
      contact: 'website',
    };

    try {
      const res = await crmService.ingestLead({
        customer_name: customerName,
        phone,
        email,
        city,
        source: sourceMap[activeForm] || 'website',
        interested_car: carName,
        budget: budget ? parseInt(budget.replace(/\D/g, '')) : undefined,
        notes: `[Inquiry Form: ${activeForm.toUpperCase()}] ${notes}`,
      });

      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Error submitting lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col">
      <CRMNavbar onOpenAddLead={() => setIsAddLeadOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Module Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#E10613] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Module 1: Ingestion Engine & Deduplication</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Zero Lead Leakage & Smart Ingestion Engine
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl mt-1">
            Simulates inbound customer inquiries across the public website, test drive forms, and WhatsApp. Phone numbers are normalized and checked for existing active leads to prevent duplicate clutter.
          </p>
        </div>

        {/* Deduplication Test Bar */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Live Deduplication Simulator</h4>
              <p className="text-xs text-gray-500">
                Click a preset below to test how our engine handles existing vs brand-new clients:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={fillExistingLead}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
            >
              Simulate Existing Client (9840192831)
            </button>
            <button
              onClick={fillNewLead}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
            >
              Simulate Fresh Client
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Public Ingestion Forms */}
          <div className="lg:col-span-7 bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs">
            {/* Form Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveForm('vehicle')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeForm === 'vehicle' ? 'bg-[#E10613] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 bg-gray-50'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Vehicle Inquiry Modal</span>
              </button>
              <button
                onClick={() => setActiveForm('testdrive')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeForm === 'testdrive' ? 'bg-[#E10613] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>/testdrive Form</span>
              </button>
              <button
                onClick={() => setActiveForm('sell')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeForm === 'sell' ? 'bg-[#E10613] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 bg-gray-50'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>/sell Car Evaluation</span>
              </button>
              <button
                onClick={() => setActiveForm('contact')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeForm === 'contact' ? 'bg-[#E10613] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>/contact Form</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Raghavendra Rao"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9840192831"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                  {phone && (
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Normalized 10-digit: {normalizePhone(phone)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@autobourn.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chennai"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Vehicle of Interest</label>
                  <input
                    type="text"
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                    placeholder="Mercedes-Benz S-Class"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Budget (INR)</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="1,35,00,000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Client Inbound Message / Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us what you are looking for..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-[#E10613] hover:bg-[#c70511] text-white shadow-md shadow-red-200 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Ingesting...' : 'Submit Inbound Ingestion'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live Result & Deduplication Inspection Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>Ingestion Diagnostics & Deduplication</span>
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Live feedback from the normalization and de-duplication layer:
              </p>

              {result ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div
                    className={`p-4 rounded-xl border ${
                      result.isDuplicate
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm mb-1">
                      {result.isDuplicate ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>DEDUPLICATION APPLIED</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>NEW LEAD REGISTERED</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed font-medium">{result.message}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs font-medium">
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Lead ID:</span>
                      <span className="font-mono text-gray-700">{result.lead.id}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Customer Name:</span>
                      <span className="font-bold text-gray-900">{result.lead.customer_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Normalized Phone:</span>
                      <span className="font-mono font-bold text-gray-800">{result.lead.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Pipeline Stage:</span>
                      <span className="font-bold uppercase text-indigo-700">{result.lead.lead_status}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">WhatsApp Greeting:</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Triggered
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`/dashboard/crm/leads/${result.lead.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs transition-colors"
                    >
                      <span>View 360° Lead Detail & Merged Notes</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E10613]" />
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-60 text-gray-400" />
                  <span className="font-medium">Submit the form on the left or click one of the simulator presets above to inspect output.</span>
                </div>
              )}
            </div>

            {/* Ingestion Rules Guide */}
            <div className="p-5 rounded-2xl bg-white border border-gray-200/90 text-xs text-gray-600 space-y-2 shadow-xs">
              <span className="font-bold text-gray-900 block">Engine Technical Guarantees:</span>
              <ul className="space-y-1.5 list-disc pl-4 text-gray-500 font-medium">
                <li>Strips spaces, country codes (+91), dashes, and leading zeros to clean 10 digits.</li>
                <li>Excludes closed leads (sold/lost) so past customers can open new deal cycles.</li>
                <li>Appends inquiry payload to customer notes with timestamp & source attribution.</li>
                <li>Schedules an urgent 15-minute callback task for the assigned sales representative.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onLeadAdded={() => {}}
      />
    </div>
  );
}
