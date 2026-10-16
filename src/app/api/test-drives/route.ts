// src/app/api/test-drives/route.ts — Test Drive Scheduling API with Inventory Collision Checks
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, car_id, car_name, scheduled_at, location, notes, employee_id } = body;

    if (!lead_id || !scheduled_at) {
      return NextResponse.json({ error: 'Lead ID and Scheduled Date/Time are required.' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    // Check inventory collision if car_id is specified
    if (car_id) {
      const scheduledTime = new Date(scheduled_at).getTime();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      const startTime = new Date(scheduledTime - twoHoursMs).toISOString();
      const endTime = new Date(scheduledTime + twoHoursMs).toISOString();

      const { data: collisions } = await serviceClient
        .from('test_drives')
        .select('id, scheduled_at, status')
        .eq('car_id', car_id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', startTime)
        .lte('scheduled_at', endTime);

      if (collisions && collisions.length > 0) {
        return NextResponse.json(
          {
            error: `Vehicle collision: This car is already scheduled for another test drive around ${new Date(
              collisions[0].scheduled_at
            ).toLocaleTimeString('en-IN')}. Please pick a time at least 2 hours apart.`,
          },
          { status: 409 }
        );
      }
    }

    const { data: testDrive, error } = await serviceClient
      .from('test_drives')
      .insert({
        lead_id,
        car_id: car_id || null,
        car_name: car_name || null,
        scheduled_at,
        location: location || 'Autobourn Showroom, Velachery',
        notes: notes || null,
        employee_id: employee_id || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    // Advance lead stage to 'test_drive_scheduled'
    await serviceClient
      .from('leads')
      .update({ lead_status: 'test_drive_scheduled', updated_at: new Date().toISOString() })
      .eq('id', lead_id);

    return NextResponse.json({ success: true, testDrive });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
