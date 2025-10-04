/**
 * Appointment status constants and utility functions
 */

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed', 
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  NO_SHOW: 'no-show'
} as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];

export interface StatusOption {
  value: AppointmentStatus;
  label: string;
}

/**
 * Get available status options based on appointment time
 * @param appointmentStart - The appointment start time
 * @returns Array of status options available for selection
 */
export const getAvailableStatusOptions = (appointmentStart: Date): StatusOption[] => {
  const now = new Date();
  const isPastAppointment = appointmentStart < now;

  if (isPastAppointment) {
    // For past appointments: scheduled, completed, no-show
    return [
      { value: APPOINTMENT_STATUS.SCHEDULED, label: 'Programada' },
      { value: APPOINTMENT_STATUS.COMPLETED, label: 'Completada' },
      { value: APPOINTMENT_STATUS.NO_SHOW, label: 'No se presentó' }
    ];
  } else {
    // For future appointments: scheduled, confirmed
    return [
      { value: APPOINTMENT_STATUS.SCHEDULED, label: 'Programada' },
      { value: APPOINTMENT_STATUS.CONFIRMED, label: 'Confirmada' }
    ];
  }
};

/**
 * Get the display label for a status
 * @param status - The appointment status
 * @returns The Spanish label for the status
 */
export const getStatusLabel = (status: AppointmentStatus): string => {
  const statusLabels: Record<AppointmentStatus, string> = {
    [APPOINTMENT_STATUS.SCHEDULED]: 'Programada',
    [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmada',
    [APPOINTMENT_STATUS.COMPLETED]: 'Completada',
    [APPOINTMENT_STATUS.CANCELLED]: 'Cancelada',
    [APPOINTMENT_STATUS.RESCHEDULED]: 'Reagendada', 
    [APPOINTMENT_STATUS.NO_SHOW]: 'No se presentó'
  };

  return statusLabels[status] || status;
};

/**
 * Check if an appointment is in the past
 * @param appointmentStart - The appointment start time
 * @returns True if the appointment is in the past
 */
export const isAppointmentPast = (appointmentStart: Date): boolean => {
  const now = new Date();
  return appointmentStart < now;
};
