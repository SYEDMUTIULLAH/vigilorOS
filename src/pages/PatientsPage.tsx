import { useEffect, useMemo, useState } from "react";
import { Patient } from "../types/models";
import { patientService } from "../services/patientService";
import PatientForm from "../components/common/PatientForm";
import PatientTable from "../components/common/PatientTable";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.getAll();
      setPatients(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleCreate = async (patient: Omit<Patient, "id" | "createdAt">) => {
    console.log("handleCreate called", patient);

    const created = await patientService.create(patient);

    console.log("Created patient:", created);

    setPatients((current) => [created, ...current]);
  };

  const handleUpdate = async () => {
    alert("Update feature coming soon");
  };

  const handleDelete = async (id: string) => {
    try {
     await patientService.delete(id);
      setPatients((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete patient:", error);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return patients;
   return patients.filter((patient) =>
    patient.fullName.toLowerCase().includes(q)
);
  }, [patients, searchTerm]);

  const patientStats = useMemo(
    () => ({
      total: patients.length,
      male: patients.filter((patient) => patient.gender === "Male").length,
      female: patients.filter((patient) => patient.gender === "Female").length,
      other: patients.filter((patient) => patient.gender === "Other").length,
    }),
    [patients]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold font-mono">Stage 1 Foundation</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Patients Registry</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Manage hospital patient records with Supabase cloud database integration.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-100">{patientStats.total} patients</span>
          <button
            type="button"
            onClick={() => {
              setSelectedPatient(null);
            }}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Add Patient
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Total</div>
          <div className="mt-3 text-3xl font-bold text-slate-900">{patientStats.total}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Male</div>
          <div className="mt-3 text-3xl font-bold text-slate-900">{patientStats.male}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">Female</div>
          <div className="mt-3 text-3xl font-bold text-slate-900">{patientStats.female}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <PatientForm
            onSubmit={handleCreate}
            initialData={undefined}
            submitLabel="Add Patient"
            onCancel={() => {}}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <PatientTable
            patients={filteredPatients}
            loading={loading}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onEdit={setSelectedPatient}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
