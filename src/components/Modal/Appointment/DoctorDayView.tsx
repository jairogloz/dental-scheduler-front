import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { useEffect, useState } from "react";
import { getDoctorAvailability } from "../../../api/entities/Doctor";
import type { Appointment } from "../../../api/entities/Appointment";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";

interface DoctorDayViewProps {
  doctorId: string;
  selectedDate: Date;
  selectedInterval: {
    start: Date;
    end: Date;
  };
  onSlotSelect: (start: Date, end: Date) => void;
}

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DoctorDayView = ({
  doctorId,
  selectedDate,
  selectedInterval,
  onSlotSelect,
}: DoctorDayViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const doctorAppointments = await getDoctorAvailability(
        doctorId,
        selectedDate
      );
      setAppointments(doctorAppointments);
    };
    fetchAppointments();
  }, [doctorId, selectedDate]);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    onSlotSelect(slotInfo.start, slotInfo.end);
  };

  return (
    <div style={{ height: "500px" }}>
      <h4>Horario del Doctor</h4>
      <Calendar
        localizer={localizer}
        defaultView={Views.DAY}
        views={[Views.DAY]}
        events={[
          ...appointments.map((apt) => ({
            title: "Ocupado",
            start: new Date(apt.start),
            end: new Date(apt.end),
          })),
          {
            title: "Seleccionado",
            start: selectedInterval.start,
            end: selectedInterval.end,
            backgroundColor: "#28a745",
          },
        ]}
        step={15}
        timeslots={1}
        min={new Date(0, 0, 0, 7, 0, 0)} // Start at 7:00 AM
        max={new Date(0, 0, 0, 23, 0, 0)} // End at 11:00 PM
        selectable
        onSelectSlot={handleSelectSlot}
        date={selectedDate}
        toolbar={false}
      />
    </div>
  );
};

export default DoctorDayView;
