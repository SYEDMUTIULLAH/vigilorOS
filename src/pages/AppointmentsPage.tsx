import { useEffect, useMemo, useState } from "react";
import { Appointment, Doctor, Patient } from "../types/models";
import { appointmentService } from "../services/appointmentService";
import { doctorService } from "../services/doctorService";
import { patientService } from "../services/patientService";
import AppointmentForm from "../components/common/AppointmentForm";
import AppointmentTable from "../components/common/AppointmentTable";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [appointmentsData, patientData, doctorData] = await Promise.all([
        appointmentService.getAll(),
        patientService.getAll(),
        doctorService.getAll(),
      ]);
      setAppointments(appointmentsData);
      setPatients(patientData);
      setDoctors(doctorData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const patientMap = useMemo(() => {
    return patients.reduce<Record<string, Patient>>((acc, patient) => {
      acc[patient.id] = patient;
      return acc;
    }, {});
  }, [patients]);

  const doctorMap = useMemo(() => {
    return doctors.reduce<Record<string, Doctor>>((acc, doctor) => {
      acc[doctor.id] = doctor;
      return acc;
    }, {});
  }, [doctors]);

  const handleCreate = async (appointment: Omit<Appointment, "id" | "createdAt">) => {
    const created = await appointmentService.create(appointment);
    setAppointments((current) => [created, ...current]);
  };

  const handleUpdate = async (id: string, updates: Partial<Omit<Appointment, "id" | "createdAt">>) => {
    const updated = await appointmentService.update(id, updates);
    setAppointments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedAppointment(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await appointmentService.remove(id);
      setAppointments((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    }
  };

  const filteredAppointments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (appointment) =>
        patientMap[appointment.patientId]?.name.toLowerCase().includes(q) ||
        doctorMap[appointment.doctorId]?.name.toLowerCase().includes(q)
    );
  }, [appointments, searchTerm, patientMap, doctorMap]);

  const appointmentStats = useMemo(
    () => ({
      total: appointments.length,
      scheduled: appointments.filter((apt) => apt.status === "Scheduled").length,
      completed: appointments.filter((apt) => apt.status === "Completed").length,
      cancelled: appointments.filter((apt) => apt.status === "Cancelled").length,
    }),
    [appointments]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold font-mono">Stage 1 Foundation</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Appointments</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">Book, edit, and manage appointments in mock mode while preserving existing application flow.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 border border-indigo-100">{appointmentStats.total} appointments</span>
            <button
              type="button"
              onClick={() => {
                setSelectedAppointment(null);
              }}
              className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Add Appointment
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Total</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{appointmentStats.total}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Scheduled</div>
            <div className="mt-3 text-3xl font-bold text-indigo-700">{appointmentStats.scheduled}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Completed</div>
            <div className="mt-3 text-3xl font-bold text-emerald-700">{appointmentStats.completed}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Cancelled</div>
            <div className="mt-3 text-3xl font-bold text-red-700">{appointmentStats.cancelled}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <AppointmentForm
            patients={patients}
            doctors={doctors}
            onSubmit={selectedAppointment ? (payload) => handleUpdate(selectedAppointment.id, payload) : handleCreate}
            initialData={selectedAppointment ?? undefined}
            submitLabel={selectedAppointment ? "Update Appointment" : "Schedule Appointment"}
            onCancel={() => setSelectedAppointment(null)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <AppointmentTable
            appointments={filteredAppointments}
            loading={loading}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            patientMap={patientMap}
            doctorMap={doctorMap}
            onEdit={setSelectedAppointment}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
