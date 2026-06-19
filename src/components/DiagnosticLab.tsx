import React, { useState, useEffect } from "react";
import { Bed, Patient, LabReport } from "../types";
import { 
  Activity, 
  Search, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Plus, 
  Layers, 
  FlaskConical, 
  Trash2, 
  Sliders,
  Check,
  AlertCircle
} from "lucide-react";
import { useHospital } from "../context/HospitalContext";

interface DiagnosticLabProps {
  onRefreshGlobal?: () => Promise<void>;
}

interface CombinedPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  type: "Inpatient" | "Outpatient";
  diagnosis: string;
  bedId?: string;
  ward?: string;
}

const COMMON_TESTS_CATALOG = [
  "Blood Sugar Fasting Test",
  "Complete Blood Count (CBC) with Differential",
  "HbA1c Glycated Hemoglobin",
  "Lipid Profile Panel (Cholesterol/Triglycerides)",
  "Kidney Function Renal Panel (Urea/Creatinine)",
  "Liver Function LFT Panel",
  "Thyroid Stimulating Hormone (TSH)",
  "Arterial Blood Gas (ABG) Analysis",
  "Serum Electrolytes Panel",
  "Cardiac Troponin T/I STAT",
  "Pulmonary Function Mechanics Spirometry",
  "Urinalysis routine microscopic",
  "12-Lead Electrocardiogram (ECG)",
  "High Resolution Chest Computed Tomography (HRCT)",
  "Abdomen Pelvic Ultrasound Scan"
];

