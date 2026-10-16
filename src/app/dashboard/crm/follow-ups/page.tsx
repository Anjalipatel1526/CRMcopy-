// src/app/dashboard/crm/follow-ups/page.tsx — Module 4: Follow-up & Task Engine (White & Red Theme)
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock, Clock, AlertTriangle, CheckCircle2, Phone, MessageCircle,
  FileDown, Plus, Filter, User, ArrowRight, RefreshCw, Calendar
} from 'lucide-react';
import CRMNavbar from '@/components/CRMNavbar';
import CompleteFollowUpModal from '@/components/CompleteFollowUpModal';
import { crmService } from '@/lib/crm-service';
import { FollowUp, FOLLOW_UP_TYPE_LABELS } from '@/types/crm';
import { downloadMissedFollowUpsPdf } from '@/lib/pdf-utils';

type QueueSection = 'today' | 'missed' | 'upcoming' | 'all';

export default function FollowUpsEnginePage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<QueueSection>('today');
  const [typeFilter, setTypeFilter] = useState('all');
  const [completingItem, setCompletingItem] = useState<FollowUp | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const loadFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmService.getFollowUps();
      setFollowUps(data);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const todayItems = followUps.filter((f) => {
    if (f.status === 'completed' || f.status === 'cancelled') return false;
    const t = new Date(f.scheduled_at);
    return t >= startOfToday && t <= endOfToday;
  });

  const missedItems = followUps.filter((f) => {
    if (f.status === 'completed' || f.status === 'cancelled') return false;
    const t = new Date(f.scheduled_at);
    return f.status === 'missed' || t < startOfToday;
  });

  const upcomingItems = followUps.filter((f) => {
    if (f.status === 'completed' || f.status === 'cancelled') return false;
    const t = new Date(f.scheduled_at);
    return t > endOfToday;
  });

  const currentList = (
    activeQueue === 'today'
      ? todayItems
      : activeQueue === 'missed'
      ? missedItems
      : activeQueue === 'upcoming'
      ? upcomingItems
      : followUps
  ).filter((f) => (typeFilter === 'all' ? true : f.follow_up_type === typeFilter));

  const handleExportMissedPdf = () => {
    try {
      downloadMissedFollowUpsPdf(missedItems);
      showToast('Generated Missed Follow-ups Scrum PDF Report');
    } catch {
      window.print();
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1360px] mx-auto w-full">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-2">
              <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
              <span>Module 4: Zero Overdue Task Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Proactive Follow-Up & Scrum Queues
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Time-sensitive client touchpoints segmented by Today, Missed, and Upcoming with 1-click completion.
            </p>
          </div>

          <button
            onClick={handleExportMissedPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#E10613] border border-red-200 text-xs font-bold transition-all shadow-xs"
          >
            <FileDown className="w-4 h-4 text-[#E10613]" />
            <span>Export Morning Scrum PDF ({missedItems.length} Missed)</span>
          </button>
        </div>

        {/* 3 Queue Segment Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Today */}
          <button
            onClick={() => setActiveQueue('today')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeQueue === 'today'
                ? 'bg-white border-[#E10613] ring-2 ring-red-100 shadow-md'
                : 'bg-white border-gray-200/90 hover:border-gray-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4" /> Today&apos;s Queue
              </span>
              <span className="text-2xl font-black text-gray-900">{todayItems.length}</span>
            </div>
            <p className="text-xs text-gray-500">Urgent touchpoints due today.</p>
          </button>

          {/* Missed */}
          <button
            onClick={() => setActiveQueue('missed')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeQueue === 'missed'
                ? 'bg-red-50/50 border-[#E10613] ring-2 ring-red-100 shadow-md'
                : 'bg-white border-gray-200/90 hover:border-gray-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#E10613] flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" /> Missed / Overdue
              </span>
              <span className="text-2xl font-black text-[#E10613]">{missedItems.length}</span>
            </div>
            <p className="text-xs text-gray-500">Requires rapid re-engagement or scrum review.</p>
          </button>

          {/* Upcoming */}
          <button
            onClick={() => setActiveQueue('upcoming')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeQueue === 'upcoming'
                ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-md'
                : 'bg-white border-gray-200/90 hover:border-gray-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-4 h-4" /> Upcoming 7 Days
              </span>
              <span className="text-2xl font-black text-gray-900">{upcomingItems.length}</span>
            </div>
            <p className="text-xs text-gray-500">Scheduled test drives and future callbacks.</p>
          </button>
        </div>

        {/* Filter Row */}
        <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Filter Action:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none font-medium"
            >
              <option value="all">All Action Types</option>
              {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-medium text-gray-500">
            Showing {currentList.length} items
          </span>
        </div>

        {/* Follow-up Queue Items */}
        <div className="space-y-3">
          {currentList.map((item) => {
            const isMissed = missedItems.some((m) => m.id === item.id);
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-white border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs ${
                  isMissed ? 'border-red-300 bg-red-50/20' : 'border-gray-200/90'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-extrabold text-sm text-gray-900">
                      {item.lead?.customer_name || 'Prospect Client'}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold uppercase">
                      {FOLLOW_UP_TYPE_LABELS[item.follow_up_type]}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.priority === 'high'
                          ? 'bg-red-50 text-[#E10613] border border-red-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                    {isMissed && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-[#E10613] font-bold uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed max-w-2xl font-medium">
                    {item.notes || 'Routine follow-up consultation.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Scheduled: {new Date(item.scheduled_at).toLocaleString('en-IN')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>RM: {item.employee?.name || 'Assigned Executive'}</span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  {item.lead?.phone && (
                    <>
                      <a
                        href={`tel:${item.lead.phone}`}
                        className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                        title={`Call ${item.lead.phone}`}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/91${item.lead.phone.slice(-10)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                        title="WhatsApp Client"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </>
                  )}

                  <Link
                    href={`/dashboard/crm/leads/${item.lead_id}`}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    View Lead
                  </Link>

                  <button
                    onClick={() => setCompletingItem(item)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete & Next</span>
                  </button>
                </div>
              </div>
            );
          })}

          {currentList.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-gray-200 text-gray-400 text-xs shadow-xs">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="font-bold text-sm text-gray-800">All Clear in this Queue!</p>
              <p className="text-gray-400">No pending follow-ups in the selected queue.</p>
            </div>
          )}
        </div>

      <CompleteFollowUpModal
        isOpen={!!completingItem}
        followUp={completingItem}
        onSuccess={() => {
          showToast('Follow-up completed and next action logged!');
          loadFollowUps();
        }}
        onClose={() => setCompletingItem(null)}
      />

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
