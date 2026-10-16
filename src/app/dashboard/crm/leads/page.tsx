// src/app/dashboard/crm/leads/page.tsx — Module 2: 9-Stage Visual Pipeline & Kanban Board (White & Red Theme)
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, LayoutGrid, List, Phone, MessageCircle,
  FileDown, Car, ChevronRight, User, AlertCircle, Clock,
  ArrowUpDown, CheckCircle2
} from 'lucide-react';
import CRMNavbar from '@/components/CRMNavbar';
import AddLeadModal from '@/components/AddLeadModal';
import LostReasonModal from '@/components/LostReasonModal';
import ScheduleTestDriveModal from '@/components/ScheduleTestDriveModal';
import { crmService } from '@/lib/crm-service';
import { Lead, LeadStatus, LEAD_STAGES, formatBudget, SOURCE_LABELS } from '@/types/crm';
import { downloadLeadsPdf } from '@/lib/pdf-utils';

export default function LeadsPipelinePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  // Guards state
  const [lostGuard, setLostGuard] = useState<{ leadId: string; leadName: string } | null>(null);
  const [testDriveGuard, setTestDriveGuard] = useState<{
    leadId: string;
    leadName: string;
    interestedCar?: string | null;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmService.getLeads();
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('action') === 'add') {
        setIsAddLeadOpen(true);
      }
    }
  }, []);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((l) => {
        if (selectedStage !== 'all' && l.lead_status !== selectedStage) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          l.customer_name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.interested_car && l.interested_car.toLowerCase().includes(q)) ||
          (l.preferred_brand && l.preferred_brand.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [leads, search, selectedStage, sortOrder]);

  const handleDragStart = (leadId: string) => {
    setDraggingLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: LeadStatus) => {
    e.preventDefault();
    if (dragOverColumn !== stageKey) {
      setDragOverColumn(stageKey);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggingLeadId) return;

    const leadToMove = leads.find((l) => l.id === draggingLeadId);
    if (!leadToMove || leadToMove.lead_status === targetStage) {
      setDraggingLeadId(null);
      return;
    }

    if (targetStage === 'lost') {
      setLostGuard({
        leadId: leadToMove.id,
        leadName: leadToMove.customer_name,
      });
      return;
    }

    if (targetStage === 'test_drive_scheduled') {
      setTestDriveGuard({
        leadId: leadToMove.id,
        leadName: leadToMove.customer_name,
        interestedCar: leadToMove.interested_car,
      });
      return;
    }

    try {
      const updated = await crmService.updateLeadStatus(leadToMove.id, targetStage);
      setLeads((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      );
      showToast(`Moved ${leadToMove.customer_name} to ${targetStage.replace(/_/g, ' ').toUpperCase()}`);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setDraggingLeadId(null);
    }
  };

  const handleConfirmLost = async (reason: string) => {
    if (!lostGuard) return;
    try {
      const updated = await crmService.updateLeadStatus(lostGuard.leadId, 'lost', { lost_reason: reason });
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showToast(`Marked ${lostGuard.leadName} as Lost`);
    } catch (err: any) {
      alert(err.message || 'Error saving lost status');
    } finally {
      setLostGuard(null);
      setDraggingLeadId(null);
    }
  };

  const handleConfirmTestDrive = async (data: {
    car_id: string;
    car_name: string;
    scheduled_at: string;
    location?: string;
    notes?: string;
  }) => {
    if (!testDriveGuard) return;
    try {
      const updated = await crmService.updateLeadStatus(testDriveGuard.leadId, 'test_drive_scheduled', {
        test_drive: data,
      });
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showToast(`Scheduled Test Drive for ${testDriveGuard.leadName}`);
    } catch (err: any) {
      alert(err.message || 'Error scheduling test drive');
    } finally {
      setTestDriveGuard(null);
      setDraggingLeadId(null);
    }
  };

  const handleExportPdf = () => {
    try {
      downloadLeadsPdf(filteredLeads, selectedStage, search);
      showToast('Generated luxury PDF lead report');
    } catch {
      window.print();
    }
  };
  return (
    <div className="p-6 sm:p-8 max-w-[1360px] mx-auto w-full flex flex-col">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Sales Pipeline</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-[#E10613] font-bold border border-red-200">
                {leads.length} Leads
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              9-Stage consultative sales qualification workflow with drag-and-drop validation guards
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, car..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none font-medium"
            >
              <option value="all">All 9 Stages</option>
              {LEAD_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              title="Toggle sort order"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* PDF Export */}
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors"
            >
              <FileDown className="w-4 h-4 text-[#E10613]" />
              <span>Export PDF</span>
            </button>

            {/* Dual View Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-gray-100 border border-gray-200">
              <button
                onClick={() => setView('kanban')}
                className={`p-1.5 rounded-lg transition-all ${
                  view === 'kanban' ? 'bg-white text-[#E10613] shadow-xs font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  view === 'list' ? 'bg-white text-[#E10613] shadow-xs font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* New Lead */}
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E10613] hover:bg-[#c70511] text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Kanban 9-Stage Board */}
        {view === 'kanban' ? (
          <div className="flex-1 overflow-x-auto pb-6">
            <div className="flex gap-4 min-w-[2150px] min-h-[650px]">
              {LEAD_STAGES.map((stage) => {
                const stageLeads = filteredLeads.filter((l) => l.lead_status === stage.key);
                const columnTotalBudget = stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
                const isOver = dragOverColumn === stage.key;

                return (
                  <div
                    key={stage.key}
                    onDragOver={(e) => handleDragOver(e, stage.key)}
                    onDrop={(e) => handleDrop(e, stage.key)}
                    className={`w-[275px] shrink-0 flex flex-col rounded-2xl bg-[#F4F5F7] border transition-all ${
                      isOver ? 'border-[#E10613] bg-red-50/40 ring-2 ring-red-200' : 'border-gray-200/80 shadow-xs'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="p-3.5 border-b border-gray-200/80 bg-white rounded-t-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-bold text-xs text-gray-900">{stage.label}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 font-bold text-gray-700">
                          {stageLeads.length}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-500">
                        {formatBudget(columnTotalBudget)}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 max-h-[750px]">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => handleDragStart(lead.id)}
                          className="group rounded-xl bg-white hover:bg-gray-50/50 border border-gray-200/90 hover:border-red-300 p-3.5 transition-all shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing"
                        >
                          {/* Card Top */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Link
                              href={`/dashboard/crm/leads/${lead.id}`}
                              className="font-bold text-xs text-gray-900 hover:text-[#E10613] transition-colors line-clamp-1"
                            >
                              {lead.customer_name}
                            </Link>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0 font-medium capitalize">
                              {SOURCE_LABELS[lead.source] || lead.source}
                            </span>
                          </div>

                          {/* Interested Car */}
                          {lead.interested_car && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-800 font-semibold mb-2 line-clamp-1">
                              <Car className="w-3.5 h-3.5 text-[#E10613] shrink-0" />
                              <span>{lead.interested_car}</span>
                            </div>
                          )}

                          {/* Budget & Timeline */}
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-2.5 pt-2 border-t border-gray-100">
                            <span className="font-extrabold text-gray-900">
                              {formatBudget(lead.budget)}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {lead.purchase_timeline || 'Standard'}
                            </span>
                          </div>

                          {/* Lost Reason Notice */}
                          {lead.lead_status === 'lost' && lead.lost_reason && (
                            <div className="mb-2 p-1.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 font-medium line-clamp-2">
                              Reason: {lead.lost_reason}
                            </div>
                          )}

                          {/* Card Footer: RM & Triggers */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="line-clamp-1 max-w-[85px]">
                                {lead.assigned_employee?.name || 'Unassigned'}
                              </span>
                            </span>

                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                title={`Call ${lead.phone}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>

                              <a
                                href={`https://wa.me/91${lead.phone.slice(-10)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                                title="WhatsApp Client"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>

                              <Link
                                href={`/dashboard/crm/leads/${lead.id}`}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                title="360° Lead Hub"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                          <span className="font-medium">No leads in stage</span>
                          <span className="text-[10px] text-gray-400">Drag lead card here</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* View Mode 2: Table List View */
          <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-900">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Client Name</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Car & Brand</th>
                    <th className="py-3.5 px-4">Budget</th>
                    <th className="py-3.5 px-4">Current Stage</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Assigned RM</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredLeads.map((lead) => {
                    const currentStageObj = LEAD_STAGES.find((s) => s.key === lead.lead_status);
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          <Link
                            href={`/dashboard/crm/leads/${lead.id}`}
                            className="hover:text-[#E10613] transition-colors"
                          >
                            {lead.customer_name}
                          </Link>
                          <span className="block text-[11px] text-gray-400 font-normal">
                            {lead.city || 'Chennai'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-semibold text-gray-800">{lead.phone}</span>
                          {lead.email && (
                            <span className="block text-[11px] text-gray-400 truncate max-w-[150px]">
                              {lead.email}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900">
                            {lead.interested_car || 'Luxury Vehicle'}
                          </span>
                          <span className="block text-[11px] text-gray-400">
                            {lead.preferred_brand || 'Prestige'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-gray-900">
                          {formatBudget(lead.budget)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{
                              backgroundColor: `${currentStageObj?.color}15`,
                              color: currentStageObj?.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: currentStageObj?.color }}
                            />
                            {currentStageObj?.label || lead.lead_status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 capitalize text-gray-600">
                          {SOURCE_LABELS[lead.source] || lead.source}
                        </td>

                        <td className="py-3.5 px-4 text-gray-700">
                          {lead.assigned_employee?.name || 'Unassigned'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/91${lead.phone.slice(-10)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <Link
                              href={`/dashboard/crm/leads/${lead.id}`}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors"
                            >
                              View Hub
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onLeadAdded={() => loadLeads()}
      />

      <LostReasonModal
        isOpen={!!lostGuard}
        leadName={lostGuard?.leadName || ''}
        onConfirm={handleConfirmLost}
        onCancel={() => {
          setLostGuard(null);
          setDraggingLeadId(null);
        }}
      />

      <ScheduleTestDriveModal
        isOpen={!!testDriveGuard}
        leadId={testDriveGuard?.leadId || ''}
        leadName={testDriveGuard?.leadName || ''}
        interestedCarName={testDriveGuard?.interestedCar}
        onConfirm={handleConfirmTestDrive}
        onCancel={() => {
          setTestDriveGuard(null);
          setDraggingLeadId(null);
        }}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#E10613]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
