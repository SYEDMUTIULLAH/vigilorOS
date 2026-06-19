import { useState } from "react";
import { Bed, Patient, DischargeOutput, MitigationOutput } from "../types";
import { Activity, Clock, ShieldAlert, Zap, TrendingUp, Filter, AlertTriangle, ArrowRight, UserPlus, RefreshCw, Sparkles, Check, CheckCircle } from "lucide-react";
import { useHospital } from "../context/HospitalContext";

interface CommandCenterProps {
  beds: Bed[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onUpdatePatient: (bedId: string, updatedData: Partial<Patient>) => Promise<void>;
  onDischargePatient: (bedId: string) => Promise<void>;
}

export default function CommandCenter({
  beds,
  loading,
  onRefresh,
  onUpdatePatient,
  onDischargePatient,
}: CommandCenterProps) {
  const { runDischargeOptimizer: ctxRunDischargeOptimizer, runMitigationPaths: ctxRunMitigationPaths } = useHospital();

  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizerResult, setOptimizerResult] = useState<DischargeOutput | null>(null);
  const [mitigationLoading, setMitigationLoading] = useState(false);
  const [mitigationResult, setMitigationResult] = useState<MitigationOutput | null>(null);


  // New states for editing vitals in drawer
  const [editPulse, setEditPulse] = useState<number>(80);
  const [editBP, setEditBP] = useState<string>("120/80");
  const [editSpo2, setEditSpo2] = useState<number>(98);
  const [editTemp, setEditTemp] = useState<number>(98.6);
  const [editStatus, setEditStatus] = useState<Patient["status"]>("Stable");
  const [isUpdating, setIsUpdating] = useState(false);

  // Active wards definition for visual block grouping
  const wardsConfig = [
    { key: "ICU", label: "ICU", labelFull: "Intensive Care Unit", color: "border-slate-200" },
    { key: "CCU", label: "Cardiac CCU", labelFull: "Cardiac Care Unit", color: "border-slate-200" },
    { key: "GW3", label: "General Ward 3", labelFull: "General Medical Ward", color: "border-slate-200" },
    { key: "OBG", label: "OBG / Maternity", labelFull: "Obstetrics & Gynecology", color: "border-slate-200" },
    { key: "PED", label: "Paediatric", labelFull: "Paediatrics Ward", color: "border-slate-200" },
    { key: "ONC", label: "Oncology", labelFull: "Oncology Ward", color: "border-slate-200" },
  ];

