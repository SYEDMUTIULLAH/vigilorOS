import React, { useState, useEffect } from "react";
import { Bed, Patient } from "../types";
import { 
  Sparkles, 
  Save, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  User, 
  Heart, 
  Activity, 
  Thermometer, 
  Droplet,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  ClipboardList,
  ShieldCheck
} from "lucide-react";
import { useHospital } from "../context/HospitalContext";

interface AmbientConsultProps {
  beds: Bed[];
  onUpdatePatient: (bedId: string, updatedData: Partial<Patient>) => Promise<void>;
}


interface LabReport {
  id: string;
  patientName: string;
  mrn: string;
  testName: string;
  status: "Pending" | "Completed";
  reportValue: string;
  generatedAt: string;
}

interface PharmacyBill {
  id: string;
  patientName: string;
  mrn: string;
  drugs: { name: string; price: number; quantity: number }[];
  totalAmount: number;
  discount: number;
  gst: number;
  finalAmount: number;
  referredBy: string;
}

const TEMPLATE_CONSULTS = [
  {
    title: "Pneumonia Bedside Rounding Notes",
    description: "Typical conversation with an recovering outpatient suffering from secondary Lobar pneumonia.",
    transcript: "Patient looks much better today. 'Chest pain has completely gone and I actually ate a full breakfast,' they said. Respiration is comfortable, clear air entry bilaterally, no more expiratory wheezing, just some mild crepitations at the base left lung. BP is stable at 122/75, Pulse rate is down to 78, saturation is sitting healthy at 98% on room air. Let's switch from oral medication IV and get them on Augmentin 625mg twice a day for 5 days. If the physical therapist agrees, I think we can organize a safe discharge tomorrow morning."
  },
  {
    title: "Oncology Review Rounding notes",
    description: "Bedside review of a patient suffering back pain from bone metastasis.",
    transcript: "Patient complains of moderate lower spine pain, rating it a 4 out of 10. Says the localized heat packs provided slight relief, but they couldn't sleep well. No febrile symptoms, temp is solid at 98.6 F, Pulse normal at 72 bpm. Lungs are clear, abdominal region soft and non-tender. We are awaiting the oncology central pharmacy delivery of Bortezomib 3.5mg, there was a stock issue earlier but oncology confirmed supply arriving shortly. Let's start the dosage immediately on arrival. Also add oral paracetamol 1g every 6 hours PRN for local skeletal bone pain management."
  },
  {
    title: "Severe ICU COPD Post-Crisis Roundup",
    description: "Acute crisis stabilization note documenting mechanical ventilation weed-down.",
    transcript: "Rounding on ICU-07. Patient is fully awake, nodding to commands. We successfully weeded them off high-flow oxygen, now on 2L NC with stable SpO2 at 94%. Pulse rate is still somewhat tachycardic at 98, but blood pressure is well preserved at 138/88. Still has some audible wheezing in the upper bronchi. PT needs to execute chest percussion physiotherapy first to mobilize mucus. Continue IV Nebulizers every 4 hours. Keep them under continuous ICU monitoring for another 24 hours to secure absolute airway clearance."
  }
];

