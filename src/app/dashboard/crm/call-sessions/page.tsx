// src/app/dashboard/crm/call-sessions/page.tsx — Executive Rapid Call & Outreach Desk
'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall, Phone, MessageSquare, Clock, User, Car,
  CheckCircle2, ArrowRight, Calendar, Sparkles, AlertCircle,
  ThumbsUp, CalendarCheck, XCircle, Search
} from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Lead, formatBudget, LEAD_STAGES } from '@/types/crm';

export default function CallSessionsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callOutcome, setCallOutcome] = useState('interested');
  const [callNotes, setCallNotes] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const l = await crmService.getLeads();
      const active = l.filter((x) => x.lead_status !== 'sold' && x.lead_status !== 'lost');
      setLeads(active);
      if (active.length > 0) setSelectedLead(active[0]);
    }
    load();
  }, []);

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    await crmService.logActivity({
      lead_id: selectedLead.id,
      activity_type: 'call',
      title: `Call Session Completed (${callOutcome.replace('_', ' ').toUpperCase()})`,
      description: callNotes || `Completed client touchpoint. Outcome: ${callOutcome}`,
      created_by: 'Vikram Mehta',
    });

    setToast(`Logged call touchpoint for ${selectedLead.customer_name}`);
    setCallNotes('');
    setTimeout(() => setToast(null), 3000);
  };

  const filteredLeads = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.customer_name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.interested_car && l.interested_car.toLowerCase().includes(q))
    );
  });

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#173B67', letterSpacing: '-0.5px', margin: 0 }}>
                Call Scheduler
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFF0F2',
                  color: '#F5223B',
                  border: '1px solid rgba(245,34,59,0.2)',
                }}
              >
                {leads.length} Priority Leads
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#8298B8', marginTop: '4px', fontWeight: '500', margin: '4px 0 0 0' }}>
              Rapid outbound calling desk with instant WhatsApp trigger and automated CRM activity logging.
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left: Queue of Leads to Call */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAEFF5',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              marginBottom: '14px',
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#173B67', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Outreach Priority Queue
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#F1F5F9',
                color: '#64748B',
                border: '1px solid #E2E8F0',
              }}
            >
              {filteredLeads.length} leads
            </span>
          </div>

          {/* Search in queue */}
          <div
            style={{
              position: 'relative',
              marginBottom: '14px',
            }}
          >
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                color: '#8298B8',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queue by name, phone, car..."
              style={{
                width: '100%',
                backgroundColor: '#F8FAFC',
                border: '1px solid #EAEFF5',
                borderRadius: '10px',
                padding: '8px 12px 8px 34px',
                fontSize: '12px',
                color: '#173B67',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Queue items list */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '620px',
              overflowY: 'auto',
              paddingRight: '2px',
            }}
          >
            {filteredLeads.map((l) => {
              const isSelected = selectedLead?.id === l.id;
              const stageObj = LEAD_STAGES.find((s) => s.key === l.lead_status);
              return (
                <div
                  key={l.id}
                  onClick={() => setSelectedLead(l)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? '#FFF5F5' : '#FFFFFF',
                    border: isSelected ? '2px solid #F5223B' : '1px solid #EAEFF5',
                    boxShadow: isSelected ? '0 4px 14px rgba(245, 34, 59, 0.10)' : '0 1px 3px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxSizing: 'border-box',
                  }}
                  className={!isSelected ? 'hover:bg-[#F8FAFC] hover:border-gray-300' : ''}
                >
                  {/* Line 1: Name and Stage Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? '#F5223B' : '#173B67' }}>
                      {l.customer_name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: `${stageObj?.color}15`,
                        color: stageObj?.color,
                        border: `1px solid ${stageObj?.color}30`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        flexShrink: 0,
                      }}
                    >
                      {stageObj?.label || l.lead_status}
                    </span>
                  </div>

                  {/* Line 2: Interested Car */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Car style={{ width: '13px', height: '13px', color: '#F5223B', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.interested_car || 'Luxury Vehicle'}
                    </span>
                  </div>

                  {/* Line 3: Phone & Budget */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: '600', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                      {l.phone}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#173B67' }}>
                      {formatBudget(l.budget)}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredLeads.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#8298B8', fontSize: '12px' }}>
                No leads match your search.
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Calling Console */}
        <div>
          {selectedLead ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #EAEFF5',
                padding: '24px 28px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                boxSizing: 'border-box',
              }}
            >
              {/* Profile Card Hero */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  padding: '20px 22px',
                  marginBottom: '22px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#F5223B', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '2px' }}>
                    Active Prospect
                  </span>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#173B67', margin: 0 }}>
                    {selectedLead.customer_name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      Interested in: <strong style={{ color: '#1E293B', fontWeight: '700' }}>{selectedLead.interested_car}</strong>
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#FFF0F2',
                        color: '#F5223B',
                        border: '1px solid rgba(245,34,59,0.2)',
                      }}
                    >
                      {formatBudget(selectedLead.budget)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      backgroundColor: '#F5223B',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(245, 34, 59, 0.25)',
                      transition: 'all 0.15s ease',
                    }}
                    className="hover:scale-[1.02] hover:bg-[#D91B32]"
                  >
                    <Phone style={{ width: '14px', height: '14px' }} />
                    <span>Dial Call</span>
                  </a>

                  <a
                    href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, '').slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.15s ease',
                    }}
                    className="hover:scale-[1.02] hover:bg-[#059669]"
                  >
                    <MessageSquare style={{ width: '14px', height: '14px' }} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Log Outcome Form */}
              <form onSubmit={handleLogCall} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#173B67', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                    Call Outcome
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {[
                      { key: 'interested', label: 'Very Interested', icon: ThumbsUp },
                      { key: 'callback', label: 'Requested Callback', icon: Clock },
                      { key: 'test_drive', label: 'Wants Test Drive', icon: CalendarCheck },
                      { key: 'not_interested', label: 'Not Interested', icon: XCircle },
                    ].map((opt) => {
                      const isSelected = callOutcome === opt.key;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setCallOutcome(opt.key)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            backgroundColor: isSelected ? '#FFF0F2' : '#F8FAFC',
                            border: isSelected ? '2px solid #F5223B' : '1px solid #E2E8F0',
                            color: isSelected ? '#F5223B' : '#475569',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                          className={!isSelected ? 'hover:bg-white hover:border-gray-300' : ''}
                        >
                          <Icon style={{ width: '16px', height: '16px', color: isSelected ? '#F5223B' : '#8298B8' }} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#173B67', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                    Discussion Summary & Notes
                  </label>
                  <textarea
                    rows={4}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Enter key talking points, vehicle color preference, financing requirements..."
                    style={{
                      width: '100%',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      fontSize: '13px',
                      color: '#173B67',
                      outline: 'none',
                      lineHeight: '1.5',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    backgroundColor: '#F5223B',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(245, 34, 59, 0.25)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:scale-[1.01] hover:bg-[#D91B32]"
                >
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  <span>Save Call Session Record</span>
                </button>
              </form>
            </div>
          ) : (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '2px dashed #E2E8F0',
                color: '#8298B8',
                fontSize: '13px',
              }}
            >
              Select a lead from the outreach queue to start a call session.
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50,
            backgroundColor: '#FFFFFF',
            border: '1px solid #EAEFF5',
            color: '#173B67',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F5223B' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
