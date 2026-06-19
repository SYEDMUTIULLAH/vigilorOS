import { FormEvent, useEffect, useState } from "react";
import { Patient } from "../../types/models";

interface PatientFormProps {
  onSubmit: (payload: Omit<Patient, "id" | "createdAt">) => Promise<void>;
  initialData?: Patient;
  submitLabel: string;
  onCancel: () => void;
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientForm({ onSubmit, initialData, submitLabel, onCancel }: PatientFormProps) {
  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [mrn, setMrn] = useState(initialData?.mrn ?? "");
  const [age, setAge] = useState(initialData?.age ?? 0);
  const [gender, setGender] = useState<Patient["gender"]>(initialData?.gender ?? "Male");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [bloodGroup, setBloodGroup] = useState(initialData?.bloodGroup ?? "O+");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName);
      setMrn(initialData.mrn);
      setAge(initialData.age);
      setGender(initialData.gender);
      setPhone(initialData.phone ?? "");
      setAddress(initialData.address ?? "");
      setBloodGroup(initialData.bloodGroup ?? "O+");
    } else {
      setFullName("");
      setMrn("");
      setAge(0);
      setGender("Male");
      setPhone("");
      setAddress("");
      setBloodGroup("O+");
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ mrn, fullName, age, gender, phone, address, bloodGroup });
      if (!initialData) {
        setFullName("");
        setMrn("");
        setAge(0);
        setGender("Male");
        setPhone("");
        setAddress("");
        setBloodGroup("O+");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Patient details</h2>
        <p className="text-sm text-slate-500">Capture patient fields for the new hospital registry.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm text-slate-700">
          MRN
          <input
            required
            value={mrn}
            onChange={(event) => setMrn(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>

        <label className="block text-sm text-slate-700">
          Full Name
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm text-slate-700">
          Age
          <input
            required
            type="number"
            min={0}
            value={age}
            onChange={(event) => setAge(Number(event.target.value))}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm text-slate-700">
          Gender
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value as Patient["gender"])}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </label>

        <label className="block text-sm text-slate-700">
          Blood Group
          <select
            value={bloodGroup}
            onChange={(event) => setBloodGroup(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          >
            {bloodGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4">
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
          Address
          <textarea
            required
            rows={3}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