export default function DiagnosticLab({ onRefreshGlobal }: DiagnosticLabProps) {
  const { beds, outpatients, labReports, requestLabReport, finalizeLabReport } = useHospital();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & input fields
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<CombinedPatient | null>(null);

  // Suggested Test typing filter
  const [testSearchInput, setTestSearchInput] = useState("");
  const [suggestedTestName, setSuggestedTestName] = useState("");
  const [testFocus, setTestFocus] = useState(false);

  // Report finalization inputs
  const [activeReport, setActiveReport] = useState<LabReport | null>(null);
  const [reportResultText, setReportResultText] = useState("");

  const [notice, setNotice] = useState<string | null>(null);

  // Derive unified registrants list
  const patients: CombinedPatient[] = [
    ...outpatients.map(o => ({
      id: o.id,
      name: o.name,
      age: o.age,
      gender: o.gender,
      mrn: o.mrn,
      type: "Outpatient" as const,
      diagnosis: "OPD Referral Consultation"
    })),
    ...beds.filter(b => b.occupied && b.patient).map(b => ({
      id: b.patient!.id,
      name: b.patient!.name,
      age: b.patient!.age,
      gender: b.patient!.gender,
      mrn: b.patient!.mrn,
      type: "Inpatient" as const,
      diagnosis: b.patient!.diagnosis,
      bedId: b.id,
      ward: b.ward
    }))
  ];

  const fetchClinicalState = async () => {
    // No-op client-side since data is reactively sourced from context
  };

  useEffect(() => {
    fetchClinicalState();
  }, []);

  // Filter test catalog based on typing
  const filteredCatalogTests = COMMON_TESTS_CATALOG.filter(t => 
    t.toLowerCase().includes(testSearchInput.toLowerCase())
  );

  // Filter combined patients from reception registration
  const searchablePatientsMatches = patients.filter(p => {
    const query = patientSearch.toLowerCase();
    return p.name.toLowerCase().includes(query) || p.mrn.toLowerCase().includes(query);
  });

  // Suggest a test to a registered patient
  const handleRegisterLabTest = async () => {
    const finalTest = suggestedTestName || testSearchInput;
    if (!selectedPatient) {
      alert("Please search and select a verified registrant first.");
      return;
    }
    if (!finalTest.trim()) {
      alert("Please select or type a catalog test name.");
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      await requestLabReport(selectedPatient.name, selectedPatient.mrn, finalTest);
      setNotice(`Successfully suggested [${finalTest}] for ${selectedPatient.name}. Test docket registered.`);
      setTestSearchInput("");
      setSuggestedTestName("");
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (e) {
      console.error(e);
      alert("Error logging diagnostic suggestion docket.");
    } finally {
      setLoading(false);
    }
  };

  // Compile and save generated lab report values
  const handleSaveLabReport = async () => {
    if (!activeReport) return;
    if (!reportResultText.trim()) {
      alert("Please type the compiled clinical values first.");
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      await finalizeLabReport(activeReport.id, reportResultText);
      setNotice(`Diagnostic Report (${activeReport.id}) for ${activeReport.patientName} saved and uploaded successfully.`);
      setActiveReport(null);
      setReportResultText("");
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (e) {
      console.error(e);
      alert("Error saving compiled values to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
            Diagnostics Department • central Lab
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-2.5">Clinical Diagnostic Laboratory</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
            Analyze suggested diagnostic orders. Automatically pull verified registrations from central admission, log catalog tests, and upload compiled diagnostic reports.
          </p>
        </div>

        <button
          onClick={fetchClinicalState}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 rounded-xl flex items-center gap-2 text-xs font-mono font-bold cursor-pointer transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload logs
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-xs font-bold text-emerald-850 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-150 rounded-xl flex items-center gap-2 text-xs font-bold text-red-800 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main split work layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Patient Selection & Test suggest form */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Diagnostic Order Creation</h3>
              <p className="text-[11px] text-slate-400">Pull registered patient & select appropriate test catalog.</p>
            </div>

            {/* Pull Name from Registration */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">1. Patient Lookup (Auto-Filled from Reception):</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Type name or MRN lookup..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    if (selectedPatient) setSelectedPatient(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium outline-none focus:bg-white focus:border-blue-500 transition"
                />
              </div>

              {/* Suggestions popover */}
              {patientSearch && !selectedPatient && (
                <div className="absolute top-16 left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-40 max-h-48 overflow-y-auto space-y-1">
                  {searchablePatientsMatches.length > 0 ? (
                    searchablePatientsMatches.map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() => {
                          setSelectedPatient(pat);
                          setPatientSearch(pat.name);
                        }}
                        className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-xs flex justify-between items-center"
                      >
                        <div>
                          <strong className="block text-slate-850">{pat.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{pat.mrn} • {pat.type}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 rounded-md font-extrabold border border-blue-100">{pat.id}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[11px] text-slate-400 font-medium">No registered outpatient or inpatient matches.</div>
                  )}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="bg-blue-50/70 border border-blue-150 p-3.5 rounded-xl text-xs space-y-1 font-sans">
                <div className="flex justify-between items-center text-blue-800">
                  <strong className="font-bold text-sm block">{selectedPatient.name}</strong>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-blue-100 rounded-md font-bold">{selectedPatient.type}</span>
                </div>
                <div className="text-slate-500 text-[11px]">Age: {selectedPatient.age} • Gender: {selectedPatient.gender}</div>
                <div className="text-[11px] font-mono text-slate-600">MRN Tracker: {selectedPatient.mrn}</div>
                {selectedPatient.bedId && <div className="text-[10px] text-indigo-700 font-bold font-mono">Bed location: {selectedPatient.bedId} ({selectedPatient.ward})</div>}
              </div>
            )}

            {/* Test Suggested Selector */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">2. Suggested Test Selection (Typing selector):</label>
              <input
                type="text"
                placeholder="Type test name (e.g. blood sugar)..."
                value={testSearchInput}
                onChange={(e) => {
                  setTestSearchInput(e.target.value);
                  setSuggestedTestName("");
                }}
                onFocus={() => setTestFocus(true)}
                onBlur={() => setTimeout(() => setTestFocus(false), 200)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 transition"
              />

              {/* Catalog matching options */}
              {testFocus && testSearchInput && (
                <div className="absolute top-16 left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-40 max-h-48 overflow-y-auto space-y-1">
                  {filteredCatalogTests.length > 0 ? (
                    filteredCatalogTests.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSuggestedTestName(t);
                          setTestSearchInput(t);
                        }}
                        className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[10px] text-slate-400 font-semibold">Custom Test Name input.</div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleRegisterLabTest}
              disabled={loading || !selectedPatient}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              Log Suggested Lab Order
            </button>
          </div>

        </div>

        {/* Work Area: Logged tests \& report finalization */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active test queue */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">Active Lab Tests Registry</h3>
                <p className="text-[11px] text-slate-400">Compile clinical report metrics for registered requests.</p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-slate-50 border border-slate-250 px-2.5 py-0.5 rounded font-extrabold text-slate-650">
                {labReports.length} Registered dockets
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-mono text-[10px] uppercase text-slate-400 font-bold pb-2">
                    <th className="py-2.5 px-3">Docket ID</th>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">Suggested Test Name</th>
                    <th className="py-2.5 px-3">Test Status</th>
                    <th className="py-2.5 px-3 text-right">Report Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-705 font-medium">
                  {labReports.length > 0 ? (
                    labReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/75 transition">
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400 font-bold">{r.id}</td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-950 font-bold block">{r.patientName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {r.mrn}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-850 flex items-center gap-1">
                            <FlaskConical className="w-3.5 h-3.5 text-slate-500" />
                            {r.testName}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block font-mono text-[9px] font-extrabold border uppercase px-2 py-0.5 rounded-lg ${
                            r.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {r.status === "Pending" ? (
                            <button
                              onClick={() => {
                                setActiveReport(r);
                                setReportResultText("");
                              }}
                              className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-100 transition cursor-pointer"
                            >
                              Generate Report
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                alert(`DIAGNOSTIC ARCHIVE LOG (${r.id})\nPatient: ${r.patientName}\nTest: ${r.testName}\nContents: ${r.reportValue}`);
                              }}
                              className="text-[10px] font-mono bg-slate-50 text-slate-500 border border-slate-200 px-2 py-1 rounded-lg font-bold hover:bg-slate-100 hover:text-slate-900 transition"
                            >
                              Examine values
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No diagnostic logs recorded. Registers are clean.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Report Generator Form */}
          {activeReport && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl text-white space-y-4 animate-fade-in font-sans">
              
              <div className="flex justify-between items-start border-b border-white/10 pb-2.5">
                <div>
                  <strong className="text-xs uppercase font-mono tracking-wider block text-yellow-450 font-bold">[LAB UNIT-A] ACTIVE GENERATOR</strong>
                  <h4 className="text-sm font-bold text-white mt-1">Compile Diagnostics Report for {activeReport.patientName}</h4>
                </div>
                <button
                  onClick={() => setActiveReport(null)}
                  className="text-white/60 hover:text-white text-xs font-mono font-bold"
                >
                  Clear ×
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl leading-normal space-y-1">
                  <div>Subject patient: <strong className="text-white font-bold">{activeReport.patientName} (MRN: {activeReport.mrn})</strong></div>
                  <div>Diagnos suggestion: <strong className="text-emerald-400 font-mono">{activeReport.testName}</strong></div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-white/60 block font-bold">Write Clinical Observations & Findings:</label>
                  <textarea
                    placeholder="e.g. Glucose Fasting: 112 mg/dL. Re-run result was 114 mg/dL. Confirms status of pre-diabetic monitoring. Urge dietary limitations and bedside follow-ups."
                    value={reportResultText}
                    onChange={(e) => setReportResultText(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/15 focus:border-emerald-500 rounded-xl p-3 text-xs leading-relaxed font-sans text-white outline-none resize-none font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 font-mono font-bold text-xs pt-1">
                  <button
                    onClick={() => setActiveReport(null)}
                    className="px-4 py-2 bg-white/10 text-white/80 hover:bg-white/15 rounded-xl transition cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSaveLabReport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Save & Sync Diagnostic Report
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
