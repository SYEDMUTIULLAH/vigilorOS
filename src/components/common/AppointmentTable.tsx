import { Appointment, Doctor, Patient } from "../../types/models";

interface AppointmentTableProps {
  appointments: Appointment[];
  loading: boolean;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  patientMap: Record<string, Patient>;
  doctorMap: Record<string, Doctor>;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

export default function AppointmentTable({
  appointments,
  loading,
  searchTerm,
  onSearchTermChange,
  patientMap,
  doctorMap,
  onEdit,
  onDelete,
}: AppointmentTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Appointments list</h2>
          <p className="text-sm text-slate-500">View and manage scheduled appointments.</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by patient or doctor name…"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500"
      />

      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.24em]">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading appointments…
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No appointments scheduled.
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => {
                const statusColor =
                  appointment.status === "Scheduled"
                    ? "text-indigo-600 bg-indigo-50"
                    : appointment.status === "Completed"
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-red-600 bg-red-50";

                return (
                  <tr key={appointment.id}>
                    <td className="px-4 py-4 text-slate-900 font-semibold">
                      {patientMap[appointment.patientId]?.name ?? "Unknown patient"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {doctorMap[appointment.doctorId]?.name ?? "Unknown doctor"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {new Date(appointment.appointmentDate + "T00:00:00").toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{appointment.appointmentTime}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 space-x-2">
                      <button
                        onClick={() => onEdit(appointment)}
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(appointment.id)}
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
