// src/app/dashboard/crm/customer-details/page.tsx — Luxury Customer Directory & VIP Client Profiles
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Phone, MessageSquare, ChevronRight,
  Car, User, Users, Filter, Plus, FileDown, RotateCw, CheckCircle2
} from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Lead, formatBudget, LEAD_STAGES } from '@/types/crm';
import { downloadLeadsPdf } from '@/lib/pdf-utils';
import AddLeadModal from '@/components/AddLeadModal';

export default function CustomerDetailsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
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
      console.error('Failed to load leads in customer directory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.lead_status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = l.customer_name.toLowerCase().includes(q);
        const matchPhone = l.phone.includes(q);
        const matchCar = (l.interested_car || '').toLowerCase().includes(q);
        const matchBrand = (l.preferred_brand || '').toLowerCase().includes(q);
        const matchRm = (l.assigned_employee?.name || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCar && !matchBrand && !matchRm) return false;
      }
      return true;
    });
  }, [leads, statusFilter, search]);

  const handleExportPdf = () => {
    try {
      downloadLeadsPdf(filtered, statusFilter, search);
      showToast('Exported customer directory report to PDF');
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
      {/* Toast Notification */}
      {toastMessage && (
        <div
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Control Bar — Clean 2-Tier Separated Luxury Card */}
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
        {/* Tier 1: Title, Client Counter & Primary Action Buttons */}
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full"
          style={{
            paddingBottom: '14px',
            borderBottom: '1px solid #F0F4F8',
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#173B67] tracking-tight">
                Customer Details
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFF0F2',
                  color: '#F5223B',
                  border: '1px solid rgba(245,34,59,0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {leads.length} Clients
              </span>
            </div>
            <p className="text-xs text-[#8298B8] mt-0.5 font-medium">
              Centralized directory of luxury car buyers, contact info, purchase intent, and vehicle preferences
            </p>
          </div>

          {/* Primary Action Buttons: Export Directory & New Client */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            {/* Refresh Data */}
            <button
              onClick={() => {
                loadLeads();
                showToast('Customer directory updated');
              }}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAEFF5',
                borderRadius: '12px',
                padding: '8px 12px',
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
              title="Refresh Client List"
            >
              <RotateCw style={{ width: '14px', height: '14px', color: '#64748B' }} />
            </button>

            {/* Export PDF */}
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
                whiteSpace: 'nowrap',
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
                whiteSpace: 'nowrap',
              }}
              className="hover:bg-[#E0142C] active:scale-95"
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              <span>New Client</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Search Input, Stage Filter & Live Counter */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 w-full"
          style={{ paddingTop: '14px' }}
        >
          {/* Left: Search Input + Stage Filter */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '15px',
                  height: '15px',
                  color: '#8298B8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search name, phone, car, RM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #EAEFF5',
                  borderRadius: '12px',
                  padding: '8px 14px 8px 36px',
                  fontSize: '12px',
                  color: '#173B67',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '11px',
                    color: '#94A3B8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Stage Filter */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter
                style={{
                  position: 'absolute',
                  left: '10px',
                  width: '13px',
                  height: '13px',
                  color: '#8298B8',
                  pointerEvents: 'none',
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #EAEFF5',
                  borderRadius: '12px',
                  padding: '8px 14px 8px 30px',
                  fontSize: '12px',
                  color: '#173B67',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">All Stages ({leads.length})</option>
                {LEAD_STAGES.map((s) => {
                  const count = leads.filter((l) => l.lead_status === s.key).length;
                  return (
                    <option key={s.key} value={s.key}>
                      {s.label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Right: Active Pipeline Stats & Counter */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #EAEFF5',
                fontSize: '11px',
                color: '#64748B',
                fontWeight: '600',
              }}
            >
              <Users style={{ width: '13px', height: '13px', color: '#173B67' }} />
              <span>Active Pipeline:</span>
              <strong style={{ color: '#173B67', fontWeight: '800' }}>
                {leads.filter((x) => x.lead_status !== 'sold' && x.lead_status !== 'lost').length}
              </strong>
            </div>

            <span style={{ fontSize: '12px', fontWeight: '600', color: '#8298B8', whiteSpace: 'nowrap' }}>
              Showing <strong style={{ color: '#173B67' }}>{filtered.length}</strong> of {leads.length}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Directory Table Card */}
      <div
        className="w-full min-w-0"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #EAEFF5',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              minWidth: '1080px',
              textAlign: 'left',
              borderCollapse: 'collapse',
              fontSize: '13px',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '23%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '17%' }} />
            </colgroup>
            <thead>
              <tr
                style={{
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #EAEFF5',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                }}
              >
                <th style={{ padding: '14px 20px' }}>Customer Name</th>
                <th style={{ padding: '14px 20px' }}>Contact Details</th>
                <th style={{ padding: '14px 20px' }}>Interested Vehicle</th>
                <th style={{ padding: '14px 20px' }}>Budget</th>
                <th style={{ padding: '14px 20px' }}>Status Stage</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const stageObj = LEAD_STAGES.find((s) => s.key === l.lead_status);
                const assignedName = l.assigned_employee?.name || 'Unassigned';

                return (
                  <tr
                    key={l.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background-color 0.15s ease',
                    }}
                    className="hover:bg-[#F8FAFC]"
                  >
                    {/* Customer Name & RM */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <Link
                        href={`/dashboard/crm/leads/${l.id}`}
                        style={{
                          fontSize: '14px',
                          fontWeight: '800',
                          color: '#173B67',
                          textDecoration: 'none',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'color 0.15s ease',
                        }}
                        className="hover:text-[#F5223B]"
                        title={l.customer_name}
                      >
                        {l.customer_name}
                      </Link>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#8298B8',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '3px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <User style={{ width: '11px', height: '11px', color: '#94A3B8', flexShrink: 0 }} />
                        <span>
                          Assigned: <strong style={{ color: '#475569', fontWeight: '600' }}>{assignedName}</strong>
                        </span>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontWeight: '700',
                          color: '#1E293B',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {l.phone}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#8298B8',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={l.email || ''}
                      >
                        {l.email || '—'}
                      </div>
                    </td>

                    {/* Interested Vehicle */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '7px',
                            backgroundColor: '#FFF0F2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Car style={{ width: '14px', height: '14px', color: '#F5223B' }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: '700',
                              color: '#173B67',
                              fontSize: '13px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={l.interested_car || 'General Inquiry'}
                          >
                            {l.interested_car || 'General Inquiry'}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#8298B8',
                              marginTop: '1px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {l.preferred_brand || 'Luxury Segment'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Budget & Timeline */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#173B67', display: 'block', whiteSpace: 'nowrap' }}>
                        {formatBudget(l.budget)}
                      </span>
                      {l.purchase_timeline && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#64748B',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '3px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {l.purchase_timeline}
                        </span>
                      )}
                    </td>

                    {/* Status Stage */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: `${stageObj?.color || '#64748B'}15`,
                          color: stageObj?.color || '#64748B',
                          border: `1px solid ${stageObj?.color || '#64748B'}30`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: stageObj?.color || '#64748B',
                          }}
                        />
                        {stageObj?.label || l.lead_status}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                        <a
                          href={`tel:${l.phone}`}
                          style={{
                            width: '30px',
                            height: '30px',
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
                          title="Call Customer"
                        >
                          <Phone style={{ width: '13px', height: '13px' }} />
                        </a>

                        <a
                          href={`https://wa.me/91${l.phone.replace(/\D/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            width: '30px',
                            height: '30px',
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
                          title="WhatsApp Chat"
                        >
                          <MessageSquare style={{ width: '13px', height: '13px' }} />
                        </a>

                        <Link
                          href={`/dashboard/crm/leads/${l.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 11px',
                            borderRadius: '8px',
                            backgroundColor: '#FFF0F2',
                            color: '#F5223B',
                            border: '1px solid rgba(245,34,59,0.2)',
                            fontSize: '11px',
                            fontWeight: '700',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                          }}
                          className="hover:bg-[#F5223B] hover:text-white"
                        >
                          <span>Profile 360°</span>
                          <ChevronRight style={{ width: '12px', height: '12px' }} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#8298B8', fontSize: '13px' }}>
                    No customer records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead / New Client Modal */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onLeadAdded={() => {
          loadLeads();
          showToast('New client successfully registered into CRM');
        }}
      />
    </div>
  );
}
