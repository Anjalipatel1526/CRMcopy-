// src/lib/crm-service.ts — Unified CRM Data & Business Logic Engine
import { Lead, FollowUp, CustomerNote, TestDrive, Booking, CRMActivityLog, LeadStatus, LeadSource, FollowUpType, FollowUpPriority } from '@/types/crm';
import { Employee, Car } from '@/types/database';
import { MOCK_LEADS, MOCK_FOLLOW_UPS, MOCK_TEST_DRIVES, MOCK_BOOKINGS, MOCK_CUSTOMER_NOTES, MOCK_ACTIVITY_LOGS, MOCK_EMPLOYEES, MOCK_CARS } from './mock-data';
import { createClient } from './supabase/client';

const STORAGE_KEYS = {
  LEADS: 'autobourn_crm_leads',
  FOLLOW_UPS: 'autobourn_crm_follow_ups',
  TEST_DRIVES: 'autobourn_crm_test_drives',
  BOOKINGS: 'autobourn_crm_bookings',
  NOTES: 'autobourn_crm_notes',
  LOGS: 'autobourn_crm_logs',
  CARS: 'autobourn_crm_cars',
  EMPLOYEES: 'autobourn_crm_employees',
  USE_LIVE_DB: 'autobourn_crm_use_live_db',
  CURRENT_USER_ROLE: 'autobourn_crm_current_user_role', // 'admin' | 'employee'
  CURRENT_EMPLOYEE_ID: 'autobourn_crm_current_emp_id',
};

// Normalize Indian / International phone numbers to clean 10-digit format
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(-10);
}

class CRMService {
  private isBrowser = typeof window !== 'undefined';

