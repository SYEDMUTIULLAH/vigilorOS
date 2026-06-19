import { FormEvent, useEffect, useState } from "react";
import { Appointment, Doctor, Patient } from "../../types/models";

interface AppointmentFormProps {
  patients: Patient[];
  doctors: Doctor[];
  onSubmit: (payload: Omit<Appointment, "id" | "createdAt">) => Promise<void>;
  initialData?: Appointment;
  submitLabel: string;
  onCancel: () => void;
}

export default function AppointmentForm({ patients, doctors, onSubmit, initialData, submitLabel, onCancel }: AppointmentFormProps) {
  const [patientId, setPatientId] = useState(initialData?.patientId ?? "");
  const [doctorId, setDoctorId] = useState(initialData?.doctorId ?? "");
  const [appointmentDate, setAppointmentDate] = useState(initialData?.appointmentDate ?? "");
  const [appointmentTime, setAppointmentTime] = useState(initialData?.appointmentTime ?? "");
  const [status, setStatus] = useState<Appointment["status"]>(initialData?.status ?? "Scheduled");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setPatientId(initialData.patientId);
      setDoctorId(initialData.doctorId);
      setAppointmentDate(initialData.appointmentDate);
      setAppointmentTime(initialData.appointmentTime);
      setStatus(initialData.status);
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ patientId, doctorId, appointmentDate, appointmentTime, status });
      if (!initialData) {
        setPatientId("");
        setDoctorId("");
        setAppointmentDate("");
        setAppointmentTime("");
        setStatus("Scheduled");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Schedule appointment</h2>
        <p className="text-sm text-slate-500">Link patients with doctors for future appointments.</p>
      </div>

      <label className="block text-sm text-slate-700">
        Patient
        <select
          required
          value={patientId}
          onChange={(event) => setPatientId(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
        >
          <option value="">Select Patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>{patient.name}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-slate-700">
        Doctor
        <select
          required
          value={doctorId}
          onChange={(event) => setDoctorId(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
        >
          <option value="">Select Doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>{doctor.name} — {doctor.specialization}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-slate-700">
        Appointment Date
        <input
          required
          type="date"
          value={appointmentDate}
          onChange={(event) => setAppointmentDate(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
        />
      </label>

      <label className="block text-sm text-slate-700">
        Appointment Time
        <input
          required
          type="time"
          value={appointmentTime}
          onChange={(event) => setAppointmentTime(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
        />
      </label>

      <label className="block text-sm text-slate-700">
        Status
        <select
          required
          value={status}
          onChange={(event) => setStatus(event.target.value as Appointment["status"])}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
        >
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </label>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
