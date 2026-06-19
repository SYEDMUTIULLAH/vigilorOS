import { Appointment } from "../types/models";
import { supabase } from "../lib/supabase";

export const appointmentService = {
  getAll: async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return data.map((appointment) => ({
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.dateTime.split("T")[0],
      appointmentTime: new Date(appointment.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: appointment.status,
      createdAt: new Date(appointment.createdAt).toISOString(),
    }));
  },

  create: async (payload: Omit<Appointment, "id" | "createdAt">): Promise<Appointment> => {
    const dateTime = new Date(`${payload.appointmentDate}T${payload.appointmentTime}`).toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        dateTime,
        status: payload.status,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: data.dateTime.split("T")[0],
      appointmentTime: new Date(data.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: data.status,
      createdAt: new Date(data.createdAt).toISOString(),
    };
  },

  update: async (id: string, updates: Partial<Omit<Appointment, "id" | "createdAt">>): Promise<Appointment> => {
    const payload: Record<string, any> = {};
    if (updates.patientId !== undefined) payload.patientId = updates.patientId;
    if (updates.doctorId !== undefined) payload.doctorId = updates.doctorId;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.appointmentDate !== undefined && updates.appointmentTime !== undefined) {
      payload.dateTime = new Date(`${updates.appointmentDate}T${updates.appointmentTime}`).toISOString();
    } else if (updates.appointmentDate !== undefined) {
      payload.dateTime = new Date(`${updates.appointmentDate}T00:00:00`).toISOString();
    } else if (updates.appointmentTime !== undefined) {
      payload.dateTime = new Date(`${new Date().toISOString().split("T")[0]}T${updates.appointmentTime}`).toISOString();
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: data.dateTime.split("T")[0],
      appointmentTime: new Date(data.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: data.status,
      createdAt: new Date(data.createdAt).toISOString(),
    };
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
