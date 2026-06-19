import { useState } from "react";
import { Bed } from "../types";
import { Shield, Check, RefreshCw, Layers, Key, Download, FileCheck, Search, Users } from "lucide-react";

interface AbdmIntegrationProps {
  beds: Bed[];
}

export default function AbdmIntegration({ beds }: AbdmIntegrationProps) {
  const [sandboxSynced, setSandboxSynced] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAbha, setSelectedAbha] = useState<any | null>(null);

  const activePatients = beds.filter((b) => b.occupied && b.patient).map((b) => b.patient);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setSandboxSynced(true);
      setIsSyncing(false);
    }, 1500);
  };

  const filteredPatients = activePatients.filter((p) => {
    if (!p) return false;
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || p.abhaId.includes(query) || p.mrn.toLowerCase().includes(query);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Sandbox Synchronization Controls & Health Records */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Sync status card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 animate-none" />
                <h3 className="text-base font-bold text-slate-900 font-sans">ABDM National Sandbox Integration</h3>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Linked to India's National Health Authority (NHA) Registry database for fully interoperable health logs exchange.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold">
                <span className={`w-2 h-2 rounded-full ${sandboxSynced ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                <span className={sandboxSynced ? "text-emerald-700 font-extrabold" : "text-red-700"}>
                  {sandboxSynced ? "NHA SANDBOX SYNCED" : "OFFLINE"}
                </span>
              </span>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="p-1 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700 font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-slate-600" : ""}`} />
                Re-sync M3
              </button>
            </div>
          </div>

          {/* Connected layers info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
              <div className="text-slate-800 font-bold text-[11px]">M1: ABHA Registration</div>
              <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> COMPLIANT
              </div>
              <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">Citizen id creation, linking & verification protocols active.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
              <div className="text-slate-800 font-bold text-[11px]">M2: Health Facilities</div>
              <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> COMPLIANT
              </div>
              <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">HIP/HIU facility profile listing synchronized inside central servers.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
              <div className="text-slate-800 font-semibold text-[11px]">M3: Health Records Share</div>
              <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE COMPLIANT
              </div>
              <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">Interoperable clinical diagnostic exchange (FHIR bundle compliant).</p>
            </div>
          </div>
        </div>

        {/* Sync logs and credentials registry */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 font-sans shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-800 font-extrabold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" /> ABDM Verified Patient database
            </span>
            <div className="relative w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              <input
                type="text"
                placeholder="Search name, ABHA or MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 hover:border-slate-300 text-slate-705 px-3 py-1.5 pl-8 rounded-lg text-xs outline-none focus:border-blue-500 w-full sm:w-56 font-mono"
              />
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-150 text-slate-500 font-bold uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">MRN Number</th>
                  <th className="py-2.5 px-3">ABHA ID (NHA linked)</th>
                  <th className="py-2.5 px-3">Sync State</th>
                  <th className="py-2.5 px-3 text-right">Credentials Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p, pIdx) => {
                    if (!p) return null;
                    return (
                      <tr key={pIdx} className="hover:bg-slate-50/75 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-blue-600 font-bold">{p.mrn}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{p.abhaId}</td>
                        <td className="py-3 px-3 font-mono">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg font-bold">
                            <Check className="w-2.5 h-2.5 text-emerald-600" /> FHIR Synced
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedAbha(p)}
                            className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition cursor-pointer font-bold"
                          >
                            Examine Card
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching verified ABDM patient profiles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Right Column: Visual ABHA Digital Health Card Presentation */}
      <div>
        {selectedAbha ? (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm animate-fade-in font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-800 font-bold">Health Credential Passport</span>
              <button
                onClick={() => setSelectedAbha(null)}
                className="text-slate-400 hover:text-slate-900 text-xs font-mono font-bold"
              >
                Clear ×
              </button>
            </div>

            {/* Official Ayush ID Card Design - Clean high contrast minimalism */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-800 rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-6">
              
              {/* National Emblem watermarks / headers */}
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-amber-300 font-extrabold block">Ministry of Health & Family Welfare</span>
                  <span className="text-xs font-black text-white tracking-tight uppercase block font-display">Ayushman Bharat Digital Mission</span>
                </div>
                <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center border border-white/25">
                  <span className="text-[10px] font-mono text-white font-bold">ABHA</span>
                </div>
              </div>

              {/* Patient visual particulars */}
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center relative flex-shrink-0 text-white/50 text-[10px] font-mono font-semibold">
                  MEMBER
                </div>
                <div className="space-y-0.5 text-xs text-white">
                  <div className="text-sm font-black text-white">{selectedAbha.name}</div>
                  <div className="text-white/80">Gender: <span className="font-mono text-white font-bold">{selectedAbha.gender}</span> • Dob Year: <span className="font-mono text-white font-bold">{2026 - selectedAbha.age}</span></div>
                  <div className="text-white/80">MRN ID: <span className="font-mono text-white font-bold">{selectedAbha.mrn}</span></div>
                </div>
              </div>

              {/* Digital Identifiers */}
              <div className="bg-black/25 p-3 rounded-xl border border-white/10 space-y-1.5">
                <div>
                  <div className="text-[9px] font-mono uppercase text-white/60 font-semibold">ABHA ADDRESS COORDINATE</div>
                  <div className="text-xs font-black text-emerald-300 font-mono tracking-wider">{selectedAbha.abhaId}@ndhm</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-white/60 font-semibold">NHA VERIFIED FACILITY REGISTRY</div>
                  <div className="text-xs font-bold text-white font-mono">HIP-9874-Live-Synchronous</div>
                </div>
              </div>

              {/* QR Code emulation & details */}
              <div className="flex justify-between items-center text-[10px] font-mono text-white/60 pt-1">
                <span>Verified by National Health Authority</span>
                <span className="text-emerald-300 flex items-center gap-0.5 font-bold">
                  <Check className="w-3.5 h-3.5" /> SECURE MATCH
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs leading-relaxed text-slate-600 border border-slate-150 space-y-2">
              <span className="text-[10px] font-bold text-blue-700 font-mono uppercase block">ABDM Interoperability Data:</span>
              <p className="font-medium">When this patient is discharged, VIGILOR OS will automatically export completed FHIR electronic diagnostic logs directly to global logs linked to the ABHA ID.</p>
              <button className="w-full mt-2 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[11px] font-mono text-slate-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition">
                <Download className="w-3.5 h-3.5 text-slate-500" /> Download clinical FHIR Bundle (JSON)
              </button>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl h-100 flex flex-col items-center justify-center text-slate-500 font-sans p-6 text-center shadow-xs">
            <Key className="w-12 h-12 text-slate-200 mb-2" />
            <p className="text-sm font-bold text-slate-800">ID Credentials Sandbox</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-normal font-medium">
              Select or examine a verified patient profile on the left registry table to see their official digital ABHA credentials passport.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
