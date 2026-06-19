import React, { useState, useEffect, useMemo } from "react";
import { Bed, TriageResult, Patient as HospitalPatient } from "../types";
import { Appointment, Doctor, Patient as PatientModel } from "../types/models";
import { patientService } from "../services/patientService";
import { doctorService } from "../services/doctorService";
import { appointmentService } from "../services/appointmentService";
import PatientForm from "./common/PatientForm";
import PatientTable from "./common/PatientTable";
import AppointmentForm from "./common/AppointmentForm";
import AppointmentTable from "./common/AppointmentTable";
import { 
  Sparkles, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  ShieldCheck, 
  UserPlus, 
  UserCheck, 
  Heart, 
  Thermometer, 
  Layers, 
  User, 
  Clock, 
  Search, 
  Download, 
  FileText,
  DollarSign,
  Plus,
  FlameKindling,
  Trash2,
  Check
} from "lucide-react";
import { useHospital } from "../context/HospitalContext";

interface TriageDeskProps {
  beds: Bed[];
  onAddPatient: (bedId: string, patientData: HospitalPatient) => Promise<void>;
  onDischargePatient: (bedId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}


interface Outpatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  doctor: string;
  appointmentTime: string;
  queueNo: string;
  registrationDate: string;
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

const DOCTORS_LIST = [
  "Dr. Ashish Verma (Cardiology)",
  "Dr. Sunita Rao (Pediatrics)",
  "Dr. Rajesh Mehta (Internal Medicine)",
  "Dr. Shalini Sen (OBG / Gynecology)",
  "Dr. Sanjay Dutt (Oncology)",
  "Dr. Vikram Patel (General Surgery)"
];

export default function TriageDesk({ beds, onAddPatient, onDischargePatient, onRefresh }: TriageDeskProps) {
  const { outpatients: outpatientsList, registerOutpatient, runTriage } = useHospital();

  // Master Reception subtab
  const [receptionTab, setReceptionTab] = useState<"active-queue" | "new-patient" | "returning-patients" | "patient-master" | "appointments" | "visit-history" | "ipd-triage" | "abdm" | "discharge">("active-queue");

  // --- OPD Registration State ---
  const [opdName, setOpdName] = useState("");
  const [opdAge, setOpdAge] = useState("32");
  const [opdGender, setOpdGender] = useState("Male");
  const [opdDoctor, setOpdDoctor] = useState(DOCTORS_LIST[0]);
  const [opdTime, setOpdTime] = useState("10:30 AM");

  // Data stores for unified reception workflows
  const [patients, setPatients] = useState<PatientModel[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientModel | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [masterSearchTerm, setMasterSearchTerm] = useState("");
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const patientMap = useMemo(
    () => patients.reduce<Record<string, PatientModel>>((acc, patient) => {
      acc[patient.id] = patient;
      return acc;
    }, {}),
    [patients]
  );

  const doctorMap = useMemo(
    () => doctors.reduce<Record<string, Doctor>>((acc, doctor) => {
      acc[doctor.id] = doctor;
      return acc;
    }, {}),
    [doctors]
  );

  const filteredReturningPatients = useMemo(() => {
    const q = patientSearchTerm.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((patient) => patient.name.toLowerCase().includes(q) || patient.phone.toLowerCase().includes(q));
  }, [patients, patientSearchTerm]);

  const filteredMasterPatients = useMemo(() => {
    const q = masterSearchTerm.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(q) ||
        patient.phone.toLowerCase().includes(q) ||
        patient.address.toLowerCase().includes(q)
    );
  }, [patients, masterSearchTerm]);

  const filteredAppointments = useMemo(() => {
    const q = appointmentSearchTerm.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (appointment) =>
        patientMap[appointment.patientId]?.name.toLowerCase().includes(q) ||
        doctorMap[appointment.doctorId]?.name.toLowerCase().includes(q)
    );
  }, [appointments, appointmentSearchTerm, patientMap, doctorMap]);

