// src/app/api/bookings/route.ts — Bookings & Financial Milestone API
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, car_id, car_name, booking_amount, total_amount, expected_delivery, notes, employee_id } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    const { data: booking, error } = await serviceClient
      .from('bookings')
      .insert({
        lead_id,
        car_id: car_id || null,
        car_name: car_name || null,
        employee_id: employee_id || null,
        booking_amount: booking_amount ? parseInt(String(booking_amount)) : 0,
        total_amount: total_amount ? parseInt(String(total_amount)) : 0,
        payment_status: booking_amount && total_amount && booking_amount >= total_amount ? 'completed' : 'partial',
        delivery_status: 'processing',
        finance_status: 'pending',
        insurance_status: 'pending',
        rto_status: 'pending',
        expected_delivery: expected_delivery || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update car status to 'reserved'
    if (car_id) {
      await serviceClient.from('cars').update({ status: 'reserved' }).eq('id', car_id);
    }

    // Advance lead status to 'booking_done'
    await serviceClient
      .from('leads')
      .update({ lead_status: 'booking_done', updated_at: new Date().toISOString() })
      .eq('id', lead_id);

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
