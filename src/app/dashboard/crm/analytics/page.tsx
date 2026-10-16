// src/app/dashboard/crm/analytics/page.tsx — Module 7: Analytics & Executive Intelligence (White & Red Theme)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, Trophy, Target, Users, Car, PhoneCall, Award,
  Sparkles, ArrowRight, DollarSign, Calendar, PieChart as PieIcon, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import CRMNavbar from '@/components/CRMNavbar';
import { crmService } from '@/lib/crm-service';
import { Lead, FollowUp, TestDrive, Booking, LEAD_STAGES, SOURCE_LABELS, formatBudget } from '@/types/crm';
import { Employee } from '@/types/database';

export default function AnalyticsDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalLeads = leads.length;
  const contactedLeads = leads.filter((l) => l.lead_status !== 'new').length;
  const testDriveLeads = leads.filter(
    (l) => l.lead_status === 'test_drive_scheduled' || l.lead_status === 'negotiation' || l.lead_status === 'booking_done' || l.lead_status === 'sold'
  ).length;
  const bookedLeads = leads.filter((l) => l.lead_status === 'booking_done' || l.lead_status === 'sold').length;
  const soldLeads = leads.filter((l) => l.lead_status === 'sold').length;

  const leadToTestDriveRate = totalLeads > 0 ? Math.round((testDriveLeads / totalLeads) * 100) : 0;
  const testDriveToSoldRate = testDriveLeads > 0 ? Math.round((soldLeads / testDriveLeads) * 100) : 0;
  const overallConversionRate = totalLeads > 0 ? Math.round((soldLeads / totalLeads) * 100) : 0;

  const funnelData = [
    { name: '1. Inbound Inflow', count: totalLeads, fill: '#E10613' },
    { name: '2. Contacted', count: contactedLeads, fill: '#3b82f6' },
    { name: '3. Test Drive Locked', count: testDriveLeads, fill: '#8b5cf6' },
    { name: '4. Token Advance Paid', count: bookedLeads, fill: '#10b981' },
    { name: '5. Handover Completed', count: soldLeads, fill: '#059669' },
  ];

  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => {
    const s = SOURCE_LABELS[l.source] || l.source;
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });

  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
  const SOURCE_COLORS = ['#E10613', '#2563eb', '#0891b2', '#d97706', '#7c3aed', '#db2777', '#059669', '#4f46e5'];

  const leaderboard = employees
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
    .sort((a, b) => b.closedRevenue - a.closedRevenue);

  return (
    <div className="p-6 sm:p-8 max-w-[1360px] mx-auto w-full">
        {/* Module Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#E10613] text-xs font-bold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Executive Intelligence & Performance Leaderboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            CRM Analytics & Performance
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time dealership conversion rates, average deal cycle duration, channel ROI, and sales rep leaderboard.
          </p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs">
            <span className="text-xs font-bold text-gray-500 block mb-1">Lead ➔ Test Drive Rate</span>
            <span className="text-3xl font-black text-purple-600">{leadToTestDriveRate}%</span>
            <span className="text-[11px] text-gray-400 block mt-1">Benchmark: &gt; 40%</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs">
            <span className="text-xs font-bold text-gray-500 block mb-1">Test Drive ➔ Sold Rate</span>
            <span className="text-3xl font-black text-emerald-600">{testDriveToSoldRate}%</span>
            <span className="text-[11px] text-gray-400 block mt-1">High-touch consultative closing</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs">
            <span className="text-xs font-bold text-gray-500 block mb-1">Average Deal Cycle</span>
            <span className="text-3xl font-black text-indigo-600">11.4 Days</span>
            <span className="text-[11px] text-gray-400 block mt-1">From first inquiry to delivery</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs">
            <span className="text-xs font-bold text-gray-500 block mb-1">Overall Conversion Rate</span>
            <span className="text-3xl font-black text-[#E10613]">{overallConversionRate}%</span>
            <span className="text-[11px] text-gray-400 block mt-1">Inflow to closed deliveries</span>
          </div>
        </div>

        {/* Conversion Funnel & Channel ROI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Funnel Diagram */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#E10613]" />
                  <span>Pipeline Conversion Funnel</span>
                </h3>
                <p className="text-xs text-gray-500">Attrition through the 5 consultative milestones</p>
              </div>
            </div>

            <div className="space-y-4">
              {funnelData.map((step) => {
                const pctOfTotal = totalLeads > 0 ? Math.round((step.count / totalLeads) * 100) : 0;
                return (
                  <div key={step.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700">{step.name}</span>
                      <span className="font-bold text-gray-900">
                        {step.count} leads ({pctOfTotal}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pctOfTotal}%`,
                          backgroundColor: step.fill,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lead Source Breakdown */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-amber-500" />
                    <span>Inbound Channel ROI</span>
                  </h3>
                  <p className="text-xs text-gray-500">Attribution across marketing sources</p>
                </div>
              </div>

              <div className="h-44 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={35}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      itemStyle={{ color: '#1A1A1A', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-gray-100">
              {sourceData.map((src, i) => (
                <div key={src.name} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                  />
                  <span className="text-gray-600 text-[11px] truncate">
                    {src.name}: <strong className="text-gray-900">{src.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales Rep Leaderboard */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Relationship Manager Performance Leaderboard</h3>
                <p className="text-xs text-gray-500">
                  Individual conversions, completed phone calls, test drives, and closed delivery revenue
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-900">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Sales Executive</th>
                  <th className="py-3 px-4">Assigned Leads</th>
                  <th className="py-3 px-4">Calls Completed</th>
                  <th className="py-3 px-4">Test Drives</th>
                  <th className="py-3 px-4">Deals Closed</th>
                  <th className="py-3 px-4">Conversion %</th>
                  <th className="py-3 px-4 text-right">Closed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {leaderboard.map((rep, idx) => (
                  <tr key={rep.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      {idx === 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-[11px]">
                          1
                        </span>
                      ) : (
                        <span className="text-gray-400 pl-2 font-bold">{idx + 1}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold">
                      <span className="text-gray-900">{rep.name}</span>
                      <span className="text-[10px] text-gray-400 block font-normal">{rep.code}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-700">{rep.assignedCount}</td>
                    <td className="py-3.5 px-4 text-blue-600 font-semibold">{rep.callsCompleted}</td>
                    <td className="py-3.5 px-4 text-purple-600 font-semibold">{rep.testDrivesDone}</td>
                    <td className="py-3.5 px-4 text-emerald-600 font-bold">{rep.soldCount}</td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 font-bold text-gray-800 text-[11px]">
                        {rep.conversionRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-[#E10613] text-sm">
                      {formatBudget(rep.closedRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
