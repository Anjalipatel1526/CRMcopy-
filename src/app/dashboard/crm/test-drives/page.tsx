// src/app/dashboard/crm/test-drives/page.tsx — Module 5: Test Drive Fleet (White & Red Theme)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Calendar, Clock, MapPin, CheckCircle2, AlertTriangle, Plus,
  ShieldCheck, MessageSquare, User, ArrowRight, X
} from 'lucide-react';
import CRMNavbar from '@/components/CRMNavbar';
import ScheduleTestDriveModal from '@/components/ScheduleTestDriveModal';
import { crmService } from '@/lib/crm-service';
import { TestDrive, Lead } from '@/types/crm';
import { Car as CarType } from '@/types/database';

export default function TestDrivesPage() {
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [feedbackItem, setFeedbackItem] = useState<TestDrive | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<'interested' | 'not_interested' | 'needs_follow_up'>('interested');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedLeadForTd, setSelectedLeadForTd] = useState<Lead | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const tds = await crmService.getTestDrives();
      const c = await crmService.getCars();
      const l = await crmService.getLeads();
      setTestDrives(tds);
      setCars(c);
      setLeads(l);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackItem) return;

    try {
      await crmService.completeTestDriveFeedback(feedbackItem.id, feedbackResult, feedbackNotes);
      showToast('Test drive outcome and client feedback logged!');
      setFeedbackItem(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error updating test drive');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1360px] mx-auto w-full">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mb-2">
              <Car className="w-3.5 h-3.5 text-purple-600" />
              <span>Module 5: Test Drive & Fleet Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Test Drive Management & Inventory Safety
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Live showroom and home test drive bookings with automated vehicle scheduling collision checks.
            </p>
          </div>

          <button
            onClick={() => {
              if (leads.length > 0) {
                setSelectedLeadForTd(leads[0]);
                setIsScheduleOpen(true);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E10613] hover:bg-[#c70511] text-white text-xs font-bold shadow-md shadow-red-200 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Book Test Drive</span>
          </button>
        </div>

        {/* Fleet Availability Status Ribbon */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 mb-8 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-900">Live Inventory Collision Guard:</span>
            <span className="text-gray-500">
              Active algorithms prevent double-booking cars within a 2-hour buffer.
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-700">{cars.filter((c) => c.status === 'available').length} Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-gray-700">{cars.filter((c) => c.status === 'reserved').length} Reserved</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-gray-700">{cars.filter((c) => c.status === 'sold').length} Sold</span>
            </span>
          </div>
        </div>

        {/* Test Drives List */}
        <div className="space-y-4">
          {testDrives.map((td) => {
            const lead = leads.find((l) => l.id === td.lead_id);
            return (
              <div
                key={td.id}
                className="p-6 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-extrabold text-gray-900">{td.car_name}</h3>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        td.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : td.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {td.status}
                    </span>
                    {td.result && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold uppercase">
                        Outcome: {td.result.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1 text-gray-800 font-semibold">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Client: {lead?.customer_name || 'Prospect Client'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{new Date(td.scheduled_at).toLocaleString('en-IN')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{td.location || 'Velachery Showroom'}</span>
                    </span>
                  </div>

                  {td.notes && (
                    <p className="text-xs text-gray-600 max-w-2xl font-medium">{td.notes}</p>
                  )}

                  {td.customer_feedback && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                      Client Feedback: &ldquo;{td.customer_feedback}&rdquo;
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {lead && (
                    <Link
                      href={`/dashboard/crm/leads/${lead.id}`}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                    >
                      View Hub
                    </Link>
                  )}

                  {td.status === 'scheduled' && (
                    <button
                      onClick={() => {
                        setFeedbackItem(td);
                        setFeedbackNotes('');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      Log Feedback & Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      {/* Post Drive Feedback Modal (Light Mode) */}
      <AnimatePresence>
        {feedbackItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 text-gray-900 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Log Test Drive Feedback</h3>
                  <p className="text-xs text-gray-500">{feedbackItem.car_name}</p>
                </div>
                <button onClick={() => setFeedbackItem(null)} className="text-gray-400 hover:text-gray-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCompleteFeedback} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Interest Outcome</label>
                  <select
                    value={feedbackResult}
                    onChange={(e) => setFeedbackResult(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                  >
                    <option value="interested">Highly Interested (Ready for Pricing/Negotiation)</option>
                    <option value="needs_follow_up">Needs Follow-up (Evaluating other options)</option>
                    <option value="not_interested">Not Interested (Vehicle didn&apos;t meet expectations)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Feedback Notes</label>
                  <textarea
                    rows={3}
                    required
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="e.g. Loved acceleration and cabin comfort. Requested quote with exchange on old sedan."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackItem(null)}
                    className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Test Drive Modal */}
      {selectedLeadForTd && (
        <ScheduleTestDriveModal
          isOpen={isScheduleOpen}
          leadId={selectedLeadForTd.id}
          leadName={selectedLeadForTd.customer_name}
          interestedCarName={selectedLeadForTd.interested_car}
          onConfirm={async (data) => {
            await crmService.scheduleTestDrive({
              lead_id: selectedLeadForTd.id,
              car_id: data.car_id,
              car_name: data.car_name,
              scheduled_at: data.scheduled_at,
              location: data.location,
              notes: data.notes,
            });
            setIsScheduleOpen(false);
            showToast('Test drive scheduled successfully!');
            loadData();
          }}
          onCancel={() => setIsScheduleOpen(false)}
        />
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#E10613]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
