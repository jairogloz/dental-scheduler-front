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
  existingAppointments?: Appointment[]; // New prop
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
  existingAppointments = [], // Default to empty array
}: DoctorDayViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If existingAppointments are provided, use them and filter for the selected doctor and date
    if (existingAppointments.length > 0) {
      const doctorAppointmentsForDate = existingAppointments.filter((apt) => {
        const appointmentDate = new Date(apt.start);
        const selectedDateStr = selectedDate.toDateString();
        const appointmentDateStr = appointmentDate.toDateString();

        return (
          apt.doctorId === doctorId &&
          appointmentDateStr === selectedDateStr &&
          apt.status !== "cancelled"
        ); // Exclude cancelled appointments
      });

      console.log(
        `📅 DoctorDayView: Found ${
          doctorAppointmentsForDate.length
        } appointments for doctor ${doctorId} on ${selectedDate.toDateString()}`
      );
      setAppointments(doctorAppointmentsForDate);
      setIsLoading(false);
    } else {
      // Fallback to the old API call if no existing appointments are provided
      console.log(
        `📅 DoctorDayView: No existing appointments provided, falling back to API call`
      );
      const fetchAppointments = async () => {
        setIsLoading(true);
        try {
          const doctorAppointments = await getDoctorAvailability(
            doctorId,
            selectedDate
          );
          setAppointments(doctorAppointments);
          console.log(
            `📅 DoctorDayView: Fetched ${doctorAppointments.length} appointments from API`
          );
        } catch (error) {
          console.error("Error fetching appointments:", error);
          setAppointments([]); // Set to empty array on error
        } finally {
          setIsLoading(false);
        }
      };

      fetchAppointments();
    }
  }, [doctorId, selectedDate, existingAppointments]); // Include existingAppointments in dependencies

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    onSlotSelect(slotInfo.start, slotInfo.end);
  };

  // Calculate scroll time: 30 minutes before the selected time to give context
  const scrollToTime = new Date(selectedInterval.start);
  scrollToTime.setMinutes(scrollToTime.getMinutes() - 30);

  return (
    <div style={{ height: "500px" }}>
      <h4>Horario del Doctor {isLoading && "(Cargando...)"}</h4>
      <Calendar
        localizer={localizer}
        defaultView={Views.DAY}
        views={[Views.DAY]}
        events={[
          ...appointments.map((apt) => ({
            title: `${apt.patient_name || apt.patientId} - ${apt.treatment}`, // Show patient name (fallback to ID) and treatment
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
        eventPropGetter={(event) => ({
          style: {
            backgroundColor:
              event.title === "Seleccionado" ? "#28a745" : "#dc3545",
            color: "white",
            borderRadius: "4px",
            border: "none",
            fontSize: "12px", // Make text slightly smaller to fit
            padding: "2px 4px",
          },
        })}
        scrollToTime={scrollToTime}
      />
    </div>
  );
};

export default DoctorDayView;
