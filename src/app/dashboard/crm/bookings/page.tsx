// src/app/dashboard/crm/bookings/page.tsx — Module 5: Deal Closure & Handover Milestones (White & Red Theme)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, CheckCircle2, Clock, Car, User, IndianRupee,
  ShieldCheck, FileCheck, Sparkles, AlertCircle, ArrowRight
} from 'lucide-react';
import CRMNavbar from '@/components/CRMNavbar';
import { crmService } from '@/lib/crm-service';
import { Booking, Lead } from '@/types/crm';

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const b = await crmService.getBookings();
      const l = await crmService.getLeads();
      setBookings(b);
      setLeads(l);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAdvance = bookings.reduce((sum, b) => sum + (b.booking_amount || 0), 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

  return (
    <div className="p-6 sm:p-8 max-w-[1360px] mx-auto w-full">
        {/* Module Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Module 5: Deal Closure & Handover Milestone Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Bookings, Financing & Handover Ceremony
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            5-Stage delivery governance: Token Paid ➔ Loan Approved ➔ 200-Pt Inspection ➔ RTO Transfer ➔ Handover Ceremony.
          </p>
        </div>

        {/* Financial KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs">
            <span className="text-xs font-bold text-gray-500 block mb-1">Total Token Advances Held</span>
            <span className="text-2xl font-black text-emerald-600">
              ₹{(totalAdvance / 100000).toFixed(1)} Lakhs
            </span>
            <span className="text-[11px] text-gray-400 block mt-1">Liquid advance commitment</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs">
            <span className="text-xs font-bold text-gray-500 block mb-1">Closed Bookings Value</span>
            <span className="text-2xl font-black text-gray-900">
              ₹{(totalRevenue / 10000000).toFixed(2)} Crores
            </span>
            <span className="text-[11px] text-gray-400 block mt-1">Total deal pipeline settled</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs">
            <span className="text-xs font-bold text-gray-500 block mb-1">Active Deliveries</span>
            <span className="text-2xl font-black text-indigo-600">
              {bookings.filter((b) => b.delivery_status !== 'completed').length} In Progress
            </span>
            <span className="text-[11px] text-gray-400 block mt-1">Awaiting RTO / Handover ceremony</span>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {bookings.map((booking) => {
            const lead = leads.find((l) => l.id === booking.lead_id);
            const isCompleted = booking.delivery_status === 'completed';
            const advanceRatio = booking.total_amount
              ? Math.min(100, Math.round(((booking.booking_amount || 0) / booking.total_amount) * 100))
              : 0;

            return (
              <div
                key={booking.id}
                className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-6"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-gray-900">{booking.car_name}</h3>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {booking.delivery_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-semibold text-gray-800">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Client: {lead?.customer_name || 'Prospect Client'}</span>
                      </span>
                      {booking.expected_delivery && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>Delivery Target: {booking.expected_delivery}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {lead && (
                    <Link
                      href={`/dashboard/crm/leads/${lead.id}`}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>360° Lead Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Financial Progress Bar */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600">Payment Settlement:</span>
                    <span className="text-gray-900">
                      ₹{booking.booking_amount?.toLocaleString('en-IN')} paid of ₹{booking.total_amount?.toLocaleString('en-IN')} ({advanceRatio}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${advanceRatio}%` }}
                    />
                  </div>
                </div>

                {/* 5-Stage Milestone Checklist */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 block mb-3 uppercase tracking-wider">
                    Handover Milestone Checklist:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-medium">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-bold block">1. Token Advance</span>
                        <span className="text-[10px] text-emerald-600">Paid & Verified</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                      booking.finance_status === 'approved' || isCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-bold block">2. Loan Approved</span>
                        <span className="text-[10px] text-gray-500">{booking.finance_status}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-bold block">3. 200+ Pt Inspection</span>
                        <span className="text-[10px] text-emerald-600">Certified</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                      booking.rto_status === 'completed' || isCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-bold block">4. RTO Transfer</span>
                        <span className="text-[10px] text-gray-500">{booking.rto_status}</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                      <div>
                        <span className="font-bold block">5. Handover Ceremony</span>
                        <span className="text-[10px] text-gray-500">
                          {isCompleted ? 'Completed' : 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium">
                    Notes: {booking.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
    </div>
  );
}
