'use client';

import { useState, useEffect } from 'react';
import moment from 'moment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date | null;
  userRole: 'neighbor' | 'trainer' | 'admin';
  onConfirm?: (booking: { start: Date; end: Date; duration: number }) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  startTime,
  userRole,
  onConfirm,
}: BookingModalProps) {
  const [duration, setDuration] = useState<number>(60); // Default 60 minutes
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>('');
  const [clientReference, setClientReference] = useState<string>('');

  // Calculate end time whenever start time or duration changes
  useEffect(() => {
    if (startTime) {
      const calculatedEndTime = moment(startTime)
        .add(duration, 'minutes')
        .toDate();
      setEndTime(calculatedEndTime);
      validateBooking(startTime, calculatedEndTime);
    }
  }, [startTime, duration]);

  const validateBooking = (start: Date, end: Date) => {
    setValidationError('');

    // Check if booking is in the past
    if (moment(start).isBefore(moment())) {
      setValidationError('No se pueden reservar horarios en el pasado.');
      return false;
    }

    // Check 7-day limit for neighbors
    if (userRole === 'neighbor') {
      const maxDate = moment().add(7, 'days').endOf('day');
      if (moment(start).isAfter(maxDate)) {
        setValidationError(
          'Los vecinos solo pueden reservar hasta con 7 días de anticipación.'
        );
        return false;
      }
    }

    // Check if booking stays within gym hours (6:00 AM - 10:00 PM)
    const startHour = moment(start).hour();
    const startMinute = moment(start).minute();
    const endHour = moment(end).hour();
    const endMinute = moment(end).minute();

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    const gymOpenTime = 6 * 60; // 6:00 AM in minutes
    const gymCloseTime = 22 * 60; // 10:00 PM in minutes

    if (startTimeInMinutes < gymOpenTime) {
      setValidationError('El gimnasio abre a las 6:00 AM.');
      return false;
    }

    if (endTimeInMinutes > gymCloseTime) {
      setValidationError(
        'La reserva se extiende más allá del horario de cierre del gimnasio (10:00 PM).'
      );
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    if (!startTime || !endTime) return;

    // Clear previous API errors
    setApiError('');

    // Run client-side validation first
    if (!validateBooking(startTime, endTime)) {
      return;
    }

    setIsLoading(true);

    try {
      // Call API to create booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration,
          client_reference: clientReference.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        setApiError(data.error || 'Failed to create booking');
        setIsLoading(false);
        return;
      }

      // Success! Call the onConfirm callback
      if (onConfirm) {
        onConfirm({
          start: startTime,
          end: endTime,
          duration,
        });
      }

      // Close modal
      handleClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      setApiError(
        'Error de red. Por favor verifica tu conexión e intenta de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setValidationError('');
    setApiError('');
    setDuration(60);
    setIsLoading(false);
    setClientReference('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reservar Horario del Gimnasio</DialogTitle>
          <DialogDescription>
            Selecciona tu duración preferida para esta sesión de gimnasio.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Start Time Display */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="start-time"
              className="text-right text-sm font-medium"
            >
              Hora Inicio
            </label>
            <div className="col-span-3 text-sm text-gray-700">
              {startTime
                ? moment(startTime).format('dddd, MMMM Do, YYYY [a las] h:mm A')
                : 'N/A'}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="duration"
              className="text-right text-sm font-medium"
            >
              Duración
            </label>
            <div className="col-span-3">
              <Select
                value={duration.toString()}
                onValueChange={(value) => setDuration(parseInt(value))}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Seleccionar duración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">60 minutos (1 hora)</SelectItem>
                  <SelectItem value="90">90 minutos (1.5 horas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End Time Display */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="end-time"
              className="text-right text-sm font-medium"
            >
              Hora Fin
            </label>
            <div className="col-span-3 text-sm text-gray-700">
              {endTime ? moment(endTime).format('h:mm A') : 'N/A'}
            </div>
          </div>

          {/* Client Reference (Trainers only) */}
          {userRole === 'trainer' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="client-reference"
                className="text-right text-sm font-medium"
              >
                Cliente
              </label>
              <div className="col-span-3">
                <input
                  type="text"
                  id="client-reference"
                  placeholder="Nombre del cliente (opcional)"
                  value={clientReference}
                  onChange={(e) => setClientReference(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional: Agrega una referencia a tu cliente
                </p>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="col-span-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {validationError}
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="col-span-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {apiError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!!validationError || !startTime || isLoading}
          >
            {isLoading ? 'Creando...' : 'Confirmar Reserva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
