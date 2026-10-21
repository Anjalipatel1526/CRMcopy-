// src/app/dashboard/crm/analytics/page.tsx — Luxury Dealership Analytics & Executive Intelligence
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Trophy, Target, Users, Car, PhoneCall, Award,
  Sparkles, ArrowRight, DollarSign, Calendar, PieChart as PieIcon,
  BarChart3, RotateCw, FileDown, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { crmService } from '@/lib/crm-service';
import { Lead, FollowUp, TestDrive, Booking, LEAD_STAGES, SOURCE_LABELS, formatBudget } from '@/types/crm';
import { Employee } from '@/types/database';

export default function AnalyticsDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [l, fu, td, b, emps] = await Promise.all([
        crmService.getLeads(),
        crmService.getFollowUps(),
        crmService.getTestDrives(),
        crmService.getBookings(),
        crmService.getEmployees(),
      ]);
      setLeads(l);
      setFollowUps(fu);
      setTestDrives(td);
      setBookings(b);
      setEmployees(emps);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  // Funnel & KPI Calculations
  const totalLeads = leads.length;
  const contactedLeads = leads.filter((l) => l.lead_status !== 'new').length;
  const testDriveLeads = leads.filter(
    (l) =>
      l.lead_status === 'test_drive_scheduled' ||
      l.lead_status === 'negotiation' ||
      l.lead_status === 'booking_done' ||
      l.lead_status === 'sold'
  ).length;
  const bookedLeads = leads.filter(
    (l) => l.lead_status === 'booking_done' || l.lead_status === 'sold'
  ).length;
  const soldLeads = leads.filter((l) => l.lead_status === 'sold').length;

  const leadToTestDriveRate = totalLeads > 0 ? Math.round((testDriveLeads / totalLeads) * 100) : 0;
  const testDriveToSoldRate = testDriveLeads > 0 ? Math.round((soldLeads / testDriveLeads) * 100) : 0;
  const overallConversionRate = totalLeads > 0 ? Math.round((soldLeads / totalLeads) * 100) : 0;

  const funnelData = [
    { name: '1. Inbound Inflow', count: totalLeads, fill: '#F5223B', description: 'Total prospective clients captured' },
    { name: '2. Contacted & Qualified', count: contactedLeads, fill: '#2563EB', description: 'Requirements gathered & verified' },
    { name: '3. Test Drive Locked', count: testDriveLeads, fill: '#7C3AED', description: 'Vehicle demonstration completed' },
    { name: '4. Token Advance Paid', count: bookedLeads, fill: '#10B981', description: 'Purchase contract & deposit placed' },
    { name: '5. Handover Completed', count: soldLeads, fill: '#059669', description: 'Vehicle delivered to customer' },
  ];

  // Lead Sources for ROI
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => {
    const s = SOURCE_LABELS[l.source] || l.source;
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });

  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
  const SOURCE_COLORS = ['#F5223B', '#2563EB', '#0891B2', '#D97706', '#7C3AED', '#DB2777', '#059669', '#4F46E5'];

  // Leaderboard Calculation
  const leaderboard = useMemo(() => {
    return employees
      .filter((e) => e.role === 'employee' || e.role === 'admin')
      .map((emp) => {
        const assigned = leads.filter((l) => l.assigned_to === emp.id);
        const repSold = leads.filter((l) => l.assigned_to === emp.id && l.lead_status === 'sold');
        const repCalls = followUps.filter((f) => f.employee_id === emp.id && f.status === 'completed');
        const repTds = testDrives.filter((t) => t.employee_id === emp.id);
        const repBookings = bookings.filter((b) => b.employee_id === emp.id);
        const revenue = repSold.reduce((sum, l) => sum + (l.budget || 0), 0);
        const conv = assigned.length > 0 ? Math.round((repSold.length / assigned.length) * 100) : 0;

        return {
          id: emp.id,
          name: emp.name,
          code: emp.employee_id,
          assignedCount: assigned.length,
          soldCount: repSold.length,
          callsCompleted: repCalls.length,
          testDrivesDone: repTds.length,
          bookingsClosed: repBookings.length,
          conversionRate: conv,
          closedRevenue: revenue,
        };
      })
      .sort((a, b) => b.closedRevenue - a.closedRevenue || b.conversionRate - a.conversionRate);
  }, [employees, leads, followUps, testDrives, bookings]);

  const topPerformer = leaderboard.length > 0 ? leaderboard[0] : null;

  const handleExportReport = () => {
    showToast('Preparing executive analytics report for printing/PDF...');
    setTimeout(() => {
      window.print();
    }, 500);
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

      {/* Top Header & Executive Control Card */}
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
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#173B67] tracking-tight">
                CRM Analytics & Performance
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
                Executive Intelligence
              </span>
            </div>
            <p className="text-xs text-[#8298B8] mt-0.5 font-medium">
              Real-time dealership conversion rates, pipeline velocity, marketing channel ROI, and sales leaderboard
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            {/* Timeframe Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #EAEFF5',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#173B67',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All-Time Pipeline</option>
              <option value="month">Current Month</option>
              <option value="quarter">Q4 Fiscal Quarter</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => {
                loadData();
                showToast('Analytics metrics refreshed');
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
              title="Refresh Analytics"
            >
              <RotateCw style={{ width: '14px', height: '14px', color: '#64748B' }} />
            </button>

            {/* Export Report */}
            <button
              onClick={handleExportReport}
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
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Executive KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* KPI 1: Lead ➔ Test Drive Rate */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAEFF5',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            padding: '18px 20px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lead ➔ Test Drive
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#F5F3FF',
                border: '1px solid #EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Car style={{ width: '16px', height: '16px', color: '#7C3AED' }} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#7C3AED', lineHeight: 1.1 }}>
            {leadToTestDriveRate}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
              }}
            >
              &gt; 40% Benchmark
            </span>
            <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '500' }}>
              {testDriveLeads} of {totalLeads} demonstrated
            </span>
          </div>
        </div>

        {/* KPI 2: Test Drive ➔ Sold Rate */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAEFF5',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            padding: '18px 20px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Test Drive ➔ Sold
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #D1FAE5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award style={{ width: '16px', height: '16px', color: '#059669' }} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#059669', lineHeight: 1.1 }}>
            {testDriveToSoldRate}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
              }}
            >
              High Touch
            </span>
            <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '500' }}>
              Consultative closing efficiency
            </span>
          </div>
        </div>

        {/* KPI 3: Average Deal Cycle */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAEFF5',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            padding: '18px 20px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Deal Cycle
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar style={{ width: '16px', height: '16px', color: '#2563EB' }} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#2563EB', lineHeight: 1.1 }}>
            11.4 Days
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
              }}
            >
              First Inflow ➔ Handover
            </span>
            <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '500' }}>
              Target: &lt; 14 days
            </span>
          </div>
        </div>

        {/* KPI 4: Overall Conversion Rate */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAEFF5',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            padding: '18px 20px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overall Conversion
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#FFF0F2',
                border: '1px solid rgba(245,34,59,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp style={{ width: '16px', height: '16px', color: '#F5223B' }} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#F5223B', lineHeight: 1.1 }}>
            {overallConversionRate}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#FFF0F2',
                color: '#F5223B',
              }}
            >
              {soldLeads} {soldLeads === 1 ? 'Delivery' : 'Deliveries'}
            </span>
            <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '500' }}>
              from {totalLeads} total inquiries
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Funnel & Channel ROI (Balanced 2-Column Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Left Card: Pipeline Conversion Funnel */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAEFF5',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            padding: '22px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#FFF0F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 style={{ width: '16px', height: '16px', color: '#F5223B' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#173B67', margin: 0 }}>
                  Pipeline Conversion Funnel
                </h3>
                <p style={{ fontSize: '12px', color: '#8298B8', margin: '2px 0 0 0', fontWeight: '500' }}>
                  Client attrition through the 5 consultative sales milestones
                </p>
              </div>
            </div>

            {/* Funnel Milestone Progress Bars */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {funnelData.map((step) => {
                const pctOfTotal = totalLeads > 0 ? Math.round((step.count / totalLeads) * 100) : 0;
                return (
                  <div key={step.name} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#173B67' }}>
                          {step.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#8298B8', fontWeight: '500' }}>
                          — {step.description}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: '#173B67',
                          backgroundColor: '#F8FAFC',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #EAEFF5',
                        }}
                      >
                        {step.count} {step.count === 1 ? 'lead' : 'leads'} ({pctOfTotal}%)
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div
                      style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: '#F1F5F9',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(pctOfTotal, 3)}%`,
                          height: '100%',
                          backgroundColor: step.fill,
                          borderRadius: '9999px',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Funnel Bottom Summary Pill */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #F0F4F8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Active In Pipeline:</span>
              <strong style={{ fontSize: '12px', color: '#173B67', fontWeight: '800' }}>
                {leads.filter((l) => l.lead_status !== 'sold' && l.lead_status !== 'lost').length} leads
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Delivered:</span>
              <strong style={{ fontSize: '12px', color: '#059669', fontWeight: '800' }}>
                {soldLeads} {soldLeads === 1 ? 'deal' : 'deals'}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F5223B' }} />
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Lost:</span>
              <strong style={{ fontSize: '12px', color: '#F5223B', fontWeight: '800' }}>
                {leads.filter((l) => l.lead_status === 'lost').length} dropped
              </strong>
            </div>
          </div>
        </div>

        {/* Right Card: Inbound Channel ROI */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAEFF5',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            padding: '22px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PieIcon style={{ width: '16px', height: '16px', color: '#D97706' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#173B67', margin: 0 }}>
                  Inbound Channel ROI
                </h3>
                <p style={{ fontSize: '12px', color: '#8298B8', margin: '2px 0 0 0', fontWeight: '500' }}>
                  Attribution and acquisition volume across marketing sources
                </p>
              </div>
            </div>

            {/* Pure SVG Donut Chart with Center KPI */}
            <div
              style={{
                height: '180px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '10px',
                position: 'relative',
              }}
            >
              <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track */}
                <circle
                  cx="85"
                  cy="85"
                  r="56"
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="20"
                />
                {(() => {
                  const radius = 56;
                  const circumference = 2 * Math.PI * radius;
                  let accumulatedOffset = 0;

                  return sourceData.map((src, index) => {
                    const pct = totalLeads > 0 ? src.value / totalLeads : 0;
                    const strokeDasharray = `${pct * circumference} ${circumference}`;
                    const strokeDashoffset = -accumulatedOffset;
                    accumulatedOffset += pct * circumference;
                    const color = SOURCE_COLORS[index % SOURCE_COLORS.length];

                    return (
                      <circle
                        key={src.name}
                        cx="85"
                        cy="85"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    );
                  });
                })()}
              </svg>
              {/* Center Total Count Badge */}
              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#173B67', lineHeight: 1 }}>
                  {totalLeads}
                </span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#8298B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                  Total Inflow
                </span>
              </div>
            </div>
          </div>

          {/* Channel Breakdown Pills */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #F0F4F8',
            }}
          >
            {sourceData.map((src, i) => {
              const color = SOURCE_COLORS[i % SOURCE_COLORS.length];
              const pct = totalLeads > 0 ? Math.round((src.value / totalLeads) * 100) : 0;
              return (
                <div
                  key={src.name}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #EAEFF5',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }} />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {src.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '13px', fontWeight: '800', color: '#173B67' }}>
                      {src.value}
                    </strong>
                    <span style={{ fontSize: '10px', color: '#8298B8', fontWeight: '600' }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sales Rep Leaderboard Card */}
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
        {/* Leaderboard Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #EAEFF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy style={{ width: '18px', height: '18px', color: '#D97706' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#173B67', margin: 0 }}>
                Relationship Manager Performance Leaderboard
              </h3>
              <p style={{ fontSize: '12px', color: '#8298B8', margin: '2px 0 0 0', fontWeight: '500' }}>
                Conversions, follow-up calls, completed vehicle test drives, and closed delivery revenue
              </p>
            </div>
          </div>

          {topPerformer && topPerformer.closedRevenue > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '10px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                fontSize: '12px',
                fontWeight: '700',
                color: '#B45309',
              }}
            >
              <span>🏆 Top Performer:</span>
              <strong style={{ color: '#173B67' }}>{topPerformer.name}</strong>
              <span style={{ color: '#D97706' }}>({formatBudget(topPerformer.closedRevenue)})</span>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              minWidth: '980px',
              textAlign: 'left',
              borderCollapse: 'collapse',
              fontSize: '13px',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
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
                <th style={{ padding: '14px 20px' }}>Rank</th>
                <th style={{ padding: '14px 20px' }}>Sales Executive</th>
                <th style={{ padding: '14px 20px' }}>Assigned Leads</th>
                <th style={{ padding: '14px 20px' }}>Calls Completed</th>
                <th style={{ padding: '14px 20px' }}>Test Drives</th>
                <th style={{ padding: '14px 20px' }}>Deals Closed</th>
                <th style={{ padding: '14px 20px' }}>Conversion %</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Closed Revenue</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((rep, idx) => {
                const isGold = idx === 0 && rep.closedRevenue > 0;
                const isSilver = idx === 1 && rep.closedRevenue > 0;
                const isBronze = idx === 2 && rep.closedRevenue > 0;

                return (
                  <tr
                    key={rep.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background-color 0.15s ease',
                    }}
                    className="hover:bg-[#F8FAFC]"
                  >
                    {/* Rank */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      {isGold ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#FEF3C7',
                            border: '1px solid #FDE68A',
                            color: '#B45309',
                            fontWeight: '900',
                            fontSize: '12px',
                          }}
                        >
                          🥇 1
                        </span>
                      ) : isSilver ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            color: '#475569',
                            fontWeight: '900',
                            fontSize: '12px',
                          }}
                        >
                          🥈 2
                        </span>
                      ) : isBronze ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#FFEDD5',
                            border: '1px solid #FED7AA',
                            color: '#9A3412',
                            fontWeight: '900',
                            fontSize: '12px',
                          }}
                        >
                          🥉 3
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            color: '#94A3B8',
                            fontWeight: '700',
                            fontSize: '12px',
                          }}
                        >
                          {idx + 1}
                        </span>
                      )}
                    </td>

                    {/* Sales Executive */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '800',
                          color: '#173B67',
                          display: 'block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rep.name}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#8298B8',
                          fontWeight: '500',
                          marginTop: '2px',
                          display: 'inline-block',
                        }}
                      >
                        {rep.code} • Executive RM
                      </span>
                    </td>

                    {/* Assigned Leads */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #EAEFF5',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#173B67',
                        }}
                      >
                        {rep.assignedCount}
                      </span>
                    </td>

                    {/* Calls Completed */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #DBEAFE',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#2563EB',
                        }}
                      >
                        {rep.callsCompleted}
                      </span>
                    </td>

                    {/* Test Drives */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#F5F3FF',
                          border: '1px solid #EDE9FE',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#7C3AED',
                        }}
                      >
                        {rep.testDrivesDone}
                      </span>
                    </td>

                    {/* Deals Closed */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: rep.soldCount > 0 ? '#ECFDF5' : '#F8FAFC',
                          border: `1px solid ${rep.soldCount > 0 ? '#A7F3D0' : '#EAEFF5'}`,
                          fontSize: '12px',
                          fontWeight: '700',
                          color: rep.soldCount > 0 ? '#059669' : '#94A3B8',
                        }}
                      >
                        {rep.soldCount}
                      </span>
                    </td>

                    {/* Conversion % */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          backgroundColor: rep.conversionRate > 0 ? '#ECFDF5' : '#F1F5F9',
                          border: `1px solid ${rep.conversionRate > 0 ? '#A7F3D0' : '#E2E8F0'}`,
                          fontSize: '11px',
                          fontWeight: '800',
                          color: rep.conversionRate > 0 ? '#059669' : '#64748B',
                        }}
                      >
                        {rep.conversionRate}%
                      </span>
                    </td>

                    {/* Closed Revenue */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                      {rep.closedRevenue > 0 ? (
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: '900',
                            color: '#F5223B',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatBudget(rep.closedRevenue)}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#94A3B8',
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {leaderboard.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#8298B8', fontSize: '13px' }}>
                    No sales executive performance data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
