// src/app/dashboard/crm/leads/[id]/page.tsx — Luxury Lead Detail 360° Profile Hub
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, MessageCircle, Mail, MapPin, Briefcase, Car,
  Calendar, Clock, CheckCircle2, AlertTriangle, Plus,
  User, Award, FileText, Send, Sparkles, Activity, ShieldAlert,
  ChevronRight, ExternalLink
} from 'lucide-react';
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
      showToast('Follow-up task scheduled successfully');
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
      <div style={{ padding: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #F5223B', borderTopColor: 'transparent' }} className="animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ maxWidth: '600px', margin: '64px auto', textAlign: 'center', padding: '32px' }}>
        <AlertTriangle style={{ width: '48px', height: '48px', color: '#D97706', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#173B67' }}>Prospect Record Not Found</h2>
        <p style={{ fontSize: '13px', color: '#8298B8', margin: '8px 0 24px' }}>
          The lead ID {leadId} does not exist in the CRM database.
        </p>
        <Link
          href="/dashboard/crm/leads"
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: '#F5223B',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: '700',
            textDecoration: 'none',
          }}
        >
          Return to Pipeline
        </Link>
      </div>
    );
  }

  const currentStageObj = LEAD_STAGES.find((s) => s.key === lead.lead_status);
  const initials = lead.customer_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '24px',
              zIndex: 9999,
              backgroundColor: '#173B67',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 8px 24px rgba(23, 59, 103, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 style={{ width: '15px', height: '15px', color: '#10B981' }} />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Ribbon: Back Link & Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <Link
          href="/dashboard/crm/leads"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#173B67',
            textDecoration: 'none',
            backgroundColor: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid #EAEFF5',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
          }}
          className="hover:bg-[#F8FAFC]"
        >
          <ArrowLeft style={{ width: '14px', height: '14px', color: '#F5223B' }} />
          <span>Back to 9-Stage Pipeline</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8298B8', fontWeight: '600' }}>
          <Link href="/dashboard/crm/leads" style={{ color: '#8298B8', textDecoration: 'none' }} className="hover:text-[#173B67]">
            Pipeline
          </Link>
          <span>/</span>
          <Link href="/dashboard/crm/customer-details" style={{ color: '#8298B8', textDecoration: 'none' }} className="hover:text-[#173B67]">
            Prospects
          </Link>
          <span>/</span>
          <strong style={{ color: '#173B67' }}>{lead.customer_name}</strong>
        </div>
      </div>

      {/* Customer Master Header Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #EAEFF5',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          padding: '22px 26px',
          marginBottom: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Tier 1: Customer Identity, Badges, Direct Actions & Pipeline Stage */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '18px',
            borderBottom: '1px solid #F0F4F8',
          }}
        >
          {/* Identity & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                backgroundColor: '#FFF0F2',
                border: '1px solid rgba(245,34,59,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '900',
                color: '#F5223B',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#173B67', letterSpacing: '-0.5px', margin: 0 }}>
                  {lead.customer_name}
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #DBEAFE',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {SOURCE_LABELS[lead.source] || lead.source} Inbound
                </span>
                {lead.wa_greeting_sent && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                    WhatsApp Greeting Sent
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#8298B8', margin: '4px 0 0 0', fontWeight: '500' }}>
                Lead ID: <strong style={{ color: '#475569' }}>{lead.id}</strong> • Ingestion: {timeAgo(lead.created_at)}
              </p>
            </div>
          </div>

          {/* Action Buttons & Stage Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={`tel:${lead.phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
                color: '#2563EB',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-blue-100 hover:scale-102"
              title="Call Prospect"
            >
              <Phone style={{ width: '14px', height: '14px' }} />
              <span>Call Prospect</span>
            </a>

            <a
              href={`https://wa.me/91${lead.phone.replace(/\D/g, '').slice(-10)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-emerald-100 hover:scale-102"
              title="Launch WhatsApp Chat"
            >
              <MessageCircle style={{ width: '14px', height: '14px' }} />
              <span>Launch WhatsApp</span>
            </a>

            {/* Pipeline Stage Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #EAEFF5',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: currentStageObj?.color || '#F5223B',
                }}
              />
              <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '700', textTransform: 'uppercase' }}>
                Stage:
              </span>
              <select
                value={lead.lead_status}
                onChange={(e) => handleStageChange(e.target.value as LeadStatus)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: '#173B67',
                  cursor: 'pointer',
                  outline: 'none',
                }}
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

        {/* Tier 2: 4 Aligned Customer Dossier Metric Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            paddingTop: '18px',
          }}
        >
          {/* Col 1: Contact Details */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #EAEFF5',
              padding: '12px 16px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#8298B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
              Contact Details
            </span>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: '800', color: '#173B67', fontSize: '14px' }}>
              +91 {lead.phone}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={lead.email || ''}>
              {lead.email || 'No email registered'}
            </div>
            <div style={{ fontSize: '11px', color: '#8298B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
              <span>{lead.city || 'Chennai'}, {lead.state || 'Tamil Nadu'}</span>
            </div>
          </div>

          {/* Col 2: Vehicle Preference */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #EAEFF5',
              padding: '12px 16px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#8298B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
              Interested Vehicle
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Car style={{ width: '15px', height: '15px', color: '#F5223B', flexShrink: 0 }} />
              <strong style={{ fontSize: '14px', fontWeight: '800', color: '#173B67', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lead.interested_car || 'Luxury Vehicle'}
              </strong>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', paddingLeft: '21px' }}>
              {lead.preferred_brand || 'Luxury Segment'}
            </div>
            <div style={{ fontSize: '11px', color: '#8298B8', marginTop: '2px', paddingLeft: '21px' }}>
              Occ: {lead.occupation || 'Executive / Business'}
            </div>
          </div>

          {/* Col 3: Target Budget & Timeline */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #EAEFF5',
              padding: '12px 16px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#8298B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
              Target Budget & Timeline
            </span>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#F5223B' }}>
              {formatBudget(lead.budget)}
            </div>
            <div style={{ marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#475569',
                  backgroundColor: '#EAEFF5',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                }}
              >
                Timeline: {lead.purchase_timeline || 'Within 1 week'}
              </span>
            </div>
          </div>

          {/* Col 4: Assigned RM */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #EAEFF5',
              padding: '12px 16px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#8298B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
              Assigned RM
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User style={{ width: '15px', height: '15px', color: '#173B67' }} />
              <strong style={{ fontSize: '14px', fontWeight: '800', color: '#173B67' }}>
                {lead.assigned_employee?.name || 'Unassigned Executive'}
              </strong>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', paddingLeft: '21px' }}>
              ID: {lead.assigned_employee?.employee_id || 'AB1002'} • Senior RM
            </div>
            <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px', paddingLeft: '21px', fontWeight: '600' }}>
              Dedicated Client Manager
            </div>
          </div>
        </div>
      </div>

      {/* Action Tabs Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #EAEFF5',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          padding: '6px 10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'timeline' ? '1px solid rgba(245,34,59,0.2)' : '1px solid transparent',
            backgroundColor: activeTab === 'timeline' ? '#FFF0F2' : 'transparent',
            color: activeTab === 'timeline' ? '#F5223B' : '#64748B',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
          className="hover:text-[#173B67]"
        >
          <Activity style={{ width: '15px', height: '15px', color: activeTab === 'timeline' ? '#F5223B' : '#8298B8' }} />
          <span>Activity Timeline ({activityLogs.length + notes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('followups')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'followups' ? '1px solid rgba(245,34,59,0.2)' : '1px solid transparent',
            backgroundColor: activeTab === 'followups' ? '#FFF0F2' : 'transparent',
            color: activeTab === 'followups' ? '#F5223B' : '#64748B',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
          className="hover:text-[#173B67]"
        >
          <Calendar style={{ width: '15px', height: '15px', color: activeTab === 'followups' ? '#F5223B' : '#D97706' }} />
          <span>Follow-up Tasks ({followUps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'notes' ? '1px solid rgba(245,34,59,0.2)' : '1px solid transparent',
            backgroundColor: activeTab === 'notes' ? '#FFF0F2' : 'transparent',
            color: activeTab === 'notes' ? '#F5223B' : '#64748B',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
          className="hover:text-[#173B67]"
        >
          <FileText style={{ width: '15px', height: '15px', color: activeTab === 'notes' ? '#F5223B' : '#6366F1' }} />
          <span>Team Notes ({notes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('testdrives')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'testdrives' ? '1px solid rgba(245,34,59,0.2)' : '1px solid transparent',
            backgroundColor: activeTab === 'testdrives' ? '#FFF0F2' : 'transparent',
            color: activeTab === 'testdrives' ? '#F5223B' : '#64748B',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
          className="hover:text-[#173B67]"
        >
          <Car style={{ width: '15px', height: '15px', color: activeTab === 'testdrives' ? '#F5223B' : '#7C3AED' }} />
          <span>Test Drives ({testDrives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('booking')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'booking' ? '1px solid rgba(245,34,59,0.2)' : '1px solid transparent',
            backgroundColor: activeTab === 'booking' ? '#FFF0F2' : 'transparent',
            color: activeTab === 'booking' ? '#F5223B' : '#64748B',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
          className="hover:text-[#173B67]"
        >
          <Award style={{ width: '15px', height: '15px', color: activeTab === 'booking' ? '#F5223B' : '#059669' }} />
          <span>Booking & Financials ({bookings.length})</span>
        </button>
      </div>

      {/* 2-Column Responsive Workspace: Active Tab Content (70%) + Quick Action & Dossier Panel (30%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '20px',
          alignItems: 'start',
        }}
        className="grid-cols-1 lg:grid-cols-[1fr_340px]"
      >
        {/* Left Column: Tab Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* TAB 1: Unified Activity Timeline */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Log Input Box */}
              <form
                onSubmit={handleAddNote}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EAEFF5',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  padding: '16px 20px',
                  boxSizing: 'border-box',
                }}
              >
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#173B67', marginBottom: '8px' }}>
                  Quick Log / Add Activity Note
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Record customer conversation, requirement changes, or showroom visit notes..."
                    style={{
                      flex: 1,
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #EAEFF5',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '12px',
                      color: '#173B67',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNoteText.trim()}
                    style={{
                      backgroundColor: '#F5223B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(245,34,59,0.22)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      opacity: savingNote || !newNoteText.trim() ? 0.6 : 1,
                    }}
                    className="hover:bg-[#E0142C]"
                  >
                    {savingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </form>

              {/* Chronological Stream */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EAEFF5',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#173B67', margin: 0, paddingBottom: '10px', borderBottom: '1px solid #F0F4F8' }}>
                  Chronological Timeline History
                </h3>

                {activityLogs.length === 0 && notes.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#8298B8', fontSize: '12px' }}>
                    No recorded activities yet. Use the log box above to record conversations.
                  </div>
                )}

                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px solid #EAEFF5',
                      padding: '14px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F5223B' }} />
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#173B67' }}>{log.action}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '500' }}>
                        {timeAgo(log.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                      {log.details}
                    </p>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #EAEFF5', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8' }}>
                      <span>Logged by: <strong style={{ color: '#64748B' }}>{log.employee?.name || 'System CRM'}</strong></span>
                      <span>{new Date(log.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}

                {notes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      backgroundColor: '#EFF6FF',
                      borderRadius: '12px',
                      border: '1px solid #DBEAFE',
                      padding: '14px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1D4ED8' }}>Customer Note</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '500' }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#1E293B', margin: '4px 0 0 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {n.note}
                    </p>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #DBEAFE', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                      <span>Recorded by: <strong style={{ color: '#1E293B' }}>{n.employee?.name || 'Executive'}</strong></span>
                      <span>{new Date(n.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Follow-up Tasks */}
          {activeTab === 'followups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Schedule Follow-up Form */}
              <form
                onSubmit={handleScheduleFollowUp}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EAEFF5',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus style={{ width: '16px', height: '16px', color: '#F5223B' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#173B67', margin: 0 }}>
                    Schedule New Follow-up Task
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                      Task Type
                    </label>
                    <select
                      value={fuType}
                      onChange={(e) => setFuType(e.target.value as any)}
                      style={{
                        width: '100%',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #EAEFF5',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#173B67',
                        fontWeight: '600',
                        outline: 'none',
                      }}
                    >
                      {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={fuDate}
                      onChange={(e) => setFuDate(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #EAEFF5',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#173B67',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                      Priority
                    </label>
                    <select
                      value={fuPriority}
                      onChange={(e) => setFuPriority(e.target.value as any)}
                      style={{
                        width: '100%',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #EAEFF5',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#173B67',
                        fontWeight: '600',
                        outline: 'none',
                      }}
                    >
                      <option value="high">High Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                    Task Notes & Objectives
                  </label>
                  <input
                    type="text"
                    value={fuNotes}
                    onChange={(e) => setFuNotes(e.target.value)}
                    placeholder="e.g. Call to discuss finance quotation, down payment terms, and trade-in evaluation"
                    style={{
                      width: '100%',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #EAEFF5',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#173B67',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    className="hover:bg-amber-700"
                  >
                    Schedule Follow-up
                  </button>
                </div>
              </form>

              {/* Tasks List */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EAEFF5',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#173B67', margin: 0, paddingBottom: '10px', borderBottom: '1px solid #F0F4F8' }}>
                  Scheduled Tasks ({followUps.length})
                </h4>

                {followUps.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#8298B8', fontSize: '12px' }}>
                    No pending follow-ups scheduled for this client.
                  </div>
                )}

                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px solid #EAEFF5',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#173B67' }}>
                          {FOLLOW_UP_TYPE_LABELS[fu.follow_up_type] || fu.follow_up_type}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            backgroundColor:
                              fu.status === 'completed' ? '#ECFDF5' : fu.status === 'missed' ? '#FFF0F2' : '#FEF3C7',
                            color:
                              fu.status === 'completed' ? '#059669' : fu.status === 'missed' ? '#F5223B' : '#B45309',
                            border: `1px solid ${
                              fu.status === 'completed' ? '#A7F3D0' : fu.status === 'missed' ? 'rgba(245,34,59,0.2)' : '#FDE68A'
                            }`,
                          }}
                        >
                          {fu.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0 4px 0' }}>{fu.notes}</p>
                      <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '500' }}>
                        Scheduled for: <strong style={{ color: '#173B67' }}>{new Date(fu.scheduled_at).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>

                    {fu.status === 'pending' && (
                      <button
                        onClick={() => setCompletingFollowUp(fu)}
                        style={{
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                        className="hover:bg-emerald-700"
                      >
                        Complete & Next
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Team Notes */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <form
                onSubmit={handleAddNote}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EAEFF5',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#173B67' }}>
                  Add Internal Team Note
                </label>
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Log internal sales notes, negotiation specifics, special requests, trade-in condition..."
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #EAEFF5',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '12px',
                    color: '#173B67',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={savingNote || !newNoteText.trim()}
                    style={{
                      backgroundColor: '#F5223B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      opacity: savingNote || !newNoteText.trim() ? 0.6 : 1,
                    }}
                    className="hover:bg-[#E0142C]"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EAEFF5',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#173B67', margin: 0, paddingBottom: '10px', borderBottom: '1px solid #F0F4F8' }}>
                  Team Notes History ({notes.length})
                </h4>

                {notes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px solid #EAEFF5',
                      padding: '14px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px', color: '#173B67' }}>{n.employee?.name || 'Sales Desk'}</strong>
                      <span style={{ fontSize: '11px', color: '#8298B8' }}>{timeAgo(n.created_at)}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {n.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Test Drives */}
          {activeTab === 'testdrives' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EAEFF5',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#173B67', margin: 0 }}>
                      Test Drive Demonstrations
                    </h4>
                    <p style={{ fontSize: '12px', color: '#8298B8', margin: '2px 0 0 0' }}>
                      Track showroom and doorstep test drives with vehicle collision guards
                    </p>
                  </div>
                  <button
                    onClick={() => setIsTestDriveModalOpen(true)}
                    style={{
                      backgroundColor: '#7C3AED',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    className="hover:bg-purple-700"
                  >
                    <Plus style={{ width: '14px', height: '14px' }} />
                    <span>Schedule Test Drive</span>
                  </button>
                </div>

                {testDrives.length === 0 && (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#8298B8', fontSize: '13px' }}>
                    No test drive scheduled yet. Click &quot;Schedule Test Drive&quot; to book a vehicle.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {testDrives.map((td) => (
                    <div
                      key={td.id}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: '12px',
                        border: '1px solid #EAEFF5',
                        padding: '16px 20px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#173B67' }}>{td.car_name}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            backgroundColor: td.status === 'completed' ? '#ECFDF5' : '#F5F3FF',
                            color: td.status === 'completed' ? '#059669' : '#7C3AED',
                            border: `1px solid ${td.status === 'completed' ? '#A7F3D0' : '#DDD6FE'}`,
                          }}
                        >
                          {td.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        Location: <strong style={{ color: '#173B67' }}>{td.location || 'Flagship Showroom'}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#8298B8', marginTop: '2px' }}>
                        Scheduled: {new Date(td.scheduled_at).toLocaleString('en-IN')}
                      </div>
                      {td.customer_feedback && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            fontSize: '12px',
                            color: '#065F46',
                          }}
                        >
                          Feedback: &quot;{td.customer_feedback}&quot; (Outcome: {td.result})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Booking & Financials */}
          {activeTab === 'booking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {bookings.map((bk) => (
                    <div
                      key={bk.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid #EAEFF5',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        padding: '22px 24px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#173B67' }}>{bk.car_name}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            textTransform: 'uppercase',
                          }}
                        >
                          Payment: {bk.payment_status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: '12px',
                          padding: '14px',
                          borderRadius: '12px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #EAEFF5',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '10px', color: '#8298B8', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                            Token Advance
                          </span>
                          <strong style={{ fontSize: '15px', color: '#173B67' }}>
                            ₹{bk.booking_amount?.toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#8298B8', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                            Total Deal Amount
                          </span>
                          <strong style={{ fontSize: '15px', color: '#F5223B' }}>
                            ₹{bk.total_amount?.toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#8298B8', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                            Expected Delivery
                          </span>
                          <strong style={{ fontSize: '14px', color: '#173B67' }}>
                            {bk.expected_delivery || 'Within 7 Days'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#8298B8', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                            Finance / RTO
                          </span>
                          <strong style={{ fontSize: '14px', color: '#059669', textTransform: 'capitalize' }}>
                            {bk.finance_status} / {bk.rto_status}
                          </strong>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
                        {bk.notes || 'Booking confirmed. Vehicle inventory status locked.'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form
                  onSubmit={handleCreateBooking}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #EAEFF5',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    padding: '22px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#173B67', margin: 0 }}>
                      Record Advance Booking & Lock Inventory
                    </h4>
                    <p style={{ fontSize: '12px', color: '#8298B8', margin: '2px 0 0 0' }}>
                      Reserves vehicle in inventory and initiates handover ceremony checklist
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                        Token Advance Amount (INR)
                      </label>
                      <input
                        type="text"
                        required
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        placeholder="10,00,000"
                        style={{
                          width: '100%',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #EAEFF5',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: '#173B67',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                        Total Agreed Deal Amount (INR)
                      </label>
                      <input
                        type="text"
                        required
                        value={totalDealAmount}
                        onChange={(e) => setTotalDealAmount(e.target.value)}
                        placeholder="1,35,00,000"
                        style={{
                          width: '100%',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #EAEFF5',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: '#173B67',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #EAEFF5',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: '#173B67',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                      Delivery Ceremony Notes & Accessories
                    </label>
                    <textarea
                      rows={2}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Puja requested, champagne delivery ceremony, accessories package installed..."
                      style={{
                        width: '100%',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #EAEFF5',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: '#173B67',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 22px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(5,150,105,0.22)',
                      }}
                      className="hover:bg-emerald-700"
                    >
                      Lock Booking & Reserve Vehicle
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Prospect Intelligence Dossier */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Action Panel */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EAEFF5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              padding: '20px',
              boxSizing: 'border-box',
            }}
          >
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#173B67', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Pipeline Actions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  setActiveTab('followups');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  color: '#B45309',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                className="hover:bg-amber-100"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar style={{ width: '15px', height: '15px' }} />
                  <span>Schedule Callback</span>
                </div>
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </button>

              <button
                onClick={() => setIsTestDriveModalOpen(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F5F3FF',
                  border: '1px solid #EDE9FE',
                  color: '#7C3AED',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                className="hover:bg-purple-100"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car style={{ width: '15px', height: '15px' }} />
                  <span>Book Test Drive</span>
                </div>
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </button>

              <button
                onClick={() => {
                  setActiveTab('booking');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#059669',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                className="hover:bg-emerald-100"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award style={{ width: '15px', height: '15px' }} />
                  <span>Record Booking Advance</span>
                </div>
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </button>

              <button
                onClick={() => setIsLostModalOpen(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF0F2',
                  border: '1px solid rgba(245,34,59,0.2)',
                  color: '#F5223B',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                className="hover:bg-red-100"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert style={{ width: '15px', height: '15px' }} />
                  <span>Mark Deal as Lost</span>
                </div>
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>

          {/* Prospect Dossier Summary Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EAEFF5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              padding: '20px',
              boxSizing: 'border-box',
            }}
          >
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#173B67', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Prospect Dossier
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F0F4F8' }}>
                <span style={{ color: '#8298B8' }}>Customer Status:</span>
                <strong style={{ color: '#173B67', textTransform: 'capitalize' }}>
                  {currentStageObj?.label || lead.lead_status}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F0F4F8' }}>
                <span style={{ color: '#8298B8' }}>Acquisition Channel:</span>
                <strong style={{ color: '#173B67' }}>
                  {SOURCE_LABELS[lead.source] || lead.source}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F0F4F8' }}>
                <span style={{ color: '#8298B8' }}>WhatsApp Engagement:</span>
                <strong style={{ color: lead.wa_greeting_sent ? '#059669' : '#8298B8' }}>
                  {lead.wa_greeting_sent ? 'Automated Welcome Sent' : 'Pending'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F0F4F8' }}>
                <span style={{ color: '#8298B8' }}>City & State:</span>
                <strong style={{ color: '#173B67' }}>
                  {lead.city || 'Chennai'}, {lead.state || 'Tamil Nadu'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F0F4F8' }}>
                <span style={{ color: '#8298B8' }}>Occupation:</span>
                <strong style={{ color: '#173B67' }}>
                  {lead.occupation || 'Executive'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8298B8' }}>Last Updated:</span>
                <strong style={{ color: '#173B67' }}>
                  {timeAgo(lead.updated_at || lead.created_at)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
