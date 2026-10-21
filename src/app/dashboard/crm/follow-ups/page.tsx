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

const getFollowUpTypeBadge = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'call':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE', icon: Phone };
    case 'whatsapp':
      return { bg: '#ECFDF5', text: '#047857', border: '#D1FAE5', icon: MessageCircle };
    case 'visit':
      return { bg: '#FFFBEB', text: '#B45309', border: '#FEF3C7', icon: User };
    case 'test_drive':
      return { bg: '#FFF0F2', text: '#F5223B', border: '#FFE4E6', icon: CalendarClock };
    default:
      return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', icon: CalendarClock };
  }
};

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
    <div style={{ padding: '24px 28px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #EAEFF5',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          padding: '20px 24px',
          marginBottom: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#173B67', letterSpacing: '-0.5px', margin: 0 }}>
                Follow-Up & Scrum Queues
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: missedItems.length > 0 ? '#FFF0F2' : '#F0FDF4',
                  color: missedItems.length > 0 ? '#F5223B' : '#16A34A',
                  border: missedItems.length > 0 ? '1px solid rgba(245,34,59,0.2)' : '1px solid rgba(22,163,74,0.2)',
                }}
              >
                {missedItems.length > 0 ? `${missedItems.length} Overdue Missed` : 'All On Track'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#8298B8', marginTop: '4px', fontWeight: '500', margin: '4px 0 0 0' }}>
              Time-sensitive client touchpoints segmented by Today, Missed, and Upcoming with 1-click completion.
            </p>
          </div>

          {/* Export Morning Scrum PDF */}
          <button
            onClick={handleExportMissedPdf}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAEFF5',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '12px',
              color: '#173B67',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
            }}
            className="hover:bg-[#F5F8FC]"
          >
            <FileDown style={{ width: '15px', height: '15px', color: '#F5223B' }} />
            <span>Export Morning Scrum PDF ({missedItems.length} Missed)</span>
          </button>
        </div>
      </div>

      {/* 3 Queue Segment Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Today's Queue Card */}
        <button
          onClick={() => setActiveQueue('today')}
          style={{
            backgroundColor: activeQueue === 'today' ? '#FFFFFF' : '#FFFFFF',
            border: activeQueue === 'today' ? '2px solid #F5223B' : '1px solid #EAEFF5',
            borderRadius: '16px',
            padding: '18px 20px',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: activeQueue === 'today' ? '0 8px 24px rgba(245, 34, 59, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
          }}
          className="hover:border-[#F5223B]/60"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Clock style={{ width: '15px', height: '15px' }} />
              Today&apos;s Queue
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: '900',
                color: activeQueue === 'today' ? '#F5223B' : '#173B67',
                backgroundColor: '#FFFBEB',
                padding: '2px 10px',
                borderRadius: '9999px',
                border: '1px solid #FEF3C7',
              }}
            >
              {todayItems.length}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#8298B8', margin: 0, fontWeight: '500' }}>
            Urgent client touchpoints due today.
          </p>
        </button>

        {/* Missed / Overdue Card */}
        <button
          onClick={() => setActiveQueue('missed')}
          style={{
            backgroundColor: activeQueue === 'missed' ? '#FFF5F5' : '#FFFFFF',
            border: activeQueue === 'missed' ? '2px solid #F5223B' : '1px solid #FEE2E2',
            borderRadius: '16px',
            padding: '18px 20px',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: activeQueue === 'missed' ? '0 8px 24px rgba(245, 34, 59, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
          }}
          className="hover:border-[#F5223B]"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#F5223B', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <AlertTriangle style={{ width: '15px', height: '15px' }} />
              Missed / Overdue
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: '900',
                color: '#F5223B',
                backgroundColor: '#FFF0F2',
                padding: '2px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(245,34,59,0.2)',
              }}
            >
              {missedItems.length}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#8298B8', margin: 0, fontWeight: '500' }}>
            Requires rapid re-engagement or scrum review.
          </p>
        </button>

        {/* Upcoming Card */}
        <button
          onClick={() => setActiveQueue('upcoming')}
          style={{
            backgroundColor: activeQueue === 'upcoming' ? '#FFFFFF' : '#FFFFFF',
            border: activeQueue === 'upcoming' ? '2px solid #2563EB' : '1px solid #EAEFF5',
            borderRadius: '16px',
            padding: '18px 20px',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: activeQueue === 'upcoming' ? '0 8px 24px rgba(37, 99, 235, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
          }}
          className="hover:border-blue-400"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Calendar style={{ width: '15px', height: '15px' }} />
              Upcoming (7 Days)
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: '900',
                color: '#2563EB',
                backgroundColor: '#EFF6FF',
                padding: '2px 10px',
                borderRadius: '9999px',
                border: '1px solid #DBEAFE',
              }}
            >
              {upcomingItems.length}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#8298B8', margin: 0, fontWeight: '500' }}>
            Scheduled test drives and future callbacks.
          </p>
        </button>
      </div>

      {/* Filter Row */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #EAEFF5',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          padding: '12px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter style={{ width: '14px', height: '14px', color: '#8298B8' }} />
          <span style={{ fontSize: '12px', color: '#8298B8', fontWeight: '600' }}>Filter Action:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              backgroundColor: '#F5F8FC',
              border: '1px solid #EAEFF5',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#173B67',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Action Types</option>
            {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: '12px', fontWeight: '600', color: '#8298B8' }}>
          Showing <strong style={{ color: '#173B67' }}>{currentList.length}</strong> items
        </span>
      </div>

      {/* Follow-up Queue Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {currentList.map((item) => {
          const isMissed = missedItems.some((m) => m.id === item.id);
          const typeBadge = getFollowUpTypeBadge(item.follow_up_type);
          const TypeIcon = typeBadge.icon;

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: isMissed ? '1px solid #FCA5A5' : '1px solid #EAEFF5',
                borderLeft: isMissed ? '5px solid #F5223B' : '5px solid #10B981',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                padding: '18px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
              className="hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Tier 1: Client, Type Badge, Priority & Overdue */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <Link
                    href={`/dashboard/crm/leads/${item.lead_id}`}
                    style={{
                      fontSize: '15px',
                      fontWeight: '800',
                      color: '#173B67',
                      textDecoration: 'none',
                      transition: 'color 0.15s ease',
                    }}
                    className="hover:text-[#F5223B]"
                  >
                    {item.lead?.customer_name || 'Prospect Client'}
                  </Link>

                  {/* Type badge */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: typeBadge.bg,
                      color: typeBadge.text,
                      border: `1px solid ${typeBadge.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}
                  >
                    <TypeIcon style={{ width: '12px', height: '12px' }} />
                    {FOLLOW_UP_TYPE_LABELS[item.follow_up_type] || item.follow_up_type}
                  </span>

                  {/* Priority */}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: item.priority === 'high' ? '#FFF0F2' : '#F1F5F9',
                      color: item.priority === 'high' ? '#F5223B' : '#64748B',
                      border: item.priority === 'high' ? '1px solid rgba(245,34,59,0.2)' : '1px solid #E2E8F0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}
                  >
                    {item.priority} Priority
                  </span>

                  {/* Overdue */}
                  {isMissed && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      <AlertTriangle style={{ width: '11px', height: '11px' }} /> Overdue
                    </span>
                  )}
                </div>
              </div>

              {/* Tier 2: Notes / Requirements Box */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #F1F5F9',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#334155',
                  fontWeight: '500',
                  lineHeight: '1.5',
                }}
              >
                {item.notes || 'Routine follow-up consultation.'}
              </div>

              {/* Tier 3: Metadata (Scheduled & RM) on left, Action buttons on right */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '6px',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                {/* Metadata */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                    <Clock style={{ width: '14px', height: '14px', color: '#94A3B8' }} />
                    Scheduled: <strong style={{ color: '#1E293B', fontWeight: '600' }}>{new Date(item.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                  </span>

                  <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <User style={{ width: '11px', height: '11px', color: '#64748B' }} />
                    </div>
                    RM: <strong style={{ color: '#1E293B', fontWeight: '600' }}>{item.employee?.name || 'Assigned Executive'}</strong>
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.lead?.phone && (
                    <>
                      <a
                        href={`tel:${item.lead.phone}`}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
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
                        title={`Call ${item.lead.phone}`}
                      >
                        <Phone style={{ width: '14px', height: '14px' }} />
                      </a>

                      <a
                        href={`https://wa.me/91${item.lead.phone.slice(-10)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
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
                        <MessageCircle style={{ width: '14px', height: '14px' }} />
                      </a>
                    </>
                  )}

                  <Link
                    href={`/dashboard/crm/leads/${item.lead_id}`}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#173B67',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    className="hover:bg-gray-100"
                  >
                    View Lead
                  </Link>

                  <button
                    onClick={() => setCompletingItem(item)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(16,185,129,0.25)',
                      transition: 'all 0.15s ease',
                    }}
                    className="hover:bg-emerald-700 hover:scale-[1.02]"
                  >
                    <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                    <span>Complete & Next</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {currentList.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '2px dashed #E2E8F0',
              color: '#8298B8',
              fontSize: '13px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <CheckCircle2 style={{ width: '40px', height: '40px', margin: '0 auto 10px auto', color: '#10B981', opacity: 0.8 }} />
            <p style={{ fontWeight: '800', fontSize: '15px', color: '#173B67', margin: '0 0 4px 0' }}>All Clear in this Queue!</p>
            <p style={{ color: '#8298B8', margin: 0 }}>No pending follow-ups in the selected queue.</p>
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