  // Occupied beds
  const occupiedBeds = beds.filter((b) => b.occupied);
  const occupancyPercentage = beds.length > 0 ? Math.round((occupiedBeds.length / beds.length) * 100) : 0;
  const eddSoonCount = beds.filter((b) => b.occupied && b.patient?.eddSoon).length;

  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
    if (bed.patient) {
      setEditPulse(bed.patient.vitals.pulseRate);
      setEditBP(bed.patient.vitals.bloodPressure);
      setEditSpo2(bed.patient.vitals.spo2);
      setEditTemp(bed.patient.vitals.temperature);
      setEditStatus(bed.patient.status);
    }
  };

  const handleSaveVitals = async () => {
    if (!selectedBed || !selectedBed.patient) return;
    setIsUpdating(true);
    try {
      await onUpdatePatient(selectedBed.id, {
        status: editStatus,
        vitals: {
          pulseRate: editPulse,
          bloodPressure: editBP,
          spo2: editSpo2,
          temperature: editTemp,
        },
      });
      // Update local state
      const updatedBed = {
        ...selectedBed,
        patient: {
          ...selectedBed.patient,
          status: editStatus,
          vitals: {
            pulseRate: editPulse,
            bloodPressure: editBP,
            spo2: editSpo2,
            temperature: editTemp,
          },
        },
      };
      setSelectedBed(updatedBed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLocalDischarge = async (bedId: string) => {
    if (!confirm("Are you sure you want to discharge this patient? This will free up the bed immediately.")) return;
    setIsUpdating(true);
    try {
      await onDischargePatient(bedId);
      setSelectedBed(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // AI-powered: Run Discharge Optimizer
  const runDischargeOptimizer = async () => {
    setOptimizerLoading(true);
    setOptimizerResult(null);
    try {
      const data = await ctxRunDischargeOptimizer();
      setOptimizerResult(data);
    } catch (e) {
      console.error("Optimizer Error:", e);
    } finally {
      setOptimizerLoading(false);
    }
  };

  // AI-powered: View 3 Mitigation Paths
  const runMitigationPaths = async () => {
    setMitigationLoading(true);
    setMitigationResult(null);
    try {
      const data = await ctxRunMitigationPaths();
      setMitigationResult(data);
    } catch (e) {
      console.error("Mitigation Error:", e);
    } finally {
      setMitigationLoading(false);
    }
  };

  // Match colors for simple bed display - clean light minimal scheme
  const getCellColor = (bed: Bed) => {
    if (!bed.occupied) return "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400";
    if (bed.patient?.warning) {
      if (bed.patient.warning.includes("stockout") || bed.patient.status === "Critical") {
        return "bg-red-50 hover:bg-red-100 border-red-200 text-red-700 font-bold shadow-sm animate-pulse";
      }
      return "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 font-semibold shadow-sm";
    }
    if (bed.patient?.eddSoon) {
      return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-semibold shadow-sm";
    }
    return "bg-emerald-50 hover:bg-emerald-100 border-emerald-250 text-emerald-800 font-semibold shadow-sm";
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Main Living Matrix Column (3 cols wide) */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Subheader and Action buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-blue-600 font-bold mb-1">
              Capacity Command • Tuesday, May 26, 2026 • 05:16 AM
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              A living view of {beds.length} beds.
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Rule-based engine watching <span className="text-amber-600 font-semibold">4 operational bottlenecks</span> • gentle colored pulses, never alarms.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={runDischargeOptimizer}
              disabled={optimizerLoading}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition duration-200 cursor-pointer disabled:opacity-50"
              id="btn-discharge-optimizer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {optimizerLoading ? "Analyzing Clinical data..." : "Run discharge optimizer ↗"}
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer shadow-sm animate-none"
              title="Refresh State"
              id="btn-refresh-command"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 4 Essential Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition shadow-sm">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium font-sans">Occupancy</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{occupancyPercentage}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{occupiedBeds.length}/{beds.length} beds</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition shadow-sm">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium font-sans">Predicted EDDs</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{eddSoonCount} soon</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Next 6 hours</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition shadow-sm">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium font-sans">Avg LOS</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">4.2d</div>
              <div className="text-[10px] text-emerald-600 mt-0.5 font-mono font-bold">-0.3 vs target</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition shadow-sm">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium font-sans">Code-Blue MTTR</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">3:42</div>
              <div className="text-[10px] text-emerald-600 mt-0.5 font-mono font-bold">🗲 -18s this shift</div>
            </div>
          </div>
        </div>

        {/* Optimizer Result Panel (if active) */}
        {optimizerResult && (
          <div className="bg-blue-50/70 border border-blue-200/60 p-6 rounded-2xl space-y-4 animate-fade-in shadow-sm">
            <div className="flex justify-between items-center bg-blue-100/60 p-2.5 px-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs font-mono">
                <Sparkles className="w-4 h-4 text-blue-700" />
                GEMINI AI DISCHARGE DISPATCH RECOMMENDATIONS
              </div>
              <button 
                onClick={() => setOptimizerResult(null)}
                className="text-blue-500 hover:text-blue-950 text-xs font-mono font-bold"
              >
                Close ×
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans border-b border-blue-100 pb-3">
              <strong>System Summary:</strong> {optimizerResult.systemBenefitsSummary}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optimizerResult.topCandidates.map((candidate) => (
                <div key={candidate.bedId} className="bg-white border border-blue-100 rounded-xl p-4.5 space-y-3 relative overflow-hidden hover:border-blue-300 transition shadow-sm">
                  <div className="absolute top-0 right-0 p-1 px-2.5 bg-emerald-50 text-emerald-700 border-l border-b border-emerald-100 text-[10px] font-mono rounded-bl-lg font-bold">
                    {candidate.dischargeReadinessScore}% Ready
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-blue-600 tracking-wide font-bold">{candidate.bedId} • {candidate.ward}</span>
                    <button
                      onClick={() => {
                        const cell = beds.find((b) => b.id === candidate.bedId);
                        if (cell) handleBedClick(cell);
                      }}
                      className="text-sm font-bold text-slate-900 block hover:underline text-left"
                    >
                      {candidate.patientName}
                    </button>
                    <span className="text-xs text-slate-500 block truncate font-mono">{candidate.diagnosis}</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 border-t border-slate-100 pt-2 font-sans">
                    <div>
                      <strong className="text-slate-500 font-medium">Cap Barrier:</strong> {candidate.barriersToDischarge}
                    </div>
                    <div className="text-blue-700 font-medium">
                      <strong className="font-semibold">AI Action plan:</strong> {candidate.actionToAccelerate}
                    </div>
                  </div>
                  <div className="pt-1 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-mono">Impact: +{candidate.predictedImpactHours}h capacity</span>
                    <button
                      onClick={() => handleLocalDischarge(candidate.bedId)}
                      className="text-[11px] font-mono bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Resolve & Discharge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MITIGATION PANEL (if active) */}
        {mitigationResult && (
          <div className="bg-rose-50/60 border border-rose-200/60 p-6 rounded-2xl space-y-4 animate-fade-in shadow-sm">
            <div className="flex justify-between items-center bg-rose-100/60 p-2.5 px-4 rounded-xl border border-rose-200">
              <div className="flex items-center gap-2 text-rose-900 font-semibold text-xs font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                GEMINI AI CAPACITY TRAFFIC MITIGATION FORECAST
              </div>
              <button 
                onClick={() => setMitigationResult(null)}
                className="text-rose-550 hover:text-rose-950 text-xs font-mono font-bold"
              >
                Close ×
              </button>
            </div>
            <div className="text-xs text-slate-600 font-sans flex flex-col md:flex-row gap-4 border-b border-rose-100 pb-3">
              <div>🏥 <strong className="text-slate-700">Current Occupancy:</strong> {mitigationResult.currentOverallOccupancy}</div>
              <div>🚨 <strong className="text-slate-700">Bottleneck Areas:</strong> {mitigationResult.criticalWards.join(", ")}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mitigationResult.paths.map((pathItem, idx) => (
                <div key={idx} className="bg-white border border-rose-100 rounded-xl p-4.5 space-y-2.5 flex flex-col justify-between shadow-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-blue-700 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50 font-bold">Option 0{pathItem.id}</span>
                      <span className="text-[10px] font-mono text-slate-400">Risk: <strong className={pathItem.riskLevel === "High" ? "text-red-600" : (pathItem.riskLevel === "Medium" ? "text-amber-600" : "text-emerald-600")}>{pathItem.riskLevel}</strong></span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{pathItem.title}</h4>
                    <p className="text-xs text-slate-600 font-sans leading-relaxed pt-1">{pathItem.strategy}</p>
                  </div>
                  <div className="space-y-1 border-t border-slate-100 pt-2 text-[11px] font-sans text-slate-500">
                    <div className="font-semibold text-slate-700">Action Steps:</div>
                    <ul className="list-disc pl-3 text-slate-500 space-y-0.5">
                      {pathItem.steps.map((s, itemIdx) => <li key={itemIdx}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="text-xs font-mono text-emerald-600 border-t border-slate-100 pt-2 text-right font-medium">
                    Impact: {pathItem.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 128-Beds GRID VIEW */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bed flow • live organism view</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5 font-medium">Each cell represents a bed - click to review patient chart, update vitals or clear administrative targets.</p>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-250"></span>
                <span className="text-slate-500">Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-50 border border-blue-200"></span>
                <span className="text-slate-500">EDD Soon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-200 animate-pulse"></span>
                <span className="text-slate-500">Bottleneck</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-200"></span>
                <span className="text-slate-500">Available</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {wardsConfig.map((ward) => {
              const wardBeds = beds.filter((b) => b.ward === ward.key);
              const occupiedWardCount = wardBeds.filter((b) => b.occupied).length;
              const ratio = wardBeds.length > 0 ? Math.round((occupiedWardCount / wardBeds.length) * 100) : 0;

              return (
                <div key={ward.key} className="space-y-2.5">
                  {/* Ward Header */}
                  <div className="flex justify-between items-center text-xs font-mono border-b border-slate-100 pb-2">
                    <span className="text-slate-800 font-bold uppercase">{ward.label}</span>
                    <span className="text-slate-500 font-medium">{occupiedWardCount} / {wardBeds.length} beds occupied • <strong className={ratio > 90 ? "text-red-650" : "text-slate-600"}>{ratio}%</strong></span>
                  </div>

                  {/* Bed Grid Cells */}
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                    {wardBeds.map((bed) => (
                      <button
                        key={bed.id}
                        onClick={() => handleBedClick(bed)}
                        className={`py-2 px-1 text-center rounded-lg text-[10px] font-mono border font-bold transition cursor-pointer relative overflow-hidden ${getCellColor(bed)}`}
                        id={`bed-cell-${bed.id}`}
                      >
                        {bed.id.split("-")[1]}
                        {bed.patient?.eddSoon && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-bl-sm"></span>
                        )}
                        {bed.patient?.warning && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-bl-sm animate-pulse"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Right Column: Alerts & Predictive Feeds (1 col wide) */}
      <div className="space-y-6">
        
        {/* Predictive Capacity Engine Alert Card */}
        <div className="bg-red-50 border border-red-200/70 p-5 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-1 px-2.5 bg-red-100 text-red-800 text-[9px] font-mono uppercase tracking-wider rounded-bl-xl font-extrabold animate-pulse">
            CRITICAL REACHED
          </div>
          <span className="text-xs uppercase font-mono text-red-700 font-bold block mb-1">Predictive Cap Engine</span>
          <h3 className="text-base font-bold text-slate-900 font-display mt-2">Staffing breach predicted.</h3>
          <p className="text-xs text-slate-700 mt-2 font-sans leading-relaxed font-semibold">
            At <strong className="text-slate-900 font-bold">15:20</strong>, default ICU lane will breach safe clinical ratios. Cascade source: <span className="text-amber-700">2 predicted ED arrivals</span> + delayed sub-acute stepdowns.
          </p>
          <button
            onClick={runMitigationPaths}
            disabled={mitigationLoading}
            className="w-full mt-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition duration-150 cursor-pointer disabled:opacity-50"
            id="btn-mitigation-paths"
          >
            <Zap className="w-3.5 h-3.5" />
            {mitigationLoading ? "Strategizing Pathways..." : "View 3 mitigation paths ↗"}
          </button>
        </div>

        {/* Gentle Alerts Column */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-800 font-bold">Gentle Alerts</span>
            <span className="text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">4 Active</span>
          </div>

          <div className="space-y-3 font-sans">
            <button
              onClick={() => {
                const b = beds.find((bd) => bd.id === "ICU-07");
                if (b) handleBedClick(b);
              }}
              className="text-left w-full p-3 bg-slate-50 hover:bg-slate-100 border-l-4 border-amber-500 rounded-r-xl transition space-y-1 block cursor-pointer"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-amber-700 font-bold">
                <span>ICU-07</span>
                <span>COPD CASE</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-normal line-clamp-2">
                Physical therapy clearance likely needed - age 72 with underlying COPD.
              </p>
            </button>

            <button
              onClick={() => {
                const b = beds.find((bd) => bd.id === "GW3-14");
                if (b) handleBedClick(b);
              }}
              className="text-left w-full p-3 bg-slate-50 hover:bg-slate-100 border-l-4 border-amber-500 rounded-r-xl transition space-y-1 block cursor-pointer"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-amber-700 font-bold">
                <span>GW3-14</span>
                <span>PNEUMONIA CASE</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-normal line-clamp-2">
                Physical therapy clearance likely needed - age 65 with Lobar Pneumonia.
              </p>
            </button>

            <button
              onClick={() => {
                const b = beds.find((bd) => bd.id === "GW3-14");
                if (b) handleBedClick(b);
              }}
              className="text-left w-full p-3 bg-slate-50 hover:bg-slate-100 border-l-4 border-amber-500 rounded-r-xl transition space-y-1 block cursor-pointer"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-amber-700 font-bold">
                <span>GW3-14</span>
                <span>EDD OVERRUN</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-normal line-clamp-2">
                Predicted EDD overrun - discharge summary not generated 24h after patient is biochemical-ready.
              </p>
            </button>

            <button
              onClick={() => {
                const b = beds.find((bd) => bd.id === "ONC-03");
                if (b) handleBedClick(b);
              }}
              className="text-left w-full p-3 bg-slate-55 hover:bg-slate-100 border-l-4 border-red-500 rounded-r-xl transition space-y-1 block cursor-pointer"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-red-700 font-bold">
                <span>ONC-03</span>
                <span>STOCKOUT ALERT</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-normal line-clamp-2">
                Pharmacy stockout: Bortezomib 3.5mg - 2 oncology patients impacted.
              </p>
            </button>
          </div>
        </div>

        {/* Today's Recovered Revenue Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-600 font-bold">Recovered Revenue</span>
            <span className="text-[10px] font-mono text-slate-400">Live Forecast</span>
          </div>

          <div className="space-y-3 font-sans">
            <div>
              <span className="text-2xl font-black text-slate-900 font-mono">₹1,84,300</span>
              <span className="text-xs text-emerald-600 font-mono ml-2 font-bold">↑ 12.4% vs Avg</span>
            </div>
            
            <div className="text-xs text-slate-600 space-y-2 pt-1">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Pharmacy Conversions:</span>
                <span className="font-mono text-slate-800 font-bold">₹84,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Expedited Claim Processing:</span>
                <span className="font-mono text-slate-800 font-bold">₹65,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Avoided Discharge Leakages:</span>
                <span className="font-mono text-slate-800 font-bold">₹34,800</span>
              </div>
            </div>
            
            <div className="text-[10px] text-emerald-800 leading-normal bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 font-medium">
              ⚡ <strong>Flow Optimization Impact:</strong> Bed conversions of electronic pharmacy delivery rose outpatient volume by 22%.
            </div>
          </div>
        </div>

      </div>

      {/* Patient Bed Inspection Slide-Over Drawer */}
      {selectedBed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in" id="drawer-patient-inspection">
          <div className="w-full max-w-md bg-white border-l border-slate-200 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div>
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs uppercase font-mono bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg font-bold">
                    Bed {selectedBed.id}
                  </span>
                  <span className="text-xs text-slate-500 font-mono ml-3 font-semibold">
                    {selectedBed.ward} Lane
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBed(null)}
                  className="p-1 px-2.5 text-slate-400 hover:text-slate-900 rounded-lg bg-slate-100 text-xs font-mono font-bold hover:bg-slate-200 transition"
                >
                  CLOSE ×
                </button>
              </div>

              {selectedBed.occupied && selectedBed.patient ? (
                <div className="space-y-6 font-sans">
                  {/* Patient Info Card */}
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{selectedBed.patient.name}</h3>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                      <span>Age: {selectedBed.patient.age}</span>
                      <span>Gender: {selectedBed.patient.gender}</span>
                      <span>MRN: {selectedBed.patient.mrn}</span>
                    </div>
                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex gap-2 justify-between items-center mt-3 font-mono">
                      <span className="text-slate-400 font-bold">ABHA ID:</span>
                      <span className="text-slate-800 font-semibold">{selectedBed.patient.abhaId}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-bold">ABDM Synced</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">Active Inpatient Diagnosis</span>
                    <p className="text-sm font-semibold text-slate-800">{selectedBed.patient.diagnosis}</p>
                    <span className="text-xs block text-slate-400 font-mono">Admitted on: {selectedBed.patient.admissionDate}</span>
                  </div>

                  {/* Vitals Evaluation Panel */}
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-extrabold block">Real-time Vitals Intake</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-500 block font-bold">Pulse (BPM)</label>
                        <input
                          type="number"
                          value={editPulse}
                          onChange={(e) => setEditPulse(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-800 rounded-lg p-2 text-xs font-mono mt-1 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-500 block font-bold">Blood Pressure</label>
                        <input
                          type="text"
                          value={editBP}
                          onChange={(e) => setEditBP(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-800 rounded-lg p-2 text-xs font-mono mt-1 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-500 block font-bold">Pulse Ox SPO2 (%)</label>
                        <input
                          type="number"
                          value={editSpo2}
                          onChange={(e) => setEditSpo2(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-800 rounded-lg p-2 text-xs font-mono mt-1 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-500 block font-bold">Temp (°F)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editTemp}
                          onChange={(e) => setEditTemp(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-800 rounded-lg p-2 text-xs font-mono mt-1 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1.5 font-bold">Clinical Status</label>
                      <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono font-bold">
                        {["Critical", "Guarded", "Stable", "Recovering"].map((stat) => (
                          <button
                            key={stat}
                            onClick={() => setEditStatus(stat as any)}
                            className={`py-1.5 rounded-lg text-center border cursor-pointer transition ${editStatus === stat ? "bg-blue-600 border-blue-600 text-white font-extrabold" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                          >
                            {stat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveVitals}
                      disabled={isUpdating}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold py-2 rounded-xl transition mt-3 cursor-pointer shadow-sm"
                    >
                      {isUpdating ? "Saving..." : "Update vitals & prognosis"}
                    </button>
                  </div>

                  {/* Warning Alerts / Bottlenecks */}
                  {selectedBed.patient.warning && (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-mono text-amber-700 font-bold block">Active Bottleneck</span>
                        <p className="text-xs text-amber-800 mt-1 font-sans font-semibold leading-relaxed">{selectedBed.patient.warning}</p>
                      </div>
                    </div>
                  )}

                  {/* Clinical SOAP Notes Panel */}
                  {selectedBed.patient.soapNotes && (
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">Bedside SOAP Record</span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">Updated: {new Date(selectedBed.patient.soapNotes.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl text-xs leading-relaxed space-y-2 border border-slate-200 font-mono text-slate-700">
                        <div><strong className="text-amber-850 font-bold">[S] Subjective:</strong> {selectedBed.patient.soapNotes.subjective}</div>
                        <div><strong className="text-blue-800 font-bold">[O] Objective:</strong> {selectedBed.patient.soapNotes.objective}</div>
                        <div><strong className="text-indigo-800 font-bold">[A] Assessment:</strong> {selectedBed.patient.soapNotes.assessment}</div>
                        <div><strong className="text-emerald-800 font-bold">[P] Plan:</strong> {selectedBed.patient.soapNotes.plan}</div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-24 text-slate-400">
                  <UserPlus className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">This Bed is Currently Vacated</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">Submit a electronic registration via the smart reception desk to allocate patients here.</p>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            {selectedBed.occupied && selectedBed.patient && (
              <div className="border-t border-slate-100 pt-4 flex gap-3 mt-6">
                <button
                  onClick={() => handleLocalDischarge(selectedBed.id)}
                  disabled={isUpdating}
                  className="flex-1 bg-red-650 hover:bg-red-750 text-white font-mono text-xs font-bold py-2.5 rounded-xl transition text-center cursor-pointer shadow-sm"
                  id="btn-discharge-bed"
                >
                  Expedite Discharge
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
