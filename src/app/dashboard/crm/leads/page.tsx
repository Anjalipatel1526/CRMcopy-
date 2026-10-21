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

const getSourceBadgeStyle = (source: string) => {
  switch (source?.toLowerCase()) {
    case 'website':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' };
    case 'instagram':
    case 'facebook':
    case 'social_media':
      return { bg: '#FDF2F8', text: '#BE185D', border: '#FCE7F3' };
    case 'walk_in':
      return { bg: '#ECFDF5', text: '#047857', border: '#D1FAE5' };
    case 'referral':
      return { bg: '#FFFBEB', text: '#B45309', border: '#FEF3C7' };
    default:
      return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
  }
};

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
    <div
      className="w-full min-w-0 flex flex-col overflow-x-hidden"
      style={{
        padding: '20px 24px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Control Bar - Clean 2-Tier Separated Card */}
      <div
        className="w-full min-w-0 flex flex-col"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #EAEFF5',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          padding: '18px 22px',
          marginBottom: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Tier 1: Title, Counter & Primary Action Buttons */}
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full"
          style={{
            paddingBottom: '14px',
            borderBottom: '1px solid #F0F4F8',
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#173B67] tracking-tight">Sales Pipeline</h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFF0F2',
                  color: '#F5223B',
                  border: '1px solid rgba(245,34,59,0.2)',
                }}
              >
                {leads.length} Leads
              </span>
            </div>
            <p className="text-xs text-[#8298B8] mt-0.5 font-medium">
              9-Stage consultative sales qualification workflow with drag-and-drop validation guards
            </p>
          </div>

          {/* Primary Action Buttons: Export PDF & New Lead */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            {/* PDF Export */}
            <button
              onClick={handleExportPdf}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAEFF5',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12px',
                color: '#173B67',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-[#F5F8FC]"
            >
              <FileDown style={{ width: '15px', height: '15px', color: '#F5223B' }} />
              <span>Export PDF</span>
            </button>

            {/* New Lead */}
            <button
              onClick={() => setIsAddLeadOpen(true)}
              style={{
                backgroundColor: '#F5223B',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '12px',
                color: '#FFFFFF',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(245,34,59,0.22)',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-[#E0142C] active:scale-95"
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              <span>New Lead</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Filters, Sorting & View Toggle */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 w-full"
          style={{ paddingTop: '14px' }}
        >
          {/* Left: Search Input + Stage Filter + Sort Order */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '10px',
                  width: '15px',
                  height: '15px',
                  color: '#8298B8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, car..."
                style={{
                  width: '100%',
                  backgroundColor: '#F5F8FC',
                  border: '1px solid #EAEFF5',
                  borderRadius: '12px',
                  paddingLeft: '34px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '12px',
                  color: '#173B67',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                }}
                className="focus:bg-white focus:border-[#F5223B]"
              />
            </div>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              style={{
                backgroundColor: '#F5F8FC',
                border: '1px solid #EAEFF5',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12px',
                color: '#173B67',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none',
              }}
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
              style={{
                backgroundColor: '#F5F8FC',
                border: '1px solid #EAEFF5',
                borderRadius: '12px',
                padding: '8px 10px',
                color: '#8298B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-[#EAEFF5] hover:text-[#173B67]"
              title="Toggle sort order"
            >
              <ArrowUpDown style={{ width: '15px', height: '15px' }} />
            </button>
          </div>

          {/* Right: Dual View Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '12px',
              backgroundColor: '#F5F8FC',
              border: '1px solid #EAEFF5',
            }}
            className="shrink-0"
          >
            <button
              onClick={() => setView('kanban')}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                backgroundColor: view === 'kanban' ? '#FFFFFF' : 'transparent',
                color: view === 'kanban' ? '#F5223B' : '#8298B8',
                boxShadow: view === 'kanban' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Kanban Board View"
            >
              <LayoutGrid style={{ width: '15px', height: '15px' }} />
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                backgroundColor: view === 'list' ? '#FFFFFF' : 'transparent',
                color: view === 'list' ? '#F5223B' : '#8298B8',
                boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Table List View"
            >
              <List style={{ width: '15px', height: '15px' }} />
            </button>
          </div>
        </div>
      </div>

        {/* View Mode 1: Kanban 9-Stage Board */}
        {view === 'kanban' ? (
          <div
            className="flex-1 w-full min-w-0"
            style={{
              overflowX: 'auto',
              paddingBottom: '24px',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '16px',
                minWidth: '2850px',
                minHeight: '650px',
                padding: '4px 2px 16px 2px',
                alignItems: 'flex-start',
              }}
            >
              {LEAD_STAGES.map((stage) => {
                const stageLeads = filteredLeads.filter((l) => l.lead_status === stage.key);
                const columnTotalBudget = stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
                const isOver = dragOverColumn === stage.key;

                return (
                  <div
                    key={stage.key}
                    onDragOver={(e) => handleDragOver(e, stage.key)}
                    onDrop={(e) => handleDrop(e, stage.key)}
                    style={{
                      width: '300px',
                      minWidth: '300px',
                      maxWidth: '300px',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '16px',
                      backgroundColor: isOver ? '#FFF5F5' : '#F8FAFC',
                      border: isOver ? '2px dashed #F5223B' : '1px solid #E2E8F0',
                      boxShadow: isOver ? '0 8px 24px rgba(245, 34, 59, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Column Header */}
                    <div
                      style={{
                        padding: '14px 16px',
                        backgroundColor: '#FFFFFF',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: stage.color,
                            boxShadow: `0 0 0 3px ${stage.color}25`,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#173B67', letterSpacing: '-0.2px' }}>
                          {stage.label}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          {stageLeads.length}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#8298B8' }}>
                        {formatBudget(columnTotalBudget)}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div
                      style={{
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        maxHeight: '750px',
                        overflowY: 'auto',
                        boxSizing: 'border-box',
                      }}
                    >
                      {stageLeads.map((lead) => {
                        const sourceBadge = getSourceBadgeStyle(lead.source);
                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={() => handleDragStart(lead.id)}
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '14px',
                              border: '1px solid #E2E8F0',
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                              padding: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              cursor: 'grab',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxSizing: 'border-box',
                            }}
                            className="hover:shadow-md hover:border-[#F5223B]/40 hover:-translate-y-0.5 active:cursor-grabbing"
                          >
                            {/* Card Top: Customer Name & Source Badge */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <Link
                                href={`/dashboard/crm/leads/${lead.id}`}
                                style={{
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: '#173B67',
                                  textDecoration: 'none',
                                  lineHeight: '1.3',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '175px',
                                  transition: 'color 0.15s ease',
                                }}
                                className="hover:text-[#F5223B]"
                              >
                                {lead.customer_name}
                              </Link>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  backgroundColor: sourceBadge.bg,
                                  color: sourceBadge.text,
                                  border: `1px solid ${sourceBadge.border}`,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.4px',
                                  flexShrink: 0,
                                }}
                              >
                                {SOURCE_LABELS[lead.source] || lead.source}
                              </span>
                            </div>

                            {/* Interested Car */}
                            {lead.interested_car && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '7px 10px',
                                  backgroundColor: '#F8FAFC',
                                  borderRadius: '8px',
                                  border: '1px solid #F1F5F9',
                                }}
                              >
                                <div
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '6px',
                                    backgroundColor: '#FFF0F2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Car style={{ width: '13px', height: '13px', color: '#F5223B' }} />
                                </div>
                                <span
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#1E293B',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {lead.interested_car}
                                </span>
                              </div>
                            )}

                            {/* Budget & Timeline */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '4px',
                                borderTop: '1px solid #F1F5F9',
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '10px', color: '#8298B8', fontWeight: '500', display: 'block' }}>
                                  Budget
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#173B67' }}>
                                  {formatBudget(lead.budget)}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '10px', color: '#8298B8', fontWeight: '500', display: 'block' }}>
                                  Timeline
                                </span>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#475569',
                                    backgroundColor: '#F1F5F9',
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    display: 'inline-block',
                                  }}
                                >
                                  {lead.purchase_timeline || 'Standard'}
                                </span>
                              </div>
                            </div>

                            {/* Lost Reason Notice */}
                            {lead.lead_status === 'lost' && lead.lost_reason && (
                              <div
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  backgroundColor: '#FEF2F2',
                                  border: '1px solid #FEE2E2',
                                  fontSize: '11px',
                                  color: '#B91C1C',
                                  fontWeight: '500',
                                }}
                              >
                                Reason: {lead.lost_reason}
                              </div>
                            )}

                            {/* Card Footer: RM & Triggers */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '8px',
                                borderTop: '1px solid #F1F5F9',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  minWidth: 0,
                                }}
                                title={`Assigned to ${lead.assigned_employee?.name || 'Unassigned'}`}
                              >
                                <div
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    backgroundColor: '#E2E8F0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <User style={{ width: '12px', height: '12px', color: '#64748B' }} />
                                </div>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#64748B',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '110px',
                                  }}
                                >
                                  {lead.assigned_employee?.name || 'Unassigned'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '7px',
                                    backgroundColor: '#EFF6FF',
                                    border: '1px solid #DBEAFE',
                                    color: '#2563EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none',
                                    transition: 'all 0.15s ease',
                                  }}
                                  className="hover:bg-blue-100 hover:scale-105"
                                  title={`Call ${lead.phone}`}
                                >
                                  <Phone style={{ width: '13px', height: '13px' }} />
                                </a>

                                <a
                                  href={`https://wa.me/91${lead.phone.slice(-10)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '7px',
                                    backgroundColor: '#ECFDF5',
                                    border: '1px solid #A7F3D0',
                                    color: '#059669',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none',
                                    transition: 'all 0.15s ease',
                                  }}
                                  className="hover:bg-emerald-100 hover:scale-105"
                                  title="WhatsApp Client"
                                >
                                  <MessageCircle style={{ width: '13px', height: '13px' }} />
                                </a>

                                <Link
                                  href={`/dashboard/crm/leads/${lead.id}`}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '7px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    color: '#64748B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none',
                                    transition: 'all 0.15s ease',
                                  }}
                                  className="hover:bg-gray-100 hover:text-gray-900"
                                  title="360° Lead Hub"
                                >
                                  <ChevronRight style={{ width: '14px', height: '14px' }} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {stageLeads.length === 0 && (
                        <div
                          style={{
                            height: '110px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed #CBD5E1',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            gap: '4px',
                            boxSizing: 'border-box',
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8' }}>
                            No leads in stage
                          </span>
                          <span style={{ fontSize: '10px', color: '#CBD5E1' }}>
                            Drag lead card here
                          </span>
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
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAEFF5',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', color: '#173B67', borderCollapse: 'collapse' }}>
                <thead
                  style={{
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    borderBottom: '1px solid #EAEFF5',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                  }}
                >
                  <tr>
                    <th style={{ padding: '14px 18px' }}>Client Name</th>
                    <th style={{ padding: '14px 18px' }}>Contact</th>
                    <th style={{ padding: '14px 18px' }}>Car & Brand</th>
                    <th style={{ padding: '14px 18px' }}>Budget</th>
                    <th style={{ padding: '14px 18px' }}>Current Stage</th>
                    <th style={{ padding: '14px 18px' }}>Source</th>
                    <th style={{ padding: '14px 18px' }}>Assigned RM</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const currentStageObj = LEAD_STAGES.find((s) => s.key === lead.lead_status);
                    const sourceBadge = getSourceBadgeStyle(lead.source);
                    return (
                      <tr
                        key={lead.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.15s ease',
                        }}
                        className="hover:bg-[#F8FAFC]"
                      >
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: '#173B67' }}>
                          <Link
                            href={`/dashboard/crm/leads/${lead.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                            className="hover:text-[#F5223B]"
                          >
                            {lead.customer_name}
                          </Link>
                          <span style={{ display: 'block', fontSize: '11px', color: '#8298B8', fontWeight: '400', marginTop: '2px' }}>
                            {lead.city || 'Chennai'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#1E293B' }}>{lead.phone}</span>
                          {lead.email && (
                            <span style={{ display: 'block', fontSize: '11px', color: '#8298B8', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {lead.email}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Car style={{ width: '14px', height: '14px', color: '#F5223B', flexShrink: 0 }} />
                            <span style={{ fontWeight: '700', color: '#173B67' }}>
                              {lead.interested_car || 'Luxury Vehicle'}
                            </span>
                          </div>
                          <span style={{ display: 'block', fontSize: '11px', color: '#8298B8', marginTop: '2px', paddingLeft: '20px' }}>
                            {lead.preferred_brand || 'Prestige'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: '800', color: '#173B67' }}>
                          {formatBudget(lead.budget)}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: `${currentStageObj?.color}15`,
                              color: currentStageObj?.color,
                              border: `1px solid ${currentStageObj?.color}30`,
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: currentStageObj?.color,
                              }}
                            />
                            {currentStageObj?.label || lead.lead_status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              backgroundColor: sourceBadge.bg,
                              color: sourceBadge.text,
                              border: `1px solid ${sourceBadge.border}`,
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                            }}
                          >
                            {SOURCE_LABELS[lead.source] || lead.source}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#64748B', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <User style={{ width: '11px', height: '11px', color: '#64748B' }} />
                            </div>
                            <span>{lead.assigned_employee?.name || 'Unassigned'}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <a
                              href={`tel:${lead.phone}`}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #DBEAFE',
                                color: '#2563EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                              }}
                              className="hover:bg-blue-100"
                              title="Call"
                            >
                              <Phone style={{ width: '13px', height: '13px' }} />
                            </a>
                            <a
                              href={`https://wa.me/91${lead.phone.slice(-10)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                backgroundColor: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                color: '#059669',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                              }}
                              className="hover:bg-emerald-100"
                              title="WhatsApp"
                            >
                              <MessageCircle style={{ width: '13px', height: '13px' }} />
                            </a>
                            <Link
                              href={`/dashboard/crm/leads/${lead.id}`}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                color: '#173B67',
                                fontWeight: '700',
                                fontSize: '11px',
                                textDecoration: 'none',
                              }}
                              className="hover:bg-gray-100"
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