  private getItem<T>(key: string, fallback: T): T {
    if (!this.isBrowser) return fallback;
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return JSON.parse(item);
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, data: T): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }

  public isLiveDbEnabled(): boolean {
    if (!this.isBrowser) return false;
    const val = localStorage.getItem(STORAGE_KEYS.USE_LIVE_DB);
    return val === 'true';
  }

  public setLiveDbEnabled(enabled: boolean): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.USE_LIVE_DB, enabled ? 'true' : 'false');
  }

  public getCurrentRole(): 'admin' | 'employee' {
    if (!this.isBrowser) return 'admin';
    return (localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ROLE) as any) || 'admin';
  }

  public setCurrentRole(role: 'admin' | 'employee'): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, role);
  }

  public getCurrentEmployeeId(): string {
    if (!this.isBrowser) return 'emp-001';
    return localStorage.getItem(STORAGE_KEYS.CURRENT_EMPLOYEE_ID) || 'emp-002'; // Default to Vikram Malhotra for employee view
  }

  public setCurrentEmployeeId(id: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_EMPLOYEE_ID, id);
  }

  // Reset to default seed data
  public resetToSeed(): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(MOCK_LEADS));
    localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(MOCK_FOLLOW_UPS));
    localStorage.setItem(STORAGE_KEYS.TEST_DRIVES, JSON.stringify(MOCK_TEST_DRIVES));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(MOCK_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(MOCK_CUSTOMER_NOTES));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(MOCK_ACTIVITY_LOGS));
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(MOCK_CARS));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(MOCK_EMPLOYEES));
  }

  // Fetch all leads
  public async getLeads(): Promise<Lead[]> {
    if (this.isLiveDbEnabled()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('leads')
          .select('*, assigned_employee:employees!assigned_to(name,employee_id)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as Lead[];
      } catch (err) {
        console.warn('Live DB fetch error, falling back to local store:', err);
      }
    }
    return this.getItem<Lead[]>(STORAGE_KEYS.LEADS, MOCK_LEADS);
  }

  // Fetch single lead with relations
  public async getLeadById(id: string): Promise<{
    lead: Lead | null;
    followUps: FollowUp[];
    notes: CustomerNote[];
    testDrives: TestDrive[];
    bookings: Booking[];
    logs: CRMActivityLog[];
  }> {
    const leads = await this.getLeads();
    const lead = leads.find((l) => l.id === id) || null;
    const allFollowUps = this.getItem<FollowUp[]>(STORAGE_KEYS.FOLLOW_UPS, MOCK_FOLLOW_UPS);
    const allNotes = this.getItem<CustomerNote[]>(STORAGE_KEYS.NOTES, MOCK_CUSTOMER_NOTES);
    const allTestDrives = this.getItem<TestDrive[]>(STORAGE_KEYS.TEST_DRIVES, MOCK_TEST_DRIVES);
    const allBookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, MOCK_BOOKINGS);
    const allLogs = this.getItem<CRMActivityLog[]>(STORAGE_KEYS.LOGS, MOCK_ACTIVITY_LOGS);

    return {
      lead,
      followUps: allFollowUps.filter((f) => f.lead_id === id),
      notes: allNotes.filter((n) => n.lead_id === id),
      testDrives: allTestDrives.filter((t) => t.lead_id === id),
      bookings: allBookings.filter((b) => b.lead_id === id),
      logs: allLogs.filter((l) => l.lead_id === id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    };
  }

  // Core Lead Ingestion Engine with Deduplication
  public async ingestLead(payload: {
    customer_name: string;
    phone: string;
    email?: string;
    city?: string;
    state?: string;
    occupation?: string;
    source: LeadSource;
    interested_car?: string;
    preferred_brand?: string;
    budget?: number;
    purchase_timeline?: string;
    notes?: string;
  }): Promise<{ success: boolean; isDuplicate: boolean; lead: Lead; message: string }> {
    const normPhone = normalizePhone(payload.phone);
    if (!normPhone || normPhone.length < 10) {
      throw new Error('Please provide a valid 10-digit phone number.');
    }

    const leads = await this.getLeads();
    const existingLead = leads.find((l) => {
      const p = normalizePhone(l.phone);
      return p === normPhone && l.lead_status !== 'sold' && l.lead_status !== 'lost';
    });

    const now = new Date().toISOString();
    const employees = await this.getEmployees();
    const assignedEmp = employees.find((e) => e.role === 'employee') || employees[0];

    // DEDUPLICATION HIT: Active lead found with this phone number!
    if (existingLead) {
      const mergedNoteText = `[New Inbound Ingestion] Inquired via ${payload.source.toUpperCase()}${
        payload.interested_car ? ` for ${payload.interested_car}` : ''
      }${payload.budget ? ` (Budget: ₹${payload.budget.toLocaleString('en-IN')})` : ''}. ${
        payload.notes ? `Customer Note: "${payload.notes}"` : ''
      }`;

      // 1. Append note to customer notes
      const newNote: CustomerNote = {
        id: `note-${Date.now()}`,
        lead_id: existingLead.id,
        employee_id: assignedEmp ? assignedEmp.id : 'emp-001',
        note: mergedNoteText,
        created_at: now,
        employee: { name: assignedEmp?.name || 'System CRM', employee_id: assignedEmp?.employee_id || 'AB1001' },
      };
      const notes = this.getItem<CustomerNote[]>(STORAGE_KEYS.NOTES, MOCK_CUSTOMER_NOTES);
      notes.unshift(newNote);
      this.setItem(STORAGE_KEYS.NOTES, notes);

      // 2. Add audit log
      const newLog: CRMActivityLog = {
        id: `log-${Date.now()}`,
        employee_id: assignedEmp ? assignedEmp.id : 'emp-001',
        lead_id: existingLead.id,
        action: 'Deduplicated Inquiry Merged',
        details: `Duplicate inquiry received from ${payload.source}. Merged inquiry into customer activity timeline.`,
        created_at: now,
        employee: { name: 'Deduplication Engine', employee_id: 'SYSTEM' },
      };
      const logs = this.getItem<CRMActivityLog[]>(STORAGE_KEYS.LOGS, MOCK_ACTIVITY_LOGS);
      logs.unshift(newLog);
      this.setItem(STORAGE_KEYS.LOGS, logs);

      // 3. Touch updated_at on existing lead
      existingLead.updated_at = now;
      this.setItem(STORAGE_KEYS.LEADS, leads);

      return {
        success: true,
        isDuplicate: true,
        lead: existingLead,
        message: `Existing active lead found for ${existingLead.customer_name} (${normPhone}). Inquiry automatically appended to timeline without creating a duplicate record!`,
      };
    }

    // FRESH LEAD: Create new record
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      customer_name: payload.customer_name.trim(),
      phone: normPhone,
      whatsapp: normPhone,
      email: payload.email?.trim() || null,
      city: payload.city?.trim() || 'Chennai',
      state: payload.state?.trim() || 'Tamil Nadu',
      occupation: payload.occupation?.trim() || null,
      source: payload.source,
      interested_car: payload.interested_car?.trim() || null,
      preferred_brand: payload.preferred_brand?.trim() || null,
      budget: payload.budget || null,
      purchase_timeline: payload.purchase_timeline || 'Within 1 week',
      lead_status: 'new',
      assigned_to: assignedEmp?.id || null,
      created_by: 'emp-001',
      lost_reason: null,
      created_at: now,
      updated_at: now,
      wa_greeting_sent: true,
      assigned_employee: assignedEmp ? { name: assignedEmp.name, employee_id: assignedEmp.employee_id } : null,
    };

    leads.unshift(newLead);
    this.setItem(STORAGE_KEYS.LEADS, leads);

    // Initial note if provided
    if (payload.notes) {
      const initialNote: CustomerNote = {
        id: `note-${Date.now()}`,
        lead_id: newLead.id,
        employee_id: assignedEmp?.id || 'emp-001',
        note: payload.notes,
        created_at: now,
        employee: { name: assignedEmp?.name || 'System CRM', employee_id: assignedEmp?.employee_id || 'AB1001' },
      };
      const notes = this.getItem<CustomerNote[]>(STORAGE_KEYS.NOTES, MOCK_CUSTOMER_NOTES);
      notes.unshift(initialNote);
      this.setItem(STORAGE_KEYS.NOTES, notes);
    }

    // Auto-create initial follow-up due in 15 minutes
    const initialFollowUp: FollowUp = {
      id: `fu-${Date.now()}`,
      lead_id: newLead.id,
      employee_id: assignedEmp?.id || 'emp-002',
      follow_up_type: 'call',
      scheduled_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      notes: `Welcome callback for ${newLead.customer_name}. Requirement gathering for ${newLead.interested_car || 'luxury vehicle'}.`,
      priority: 'high',
      status: 'pending',
      completed_at: null,
      created_at: now,
      employee: assignedEmp ? { name: assignedEmp.name, employee_id: assignedEmp.employee_id } : null,
      lead: { customer_name: newLead.customer_name, phone: newLead.phone },
    };
    const followUps = this.getItem<FollowUp[]>(STORAGE_KEYS.FOLLOW_UPS, MOCK_FOLLOW_UPS);
    followUps.unshift(initialFollowUp);
    this.setItem(STORAGE_KEYS.FOLLOW_UPS, followUps);

    // Activity log
    const log: CRMActivityLog = {
      id: `log-${Date.now()}`,
      employee_id: assignedEmp?.id || 'emp-001',
      lead_id: newLead.id,
      action: 'Lead Ingested & Auto-Assigned',
      details: `New inbound inquiry from ${payload.source.toUpperCase()} assigned to ${assignedEmp?.name || 'Sales Desk'}. Auto-greeting triggered.`,
      created_at: now,
      employee: { name: 'Ingestion Engine', employee_id: 'SYSTEM' },
    };
    const logs = this.getItem<CRMActivityLog[]>(STORAGE_KEYS.LOGS, MOCK_ACTIVITY_LOGS);
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.LOGS, logs);

    return {
      success: true,
      isDuplicate: false,
      lead: newLead,
      message: `Lead successfully created for ${newLead.customer_name} and assigned to ${assignedEmp?.name}. Initial follow-up scheduled in 15 minutes.`,
    };
  }

  // Update lead status with guard verification
  public async updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    extra?: { lost_reason?: string; test_drive?: { car_id: string; car_name: string; scheduled_at: string; location?: string } }
  ): Promise<Lead> {
    const leads = await this.getLeads();
    const index = leads.findIndex((l) => l.id === leadId);
    if (index === -1) throw new Error('Lead not found');

    const lead = leads[index];
    const prevStatus = lead.lead_status;
    const now = new Date().toISOString();

    if (newStatus === 'lost' && !extra?.lost_reason?.trim()) {
      throw new Error('A lost reason is mandatory when moving a lead to Lost.');
    }

    lead.lead_status = newStatus;
    lead.updated_at = now;
    if (newStatus === 'lost') {
      lead.lost_reason = extra?.lost_reason || 'Deal dropped';
    }

    leads[index] = lead;
    this.setItem(STORAGE_KEYS.LEADS, leads);

    // If moved to test drive scheduled and info provided, schedule the test drive
    if (newStatus === 'test_drive_scheduled' && extra?.test_drive) {
      await this.scheduleTestDrive({
        lead_id: leadId,
        car_id: extra.test_drive.car_id,
        car_name: extra.test_drive.car_name,
        scheduled_at: extra.test_drive.scheduled_at,
        location: extra.test_drive.location || 'Autobourn Showroom, Velachery',
        notes: 'Scheduled via Kanban pipeline transition guard',
      });
    }

    // Add activity log
    const log: CRMActivityLog = {
      id: `log-${Date.now()}`,
      employee_id: this.getCurrentEmployeeId(),
      lead_id: leadId,
      action: `Stage Changed: ${prevStatus} ➔ ${newStatus}`,
      details: newStatus === 'lost' ? `Reason: ${lead.lost_reason}` : `Stage updated in pipeline`,
      created_at: now,
      employee: { name: 'Active User', employee_id: 'RM' },
    };
    const logs = this.getItem<CRMActivityLog[]>(STORAGE_KEYS.LOGS, MOCK_ACTIVITY_LOGS);
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.LOGS, logs);

    return lead;
  }

  // Update lead assigned employee
  public async assignLead(leadId: string, employeeId: string): Promise<Lead> {
    const leads = await this.getLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    const employees = await this.getEmployees();
    const emp = employees.find((e) => e.id === employeeId);

    lead.assigned_to = employeeId;
    lead.assigned_employee = emp ? { name: emp.name, employee_id: emp.employee_id } : null;
    lead.updated_at = new Date().toISOString();

    this.setItem(STORAGE_KEYS.LEADS, leads);

    // Activity log
    const log: CRMActivityLog = {
      id: `log-${Date.now()}`,
      employee_id: employeeId,
      lead_id: leadId,
      action: 'Lead Reassigned',
      details: `Lead reassigned to ${emp?.name || 'Executive'}`,
      created_at: new Date().toISOString(),
      employee: { name: 'Admin Console', employee_id: 'AB1001' },
    };
    const logs = this.getItem<CRMActivityLog[]>(STORAGE_KEYS.LOGS, MOCK_ACTIVITY_LOGS);
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.LOGS, logs);

    return lead;
  }

  // Follow-ups management
  public async getFollowUps(): Promise<FollowUp[]> {
    return this.getItem<FollowUp[]>(STORAGE_KEYS.FOLLOW_UPS, MOCK_FOLLOW_UPS);
  }

  public async scheduleFollowUp(payload: {
    lead_id: string;
    follow_up_type: FollowUpType;
    scheduled_at: string;
    notes: string;
    priority: FollowUpPriority;
    employee_id?: string;
  }): Promise<FollowUp> {
    const leads = await this.getLeads();
    const lead = leads.find((l) => l.id === payload.lead_id);
    const empId = payload.employee_id || this.getCurrentEmployeeId();
    const employees = await this.getEmployees();
    const emp = employees.find((e) => e.id === empId);

    const newFollowUp: FollowUp = {
      id: `fu-${Date.now()}`,
      lead_id: payload.lead_id,
      employee_id: empId,
      follow_up_type: payload.follow_up_type,
      scheduled_at: payload.scheduled_at,
      notes: payload.notes,
      priority: payload.priority,
      status: 'pending',
      completed_at: null,
      created_at: new Date().toISOString(),
      employee: emp ? { name: emp.name, employee_id: emp.employee_id } : null,
      lead: lead ? { customer_name: lead.customer_name, phone: lead.phone } : null,
    };

    const followUps = this.getItem<FollowUp[]>(STORAGE_KEYS.FOLLOW_UPS, MOCK_FOLLOW_UPS);
    followUps.unshift(newFollowUp);
    this.setItem(STORAGE_KEYS.FOLLOW_UPS, followUps);

    // Activity log
    const log: CRMActivityLog = {
      id: `log-${Date.now()}`,
      employee_id: empId,
      lead_id: payload.lead_id,
      action: `Follow-up Scheduled: ${payload.follow_up_type.toUpperCase()}`,
      details: `Scheduled for ${new Date(payload.scheduled_at).toLocaleString('en-IN')}: ${payload.notes}`,
      created_at: new Date().toISOString(),
      employee: { name: emp?.name || 'Executive', employee_id: emp?.employee_id || 'AB' },
    };
    const logs = this.getItem<CRMActivityLog[]>(STORAGE_KEYS.LOGS, MOCK_ACTIVITY_LOGS);
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.LOGS, logs);

    return newFollowUp;
  }

  public async createFollowUp(payload: {
    lead_id: string;
    follow_up_type: FollowUpType;
    scheduled_at: string;
    notes?: string;
    priority?: FollowUpPriority;
    employee_id?: string;
  }): Promise<FollowUp> {
    return this.scheduleFollowUp({
      lead_id: payload.lead_id,
      follow_up_type: payload.follow_up_type,
      scheduled_at: payload.scheduled_at,
      notes: payload.notes || '',
      priority: payload.priority || 'normal',
      employee_id: payload.employee_id,
    });
  }

  // Quick Action: Complete Current & Schedule Next Follow-up in one click
  public async completeAndScheduleNext(
    currentId: string,
    completionNotes: string,
    nextSchedule?: {
      follow_up_type: FollowUpType;
      scheduled_at: string;
      notes: string;
      priority: FollowUpPriority;
    }
  ): Promise<{ completed: FollowUp; next?: FollowUp }> {
    const followUps = this.getItem<FollowUp[]>(STORAGE_KEYS.FOLLOW_UPS, MOCK_FOLLOW_UPS);
    const idx = followUps.findIndex((f) => f.id === currentId);
    if (idx === -1) throw new Error('Follow-up not found');

    const current = followUps[idx];
    const now = new Date().toISOString();
    current.status = 'completed';
    current.completed_at = now;
    if (completionNotes) {
      current.notes = (current.notes ? `${current.notes}\n[Outcome]: ` : '[Outcome]: ') + completionNotes;
    }
    followUps[idx] = current;
    this.setItem(STORAGE_KEYS.FOLLOW_UPS, followUps);

    // Append note to lead's notes
    if (completionNotes) {
      const newNote: CustomerNote = {
        id: `note-${Date.now()}`,
        lead_id: current.lead_id,
        employee_id: current.employee_id,
        note: `Follow-up (${current.follow_up_type.toUpperCase()}) completed: ${completionNotes}`,
        created_at: now,
        employee: current.employee,
      };
      const notes = this.getItem<CustomerNote[]>(STORAGE_KEYS.NOTES, MOCK_CUSTOMER_NOTES);
      notes.unshift(newNote);
      this.setItem(STORAGE_KEYS.NOTES, notes);
    }

    let nextItem: FollowUp | undefined = undefined;
    if (nextSchedule && nextSchedule.scheduled_at) {
      nextItem = await this.scheduleFollowUp({
        lead_id: current.lead_id,
        follow_up_type: nextSchedule.follow_up_type,
        scheduled_at: nextSchedule.scheduled_at,
        notes: nextSchedule.notes,
        priority: nextSchedule.priority,
        employee_id: current.employee_id,
      });
    }

    return { completed: current, next: nextItem };
  }

  // Customer Notes
  public async addNote(leadId: string, noteText: string): Promise<CustomerNote> {
    const empId = this.getCurrentEmployeeId();
    const employees = await this.getEmployees();
    const emp = employees.find((e) => e.id === empId);

    const newNote: CustomerNote = {
      id: `note-${Date.now()}`,
      lead_id: leadId,
      employee_id: empId,
      note: noteText,
      created_at: new Date().toISOString(),
      employee: emp ? { name: emp.name, employee_id: emp.employee_id } : null,
    };

    const notes = this.getItem<CustomerNote[]>(STORAGE_KEYS.NOTES, MOCK_CUSTOMER_NOTES);
    notes.unshift(newNote);
    this.setItem(STORAGE_KEYS.NOTES, notes);

    return newNote;
  }

  // Activity Audit Logging
  public async logActivity(payload: {
    lead_id: string;
    activity_type: string;
    title: string;
    description: string;
    created_by?: string;
  }): Promise<CRMActivityLog> {
    const empId = this.getCurrentEmployeeId();
    const employees = await this.getEmployees();
    const emp = employees.find((e) => e.id === empId);

    const newLog: CRMActivityLog = {
      id: `log-${Date.now()}`,
      employee_id: empId,
      lead_id: payload.lead_id,
      action: payload.title,
      details: payload.description,
      created_at: new Date().toISOString(),
      employee: emp
        ? { name: emp.name, employee_id: emp.employee_id }
        : { name: payload.created_by || 'Vikram Mehta', employee_id: 'AB1001' },
    };

    const logs = this.getItem<CRMActivityLog[]>(STORAGE_KEYS.LOGS, MOCK_ACTIVITY_LOGS);
    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.LOGS, logs);

    // Also append to customer notes
    await this.addNote(payload.lead_id, `[${payload.title}] ${payload.description}`);

    return newLog;
  }

  // Test Drives & Vehicle Collision Prevention Check
  public async getTestDrives(): Promise<TestDrive[]> {
    return this.getItem<TestDrive[]>(STORAGE_KEYS.TEST_DRIVES, MOCK_TEST_DRIVES);
  }

  public async checkCarAvailability(carId: string, desiredTimeStr: string): Promise<{ available: boolean; conflictMessage?: string }> {
    const cars = await this.getCars();
    const car = cars.find((c) => c.id === carId);
    if (!car) return { available: false, conflictMessage: 'Car does not exist in inventory' };

    if (car.status === 'sold') {
      return { available: false, conflictMessage: `This ${car.brand} ${car.model} is already SOLD and cannot be test driven.` };
    }

    const testDrives = await this.getTestDrives();
    const desiredTime = new Date(desiredTimeStr).getTime();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    const conflict = testDrives.find((td) => {
      if (td.car_id !== carId || td.status !== 'scheduled') return false;
      const tdTime = new Date(td.scheduled_at).getTime();
      return Math.abs(tdTime - desiredTime) < TWO_HOURS_MS;
    });

    if (conflict) {
      return {
        available: false,
        conflictMessage: `Inventory Collision: ${car.brand} ${car.model} is already booked for another test drive at ${new Date(
          conflict.scheduled_at
        ).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}. Please select a time at least 2 hours apart.`,
      };
    }

    return { available: true };
  }

  public async scheduleTestDrive(payload: {
    lead_id: string;
    car_id: string;
    car_name: string;
    scheduled_at: string;
    location?: string;
    notes?: string;
  }): Promise<TestDrive> {
    const availability = await this.checkCarAvailability(payload.car_id, payload.scheduled_at);
    if (!availability.available) {
      throw new Error(availability.conflictMessage || 'Vehicle unavailable');
    }

    const empId = this.getCurrentEmployeeId();
    const employees = await this.getEmployees();
    const emp = employees.find((e) => e.id === empId);

    const newTd: TestDrive = {
      id: `td-${Date.now()}`,
      lead_id: payload.lead_id,
      employee_id: empId,
      car_id: payload.car_id,
      car_name: payload.car_name,
      scheduled_at: payload.scheduled_at,
      location: payload.location || 'Autobourn Showroom, Velachery',
      status: 'scheduled',
      result: null,
      customer_feedback: null,
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      employee: emp ? { name: emp.name } : null,
    };

    const testDrives = this.getItem<TestDrive[]>(STORAGE_KEYS.TEST_DRIVES, MOCK_TEST_DRIVES);
    testDrives.unshift(newTd);
    this.setItem(STORAGE_KEYS.TEST_DRIVES, testDrives);

    // Log activity
    const log: CRMActivityLog = {
      id: `log-${Date.now()}`,
      employee_id: empId,
      lead_id: payload.lead_id,
      action: 'Test Drive Scheduled',
      details: `${payload.car_name} at ${newTd.location} on ${new Date(payload.scheduled_at).toLocaleString('en-IN')}`,
      created_at: new Date().toISOString(),
      employee: { name: emp?.name || 'Executive', employee_id: 'RM' },
    };
    const logs = this.getItem<CRMActivityLog[]>(STORAGE_KEYS.LOGS, MOCK_ACTIVITY_LOGS);
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.LOGS, logs);

    return newTd;
  }

  public async completeTestDriveFeedback(
    testDriveId: string,
    result: 'interested' | 'not_interested' | 'needs_follow_up',
    customerFeedback: string
  ): Promise<TestDrive> {
    const testDrives = this.getItem<TestDrive[]>(STORAGE_KEYS.TEST_DRIVES, MOCK_TEST_DRIVES);
    const td = testDrives.find((t) => t.id === testDriveId);
    if (!td) throw new Error('Test drive not found');

    td.status = 'completed';
    td.result = result;
    td.customer_feedback = customerFeedback;
    this.setItem(STORAGE_KEYS.TEST_DRIVES, testDrives);

    // Note on lead
    await this.addNote(
      td.lead_id,
      `[Test Drive Completed — ${td.car_name}] Result: ${result.toUpperCase()}. Customer Feedback: "${customerFeedback}"`
    );

    return td;
  }

  // Bookings & Inventory Auto-Reservation
  public async getBookings(): Promise<Booking[]> {
    return this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, MOCK_BOOKINGS);
  }

  public async createBooking(payload: {
    lead_id: string;
    car_id?: string;
    car_name: string;
    booking_amount?: number;
    token_amount?: number;
    total_amount: number;
    expected_delivery?: string | null;
    delivery_date?: string | null;
    loan_status?: string;
    notes?: string;
  }): Promise<Booking> {
    const now = new Date().toISOString();
    const empId = this.getCurrentEmployeeId();
    const amount = payload.token_amount ?? payload.booking_amount ?? 0;
    const carId = payload.car_id || 'car-001';

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      lead_id: payload.lead_id,
      employee_id: empId,
      car_id: carId,
      car_name: payload.car_name,
      booking_amount: amount,
      total_amount: payload.total_amount,
      payment_status: amount >= payload.total_amount ? 'completed' : 'partial',
      delivery_status: 'processing',
      finance_status: (payload.loan_status as any) || 'pending',
      insurance_status: 'pending',
      rto_status: 'pending',
      expected_delivery: payload.delivery_date || payload.expected_delivery || null,
      notes: payload.notes || null,
      created_at: now,
      updated_at: now,
    };

    const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, MOCK_BOOKINGS);
    bookings.unshift(newBooking);
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);

    // Lock car inventory status to 'reserved'
    const cars = await this.getCars();
    const carIdx = cars.findIndex((c) => c.id === payload.car_id);
    if (carIdx !== -1) {
      cars[carIdx].status = 'reserved';
      this.setItem(STORAGE_KEYS.CARS, cars);
    }

    // Move lead stage to 'booking_done'
    await this.updateLeadStatus(payload.lead_id, 'booking_done');

    return newBooking;
  }

  // Cars and Employees
  public async getCars(): Promise<Car[]> {
    return this.getItem<Car[]>(STORAGE_KEYS.CARS, MOCK_CARS);
  }

  public async getEmployees(): Promise<Employee[]> {
    return this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, MOCK_EMPLOYEES);
  }
}

export const crmService = new CRMService();
