import { Doctor } from "../../types/models";

interface DoctorTableProps {
  doctors: Doctor[];
  loading: boolean;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onEdit: (doctor: Doctor) => void;
  onDelete: (id: string) => void;
}

export default function DoctorTable({ doctors, loading, searchTerm, onSearchTermChange, onEdit, onDelete }: DoctorTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Doctor roster</h2>
          <p className="text-sm text-slate-500">Mock service-backed doctors table for Stage 1.</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by name or specialization…"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500"
      />

      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.24em]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Specialization</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading doctors…</td>
              </tr>
            ) : doctors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No doctors registered yet.</td>
              </tr>
            ) : (
              doctors.map((doctor) => {
                const statusColor =
                  doctor.availability === "Available"
                    ? "text-emerald-600 bg-emerald-50"
                    : doctor.availability === "On Leave"
                    ? "text-orange-600 bg-orange-50"
                    : "text-red-600 bg-red-50";
                return (
                  <tr key={doctor.id}>
                    <td className="px-4 py-4 text-slate-900 font-semibold">{doctor.name}</td>
                    <td className="px-4 py-4 text-slate-600">{doctor.specialization}</td>
                    <td className="px-4 py-4 text-slate-600">{doctor.phone}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                        {doctor.availability}
                      </span>
                    </td>
                    <td className="px-4 py-4 space-x-2">
                      <button
                        onClick={() => onEdit(doctor)}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(doctor.id)}
                        className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
