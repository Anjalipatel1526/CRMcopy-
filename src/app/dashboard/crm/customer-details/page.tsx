// src/app/dashboard/crm/customer-details/page.tsx — Customer Directory & VIP Client Profiles
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Search, Phone, MessageSquare, ChevronRight,
  Car, User, ShieldCheck, ArrowUpRight, Filter
} from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Lead, formatBudget } from '@/types/crm';

export default function CustomerDetailsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const l = await crmService.getLeads();
        setLeads(l);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = leads.filter((l) => {
    if (statusFilter !== 'all' && l.lead_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = l.customer_name.toLowerCase().includes(q);
      const matchPhone = l.phone.includes(q);
      const matchCar = (l.interested_car || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCar) return false;
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 max-w-[1360px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#E10613] text-xs font-bold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Client Master Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Customer Details
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Centralized directory of all luxury car buyers, contact info, purchase intent, and vehicle preferences.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, car..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-gray-900 placeholder-gray-400 text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E10613] outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Customer Name</th>
                <th className="py-4 px-6">Contact Details</th>
                <th className="py-4 px-6">Interested Vehicle</th>
                <th className="py-4 px-6">Budget</th>
                <th className="py-4 px-6">Status Stage</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-gray-900 text-sm">{l.customer_name}</div>
                    <span className="text-[11px] text-gray-400">
                      Assigned: {l.assigned_employee?.name || 'Unassigned'}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-mono text-gray-700 font-semibold">{l.phone}</div>
                    {l.email && <div className="text-gray-400 text-[11px]">{l.email}</div>}
                  </td>

                  <td className="py-4 px-6 font-semibold text-gray-800">
                    {l.interested_car || 'General Inquiry'}
                  </td>

                  <td className="py-4 px-6 font-bold text-[#E10613]">
                    {formatBudget(l.budget)}
                  </td>

                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 uppercase tracking-wider">
                      {l.lead_status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <a
                        href={`tel:${l.phone}`}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-[#E10613] hover:border-red-200 transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/91${l.phone.replace(/\D/g, '').slice(-10)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      <Link
                        href={`/dashboard/crm/leads/${l.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-[#E10613] font-bold text-[11px] hover:bg-red-100 transition-colors"
                      >
                        <span>Profile 360°</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
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
