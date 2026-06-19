import { Patient } from "../../types/models";

interface PatientTableProps {
  patients: Patient[];
  loading: boolean;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
}

export default function PatientTable({ patients, loading, searchTerm, onSearchTermChange, onEdit, onDelete }: PatientTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Patient list</h2>
          <p className="text-sm text-slate-500">Editable patient records from mock service state.</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by patient name…"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
      />

      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.24em]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Blood group</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading patients…</td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No patients defined yet.</td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-4 py-4 text-slate-900 font-semibold">{patient.fullName}</td>
                  <td className="px-4 py-4 text-slate-600">{patient.age}</td>
                  <td className="px-4 py-4 text-slate-600">{patient.phone}</td>
                  <td className="px-4 py-4 text-slate-600">{patient.bloodGroup}</td>
                  <td className="px-4 py-4 space-x-2">
                    <button
                      onClick={() => onEdit(patient)}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(patient.id)}
                      className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
