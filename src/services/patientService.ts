import { Patient } from "../types/models";
import { supabase } from "../lib/supabase";

export const patientService = {
  getAll: async (): Promise<Patient[]> => {
    console.log("REQUEST START", "patients", "getAll");
    const result = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    console.log("REQUEST END", "patients", "getAll", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;

    return result.data.map((p) => ({
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
    console.log("REQUEST START", "patients", "create", payload);
    const result = await supabase
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
    console.log("REQUEST END", "patients", "create", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;

    return {
      id: result.data.id,
      mrn: result.data.mrn,
      fullName: result.data.full_name,
      age: result.data.age,
      gender: result.data.gender,
      phone: result.data.phone,
      address: result.data.address,

      createdAt: result.data.created_at,
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

    console.log("REQUEST START", "patients", "update", { id, updates });
    const result = await supabase
      .from("patients")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    console.log("REQUEST END", "patients", "update", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;
    if (!result.data) throw new Error("Failed to update patient.");

    return {
      id: result.data.id,
      mrn: result.data.mrn,
      fullName: result.data.full_name,
      age: result.data.age,
      gender: result.data.gender,
      phone: result.data.phone,
      address: result.data.address,

      createdAt: result.data.created_at,
    };
  },

  remove: async (id: string): Promise<void> => {
    console.log("REQUEST START", "patients", "remove", { id });
    const result = await supabase
      .from("patients")
      .delete()
      .eq("id", id);
    console.log("REQUEST END", "patients", "remove", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;
  },

  delete: async (id: string): Promise<void> => {
    console.log("REQUEST START", "patients", "delete", { id });
    const result = await supabase
      .from("patients")
      .delete()
      .eq("id", id);
    console.log("REQUEST END", "patients", "delete", {
      data: result.data,
      error: result.error,
    });

    if (result.error) throw result.error;
  },
};