export default function AmbientConsult({ beds, onUpdatePatient }: AmbientConsultProps) {
  const { labReports, pharmacyBills, runAmbientConsult } = useHospital();

  // Subtabs configuration inside doctor's workspace
  const [doctorSubTab, setDoctorSubTab] = useState<"active-rounds" | "soap-assistant">("active-rounds");

  // --- Clinical Active Rounds State ---
  const [patientLookupQuery, setPatientLookupQuery] = useState("");
  const [selectedDocPatient, setSelectedDocPatient] = useState<any | null>(null);
  
  // Historical clinical dockets loaded from local databases to prevent fake placeholders
  const [labHistory, setLabHistory] = useState<LabReport[]>([]);
  const [pharmacyHistory, setPharmacyHistory] = useState<PharmacyBill[]>([]);

  // --- SOAP Transcription AI Assistant State ---
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [soapData, setSoapData] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [targetBedId, setTargetBedId] = useState("");

  const activeOccupiedBeds = beds.filter((b) => b.occupied && b.patient);

  // Auto-fetch related historical data once a patient is clicked
  const handleLoadPatientClinicalHistory = async (patientName: string) => {
    try {
      setLabHistory(labReports.filter((l: any) => l.patientName.toLowerCase().includes(patientName.toLowerCase())));
      setPharmacyHistory(pharmacyBills.filter((b: any) => b.patientName.toLowerCase().includes(patientName.toLowerCase())));
    } catch (e) {
      console.error("Clinical history retrieval error:", e);
    }
  };

  const handleSelectDocPatient = (patient: any) => {
    setSelectedDocPatient(patient);
    handleLoadPatientClinicalHistory(patient.name);
  };

  // SOAP Template applying configurations
  const applyTemplate = (index: number) => {
    setSelectedTemplate(index);
    setTranscript(TEMPLATE_CONSULTS[index].transcript);
    
    // Auto-align default target demo beds for templates
    if (index === 0) setTargetBedId("GW3-14");
    if (index === 1) setTargetBedId("ONC-03");
    if (index === 2) setTargetBedId("ICU-07");
  };

  const handleGenerateSOAP = async () => {
    if (!transcript.trim()) {
      alert("Please provide some conversation transcript first.");
      return;
    }
    setLoading(true);
    setSoapData(null);
    setStatusMessage(null);
    try {
      const data = await runAmbientConsult(transcript);
      setSoapData(data);
    } catch (e) {
      console.error(e);
      setStatusMessage("Error compiling transcript offline.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToBed = async () => {
    if (!targetBedId) {
      alert("Select an active bed destination to commit SOAP format files.");
      return;
    }
    if (!soapData) return;

    setLoading(true);
    setStatusMessage(null);
    try {
      const soapNotes = {
        subjective: soapData.subjective,
        objective: soapData.objective,
        assessment: soapData.assessment,
        plan: soapData.plan,
      };

      const isEddSoon = soapData.eddAdjustmentRecommendation?.toLowerCase().includes("soon") || false;
      const patchData: any = { soapNotes, eddSoon: isEddSoon };

      // Autocomplete warnings resolved
      const matchedBed = beds.find(b => b.id === targetBedId);
      if (matchedBed?.patient?.warning) {
        if (transcript.toLowerCase().includes("physiotherapy") || transcript.toLowerCase().includes("pt clearance") || transcript.toLowerCase().includes("therapist")) {
          patchData.warning = "";
        }
      }

      await onUpdatePatient(targetBedId, patchData);
      setStatusMessage(`Success! SOAP format files verified & committed to Inpatient Bed ${targetBedId}.`);
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to sync records.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Workspace Menu Selector */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-750 border border-indigo-100 px-2.5 py-1 rounded-lg font-bold">
              Consultant Medical Portal • Workspace
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-2.5">Central nervous system for medical staff</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
              Search historical patient archives, analyze ward continuous monitoring trends, identify critical triage alerts, and convert raw dialogues into structured electronic health dockets.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 font-mono text-xs">
            <button
              onClick={() => setDoctorSubTab("active-rounds")}
              className={`px-3 py-1.5 font-bold rounded-lg transition ${doctorSubTab === "active-rounds" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Active Rounds Desk
            </button>
            <button
              onClick={() => setDoctorSubTab("soap-assistant")}
              className={`px-3 py-1.5 font-bold rounded-lg transition ${doctorSubTab === "soap-assistant" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              SOAP AI Assistant
            </button>
          </div>
        </div>
      </div>

      {doctorSubTab === "active-rounds" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
          
          {/* Active Patient Navigation lists */}
          <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ward Occupancy registry</h3>
              <p className="text-[11px] text-slate-400">Search occupant name or select from triage zones.</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              <input
                type="text"
                placeholder="Search patient name..."
                value={patientLookupQuery}
                onChange={(e) => setPatientLookupQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-180 rounded-xl py-2 pl-8 pr-3 text-xs outline-none transition focus:bg-white focus:border-indigo-500 font-semibold"
              />
            </div>

            <div className="space-y-2 max-h-120 overflow-y-auto pr-1">
              {activeOccupiedBeds
                .filter(b => b.patient && (!patientLookupQuery || b.patient.name.toLowerCase().includes(patientLookupQuery.toLowerCase())))
                .map((bed) => {
                  const patient = bed.patient!;
                  const isSelect = selectedDocPatient?.id === patient.id;
                  
                  // Identify warning severity colors
                  const isCritical = patient.triageCategory === "Immediate";

                  return (
                    <button
                      key={bed.id}
                      onClick={() => handleSelectDocPatient(patient)}
                      className={`w-full text-left p-3 border rounded-xl text-xs flex justify-between items-center transition ${
                        isSelect ? "bg-indigo-50/75 border-indigo-400 text-indigo-950 font-bold" : "bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-705"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{bed.id} • {bed.ward}</span>
                        <strong className="block text-slate-900 font-bold text-xs mt-1">{patient.name}</strong>
                        <span className="text-[10px] text-slate-405 block font-medium truncate w-40">{patient.diagnosis.slice(0, 30)}...</span>
                      </div>

                      {/* Code Zone Pill Tag */}
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black border uppercase ${
                        isCritical ? "bg-red-50 text-red-700 border-red-200" :
                        patient.triageCategory === "Urgent" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {isCritical ? "RED ZONE" : (patient.triageCategory === "Urgent" ? "AMBER" : "GREEN")}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Core Monitoring & Diagnosis File Column */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            {selectedDocPatient ? (
              <div className="space-y-6">
                
                {/* Clinical Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      MEDICAL FILE COORDINATE
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 font-sans">{selectedDocPatient.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Admitted: {selectedDocPatient.admissionDate} • MRN: {selectedDocPatient.mrn}</p>
                  </div>

                  {/* Priority Alert banner */}
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black border uppercase ${
                    selectedDocPatient.triageCategory === "Immediate" ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" :
                    selectedDocPatient.triageCategory === "Urgent" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-705 border-emerald-200"
                  }`}>
                    {selectedDocPatient.triageCategory === "Immediate" ? "CRITICAL EMERGENCY - ADDRESS FIRST" : "STABLE VIGILANCE"}
                  </span>
                </div>

                {/* Vitals & Continuous Monitoring Charts */}
                <div className="space-y-3 font-sans text-xs">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Live continuous monitoring v-signs:</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    
                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center gap-3">
                      <Heart className="w-5.5 h-5.5 text-red-500" />
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Pulse Rate</span>
                        <strong className="text-sm font-mono text-slate-900 font-bold">{selectedDocPatient.vitals.pulseRate} BPM</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center gap-3">
                      <Activity className="w-5.5 h-5.5 text-blue-500" />
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Blood Pressure</span>
                        <strong className="text-sm font-mono text-slate-900 font-bold">{selectedDocPatient.vitals.bloodPressure}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center gap-3">
                      <Droplet className="w-5.5 h-5.5 text-teal-500" />
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Oxygen SpO2</span>
                        <strong className="text-sm font-mono text-slate-900 font-bold">{selectedDocPatient.vitals.spo2}%</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center gap-3">
                      <Thermometer className="w-5.5 h-5.5 text-amber-500" />
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Temperature</span>
                        <strong className="text-sm font-mono text-slate-900 font-bold">{selectedDocPatient.vitals.temperature} °F</strong>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Historic clinical processes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Diagnosis, procedures \& method followed of previous doctors */}
                  <div className="border border-slate-150 p-4 rounded-xl space-y-3 font-sans text-xs text-slate-700 font-medium">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">1. Diagnostical & Surgical Procedures:</span>
                    <div className="space-y-2.5 leading-relaxed">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Active Clinical Diagnosis:</span>
                        <strong className="text-slate-900 block font-extrabold">{selectedDocPatient.diagnosis}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Consulting Method & Techniques:</span>
                        <p className="text-slate-650 pt-0.5 leading-normal">Closed bedside monitoring loops. Intravenous drug support, with respiratory expansion therapies where indicated.</p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor's task List (Work I have to do) */}
                  <div className="border border-slate-150 p-4 rounded-xl space-y-3 font-sans text-xs text-slate-700">
                    <span className="text-[10px] uppercase font-mono text-indigo-700 block font-bold">2. Consultant Action Checklist (My work today):</span>
                    <ul className="space-y-2 font-medium">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5" />
                        <span>Verify bedside oxygen saturation limits are &gt;94%.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked={selectedDocPatient.triageCategory !== "Immediate"} className="mt-0.5" />
                        <span>Check central pharmacy for medication arrivals.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-0.5" />
                        <span>Formulate final Release documentation parameters.</span>
                      </li>
                    </ul>
                  </div>

                </div>

                {/* Pharmacy & Lab values history */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Lab reports results */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 font-sans text-xs text-slate-700">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Diagnostic Lab Reports Tally:</span>
                    {labHistory.length > 0 ? (
                      <div className="space-y-2">
                        {labHistory.map((l, lIdx) => (
                          <div key={lIdx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <strong className="text-slate-850 font-bold block">{l.testName}</strong>
                            <p className="text-[10.5px] text-slate-500 pt-0.5 leading-tight">{l.reportValue || "Result values compilation pending."}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10.5px] text-slate-400 py-3 text-center">No diagnostic test logs synced for this patient currently.</div>
                    )}
                  </div>

                  {/* Pharmacy prescriptions */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 font-sans text-xs text-slate-700">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Prescribed Pharmacy Medications:</span>
                    {pharmacyHistory.length > 0 ? (
                      <div className="space-y-2">
                        {pharmacyHistory.map((b, bIdx) => (
                          <div key={bIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[9px] font-mono text-indigo-700 block font-bold">BILL COORDINATE: {b.id}</span>
                            <ul className="text-[10.5px] text-slate-650 leading-tight list-disc pl-3">
                              {b.drugs.map((d, dIdx) => (
                                <li key={dIdx}>{d.name} (Qty {d.quantity})</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10.5px] text-slate-400 py-3 text-center font-medium">No apothecary delivery receipts logged.</div>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-slate-405 border border-dashed border-slate-200 rounded-2xl h-96 bg-slate-50/50 flex flex-col items-center justify-center">
                <Stethoscope className="w-12 h-12 text-slate-300 mb-2.5" />
                <h4 className="text-sm font-bold text-slate-700">Consultant Active Monitoring desk</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium leading-relaxed">
                  Select any active occupant residing in wards from the left panel column to track their live pulse logs, surgical procedures history, previous clinician approaches, and billing reports.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {doctorSubTab === "soap-assistant" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in font-sans">
          
          {/* Inputs */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">EHR Automated SOAP Note Generator</h3>
              <p className="text-[11px] text-slate-400">Process recorded consultations or select mock bedside notes.</p>
            </div>

            {/* Quick Templates */}
            <div className="text-xs space-y-2">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Apply Clinical bedside Note:</span>
              <div className="grid grid-cols-1 gap-2">
                {TEMPLATE_CONSULTS.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(idx)}
                    className={`text-left p-3 border rounded-xl transition ${selectedTemplate === idx ? "bg-indigo-50 border-indigo-540 text-slate-900" : "bg-slate-50 border-slate-180 hover:bg-slate-100"}`}
                  >
                    <strong className="block text-slate-900 font-bold text-[11px]">{template.title}</strong>
                    <span className="text-[10px] text-slate-450 block mt-0.5 leading-normal">{template.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transcript text inputs */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Bedside dialogue transcript:</label>
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setSelectedTemplate(null);
                }}
                rows={6}
                placeholder="Type or paste dialogues transcript..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed outline-none focus:bg-white focus:border-indigo-500 transition resize-none font-medium text-slate-700"
              />
            </div>

            {/* Bind destination bed */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Destination synchronizing Bed slot:</label>
              <select
                value={targetBedId}
                onChange={(e) => setTargetBedId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-semibold text-slate-800"
              >
                <option value="">-- Choose Target Bed --</option>
                {activeOccupiedBeds.map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    {bed.id} ({bed.ward}) — {bed.patient?.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateSOAP}
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-450 animate-pulse" />
              Format Clinical SOAP Record
            </button>
          </div>

          {/* AI Resulting Notes */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
            {soapData ? (
              <div className="space-y-5 flex-1">
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-sans">Generated SOAP Record Summary</h3>
                    <p className="text-[10px] text-slate-450">Clinical standard dockets.</p>
                  </div>
                  <span className="font-mono text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-lg font-bold">
                    COMPILED OK
                  </span>
                </div>

                <div className="space-y-3.5 text-xs leading-relaxed text-slate-700 font-medium">
                  
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <strong className="text-[10px] uppercase font-mono text-slate-400 block font-bold mb-0.5">Subjective:</strong>
                    <p>{soapData.subjective}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <strong className="text-[10px] uppercase font-mono text-slate-400 block font-bold mb-0.5">Objective:</strong>
                    <p>{soapData.objective}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <strong className="text-[10px] uppercase font-mono text-slate-400 block font-bold mb-0.5">Assessment:</strong>
                    <p>{soapData.assessment}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <strong className="text-[10px] uppercase font-mono text-slate-400 block font-bold mb-0.5">Plan:</strong>
                    <p>{soapData.plan}</p>
                  </div>

                </div>

                {statusMessage && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-150 text-xs text-emerald-800 rounded-lg font-semibold">
                    {statusMessage}
                  </div>
                )}

                <div className="border-t border-slate-100 pt-5 flex justify-end gap-3 font-mono font-bold text-xs">
                  <button
                    onClick={() => setSoapData(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
                  >
                    Clear Notes
                  </button>
                  <button
                    onClick={handleSyncToBed}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Commit & Synchronize Bedside
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-205 rounded-2xl bg-slate-50/50 h-96">
                <FileText className="w-12 h-12 text-slate-200 mb-2.5" />
                <h4 className="text-xs font-bold text-slate-800">SOAP AI Notes Roster</h4>
                <p className="text-xs text-slate-450 max-w-xs mt-1 font-medium leading-relaxed">
                  Apply a pre-rounded template or paste bedside logs, then trigger the formatting builder to review organized EHR files.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