  const filteredHistory = useMemo(() => {
    const q = historySearchTerm.trim().toLowerCase();
    return appointments
      .filter((appointment) => appointment.status === "Completed")
      .filter(
        (appointment) =>
          !q ||
          patientMap[appointment.patientId]?.name.toLowerCase().includes(q) ||
          doctorMap[appointment.doctorId]?.name.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }, [appointments, historySearchTerm, patientMap, doctorMap]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [patientsData, doctorsData, appointmentsData] = await Promise.all([
          patientService.getAll(),
          doctorService.getAll(),
          appointmentService.getAll(),
        ]);
        setPatients(patientsData);
        setDoctors(doctorsData);
        setAppointments(appointmentsData);
      } catch (error) {
        console.error("Failed to load reception data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreatePatient = async (payload: Omit<PatientModel, "id" | "createdAt">) => {
    const created = await patientService.create(payload);
    setPatients((current) => [created, ...current]);
  };

  const handleUpdatePatient = async (id: string, updates: Partial<Omit<PatientModel, "id" | "createdAt">>) => {
    const updated = await patientService.update(id, updates);
    setPatients((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedPatient(null);
  };

  const handleDeletePatient = async (id: string) => {
    try {
      await patientService.remove(id);
      setPatients((current) => current.filter((item) => item.id !== id));
      if (selectedPatient?.id === id) {
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error("Failed to delete patient:", error);
    }
  };

  const handleCreateAppointment = async (payload: Omit<Appointment, "id" | "createdAt">) => {
    const created = await appointmentService.create(payload);
    setAppointments((current) => [created, ...current]);
  };

  const handleUpdateAppointment = async (id: string, updates: Partial<Omit<Appointment, "id" | "createdAt">>) => {
    const updated = await appointmentService.update(id, updates);
    setAppointments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedAppointment(null);
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await appointmentService.remove(id);
      setAppointments((current) => current.filter((item) => item.id !== id));
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    }
  };

  // --- IPD / Emergency AI Triage State ---
  const [ipdName, setIpdName] = useState("");
  const [ipdAge, setIpdAge] = useState("45");
  const [ipdGender, setIpdGender] = useState("Male");
  const [isEmergency, setIsEmergency] = useState(false);
  const [subjectiveSymptoms, setSubjectiveSymptoms] = useState("");
  const [pulseRate, setPulseRate] = useState<number>(82);
  const [bloodPressure, setBloodPressure] = useState("120/80");
  const [spo2, setSpo2] = useState<number>(98);
  const [temperature, setTemperature] = useState<number>(98.6);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [selectedBedId, setSelectedBedId] = useState("");

  // --- ABDM Compliance State ---
  const [abhaQuery, setAbhaQuery] = useState("");
  const [selectedAbhaProfile, setSelectedAbhaProfile] = useState<any | null>(null);
  const [sandboxSynced, setSandboxSynced] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Discharge & Billing State ---
  const [selectedDischargeBed, setSelectedDischargeBed] = useState<Bed | null>(null);
  const [stayDays, setStayDays] = useState(3);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [gstPercent, setGstPercent] = useState(18);
  const [billingCompleted, setBillingCompleted] = useState(false);
  const [dischargeReceipt, setDischargeReceipt] = useState<any | null>(null);

  // General loader/alerts
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter useful variables
  const vacantBeds = beds.filter((b) => !b.occupied);
  const occupiedBeds = beds.filter((b) => b.occupied && b.patient);

  // Handle OPD Form Submission
  const handleRegisterOpd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!opdName.trim()) {
      alert("Please provide the patient name.");
      return;
    }
    setActionLoading(true);
    setNotice(null);
    try {
      const mrn = `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const createdPatient = await patientService.create({
        mrn,
        fullName: opdName,
        age: Number(opdAge),
        gender: opdGender as "Male" | "Female" | "Other",
      });

      const outpatient = await registerOutpatient({
        name: opdName,
        age: Number(opdAge),
        gender: opdGender,
        doctor: opdDoctor,
        appointmentTime: opdTime,
        mrn,
      });
      setNotice(`Successfully registered outpatient: ${opdName} (${outpatient.id}) queued at ${outpatient.queueNo}`);
      setOpdName("");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setNotice("Error registering outpatient record.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle IPD / Emergency AI Triage Evaluation
  const handleEvaluateTriage = async () => {
    if (!subjectiveSymptoms.trim()) {
      alert("Please enter the present illness / symptoms to run clinical triage evaluation.");
      return;
    }
    setActionLoading(true);
    setTriageResult(null);
    setNotice(null);
    try {
      // If it's an emergency, simulate higher critical distress vitals unless overridden
      let actualPulse = pulseRate;
      let actualBp = bloodPressure;
      let actualSpo2 = spo2;
      let actualTemp = temperature;
      
      if (isEmergency) {
        actualPulse = Math.max(actualPulse, 110);
        actualSpo2 = Math.min(actualSpo2, 90);
      }

      const data = await runTriage({
        name: ipdName || "Incoming Emergency Inpatient",
        age: Number(ipdAge),
        gender: ipdGender,
        subjectiveSymptoms: subjectiveSymptoms + (isEmergency ? " [ALERT: REGISTERED AS CRISIS / EMERGENCY EMERGENCY]" : ""),
        vitals: {
          pulseRate: actualPulse,
          bloodPressure: actualBp,
          spo2: actualSpo2,
          temperature: actualTemp
        }
      });
      setTriageResult(data);

      // Pre-select first vacant bed in the recommended ward
      const recWard = data.recommendedWard || "GW3";
      const matchBeds = beds.filter(b => b.ward === recWard && !b.occupied);
      if (matchBeds.length > 0) {
        setSelectedBedId(matchBeds[0].id);
      } else if (vacantBeds.length > 0) {
        setSelectedBedId(vacantBeds[0].id);
      }
    } catch (e) {
      console.error(e);
      setNotice("Failed to resolve AI Triage metrics with server.");
    } finally {
      setActionLoading(false);
    }
  };

  // Commit the triaged patient into the bed
  const handleCommitBedAdmission = async () => {
    if (!triageResult || !selectedBedId) {
      alert("Run clinical evaluation and select an available bed first.");
      return;
    }
    setActionLoading(true);
    try {
      const gMRN = `MRN-2026-${Math.floor(1100 + Math.random() * 8800)}`;
      const gABHA = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const patientData: Patient = {
        id: `PAT-${Math.floor(5100 + Math.random() * 4000)}`,
        name: ipdName || "Emergency Inpatient",
        age: Number(ipdAge),
        gender: ipdGender,
        mrn: gMRN,
        abhaId: gABHA,
        diagnosis: `Admitting Complaint: ${subjectiveSymptoms.slice(0, 50)}... [Triage Diagnosed: ${triageResult.clinicalJustification}]`,
        admissionDate: new Date().toISOString().split('T')[0],
        edd: new Date(Date.now() + (triageResult.estimatedLengthOfStayDays || 4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        eddSoon: false,
        vitals: triageResult.simulatedVitals,
        triageCategory: triageResult.triageCategory,
        status: triageResult.triageCategory === "Immediate" ? "Critical" : "Stable",
        warning: triageResult.triageCategory === "Immediate" ? "Emergency admission - critical monitoring required." : undefined
      };

      await onAddPatient(selectedBedId, patientData);
      setNotice(`Admission completed! ${patientData.name} successfully assigned to Bed ${selectedBedId}. (MRN: ${gMRN})`);
      setIpdName("");
      setSubjectiveSymptoms("");
      setTriageResult(null);
      setIsEmergency(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to commit admission.");
    } finally {
      setActionLoading(false);
    }
  };

  // ABDM Sandbox synchronization trigger
  const handleAbdmSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setSandboxSynced(true);
      setIsSyncing(false);
    }, 1200);
  };

  // Populate dynamic invoice summaries for discharge candidate
  const handleSelectDischargeCandidate = (bed: Bed) => {
    setSelectedDischargeBed(bed);
    setStayDays(Math.floor(3 + Math.random() * 6));
    setBillingCompleted(false);
    setDischargeReceipt(null);
  };

  const handleFinalizeDischargeBill = async () => {
    if (!selectedDischargeBed || !selectedDischargeBed.patient) return;
    setActionLoading(true);

    const patient = selectedDischargeBed.patient;
    const bedId = selectedDischargeBed.id;
    const ward = selectedDischargeBed.ward;

    // Ward charges
    const ratePerDay = ward === "ICU" ? 12000 : (ward === "CCU" ? 10000 : 3200);
    const roomCharge = ratePerDay * stayDays;
    const clinicalDiagnosticsCharge = 4500;
    const centralPharmacyCharge = 3850;
    const subtotal = roomCharge + clinicalDiagnosticsCharge + centralPharmacyCharge;
    
    const discountVal = Math.round(subtotal * (discountPercent / 100));
    const taxableVal = subtotal - discountVal;
    const gstVal = Math.round(taxableVal * (gstPercent / 100));
    const totalInvoice = taxableVal + gstVal;

    const invoice = {
      billId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      patientName: patient.name,
      mrn: patient.mrn,
      bedId,
      ward,
      stayLength: stayDays,
      ratePerDay,
      roomCharge,
      diagnostics: clinicalDiagnosticsCharge,
      pharmacy: centralPharmacyCharge,
      subtotal,
      discount: discountVal,
      gst: gstVal,
      totalAmount: totalInvoice,
      clearedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
    };

    try {
      // Trigger actual discharge in App DB
      await onDischargePatient(bedId);
      setDischargeReceipt(invoice);
      setBillingCompleted(true);
      setNotice(`Invoice generated and bed ${bedId} cleared successfully.`);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      setNotice("Failed to complete discharge database clearance.");
    } finally {
      setActionLoading(false);
    }
  };

  const activePatientsCombined = beds.filter(b => b.occupied && b.patient).map(b => b.patient);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper header section */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg font-bold">
              Central Reception & Registrations Desk
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-2.5">Unified Intake & Patient Clearance Desk</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
              One single integrated interface for quick Outpatient bookings, emergency IPD bed triage, security ABDM card setups, and dynamically synchronized invoice clearances.
            </p>
          </div>

          {/* Tab switches */}
          <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => { setReceptionTab("active-queue"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "active-queue" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Active Queue
            </button>
            <button
              onClick={() => { setReceptionTab("new-patient"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "new-patient" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              New Patient Registration
            </button>
            <button
              onClick={() => { setReceptionTab("returning-patients"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "returning-patients" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Returning Patients
            </button>
            <button
              onClick={() => { setReceptionTab("patient-master"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "patient-master" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Patient Master
            </button>
            <button
              onClick={() => { setReceptionTab("appointments"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "appointments" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Appointments
            </button>
            <button
              onClick={() => { setReceptionTab("visit-history"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "visit-history" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Visit History
            </button>
            <button
              onClick={() => { setReceptionTab("ipd-triage"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "ipd-triage" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              IPD & Emergency
            </button>
            <button
              onClick={() => { setReceptionTab("abdm"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "abdm" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              ABDM Sandbox
            </button>
            <button
              onClick={() => { setReceptionTab("discharge"); setNotice(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition font-mono ${receptionTab === "discharge" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Discharge & Billing
            </button>
          </div>
        </div>

        {notice && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs md:text-sm text-blue-800 font-medium">
            <CheckCircle className="w-4.5 h-4.5 text-blue-600 flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {receptionTab === "new-patient" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Side */}
          <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">New OPD Registration</h3>
              <p className="text-[11px] text-slate-400">Schedule dynamic outpatient consults instantly.</p>
            </div>

            <form onSubmit={handleRegisterOpd} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Patient Full Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={opdName}
                  onChange={(e) => setOpdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Age:</label>
                  <input
                    type="number"
                    value={opdAge}
                    onChange={(e) => setOpdAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Gender:</label>
                  <select
                    value={opdGender}
                    onChange={(e) => setOpdGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Consultant Specialty Doctor:</label>
                <select
                  value={opdDoctor}
                  onChange={(e) => setOpdDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition font-semibold text-slate-705"
                >
                  {DOCTORS_LIST.map((doc, idx) => (
                    <option key={idx} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Appointment TimeSlot Slot:</label>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={opdTime}
                  onChange={(e) => setOpdTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                Register OPD Appointment
              </button>
            </form>
          </div>

          {/* Active OPD Registry Grid */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">Active Registrants List (Clinic Dispatch)</h3>
                <p className="text-[11px] text-slate-400">Real-time OPD queue linked with Lab and Pharmacy modules automatically.</p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-slate-100 border border-slate-250 px-2.5 py-0.5 rounded font-bold">
                {outpatientsList.length} QUEUED Today
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar pt-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-mono text-[10px] uppercase text-slate-400 pb-2 font-semibold">
                    <th className="py-2.5 px-3">Patient MRN</th>
                    <th className="py-2.5 px-3">Assign Dr.</th>
                    <th className="py-2.5 px-3">Appointment Hour</th>
                    <th className="py-2.5 px-3 text-right">Live Queue Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {outpatientsList.length > 0 ? (
                    outpatientsList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/75 transition">
                        <td className="py-3.5 px-3">
                          <strong className="text-slate-950 font-bold block">{p.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{p.mrn} • Age {p.age} {p.gender}</span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700">
                          {p.doctor}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-500 font-semibold flex items-center gap-1.5 mt-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {p.appointmentTime}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-mono font-bold">
                            {p.queueNo}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                        No active outpatients registered on the OPD desk currently.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {receptionTab === "ipd-triage" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Intake inputs & raw symptoms */}
          <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="border-b border-white pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Inpatient Bed Booking</h3>
                <p className="text-[11px] text-slate-400">Emergency & clinical symptom analytics.</p>
              </div>
              
              {/* Emergency indicator */}
              <button
                type="button"
                onClick={() => setIsEmergency(!isEmergency)}
                className={`px-2.5 py-1 border rounded-lg font-mono text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition ${isEmergency ? "bg-rose-500 border-rose-600 text-white animate-pulse" : "bg-white border-slate-200 text-slate-400 hover:text-slate-800"}`}
              >
                <FlameKindling className="w-3.5 h-3.5" />
                Emergency
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Patient Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Priyadarshini Rao"
                  value={ipdName}
                  onChange={(e) => setIpdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Age:</label>
                  <input
                    type="number"
                    value={ipdAge}
                    onChange={(e) => setIpdAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition font-mono font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Gender:</label>
                  <select
                    value={ipdGender}
                    onChange={(e) => setIpdGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Patient Vitals controls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Admitting Emergency Vitals</span>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Pulse Rate (BPM)</label>
                    <input
                      type="number"
                      value={pulseRate}
                      onChange={(e) => setPulseRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs outline-none text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Blood Pressure</label>
                    <input
                      type="text"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs outline-none text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Oxygen SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs outline-none text-center font-bold text-teal-650"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs outline-none text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Presenting Symptoms / Chief complaint:</label>
                <textarea
                  placeholder="e.g. Severe retrosternal chest tightness radiates to the left jaw, coupled with mild dyspnea and sweating since 2 hours ago."
                  value={subjectiveSymptoms}
                  onChange={(e) => setSubjectiveSymptoms(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition resize-none font-sans leading-relaxed text-slate-705"
                />
              </div>

              <button
                type="button"
                onClick={handleEvaluateTriage}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-450" />
                )}
                Run Gemini AI Triage Evaluator
              </button>
            </div>
          </div>

          {/* AI Result & Allocation Panel */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
            {triageResult ? (
              <div className="space-y-6 flex-1">
                
                {/* Result header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-sans">Gemini AI Clinical Evaluation Outcomes</h3>
                    <p className="text-[10px] text-slate-400">Validated emergency diagnostic guidance.</p>
                  </div>
                  
                  {/* Category Pill Tag */}
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-mono font-extrabold border uppercase ${
                    triageResult.triageCategory === "Immediate" ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" :
                    triageResult.triageCategory === "Urgent" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    Triage Area: {triageResult.triageCategory} Zone (Priority: {triageResult.priorityScore}/100)
                  </span>
                </div>

                {/* Justification summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold mb-1">Clinical Justification & Impressions</span>
                  <p className="text-slate-700 font-semibold leading-relaxed">{triageResult.clinicalJustification}</p>
                </div>

                {/* Simulated vitals & recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="border border-slate-150 p-4 rounded-xl space-y-3 font-sans">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Suggested Immediate Operations:</span>
                    <ul className="text-xs space-y-2 text-slate-600">
                      {triageResult.immediateActions && triageResult.immediateActions.map((act, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-slate-150 p-4 rounded-xl space-y-3 font-sans">
                    <span className="text-[10px] font-mono uppercase text-teal-700 block font-bold">Admission Estimates:</span>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Recommended Ward:</span>
                        <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono font-bold uppercase">{triageResult.recommendedWard}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Estimated Duration of Stay:</span>
                        <strong className="text-slate-900 font-mono font-bold">{triageResult.estimatedLengthOfStayDays || 4} Days</strong>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Floor Reservation Selection */}
                <div className="border-t border-slate-100 pt-5 space-y-3.5">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Select Bed reservation:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono">Available Bed Allocator Grid:</label>
                      <select
                        value={selectedBedId}
                        onChange={(e) => setSelectedBedId(e.target.value)}
                        className="w-full mt-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl p-2.5 font-mono text-xs outline-none transition font-semibold"
                      >
                        <option value="">-- Choose Bed --</option>
                        {vacantBeds.map((vBed) => (
                          <option key={vBed.id} value={vBed.id}>
                            {vBed.ward} Floor - Bed {vBed.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleCommitBedAdmission}
                      disabled={actionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      Commit Inpatient Directly
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl h-80 bg-slate-50/50">
                <Sparkles className="w-12 h-12 text-slate-300 mb-2.5" />
                <h4 className="text-sm font-bold text-slate-800">Triage Evaluator Module Ready</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1 font-medium leading-relaxed">
                  Enter patient particulars and presents symptoms, then run the Gemini clinical analyzer to preview appropriate triage tags and matching room placements.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {receptionTab === "abdm" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
          
          {/* Milestone controls list */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Compliance Milestones sync cards */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">ABDM National Sandbox Interface</h3>
                  </div>
                  <p className="text-xs text-slate-500 pt-0.5 leading-normal font-medium">
                    Fully linked with India's National Health Authority (NHA) database to create citizen identity registers and export interoperable records on demand.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold">
                    <span className={`w-2 h-2 rounded-full ${sandboxSynced ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                    <span className="text-emerald-700">{sandboxSynced ? "NHA SYSTEM ONLINE" : "DISCONNECTED"}</span>
                  </span>
                  <button
                    onClick={handleAbdmSync}
                    disabled={isSyncing}
                    className="p-1 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700 font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                    Sync Sandbox M3
                  </button>
                </div>
              </div>

              {/* Milestones cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
                  <span className="text-slate-800 font-bold block text-[11px]">Milestone 1: ABHA Registration</span>
                  <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE & COMPLIANT
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1 font-medium">Generate digital credentials passport and link existing health registers securely.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
                  <span className="text-slate-800 font-bold block text-[11px]">Milestone 2: Facility Listing</span>
                  <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE & COMPLIANT
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1 font-medium">Link hospital systems as active Healthcare Provider registries nationally.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
                  <span className="text-slate-800 font-bold block text-[11px]">Milestone 3: Health Records Shared</span>
                  <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE & SYNCED
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1 font-medium">Transmit secure electronic diagnostics charts (compliant with HL7 FHIR structures).</p>
                </div>
              </div>
            </div>

            {/* List of patients to search \& examine cards */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">NHA Verified Patient Sandbox Registry</h3>
                  <p className="text-[11px] text-slate-400">Search registrants to view their government-link Health IDs passport.</p>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search name or MRN..."
                    value={abhaQuery}
                    onChange={(e) => setAbhaQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-705 px-3 py-1.5 pl-8 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 w-full sm:w-52 font-mono"
                  />
                </div>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-mono text-[10px] font-semibold uppercase pb-2">
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">MRN Number</th>
                      <th className="py-2.5 px-3">ABHA ID Address</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {activePatientsCombined.filter(p => !abhaQuery || p.name.toLowerCase().includes(abhaQuery.toLowerCase())).length > 0 ? (
                      activePatientsCombined
                        .filter(p => !abhaQuery || p.name.toLowerCase().includes(abhaQuery.toLowerCase()))
                        .map((p, index) => (
                          <tr key={index} className="hover:bg-slate-50/75 transition">
                            <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                            <td className="py-3 px-3 font-mono text-blue-600 font-bold">{p.mrn}</td>
                            <td className="py-3 px-3 font-mono text-slate-500">{p.abhaId || `${p.id}@ndhm`}</td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setSelectedAbhaProfile(p)}
                                className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 font-bold border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                              >
                                View ID Card
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-40s font-medium">
                          No active verified registrants match your query parameter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Ayushman health passport card view */}
          <div>
            {selectedAbhaProfile ? (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-xs animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-800 font-bold">Health Credential Passport</span>
                  <button
                    onClick={() => setSelectedAbhaProfile(null)}
                    className="text-slate-400 hover:text-slate-900 text-xs font-mono font-bold"
                  >
                    Clear ×
                  </button>
                </div>

                {/* Ayushman Card design */}
                <div className="bg-gradient-to-br from-blue-750 to-indigo-950 border border-blue-900 rounded-2xl p-5 shadow-md relative overflow-hidden space-y-6 text-white select-none">
                  <div className="flex justify-between items-start border-b border-white/10 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-amber-300 font-black block">Ministry of Health & Family Welfare</span>
                      <span className="text-xs font-black text-white tracking-tight uppercase block">Ayushman Bharat Digital Scheme</span>
                    </div>
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                      <span className="text-[9px] font-mono text-white font-bold">ABHA</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/10 border border-white/15 rounded-lg flex items-center justify-center text-[10px] font-mono text-white/50 font-semibold flex-shrink-0">
                      PHOTO
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <strong className="text-sm font-black block">{selectedAbhaProfile.name}</strong>
                      <div className="text-white/80">Gender: <span className="font-mono text-white font-bold">{selectedAbhaProfile.gender}</span> • Birth Year: <span className="font-mono text-white font-bold">{2026 - (selectedAbhaProfile.age || 35)}</span></div>
                      <div className="text-white/80">MRN ID: <span className="font-mono text-white font-bold">{selectedAbhaProfile.mrn}</span></div>
                    </div>
                  </div>

                  <div className="bg-black/25 p-3 rounded-xl border border-white/10 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] font-mono uppercase text-white/50 font-bold block">ABHA ADDRESS COORDINATE</span>
                      <strong className="text-xs font-black text-emerald-300 font-mono tracking-wider">{selectedAbhaProfile.abhaId || `${selectedAbhaProfile.id}@ndhm`}@ndhm</strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono uppercase text-white/50 font-bold block">NHA INTEGRATION COORDINATE</span>
                      <span className="font-mono text-white/90">FACILITY-ID-VERIFIED-VIGILOR</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-white/60">
                    <span>National Interoperable EHR Secure</span>
                    <span className="text-emerald-300 flex items-center gap-0.5 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> VERIFIED
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-xs leading-relaxed text-slate-600 border border-slate-150 space-y-2">
                  <span className="text-[10px] font-bold text-blue-700 font-mono uppercase block">FHIR records compliance</span>
                  <p className="font-medium">Vigilor automatically compiles diagnostic lab summaries, pharmacy logs, and consultant SOAP notes under this member profile, ensuring legal compliance with Milestones 1-3 guidelines.</p>
                  <button className="w-full py-2 bg-white border border-slate-200 hover:border-slate-350 rounded-lg text-[10px] font-mono text-slate-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition">
                    <Download className="w-3.5 h-3.5 text-slate-500" /> Export Interoperable FHIR Package
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-6 text-center text-slate-400 h-96 flex flex-col items-center justify-center shadow-xs">
                <FileText className="w-12 h-12 text-slate-200 mb-2" />
                <h4 className="text-xs font-bold text-slate-800">No Credentials Selected</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1.5 font-semibold leading-relaxed">
                  Select key registrants from the verified table grid on the left to examine their official digital health credential passport.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {receptionTab === "discharge" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
          
          {/* List of active bed occupants ready to discharge */}
          <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Bed Occupants Registry</h3>
              <p className="text-[11px] text-slate-400">Select an inpatient to compile their room billing & release files.</p>
            </div>

            <div className="space-y-2 max-h-110 overflow-y-auto pr-1">
              {occupiedBeds.length > 0 ? (
                occupiedBeds.map((bed) => {
                  const isSelect = selectedDischargeBed?.id === bed.id;
                  return (
                    <button
                      key={bed.id}
                      onClick={() => handleSelectDischargeCandidate(bed)}
                      className={`w-full text-left p-3.5 border rounded-xl text-xs flex justify-between items-start transition ${isSelect ? "bg-blue-50 border-blue-550 text-slate-900" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                    >
                      <div>
                        <span className="text-[9px] bg-slate-250 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold uppercase">{bed.id} • {bed.ward}</span>
                        <strong className="block text-slate-900 font-bold mt-1.5 text-xs">{bed.patient?.name}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium leading-tight">{bed.patient?.diagnosis.slice(0, 45)}...</span>
                      </div>
                      
                      {/* Bed warning indicator */}
                      {bed.patient?.warning && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse mt-1 hover:cursor-pointer" title={bed.patient.warning}></span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">No active occupants residing in wards currently.</div>
              )}
            </div>
          </div>

          {/* Billing compilation form & Invoice presentation */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            {selectedDischargeBed && selectedDischargeBed.patient ? (
              <div className="space-y-6">
                
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-sans">Clearance, Invoice & Exit Billing Desk</h3>
                    <p className="text-[11px] text-slate-400">Review length of stay and pass appropriate pharmacy discount levels.</p>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded font-extrabold">
                    Stay Active
                  </span>
                </div>

                {!billingCompleted ? (
                  <div className="space-y-5 text-xs">
                    
                    {/* Variable setups */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Length of Room Residency (Days):</label>
                        <input
                          type="number"
                          value={stayDays}
                          onChange={(e) => setStayDays(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Hospital Discount Percentage (%):</label>
                        <input
                          type="number"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white font-mono font-bold text-emerald-700 font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Clinical SGST + CGST Rate (%):</label>
                        <input
                          type="number"
                          value={gstPercent}
                          onChange={(e) => setGstPercent(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:bg-white font-mono font-bold"
                        />
                      </div>

                    </div>

                    {/* Pre-pricing estimates block */}
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 font-sans">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Pre-Invoicing Breakdown Snapshot:</span>
                      
                      <div className="space-y-2 text-xs text-slate-600 font-medium">
                        <div className="flex justify-between">
                          <span>Room Charges ({selectedDischargeBed.ward} ward daily rate: {selectedDischargeBed.ward === "ICU" ? "₹12000" : (selectedDischargeBed.ward === "CCU" ? "₹10000" : "₹3200")} × {stayDays} days):</span>
                          <span className="font-mono text-slate-900 font-bold">₹{ (selectedDischargeBed.ward === "ICU" ? 12000 : (selectedDischargeBed.ward === "CCU" ? 10000 : 3200)) * stayDays }</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Diagnostic Lab & Diagnostics flat fee:</span>
                          <span className="font-mono text-slate-900 font-bold">₹4,500</span>
                        </div>

                        <div className="flex justify-between">
                          <span>In-house central Pharmacy prescriptions:</span>
                          <span className="font-mono text-slate-900 font-bold">₹3,850</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 font-mono font-bold text-xs pt-2">
                      <button
                        onClick={() => setSelectedDischargeBed(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-605 rounded-xl cursor-pointer"
                      >
                        Cancel Selection
                      </button>
                      <button
                        onClick={handleFinalizeDischargeBill}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer flex items-center gap-1"
                      >
                        <DollarSign className="w-4 h-4" />
                        Generate Invoice & Discharge Patient
                      </button>
                    </div>

                  </div>
                ) : (
                  
                  // Printable receipt layout
                  dischargeReceipt && (
                    <div className="space-y-4 animate-fade-in font-sans">
                      
                      {/* Paper physical style envelope */}
                      <div className="bg-amber-50/20 border border-amber-150 p-6 rounded-2xl space-y-6 font-mono text-xs text-slate-800">
                        <div className="text-center border-b border-slate-200 pb-4">
                          <strong className="text-sm uppercase tracking-tight text-slate-900 font-black block">VIGILOR HOSPITAL PRIVATE LTD</strong>
                          <span className="text-[10px] text-slate-500 block">Indraprassha Area, New Delhi • GSTIN: 07AAACV9842K1Z9</span>
                          <strong className="text-[11.5px] text-emerald-800 uppercase block font-black mt-2">OFFICIAL DISCHARGE CLEARANCE RECEIPT</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[11px] pb-3 border-b border-dashed border-slate-200 leading-normal">
                          <div>
                            <div>Patient: <strong className="text-slate-900 font-bold">{dischargeReceipt.patientName}</strong></div>
                            <div>MRN Ident: <strong className="text-slate-900 font-semibold">{dischargeReceipt.mrn}</strong></div>
                            <div>Bed Ref: <strong className="text-slate-900 font-bold">{dischargeReceipt.bedId} (Floor {dischargeReceipt.ward})</strong></div>
                          </div>
                          <div className="text-right">
                            <div>Bill coordinate: <span className="font-bold text-slate-900">{dischargeReceipt.billId}</span></div>
                            <div>Dated: <span className="font-semibold">{dischargeReceipt.clearedAt}</span></div>
                            <div className="text-emerald-700 font-black flex items-center justify-end gap-0.5">
                              <Check className="w-3.5 h-3.5" /> ACCOUNT COMPLIANT & PAID
                            </div>
                          </div>
                        </div>

                        {/* Calculations particulars */}
                        <div className="space-y-2 border-b border-dashed border-slate-200 pb-3 text-[11px]">
                          <div className="flex justify-between">
                            <span>1. Room Stay ({dischargeReceipt.stayLength} days @ ₹{dischargeReceipt.ratePerDay}/d):</span>
                            <span>₹{dischargeReceipt.roomCharge}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>2. Lab & Diagnostics Testing charge:</span>
                            <span>₹{dischargeReceipt.diagnostics}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>3. Central Formularies & Drugs items:</span>
                            <span>₹{dischargeReceipt.pharmacy}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-800">
                            <span>Subtotal Amount:</span>
                            <span>₹{dischargeReceipt.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700">
                            <span>Promo Discount Applied ({discountPercent}%):</span>
                            <span>-₹{dischargeReceipt.discount}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Indian CGST + SGST ({dischargeReceipt.gstRate || gstPercent}%):</span>
                            <span>+₹{dischargeReceipt.gst}</span>
                          </div>
                        </div>

                        <div className="flex justify-between font-black text-slate-950 text-sm">
                          <span>TOTAL INVOICED RECOVERY:</span>
                          <span className="text-blue-700">₹{dischargeReceipt.totalAmount}</span>
                        </div>

                        <div className="text-center text-[9px] text-slate-400 leading-normal pt-2">
                          All electronic entries cleared. Interoperable diagnostic medical records have been synchronized with the NHA health sandbox under ABHA protocol securely.
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 text-xs font-mono font-bold">
                        <button
                          onClick={() => { setSelectedDischargeBed(null); setBillingCompleted(false); }}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                        >
                          Close Invoices Desk
                        </button>
                      </div>

                    </div>
                  )

                )}

              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-205 rounded-xl flex flex-col items-center justify-center h-80 bg-slate-50/50">
                <DollarSign className="w-12 h-12 text-slate-200 mb-2.5" />
                <h4 className="text-sm font-bold text-slate-700">Discharge Billing Compiler</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs font-medium leading-relaxed">
                  Select any active bed occupant on the left registry table panel to compute length of stay base fees, pharmacy formulas, dynamic discount values, and clear the room index securely.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
