// src/app/api/leads/route.ts — Inbound Lead Ingestion & Deduplication API
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

function normalizePhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(-10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_name,
      phone,
      email,
      whatsapp,
      city,
      state,
      occupation,
      source,
      interested_car,
      preferred_brand,
      budget,
      purchase_timeline,
      lead_status,
      assigned_to,
      created_by,
      notes,
    } = body;

    if (!customer_name || !phone) {
      return NextResponse.json({ error: 'Customer Name and Phone Number are required.' }, { status: 400 });
    }

    const normPhone = normalizePhone(phone);
    if (normPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    // DEDUPLICATION CHECK: Check if an active lead already exists with this phone number
    const { data: existingLeads, error: checkErr } = await serviceClient
      .from('leads')
      .select('id, customer_name, phone, lead_status')
      .or(`phone.eq.${normPhone},phone.eq.+91${normPhone},phone.eq.0${normPhone}`)
      .not('lead_status', 'in', '("sold","lost")')
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingLeads && existingLeads.length > 0) {
      const activeLead = existingLeads[0];
      const appendNote = `[New Inbound Ingestion] Inquired via ${(source || 'website').toUpperCase()}${
        interested_car ? ` for ${interested_car}` : ''
      }${budget ? ` with budget ₹${Number(budget).toLocaleString('en-IN')}` : ''}.${notes ? ` Customer note: "${notes}"` : ''}`;

      // Get an admin or assigned employee ID
      const { data: emp } = await serviceClient.from('employees').select('id').limit(1).maybeSingle();
      const empId = emp?.id || null;

      if (empId) {
        await serviceClient.from('customer_notes').insert({
          lead_id: activeLead.id,
          employee_id: empId,
          note: appendNote,
        });
      }

      // Update lead timestamp
      await serviceClient
        .from('leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeLead.id);

      // Log activity
      await serviceClient.from('crm_activity_logs').insert({
        lead_id: activeLead.id,
        employee_id: empId,
        action: 'Deduplicated Inquiry Appended',
        details: `Customer submitted new inquiry via ${source || 'website'}. Appended to existing history without duplicating lead.`,
      });

      return NextResponse.json({
        success: true,
        isDuplicate: true,
        message: `Existing active lead found for ${activeLead.customer_name}. Inquiry attached to customer history.`,
        lead: activeLead,
      });
    }

    // FRESH LEAD: Insert new lead into Supabase
    const insertPayload: any = {
      customer_name: customer_name.trim(),
      phone: normPhone,
      email: email ? email.trim() : null,
      whatsapp: whatsapp ? normalizePhone(whatsapp) : normPhone,
      city: city || 'Chennai',
      state: state || 'Tamil Nadu',
      occupation: occupation || null,
      source: source || 'website',
      interested_car: interested_car || null,
      preferred_brand: preferred_brand || null,
      budget: budget ? parseInt(String(budget).replace(/[^0-9]/g, '')) : null,
      purchase_timeline: purchase_timeline || 'Within 1 week',
      lead_status: lead_status || 'new',
      assigned_to: assigned_to !== undefined ? assigned_to : null,
    };

    if (created_by) {
      insertPayload.created_by = created_by;
    }

    const { data: lead, error: leadError } = await serviceClient
      .from('leads')
      .insert(insertPayload)
      .select()
      .single();

    if (leadError || !lead) {
      console.error('Error creating lead in database:', leadError);
      return NextResponse.json({ error: `Failed to register lead: ${leadError?.message}` }, { status: 500 });
    }

    // Insert notes if present
    if (notes) {
      const { data: emp } = await serviceClient.from('employees').select('id').limit(1).maybeSingle();
      if (emp) {
        await serviceClient.from('customer_notes').insert({
          lead_id: lead.id,
          employee_id: emp.id,
          note: notes,
        });
      }
    }

    // Auto-create initial follow-up due in 15 mins
    const { data: emp } = await serviceClient.from('employees').select('id').limit(1).maybeSingle();
    if (emp) {
      const scheduledAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await serviceClient.from('follow_ups').insert({
        lead_id: lead.id,
        employee_id: emp.id,
        follow_up_type: 'call',
        scheduled_at: scheduledAt,
        notes: `Urgent inbound contact within 15 mins for ${customer_name}`,
        priority: 'high',
        status: 'pending',
      });
    }

    // Trigger WhatsApp welcome greeting
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njvgqybtgakgevnxmetf.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      fetch(`${supabaseUrl}/functions/v1/send-whatsapp-greeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ leadId: lead.id }),
      }).catch((err) => {
        console.warn('Background WhatsApp greeting trigger notification:', err);
      });
    }

    return NextResponse.json({
      success: true,
      isDuplicate: false,
      message: 'Lead registered successfully. Initial 15-min follow-up created.',
      lead,
    });
  } catch (err: any) {
    console.error('Unexpected error in leads API POST:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const serviceClient = await createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');

    let query = serviceClient
      .from('leads')
      .select('*, assigned_employee:employees!assigned_to(name,employee_id)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('lead_status', status);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data: leads, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, leads });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
