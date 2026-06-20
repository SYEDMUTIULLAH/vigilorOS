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
    console.log("REQUEST START", "appointments", "getAll");
    const result = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id, date_time, status, created_at")
      .order("created_at", { ascending: false });
    console.log("REQUEST END", "appointments", "getAll", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;
    if (!result.data) return [];

    return result.data.map(formatAppointment);
  },

  create: async (payload: AppointmentPayload): Promise<Appointment> => {
    console.log("REQUEST START", "appointments", "create", payload);
    const result = await supabase
      .from("appointments")
      .insert({
        patient_id: payload.patientId,
        doctor_id: payload.doctorId,
        date_time: buildDateTime(payload.appointmentDate, payload.appointmentTime),
        status: payload.status,
      })
      .select("id, patient_id, doctor_id, date_time, status, created_at")
      .single();
    console.log("REQUEST END", "appointments", "create", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;
    if (!result.data) throw new Error("Failed to create appointment.");

    return formatAppointment(result.data);
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
      console.log("REQUEST START", "appointments", "fetchExisting", { id });
      const existingResult = await supabase
        .from("appointments")
        .select("date_time")
        .eq("id", id)
        .single();
      console.log("REQUEST END", "appointments", "fetchExisting", {
        data: existingResult.data,
        error: existingResult.error,
      });

      if (existingResult.error) throw existingResult.error;
      if (!existingResult.data) throw new Error(`Appointment not found: ${id}`);

      const currentDateTime = new Date(existingResult.data.date_time);
      if (Number.isNaN(currentDateTime.getTime())) {
        throw new Error(`Invalid existing appointment date_time: ${existingResult.data.date_time}`);
      }

      const currentDate = currentDateTime.toISOString().slice(0, 10);
      const currentTime = currentDateTime.toISOString().slice(11, 16);
      const appointmentDate = updates.appointmentDate ?? currentDate;
      const appointmentTime = updates.appointmentTime ?? currentTime;
      payload.date_time = buildDateTime(appointmentDate, appointmentTime);
    }

    console.log("REQUEST START", "appointments", "update", { id, payload });
    const result = await supabase
      .from("appointments")
      .update(payload)
      .eq("id", id)
      .select("id, patient_id, doctor_id, date_time, status, created_at")
      .single();
    console.log("REQUEST END", "appointments", "update", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;
    if (!result.data) throw new Error("Failed to update appointment.");

    return formatAppointment(result.data);
  },

  remove: async (id: string): Promise<void> => {
    console.log("REQUEST START", "appointments", "remove", { id });
    const result = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);
    console.log("REQUEST END", "appointments", "remove", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;
  },
};
