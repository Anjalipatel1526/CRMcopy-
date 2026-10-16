// src/app/dashboard/crm/leads/[id]/page.tsx — Module 3: Lead Detail 360° Hub (White & Red Theme)
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, MessageCircle, Mail, MapPin, Briefcase, Car,
  Calendar, Clock, CheckCircle2, AlertTriangle, Plus,
  User, Award, FileText, Send, Sparkles, Activity
} from 'lucide-react';
import CRMNavbar from '@/components/CRMNavbar';
import ScheduleTestDriveModal from '@/components/ScheduleTestDriveModal';
import CompleteFollowUpModal from '@/components/CompleteFollowUpModal';
import LostReasonModal from '@/components/LostReasonModal';
import { crmService } from '@/lib/crm-service';
import {
  Lead, FollowUp, CustomerNote, TestDrive, Booking, CRMActivityLog,
  LEAD_STAGES, SOURCE_LABELS, formatBudget, FOLLOW_UP_TYPE_LABELS, LeadStatus
} from '@/types/crm';
import { timeAgo } from '@/lib/utils';

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activityLogs, setActivityLogs] = useState<CRMActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'timeline' | 'followups' | 'notes' | 'testdrives' | 'booking'>('timeline');

  // Input states
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // New follow up inputs
  const [fuType, setFuType] = useState<'call' | 'whatsapp' | 'sms' | 'meeting' | 'test_drive'>('call');
  const [fuDate, setFuDate] = useState('');
  const [fuNotes, setFuNotes] = useState('');
  const [fuPriority, setFuPriority] = useState<'high' | 'normal' | 'low'>('normal');

  // Booking inputs
  const [tokenAmount, setTokenAmount] = useState('1000000');
  const [totalDealAmount, setTotalDealAmount] = useState('13500000');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Modals
  const [isTestDriveModalOpen, setIsTestDriveModalOpen] = useState(false);
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadLeadHub = async () => {
    setLoading(true);
    try {
      const data = await crmService.getLeadById(leadId);
      setLead(data.lead);
      setFollowUps(data.followUps);
      setNotes(data.notes);
      setTestDrives(data.testDrives);
      setBookings(data.bookings);
      setActivityLogs(data.logs);

      if (data.lead?.budget) {
        setTotalDealAmount(String(data.lead.budget));
      }
    } catch (err) {
      console.error('Failed to load lead:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadHub();
  }, [leadId]);

  const handleStageChange = async (newStage: LeadStatus) => {
    if (!lead) return;
    if (newStage === 'lost') {
      setIsLostModalOpen(true);
      return;
    }
    if (newStage === 'test_drive_scheduled') {
      setIsTestDriveModalOpen(true);
      return;
    }

    try {
      const updated = await crmService.updateLeadStatus(lead.id, newStage);
      setLead(updated);
      showToast(`Stage updated to ${newStage.replace(/_/g, ' ').toUpperCase()}`);
      loadLeadHub();
    } catch (err: any) {
      alert(err.message || 'Error updating stage');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !lead) return;

    try {
      setSavingNote(true);
      await crmService.addNote(lead.id, newNoteText.trim());
      setNewNoteText('');
      showToast('Note added to timeline');
      loadLeadHub();
    } catch (err: any) {
      alert(err.message || 'Error saving note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuDate || !lead) return;

    try {
      await crmService.scheduleFollowUp({
        lead_id: lead.id,
        follow_up_type: fuType,
        scheduled_at: new Date(fuDate).toISOString(),
        notes: fuNotes || `${fuType.toUpperCase()} follow-up`,
        priority: fuPriority,
      });
      setFuNotes('');
      setFuDate('');
      showToast('Follow-up scheduled');
      loadLeadHub();
    } catch (err: any) {
      alert(err.message || 'Error scheduling follow-up');
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      await crmService.createBooking({
        lead_id: lead.id,
        car_id: 'car-001',
        car_name: lead.interested_car || 'Luxury Vehicle',
        booking_amount: parseInt(tokenAmount.replace(/\D/g, '')) || 0,
        total_amount: parseInt(totalDealAmount.replace(/\D/g, '')) || 0,
        expected_delivery: deliveryDate || undefined,
        notes: bookingNotes,
      });
      showToast('Deal advance booking recorded and vehicle reserved!');
      loadLeadHub();
    } catch (err: any) {
      alert(err.message || 'Error creating booking');
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#E10613] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Prospect Record Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">The lead ID {leadId} does not exist in the CRM database.</p>
        <Link
          href="/dashboard/crm/leads"
          className="px-4 py-2 rounded-xl bg-[#E10613] text-white text-xs font-semibold"
        >
          Return to Pipeline
        </Link>
      </div>
    );
  }

  const currentStageObj = LEAD_STAGES.find((s) => s.key === lead.lead_status);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/dashboard/crm/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to 9-Stage Pipeline</span>
          </Link>
        </div>

        {/* 360° Profile Header Card */}
        <div className="rounded-3xl bg-white border border-gray-200/90 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Customer Profile */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {lead.customer_name}
                </h1>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-bold capitalize">
                  {SOURCE_LABELS[lead.source] || lead.source}
                </span>
                {lead.wa_greeting_sent && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> WhatsApp Greeting Sent
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                <span className="flex items-center gap-1 font-mono font-bold text-gray-800">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>+91 {lead.phone}</span>
                </span>
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{lead.email}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{lead.city || 'Chennai'}, {lead.state || 'Tamil Nadu'}</span>
                </span>
                {lead.occupation && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span>{lead.occupation}</span>
                  </span>
                )}
              </div>

              {/* Vehicle & Target Budget */}
              <div className="flex flex-wrap items-center gap-6 pt-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Interested Vehicle</span>
                  <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-[#E10613]" />
                    {lead.interested_car || 'Luxury Vehicle'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Target Budget</span>
                  <span className="font-black text-[#E10613] text-sm">
                    {formatBudget(lead.budget)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Assigned RM</span>
                  <span className="font-bold text-gray-800">
                    {lead.assigned_employee?.name || 'Unassigned Executive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Triggers & Stage Dropdown */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Prospect</span>
                </a>

                <a
                  href={`https://wa.me/91${lead.phone.slice(-10)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Launch WhatsApp</span>
                </a>
              </div>

              {/* Stage Switcher */}
              <div className="w-full sm:w-auto">
                <label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold text-right">
                  Pipeline Stage
                </label>
                <select
                  value={lead.lead_status}
                  onChange={(e) => handleStageChange(e.target.value as LeadStatus)}
                  className="w-full sm:w-56 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
                >
                  {LEAD_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-[#E10613] text-[#E10613]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4 text-[#E10613]" />
            <span>Activity Timeline ({activityLogs.length + notes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'followups'
                ? 'border-[#E10613] text-[#E10613]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Follow-up Tasks ({followUps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-[#E10613] text-[#E10613]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Team Notes ({notes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('testdrives')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'testdrives'
                ? 'border-[#E10613] text-[#E10613]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Car className="w-4 h-4 text-purple-500" />
            <span>Test Drives ({testDrives.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'booking'
                ? 'border-[#E10613] text-[#E10613]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Booking & Financials ({bookings.length})</span>
          </button>
        </div>

        {/* Tab 1: Unified Activity Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 max-w-4xl">
            {/* Quick Note Input Box */}
            <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <label className="block text-xs font-bold text-gray-900 mb-2">
                Quick Log / Add Activity Note
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record customer conversation, requirement changes, or showroom visit notes..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#E10613] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={savingNote || !newNoteText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#E10613] hover:bg-[#c70511] text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>

            {/* Chronological Stream */}
            <div className="relative pl-6 border-l-2 border-gray-200 space-y-5 py-2">
              {activityLogs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#E10613] border-4 border-[#F8F9FA]" />
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 text-xs shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-gray-900 text-sm">{log.action}</span>
                      <span className="text-gray-400 text-[11px]">{timeAgo(log.created_at)}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{log.details}</p>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Logged by: {log.employee?.name || 'System CRM'}</span>
                      <span>{new Date(log.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}

              {notes.map((n) => (
                <div key={n.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-4 border-[#F8F9FA]" />
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 text-xs shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-blue-700">Customer Note</span>
                      <span className="text-gray-400 text-[11px]">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{n.note}</p>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Recorded by: {n.employee?.name || 'Executive'}</span>
                      <span>{new Date(n.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Follow-ups */}
        {activeTab === 'followups' && (
          <div className="space-y-6 max-w-4xl">
            {/* Schedule Follow-up Box */}
            <form onSubmit={handleScheduleFollowUp} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E10613]" />
                <span>Schedule New Follow-up Task</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Task Type</label>
                  <select
                    value={fuType}
                    onChange={(e) => setFuType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                  >
                    {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={fuDate}
                    onChange={(e) => setFuDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Priority</label>
                  <select
                    value={fuPriority}
                    onChange={(e) => setFuPriority(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Task Notes</label>
                <input
                  type="text"
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  placeholder="e.g. Call to discuss finance quotation and down payment terms"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-3">
              {followUps.map((fu) => (
                <div
                  key={fu.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-between text-xs gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm uppercase">
                        {FOLLOW_UP_TYPE_LABELS[fu.follow_up_type]}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          fu.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : fu.status === 'missed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {fu.status}
                      </span>
                    </div>
                    <p className="text-gray-700">{fu.notes}</p>
                    <span className="text-[11px] text-gray-400 block font-medium">
                      Scheduled for: {new Date(fu.scheduled_at).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {fu.status === 'pending' && (
                    <button
                      onClick={() => setCompletingFollowUp(fu)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs"
                    >
                      Complete & Next
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Customer Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-6 max-w-4xl">
            <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <label className="block text-xs font-bold text-gray-900">Add Team Note</label>
              <textarea
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Log internal sales notes, special requests, trade-in car condition..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:bg-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote || !newNoteText.trim()}
                  className="px-5 py-2 rounded-xl bg-[#E10613] hover:bg-[#c70511] text-white font-bold text-xs disabled:opacity-50"
                >
                  Save Note
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="p-4 rounded-2xl bg-white border border-gray-200 text-xs shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900">{n.employee?.name || 'Sales Desk'}</span>
                    <span className="text-gray-400 text-[10px]">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{n.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Test Drives */}
        {activeTab === 'testdrives' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-gray-900">Test Drive Records</h4>
                <p className="text-xs text-gray-500">Showroom and home test drive schedules with collision guard</p>
              </div>
              <button
                onClick={() => setIsTestDriveModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Test Drive</span>
              </button>
            </div>

            <div className="space-y-3">
              {testDrives.map((td) => (
                <div key={td.id} className="p-4 rounded-2xl bg-white border border-gray-200 text-xs space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">{td.car_name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        td.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {td.status}
                    </span>
                  </div>
                  <p className="text-gray-700">Location: {td.location || 'Showroom'}</p>
                  <p className="text-gray-400 text-[11px]">
                    Date: {new Date(td.scheduled_at).toLocaleString('en-IN')}
                  </p>
                  {td.customer_feedback && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                      Feedback: {td.customer_feedback} (Outcome: {td.result})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Booking & Financials */}
        {activeTab === 'booking' && (
          <div className="space-y-6 max-w-4xl">
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((bk) => (
                  <div key={bk.id} className="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">{bk.car_name}</span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase text-[11px]">
                        Payment: {bk.payment_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <span className="text-gray-500 block">Token Advance</span>
                        <span className="font-bold text-gray-900 text-sm">
                          ₹{bk.booking_amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Total Deal Amount</span>
                        <span className="font-bold text-gray-900 text-sm">
                          ₹{bk.total_amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Delivery Date</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {bk.expected_delivery || 'TBD'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">RTO / Finance</span>
                        <span className="font-bold text-emerald-700 text-sm capitalize">
                          {bk.finance_status} / {bk.rto_status}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 text-gray-700">
                      {bk.notes || 'Booking active. Vehicle inventory reserved.'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-xs">
                <h4 className="text-base font-bold text-gray-900">Record Booking & Token Advance</h4>
                <p className="text-xs text-gray-500">
                  Reserves vehicle in inventory and initiates delivery milestone checklist.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Token Advance Amount (INR)</label>
                    <input
                      type="text"
                      required
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      placeholder="10,00,000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Total Agreed Deal Amount (INR)</label>
                    <input
                      type="text"
                      required
                      value={totalDealAmount}
                      onChange={(e) => setTotalDealAmount(e.target.value)}
                      placeholder="1,35,00,000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Deal & Delivery Ceremony Notes</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Puja requested, champagne delivery ceremony, accessories installed..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                  >
                    Lock Booking & Reserve Vehicle
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      {/* Modals */}
      <ScheduleTestDriveModal
        isOpen={isTestDriveModalOpen}
        leadId={lead.id}
        leadName={lead.customer_name}
        interestedCarName={lead.interested_car}
        onConfirm={async (data) => {
          await crmService.scheduleTestDrive({
            lead_id: lead.id,
            car_id: data.car_id,
            car_name: data.car_name,
            scheduled_at: data.scheduled_at,
            location: data.location,
            notes: data.notes,
          });
          setIsTestDriveModalOpen(false);
          showToast('Test Drive scheduled successfully');
          loadLeadHub();
        }}
        onCancel={() => setIsTestDriveModalOpen(false)}
      />

      <LostReasonModal
        isOpen={isLostModalOpen}
        leadName={lead.customer_name}
        onConfirm={async (reason) => {
          await crmService.updateLeadStatus(lead.id, 'lost', { lost_reason: reason });
          setIsLostModalOpen(false);
          showToast('Lead marked as Lost');
          loadLeadHub();
        }}
        onCancel={() => setIsLostModalOpen(false)}
      />

      <CompleteFollowUpModal
        isOpen={!!completingFollowUp}
        followUp={completingFollowUp}
        onSuccess={() => {
          showToast('Follow-up marked completed');
          loadLeadHub();
        }}
        onClose={() => setCompletingFollowUp(null)}
      />

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
