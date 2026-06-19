import { Patient } from "../types/models";
import { supabase } from "../lib/supabase";

export const patientService = {
  getAll: async (): Promise<Patient[]> => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((p) => ({
      id: p.id,
      mrn: p.mrn,
      fullName: p.full_name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      address: p.address,

      createdAt: p.created_at,
    }));
  },

  create: async (
    payload: Omit<Patient, "id" | "createdAt">
  ): Promise<Patient> => {
    const { data, error } = await supabase
      .from("patients")
      .insert({
        mrn: payload.mrn,
        full_name: payload.fullName,
        age: payload.age,
        gender: payload.gender,
        phone: payload.phone,
        address: payload.address,

      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      mrn: data.mrn,
      fullName: data.full_name,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      address: data.address,

      createdAt: data.created_at,
    };
  },

  update: async (
    id: string,
    updates: Partial<Omit<Patient, "id" | "createdAt">>
  ): Promise<Patient> => {
    const payload: Record<string, any> = {};

    if (updates.mrn !== undefined) payload.mrn = updates.mrn;
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.age !== undefined) payload.age = updates.age;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.address !== undefined) payload.address = updates.address;



    const { data, error } = await supabase
      .from("patients")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      mrn: data.mrn,
      fullName: data.full_name,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      address: data.address,

      createdAt: data.created_at,
    };
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};