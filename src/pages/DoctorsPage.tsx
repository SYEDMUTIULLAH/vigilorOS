import { useEffect, useMemo, useState } from "react";
import { Doctor } from "../types/models";
import { doctorService } from "../services/doctorService";
import DoctorForm from "../components/common/DoctorForm";
import DoctorTable from "../components/common/DoctorTable";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getAll();
      setDoctors(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleCreate = async (doctor: Omit<Doctor, "id" | "createdAt">) => {
    const created = await doctorService.create(doctor);
    setDoctors((current) => [created, ...current]);
  };

  const handleUpdate = async (id: string, updates: Partial<Omit<Doctor, "id" | "createdAt">>) => {
    const updated = await doctorService.update(id, updates);
    setDoctors((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedDoctor(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await doctorService.remove(id);
      setDoctors((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete doctor:", error);
    }
  };

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(q) ||
        doctor.specialization.toLowerCase().includes(q)
    );
  }, [doctors, searchTerm]);

  const doctorStats = useMemo(
    () => ({
      total: doctors.length,
      available: doctors.filter((doctor) => doctor.availability === "Available").length,
      unavailable: doctors.filter((doctor) => doctor.availability === "Unavailable").length,
      onLeave: doctors.filter((doctor) => doctor.availability === "On Leave").length,
    }),
    [doctors]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold font-mono">Stage 1 Foundation</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Doctors Directory</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">Register and manage doctors in a reusable service layer designed for later persistence integration.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-100">{doctorStats.total} doctors</span>
            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(null);
              }}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Add Doctor
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Total</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{doctorStats.total}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Available</div>
            <div className="mt-3 text-3xl font-bold text-emerald-700">{doctorStats.available}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Unavailable</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{doctorStats.unavailable}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">On Leave</div>
            <div className="mt-3 text-3xl font-bold text-orange-600">{doctorStats.onLeave}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <DoctorForm
            onSubmit={selectedDoctor ? (payload) => handleUpdate(selectedDoctor.id, payload) : handleCreate}
            initialData={selectedDoctor ?? undefined}
            submitLabel={selectedDoctor ? "Save Changes" : "Add Doctor"}
            onCancel={() => setSelectedDoctor(null)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <DoctorTable
            doctors={filteredDoctors}
            loading={loading}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onEdit={setSelectedDoctor}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
