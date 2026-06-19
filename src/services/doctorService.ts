import { Doctor } from "../types/models";
import { supabase } from "../lib/supabase";

export const doctorService = {
  getAll: async (): Promise<Doctor[]> => {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((doctor) => ({
      id: doctor.id,
      name: doctor.full_name,
      specialization: doctor.specialty,
      phone: doctor.phone,
      availability: doctor.availability || "Available",
      createdAt: new Date(doctor.created_at).toISOString(),
    }));
  },

  create: async (payload: Omit<Doctor, "id" | "createdAt">): Promise<Doctor> => {
    const { data, error } = await supabase
      .from("doctors")
      .insert({
        full_name: payload.name,
        specialty: payload.specialization,
        phone: payload.phone,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.full_name,
      specialization: data.specialty,
      phone: data.phone,
      availability: data.availability,
      createdAt: new Date(data.created_at).toISOString(),
    };
  },

  update: async (id: string, updates: Partial<Omit<Doctor, "id" | "createdAt">>): Promise<Doctor> => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.full_name = updates.name;
    if (updates.specialization !== undefined) payload.specialty = updates.specialization;
    if (updates.phone !== undefined) payload.phone = updates.phone;

    const { data, error } = await supabase
      .from("doctors")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.full_name,
      specialization: data.specialty,
      phone: data.phone,
      availability: data.availability,
      createdAt: new Date(data.createdAt).toISOString(),
    };
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
