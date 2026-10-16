// src/app/employee/crm/page.tsx — Module 6: Mobile Executive Console (White & Red Theme)
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, Phone, MessageCircle, Clock, CheckCircle2, User,
  Plus, Calendar, Target, TrendingUp, Sparkles, AlertTriangle,
  ArrowRight, Search, Check, X, ShieldAlert
} from 'lucide-react';
import CRMNavbar from '@/components/CRMNavbar';
import AddLeadModal from '@/components/AddLeadModal';
import { crmService } from '@/lib/crm-service';
import { Lead, FollowUp, LEAD_STAGES, formatBudget, FOLLOW_UP_TYPE_LABELS } from '@/types/crm';
import { Employee } from '@/types/database';

export default function EmployeeConsolePage() {
  const [employeeId, setEmployeeId] = useState('emp-002');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // 15-Second Quick Log Modal
  const [quickLogItem, setQuickLogItem] = useState<FollowUp | null>(null);
  const [quickOutcome, setQuickOutcome] = useState('Customer called back — confirmed interest in test drive.');
  const [submittingQuickLog, setSubmittingQuickLog] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const emps = await crmService.getEmployees();
      const l = await crmService.getLeads();
      const fu = await crmService.getFollowUps();

      setEmployees(emps);
      setLeads(l);
      setFollowUps(fu);
      setEmployeeId(crmService.getCurrentEmployeeId());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSwitchEmployee = (newId: string) => {
    setEmployeeId(newId);
    crmService.setCurrentEmployeeId(newId);
    showToast(`Switched active console to: ${employees.find((e) => e.id === newId)?.name}`);
  };

  const activeEmp = employees.find((e) => e.id === employeeId) || employees[1];

  const myLeads = leads.filter((l) => l.assigned_to === employeeId || !l.assigned_to);
  const myTodayTasks = followUps.filter((f) => {
    if (f.status === 'completed' || f.status === 'cancelled') return false;
    return f.employee_id === employeeId || !f.employee_id;
  });

  const completedToday = followUps.filter((f) => f.employee_id === employeeId && f.status === 'completed').length;
  const targetTotal = 5;
  const targetPercent = Math.min(100, Math.round((completedToday / targetTotal) * 100));

  const handleRapidLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogItem) return;

    try {
      setSubmittingQuickLog(true);
      await crmService.completeAndScheduleNext(quickLogItem.id, quickOutcome);
      showToast('⚡ Quick log saved in 8 seconds!');
      setQuickLogItem(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving quick log');
    } finally {
      setSubmittingQuickLog(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col">
      <CRMNavbar onOpenAddLead={() => setIsAddLeadOpen(true)} />

      <main className="flex-1 max-w-lg mx-auto px-4 py-6 w-full">
        {/* Mobile Header Banner */}
        <div className="flex items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[#E10613] text-[11px] font-bold uppercase mb-1">
              <Smartphone className="w-3 h-3" />
              <span>Showroom Console</span>
            </div>
            <h1 className="text-xl font-black text-gray-900">RM Action Queue</h1>
          </div>

          <select
            value={employeeId}
            onChange={(e) => handleSwitchEmployee(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 font-semibold focus:outline-none"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Progress Card */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#E10613]" /> Daily Follow-up Goal
            </span>
            <span className="text-xs font-black text-[#E10613]">
              {completedToday} of {targetTotal} Completed ({targetPercent}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#E10613] to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${targetPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
            <span>Executive: {activeEmp?.name}</span>
            <span>{myLeads.length} Active Assigned Leads</span>
          </div>
        </div>

        {/* Rapid Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#E10613] hover:bg-[#c70511] text-white font-bold text-xs shadow-md shadow-red-200 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Walk-in Prospect</span>
          </button>

          <Link
            href="/dashboard/crm/leads"
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs border border-gray-200 shadow-xs active:scale-95 transition-all"
          >
            <span>Full 9-Stage Board</span>
            <ArrowRight className="w-4 h-4 text-[#E10613]" />
          </Link>
        </div>

        {/* Daily Queue Heading */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Today&apos;s Priority Queue ({myTodayTasks.length})</span>
          </h2>
          <span className="text-[10px] text-gray-400 font-semibold uppercase">15-Sec Quick Log</span>
        </div>

        {/* Task Cards */}
        <div className="space-y-3 mb-8">
          {myTodayTasks.map((task) => {
            const lead = leads.find((l) => l.id === task.lead_id);
            const isHigh = task.priority === 'high';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl bg-white border transition-all shadow-xs ${
                  isHigh ? 'border-red-200 bg-red-50/15' : 'border-gray-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">
                      {task.lead?.customer_name || 'Prospect Client'}
                    </h3>
                    <span className="text-[11px] text-gray-500 block font-medium">
                      {lead?.interested_car || 'Luxury Vehicle'} — {formatBudget(lead?.budget || 0)}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isHigh ? 'bg-red-50 text-[#E10613] border border-red-200' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {FOLLOW_UP_TYPE_LABELS[task.follow_up_type]}
                  </span>
                </div>

                <p className="text-xs text-gray-700 mb-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-medium">
                  {task.notes || 'Consultation touchpoint'}
                </p>

                {/* Big Touch Targets for Call & WhatsApp */}
                <div className="grid grid-cols-3 gap-2">
                  {lead?.phone ? (
                    <>
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/91${lead.phone.slice(-10)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  ) : (
                    <div className="col-span-2 text-xs text-gray-400 text-center py-2">No phone</div>
                  )}

                  <button
                    onClick={() => setQuickLogItem(task)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-200 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Log</span>
                  </button>
                </div>
              </div>
            );
          })}

          {myTodayTasks.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-gray-200 text-gray-400 text-xs shadow-xs">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-gray-800">Daily Queue Completed!</p>
              <p className="text-gray-400">No pending follow-ups assigned for today.</p>
            </div>
          )}
        </div>
      </main>

      {/* 15-Second Quick Log Modal (Light Mode) */}
      <AnimatePresence>
        {quickLogItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-5 text-gray-900 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">15-Second Rapid Call Log</h3>
                  <p className="text-[11px] text-gray-500">{quickLogItem.lead?.customer_name}</p>
                </div>
                <button onClick={() => setQuickLogItem(null)} className="text-gray-400 hover:text-gray-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRapidLogSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1 font-semibold">Select Common Outcome:</label>
                  <div className="space-y-1.5">
                    {[
                      'Spoke with client — highly interested, scheduled showroom visit.',
                      'Call placed — client in meeting, requested callback this evening.',
                      'Requirement confirmed — requested brochure and quotation on WhatsApp.',
                      'Left voicemail and followed up via automated WhatsApp greeting.',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuickOutcome(preset)}
                        className={`w-full text-left p-2.5 rounded-xl text-[11px] border transition-all ${
                          quickOutcome === preset
                            ? 'bg-red-50 border-red-300 text-[#E10613] font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-500 mb-1 font-semibold">Custom Note:</label>
                  <input
                    type="text"
                    value={quickOutcome}
                    onChange={(e) => setQuickOutcome(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-[#E10613]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickLogItem(null)}
                    className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingQuickLog}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50"
                  >
                    {submittingQuickLog ? 'Saving...' : 'Save in 1 Click'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onLeadAdded={() => loadData()}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold"
          >
            <div className="w-2 h-2 rounded-full bg-[#E10613]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
