import { Appointment } from "../types/models";
import { supabase } from "../lib/supabase";

type AppointmentRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  date_time: string;
  status: string;
  created_at: string;
};

type AppointmentPayload = Omit<Appointment, "id" | "createdAt">;

const formatAppointment = (row: AppointmentRow): Appointment => {
  const dateTime = new Date(row.date_time);
  if (Number.isNaN(dateTime.getTime())) {
    throw new Error(`Invalid appointment date_time from database: ${row.date_time}`);
  }

  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    appointmentDate: dateTime.toLocaleDateString("en-CA"),
    appointmentTime: dateTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
};

const buildDateTime = (appointmentDate: string, appointmentTime: string): string => {
  const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);
  if (Number.isNaN(dateTime.getTime())) {
    throw new Error(`Invalid appointment date/time: ${appointmentDate} ${appointmentTime}`);
  }
  return dateTime.toISOString();
};

export const appointmentService = {
  getAll: async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from<AppointmentRow>("appointments")
      .select("id, patient_id, doctor_id, date_time, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(formatAppointment);
  },

  create: async (payload: AppointmentPayload): Promise<Appointment> => {
    const { data, error } = await supabase
      .from<AppointmentRow>("appointments")
      .insert({
        patient_id: payload.patientId,
        doctor_id: payload.doctorId,
        date_time: buildDateTime(payload.appointmentDate, payload.appointmentTime),
        status: payload.status,
      })
      .select("id, patient_id, doctor_id, date_time, status, created_at")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to create appointment.");

    return formatAppointment(data);
  },

  update: async (
    id: string,
    updates: Partial<AppointmentPayload>
  ): Promise<Appointment> => {
    const payload: Partial<AppointmentRow> = {};

    if (updates.patientId !== undefined) payload.patient_id = updates.patientId;
    if (updates.doctorId !== undefined) payload.doctor_id = updates.doctorId;
    if (updates.status !== undefined) payload.status = updates.status;

    if (updates.appointmentDate !== undefined || updates.appointmentTime !== undefined) {
      const { data: existing, error: existingError } = await supabase
        .from<Pick<AppointmentRow, "date_time">>("appointments")
        .select("date_time")
        .eq("id", id)
        .single();

      if (existingError) throw existingError;
      if (!existing) throw new Error(`Appointment not found: ${id}`);

      const currentDateTime = new Date(existing.date_time);
      if (Number.isNaN(currentDateTime.getTime())) {
        throw new Error(`Invalid existing appointment date_time: ${existing.date_time}`);
      }

      const currentDate = currentDateTime.toLocaleDateString("en-CA");
      const currentTime = currentDateTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      payload.date_time = buildDateTime(
        updates.appointmentDate ?? currentDate,
        updates.appointmentTime ?? currentTime
      );
    }

    const { data, error } = await supabase
      .from<AppointmentRow>("appointments")
      .update(payload)
      .eq("id", id)
      .select("id, patient_id, doctor_id, date_time, status, created_at")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update appointment.");

    return formatAppointment(data);
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
