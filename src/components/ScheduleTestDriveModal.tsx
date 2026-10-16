// src/components/ScheduleTestDriveModal.tsx — Test Drive Scheduling Guard (White & Red Theme)
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Calendar, MapPin, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Car as CarType } from '@/types/database';

interface ScheduleTestDriveModalProps {
  isOpen: boolean;
  leadId?: string;
  leadName?: string;
  interestedCarName?: string | null;
  onConfirm?: (data: { car_id: string; car_name: string; scheduled_at: string; location?: string; notes?: string }) => void;
  onCancel?: () => void;
  onClose?: () => void;
  onScheduled?: () => void;
}

export default function ScheduleTestDriveModal({
  isOpen,
  leadId,
  leadName,
  interestedCarName,
  onConfirm,
  onCancel,
  onClose,
  onScheduled,
}: ScheduleTestDriveModalProps) {
  const [leadsList, setLeadsList] = useState<{ id: string; customer_name: string }[]>([]);
  const [activeLeadId, setActiveLeadId] = useState(leadId || '');
  const [activeLeadName, setActiveLeadName] = useState(leadName || '');
  const [cars, setCars] = useState<CarType[]>([]);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('Autobourn Showroom, Velachery');
  const [notes, setNotes] = useState('');
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [checkingCollision, setCheckingCollision] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  useEffect(() => {
    if (isOpen) {
      if (!leadId) {
        crmService.getLeads().then((lds) => {
          setLeadsList(lds);
          if (lds.length > 0) {
            setActiveLeadId(lds[0].id);
            setActiveLeadName(lds[0].customer_name);
            if (lds[0].interested_car) {
              // try to match
            }
          }
        });
      } else {
        setActiveLeadId(leadId);
        setActiveLeadName(leadName || 'Client');
      }

      crmService.getCars().then((res) => {
        setCars(res);
        if (res.length > 0) {
          const matched = interestedCarName
            ? res.find((c) => `${c.brand} ${c.model}`.toLowerCase().includes(interestedCarName.toLowerCase()))
            : null;
          setSelectedCarId(matched ? matched.id : res[0].id);
        }
      });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);
      setScheduledAt(tomorrow.toISOString().slice(0, 16));
    }
  }, [isOpen, leadId, leadName, interestedCarName]);

  useEffect(() => {
    if (!selectedCarId || !scheduledAt) return;
    setCheckingCollision(true);
    crmService
      .checkCarAvailability(selectedCarId, scheduledAt)
      .then((res) => {
        if (!res.available) {
          setCollisionWarning(res.conflictMessage || 'Vehicle already has a test drive booked around this time.');
        } else {
          setCollisionWarning(null);
        }
      })
      .finally(() => setCheckingCollision(false));
  }, [selectedCarId, scheduledAt]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCarId) {
      setError('Please select a vehicle from inventory.');
      return;
    }
    if (!scheduledAt) {
      setError('Please select a test drive date and time.');
      return;
    }
    if (collisionWarning) {
      setError('Please resolve the vehicle collision warning before booking.');
      return;
    }

    const car = cars.find((c) => c.id === selectedCarId);
    const car_name = car ? `${car.brand} ${car.model} ${car.variant}` : 'Luxury Vehicle';

    if (onConfirm) {
      onConfirm({
        car_id: selectedCarId,
        car_name,
        scheduled_at: new Date(scheduledAt).toISOString(),
        location,
        notes,
      });
    } else {
      // Standalone direct schedule
      try {
        await crmService.scheduleTestDrive({
          lead_id: activeLeadId,
          car_id: selectedCarId,
          car_name,
          scheduled_at: new Date(scheduledAt).toISOString(),
          location,
          notes,
        });
        await crmService.updateLeadStatus(activeLeadId, 'test_drive_scheduled');
        onScheduled?.();
        handleClose();
      } catch (err: any) {
        setError(err.message || 'Error scheduling test drive');
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 text-gray-900"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Schedule Test Drive</h3>
                <p className="text-xs text-gray-500 font-medium">For client {activeLeadName}</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && <p className="text-xs text-[#E10613] font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}

            {!leadId && leadsList.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Prospect / Customer <span className="text-[#E10613]">*</span>
                </label>
                <select
                  value={activeLeadId}
                  onChange={(e) => {
                    setActiveLeadId(e.target.value);
                    const l = leadsList.find((x) => x.id === e.target.value);
                    if (l) setActiveLeadName(l.customer_name);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none font-medium"
                >
                  {leadsList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customer_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Select Inventory Vehicle <span className="text-[#E10613]">*</span>
              </label>
              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none font-medium"
              >
                {cars.map((car) => (
                  <option key={car.id} value={car.id} disabled={car.status === 'sold'}>
                    {car.brand} {car.model} {car.variant} ({car.year}) — ₹{(car.price / 100000).toFixed(1)}L{' '}
                    {car.status === 'sold' ? '[SOLD]' : car.status === 'reserved' ? '[RESERVED]' : '[AVAILABLE]'}
                  </option>
                ))}
              </select>
            </div>

            {collisionWarning && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{collisionWarning}</span>
              </div>
            )}

            {!collisionWarning && selectedCarId && !checkingCollision && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vehicle available for this time slot. No scheduling collision detected.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Date & Time <span className="text-[#E10613]">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Venue / Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Showroom or Customer Home Address"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-[#E10613] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Route / Client Preference Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific speed test, OMR highway route, or driver license notes..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10613] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!collisionWarning}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md disabled:opacity-50"
              >
                Schedule & Advance Stage
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
