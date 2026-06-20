export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900">Access Denied</h1>
        <p className="mt-4 text-sm text-slate-600">You do not have permission to view this section.</p>
      </div>
    </div>
  );
}
