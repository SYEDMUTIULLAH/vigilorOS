import { useState, useEffect } from "react";
import { Bed, Patient } from "./types";
import { 
  Building, 
  Search, 
  Bell, 
  Settings, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Info, 
  RefreshCw,
  Sliders,
  Sparkles,
  ClipboardList,
  Layers,
  ShoppingBag,
  Activity,
  FlaskConical,
  Calculator,
  TrendingUp,
  UserPlus
} from "lucide-react";

import CommandCenter from "./components/CommandCenter";
import AmbientConsult from "./components/AmbientConsult";
import AbdmIntegration from "./components/AbdmIntegration";
import PharmacyIntelligence from "./components/PharmacyIntelligence";
import TriageDesk from "./components/TriageDesk";
import DiagnosticLab from "./components/DiagnosticLab";
import PharmacyDesk from "./components/PharmacyDesk";
import HospitalFinance from "./components/HospitalFinance";
import DoctorsPage from "./pages/DoctorsPage";
import { useHospital } from "./context/HospitalContext";

export default function App() {
  const [activeTab, setActiveTab] = useState<"command" | "consult" | "abdm" | "pharmacy" | "triage" | "lab" | "pharmacy-pos" | "finance" | "doctors">("triage");
  
  const { 
    beds, 
    loading, 
    allocateBed, 
    dischargePatient, 
    updatePatient, 
    resetDatabase 
  } = useHospital();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Global patient search state
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [inspectedPatientBed, setInspectedPatientBed] = useState<Bed | null>(null);

  // Dummy action since beds are in live memory state
  const fetchBeds = async () => {};

  // API Call: Allocate/reserve patient bed
  const handleAddPatient = async (bedId: string, patientData: Patient) => {
    try {
      await allocateBed(bedId, patientData);
    } catch (e: any) {
      alert(e.message || "Failed to reserve bed.");
      throw e;
    }
  };

  // API Call: Discharge customer and free bed
  const handleDischargePatient = async (bedId: string) => {
    try {
      await dischargePatient(bedId);
    } catch (e: any) {
      alert(e.message || "Failed to clear patient records from bed.");
      throw e;
    }
  };

  // API Call: Update vital signs / soap notes
  const handleUpdatePatient = async (bedId: string, updatedData: Partial<Patient>) => {
    try {
      await updatePatient(bedId, updatedData);
    } catch (e: any) {
      alert(e.message || "Could not save diagnostic changes to central records.");
      throw e;
    }
  };

  // Trigger server database reset to original 101/128 bed configurations
  const handleDatabaseReset = async () => {
    if (!confirm("Reset database back to standard Slide 13 initial configurations (101/128 occupied beds)?")) return;
    try {
      await resetDatabase();
    } catch (e) {
      console.error(e);
    }
  };


  // Calculations for real-time header percentages
  const occupiedCount = beds.filter(b => b.occupied).length;
  const totalBedsCount = beds.length;
  const currentOccPercentage = totalBedsCount > 0 ? ((occupiedCount / totalBedsCount) * 100).toFixed(1) : "0.0";

  // Search matches for global patient bar dropdown
  const searchMatches = beds.filter(b => {
    if (!b.occupied || !b.patient) return false;
    const q = globalSearch.toLowerCase();
    return (
      b.patient.name.toLowerCase().includes(q) ||
      b.patient.mrn.toLowerCase().includes(q) ||
      b.patient.abhaId.includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row font-sans antialiased">
      
      {/* LEFT SIDEBAR (Clean Minimalism light style) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-10">
        
        <div className="p-6 space-y-8">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Building className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-display">VIGILOR OS</h1>
              <span className="text-[9px] font-mono tracking-wider text-slate-400 block -mt-0.5">CENTRAL NERVOUS SYSTEM FOR HOSPITALS</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="space-y-1 font-sans text-xs font-semibold tracking-wide">
            
            <button
              onClick={() => setActiveTab("triage")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "triage" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span id="nav-triage" className="flex items-center gap-3">
                <Activity className={`w-4 h-4 ${activeTab === "triage" ? "text-blue-600" : "text-slate-400"}`} />
                Reception Desk
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "triage" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>Intake</span>
            </button>

            <button
              onClick={() => setActiveTab("command")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "command" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span id="nav-command" className="flex items-center gap-3">
                <Sliders className={`w-4 h-4 ${activeTab === "command" ? "text-blue-600" : "text-slate-400"}`} />
                Bed Capacity
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "command" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>Beds</span>
            </button>

            <button
              onClick={() => setActiveTab("consult")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "consult" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span id="nav-consult" className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${activeTab === "consult" ? "text-blue-600" : "text-slate-400"}`} />
                Doctor's Portal
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "consult" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>ROUNDS</span>
            </button>

            <button
              onClick={() => setActiveTab("lab")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "lab" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span id="nav-lab" className="flex items-center gap-3">
                <FlaskConical className={`w-4 h-4 ${activeTab === "lab" ? "text-blue-600" : "text-slate-400"}`} />
                Diagnostic Lab
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "lab" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>Testing</span>
            </button>

            <button
              onClick={() => setActiveTab("pharmacy-pos")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "pharmacy-pos" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span id="nav-pharmacy-pos" className="flex items-center gap-3">
                <Calculator className={`w-4 h-4 ${activeTab === "pharmacy-pos" ? "text-blue-600" : "text-slate-400"}`} />
                Pharmacy Desk
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "pharmacy-pos" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}`}>POS BILLS</span>
            </button>

            <button
              onClick={() => setActiveTab("pharmacy")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "pharmacy" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span id="nav-pharmacy" className="flex items-center gap-3">
                <ShoppingBag className={`w-4 h-4 ${activeTab === "pharmacy" ? "text-blue-600" : "text-slate-400"}`} />
                Pharmacy Intel
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "pharmacy" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}`}>METRICS</span>
            </button>

            <button
              onClick={() => setActiveTab("doctors")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "doctors" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className={`w-4 h-4 ${activeTab === "doctors" ? "text-blue-600" : "text-slate-400"}`} />
                Doctors
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "doctors" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>STAFF</span>
            </button>

            <button
              onClick={() => setActiveTab("abdm")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "abdm" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span id="nav-abdm" className="flex items-center gap-3">
                <Layers className={`w-4 h-4 ${activeTab === "abdm" ? "text-blue-600" : "text-slate-400"}`} />
                ABDM Sandbox
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "abdm" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>M1-M3</span>
            </button>

            <button
              onClick={() => setActiveTab("finance")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${activeTab === "finance" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"}`}
            >
              <span id="nav-finance" className="flex items-center gap-3">
                <TrendingUp className={`w-4 h-4 ${activeTab === "finance" ? "text-blue-600" : "text-slate-400"}`} />
                Hospital Finance
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] uppercase rounded font-mono font-bold ${activeTab === "finance" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>AUDIT</span>
            </button>

          </nav>
        </div>

        {/* Footer info showing compliance tags and reset tools */}
        <div className="p-6 border-t border-slate-100 space-y-4 font-sans text-[11px]">
          <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-semibold text-slate-600">Database controls</span>
              <button
                onClick={handleDatabaseReset}
                className="text-blue-600 hover:text-blue-700 hover:underline uppercase font-bold tracking-tight cursor-pointer"
              >
                Reset Setup
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">Revert matrices to default occupied state (Slide 13)</p>
          </div>
          <div className="text-slate-500 flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ABDM Sync Connected</span>
          </div>
        </div>

      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        
        {/* TOP INTERACTIVE NAVBAR */}
        <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center justify-between flex-shrink-0 z-20">
          
          {/* Patient registry immediate searching lookup */}
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search active patient, ABHA address or MRN..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setSearchFocused(true);
              }}
              onFocus={() => setSearchFocused(true)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-mono outline-none transition"
            />

            {/* Quick matches popover */}
            {searchFocused && globalSearch && (
              <div className="absolute top-11 left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl p-3 space-y-1.5 z-30 max-h-72 overflow-y-auto">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase text-slate-400 px-1 pb-2 border-b border-slate-100">
                  <span>Bed occupants matching ({searchMatches.length})</span>
                  <button onClick={() => setGlobalSearch("")} className="hover:text-slate-900 font-bold">Clear</button>
                </div>
                {searchMatches.length > 0 ? (
                  searchMatches.map((cell) => (
                    <button
                      key={cell.id}
                      onClick={() => {
                        setInspectedPatientBed(cell);
                        setGlobalSearch("");
                        setSearchFocused(false);
                      }}
                      className="w-full text-left p-2 hover:bg-slate-50 rounded-lg font-sans text-xs flex justify-between items-center transition"
                    >
                      <div>
                        <strong className="text-slate-950 font-semibold block">{cell.patient?.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{cell.id} • {cell.patient?.diagnosis.slice(0, 45)}...</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/60 font-semibold flex-shrink-0">
                        {cell.patient?.mrn}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-5 text-slate-400 text-xs font-sans">No matching bed records found.</div>
                )}
              </div>
            )}
          </div>

          {/* Current Hospital Site occupancy label */}
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline-block text-xs font-sans text-slate-500">
              Apollo Indraprastha • Bed Occupancy <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded-lg ml-1 font-mono">{currentOccPercentage}%</strong>
            </span>
            <div className="relative">
              <button 
                onClick={() => {
                  const urgentBeds = beds.filter(b => b.occupied && b.patient?.warning);
                  if (urgentBeds.length > 0) {
                    setInspectedPatientBed(urgentBeds[0]);
                  } else {
                    alert("No critical bottleneck notifications are currently active.");
                  }
                }}
                className="p-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl relative cursor-pointer shadow-sm transition"
                title="Active capacity alerts"
              >
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></span>
              </button>
            </div>
          </div>

        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 overflow-y-auto p-8">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 flex items-start gap-3.5 text-red-700 font-sans text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong className="block mb-0.5 font-bold">System Connection Interrupted</strong>
                <span className="opacity-90">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Tab Routing renderers */}
          {activeTab === "command" && (
            <CommandCenter 
              beds={beds}
              loading={loading}
              onRefresh={fetchBeds}
              onUpdatePatient={handleUpdatePatient}
              onDischargePatient={handleDischargePatient}
            />
          )}

          {activeTab === "triage" && (
            <TriageDesk 
              beds={beds}
              onAddPatient={handleAddPatient}
              onDischargePatient={handleDischargePatient}
              onRefresh={fetchBeds}
            />
          )}

          {activeTab === "consult" && (
            <AmbientConsult 
              beds={beds}
              onUpdatePatient={handleUpdatePatient}
            />
          )}

          {activeTab === "doctors" && (
            <DoctorsPage />
          )}

          {activeTab === "abdm" && (
            <AbdmIntegration 
              beds={beds}
            />
          )}

          {activeTab === "pharmacy" && (
            <PharmacyIntelligence 
              beds={beds}
              onUpdatePatient={handleUpdatePatient}
              onRefresh={fetchBeds}
            />
          )}

          {activeTab === "lab" && (
            <DiagnosticLab onRefreshGlobal={fetchBeds} />
          )}

          {activeTab === "pharmacy-pos" && (
            <PharmacyDesk onRefreshGlobal={fetchBeds} />
          )}

          {activeTab === "finance" && (
            <HospitalFinance />
          )}
        </div>

      </main>

      {/* Global Quick-Lookup Inspections Dialog Modal */}
      {inspectedPatientBed && inspectedPatientBed.patient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6 animate-zoom-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded font-bold">
                  BED RESERVATION {inspectedPatientBed.id}
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-2 font-sans tracking-tight">{inspectedPatientBed.patient.name}</h4>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  Age: {inspectedPatientBed.patient.age} • Gender: {inspectedPatientBed.patient.gender} • MRN: {inspectedPatientBed.patient.mrn}
                </div>
              </div>
              <button 
                onClick={() => setInspectedPatientBed(null)}
                className="p-1 px-2.5 text-slate-400 hover:text-slate-900 rounded-lg bg-slate-100 text-xs font-mono font-bold hover:bg-slate-200 transition"
              >
                CLOSE
              </button>
            </div>

            {/* Inpatient diagnosis details */}
            <div className="space-y-4 font-sans border-t border-b border-slate-100 py-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">Underlying Diagnosis</span>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{inspectedPatientBed.patient.diagnosis}</p>
              </div>

              {/* Vitals snapshot */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Current Vital Signs</span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block uppercase">Pulse</span>
                    <strong className="text-slate-900 text-xs">{inspectedPatientBed.patient.vitals.pulseRate} bpm</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block uppercase">BP</span>
                    <strong className="text-slate-900 text-xs">{inspectedPatientBed.patient.vitals.bloodPressure}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block uppercase">SpO2</span>
                    <strong className="text-teal-600 font-bold text-xs">{inspectedPatientBed.patient.vitals.spo2}%</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block uppercase">Temp</span>
                    <strong className="text-slate-900 text-xs">{inspectedPatientBed.patient.vitals.temperature}°F</strong>
                  </div>
                </div>
              </div>

              {inspectedPatientBed.patient.warning && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs leading-relaxed font-sans text-amber-800">
                  <strong className="text-amber-700 uppercase font-mono tracking-wider text-[10px] block mb-1">Active bottleneck alert:</strong>
                  {inspectedPatientBed.patient.warning}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end font-mono text-xs">
              <button
                onClick={() => {
                  handleDischargePatient(inspectedPatientBed.id);
                  setInspectedPatientBed(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition cursor-pointer"
              >
                Discharge Patient
              </button>
              <button
                onClick={() => setInspectedPatientBed(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
