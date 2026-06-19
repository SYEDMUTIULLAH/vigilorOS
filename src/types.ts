export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  abhaId: string;
  diagnosis: string;
  admissionDate: string;
  edd: string;
  eddSoon: boolean;
  vitals: {
    pulseRate: number;
    bloodPressure: string;
    spo2: number;
    temperature: number;
  };
  triageCategory: "Immediate" | "Urgent" | "Less-Urgent" | "Non-Urgent";
  status: "Critical" | "Guarded" | "Stable" | "Recovering";
  warning?: string;
  soapNotes?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    lastUpdated: string;
  };
}

export interface Bed {
  id: string;
  ward: "ICU" | "CCU" | "GW3" | "OBG" | "PED" | "ONC";
  bedNumber: number;
  occupied: boolean;
  patient?: Patient;
}

export interface TriageResult {
  triageCategory: "Immediate" | "Urgent" | "Less-Urgent" | "Non-Urgent";
  recommendedWard: "ICU" | "CCU" | "GW3" | "OBG" | "PED" | "ONC";
  priorityScore: number;
  simulatedVitals: {
    pulseRate: number;
    bloodPressure: string;
    spo2: number;
    temperature: number;
  };
  clinicalJustification: string;
  immediateActions: string[];
  estimatedLengthOfStayDays: number;
}

export interface DischargeCandidate {
  bedId: string;
  patientName: string;
  ward: string;
  diagnosis: string;
  dischargeReadinessScore: number;
  barriersToDischarge: string;
  actionToAccelerate: string;
  predictedImpactHours: number;
}

export interface DischargeOutput {
  totalAnalyzedCount: number;
  topCandidates: DischargeCandidate[];
  systemBenefitsSummary: string;
}

export interface MitigationPath {
  id: number;
  title: string;
  strategy: string;
  impact: string;
  steps: string[];
  riskLevel: "Low" | "Medium" | "High";
}

export interface MitigationOutput {
  currentOverallOccupancy: string;
  criticalWards: string[];
  paths: MitigationPath[];
}

export interface Outpatient {
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

export interface LabReport {
  id: string;
  patientName: string;
  mrn: string;
  testName: string;
  status: "Pending" | "Completed";
  reportValue: string;
  generatedAt: string;
}

export interface PharmacyBill {
  id: string;
  patientName: string;
  mrn: string;
  drugs: { name: string; price: number; quantity: number }[];
  totalAmount: number;
  discount: number;
  gst: number;
  finalAmount: number;
  referredBy: string;
  generatedAt: string;
}

