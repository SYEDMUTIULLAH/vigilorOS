import { FormEvent, useEffect, useState } from "react";
import { Doctor } from "../../types/models";

interface DoctorFormProps {
  onSubmit: (payload: Omit<Doctor, "id" | "createdAt">) => Promise<void>;
  initialData?: Doctor;
  submitLabel: string;
  onCancel: () => void;
}

export default function DoctorForm({ onSubmit, initialData, submitLabel, onCancel }: DoctorFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [specialization, setSpecialization] = useState(initialData?.specialization ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [availability, setAvailability] = useState<Doctor["availability"]>(initialData?.availability ?? "Available");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSpecialization(initialData.specialization);
      setPhone(initialData.phone);
      setAvailability(initialData.availability);
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name, specialization, phone, availability });
      if (!initialData) {
        setName("");
        setSpecialization("");
        setPhone("");
        setAvailability("Available");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Doctor details</h2>
        <p className="text-sm text-slate-500">Track physician profiles in a mock service-ready component.</p>
      </div>

      <label className="block text-sm text-slate-700">
        Name
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
        />
      </label>

      <label className="block text-sm text-slate-700">
        Specialization
        <input
          required
          value={specialization}
          onChange={(event) => setSpecialization(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
        />
      </label>

      <label className="block text-sm text-slate-700">
        Phone
        <input
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
        />
      </label>

      <label className="block text-sm text-slate-700">
        Availability
        <select
          required
          value={availability}
          onChange={(event) => setAvailability(event.target.value as Doctor["availability"])}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
        >
          <option>Available</option>
          <option>Unavailable</option>
          <option>On Leave</option>
        </select>
      </label>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
