import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Bed, 
  Patient, 
  Outpatient, 
  LabReport, 
  PharmacyBill,
  TriageResult, 
  DischargeOutput, 
  MitigationOutput 
} from "../types";

interface HospitalContextProps {
  beds: Bed[];
  outpatients: Outpatient[];
  labReports: LabReport[];
  pharmacyBills: PharmacyBill[];
  loading: boolean;
  allocateBed: (bedId: string, patient: Patient) => Promise<void>;
  dischargePatient: (bedId: string) => Promise<void>;
  updatePatient: (bedId: string, updatedFields: Partial<Patient>) => Promise<void>;
  resetDatabase: () => Promise<void>;
  registerOutpatient: (outpatient: Omit<Outpatient, "id" | "queueNo" | "registrationDate">) => Promise<Outpatient>;
  requestLabReport: (patientName: string, mrn: string, testName: string) => Promise<LabReport>;
  finalizeLabReport: (reportId: string, reportValue: string) => Promise<LabReport>;
  generatePharmacyBill: (billData: Omit<PharmacyBill, "id" | "generatedAt">) => Promise<PharmacyBill>;
  runTriage: (params: {
    name: string;
    age: number;
    gender: string;
    subjectiveSymptoms: string;
    vitals: { pulseRate: number; bloodPressure: string; spo2: number; temperature: number };
  }) => Promise<TriageResult>;
  runDischargeOptimizer: () => Promise<DischargeOutput>;
  runMitigationPaths: () => Promise<MitigationOutput>;
  runAmbientConsult: (transcript: string) => Promise<any>;
  runMarketingAudit: () => Promise<string>;
}

const HospitalContext = createContext<HospitalContextProps | undefined>(undefined);

// Helper for random options
const firstNames = ["Ramesh", "Savitri", "Aisha", "Priya", "Amit", "Arjun", "Fatima", "Vikram", "Anjali", "Sanjay", "Deepak", "Neha", "Karan", "Sunita", "Rahul", "Pooja", "Rajesh", "Kiran"];
const lastNames = ["Kumar", "Devi", "Begum", "Sharma", "Patel", "Singh", "Bibi", "Gupta", "Deshmukh", "Joshi", "Verma", "Reddy", "Nair", "Iyer", "Choudhury", "Das", "Rao", "Mehta"];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomVitals(ward: string) {
  let pulseRate = 72 + Math.floor(Math.random() * 20);
  let systolic = 115 + Math.floor(Math.random() * 20);
  let diastolic = 75 + Math.floor(Math.random() * 10);
  let spo2 = 95 + Math.floor(Math.random() * 5);
  let temperature = 97.8 + Math.random() * 2;

  if (ward === "ICU") {
    pulseRate = 90 + Math.floor(Math.random() * 35);
    spo2 = 88 + Math.floor(Math.random() * 10);
    systolic = 95 + Math.floor(Math.random() * 45);
    diastolic = 55 + Math.floor(Math.random() * 30);
    temperature = 98.4 + Math.random() * 3;
  } else if (ward === "CCU") {
    pulseRate = 85 + Math.floor(Math.random() * 30);
    systolic = 100 + Math.floor(Math.random() * 40);
    diastolic = 60 + Math.floor(Math.random() * 25);
  } else if (ward === "PED") {
    pulseRate = 100 + Math.floor(Math.random() * 30);
    systolic = 90 + Math.floor(Math.random() * 20);
    diastolic = 55 + Math.floor(Math.random() * 15);
  }

  return {
    pulseRate,
    bloodPressure: `${systolic}/${diastolic}`,
    spo2,
    temperature: parseFloat(temperature.toFixed(1))
  };
}

function generateRandomABHA(): string {
  const segment = () => Math.floor(1000 + Math.random() * 9000);
  return `${segment()}-${segment()}-${segment()}`;
}

const diagnosesByWard: Record<string, string[]> = {
  ICU: ["Septic Shock", "Acute Respiratory Distress Syndrome (ARDS)", "Post-Op Cardiac Arrest recovery", "Traumatic Brain Injury", "Severe DKA with lactic acidosis", "COPD Exacerbation with respiratory fatigue"],
  CCU: ["Acute ST-Elevation Myocardial Infarction", "Decompensated Congestive Heart Failure", "Unstable Angina", "Third-Degree Atrioventricular Block", "Acute Myocarditis", "Aortic Dissection Monitoring"],
  GW3: ["Community-Acquired Lobar Pneumonia", "Cellulitis of lower left extremity", "Complicated Urinary Tract Infection", "Dehydration secondary to Gastroenteritis", "Acute Cholecystitis", "Diabetic Foot Osteomyelitis"],
  OBG: ["Post-Partum Hemorrhage monitoring", "Severe Pre-Eclampsia monitoring", "Active Labor - Stage 2 management", "Gestational Diabetes with fetal stress", "Hyperemesis Gravidarum with electrolyte imbalance"],
  PED: ["Acute Viral Bronchiolitis", "Status Asthmaticus", "Pediatric Rotavirus dehydration", "Neonatal Unconjugated Hyperbilirubinemia", "Simple Febrile Seizure monitoring", "Croup with moderate stridor"],
  ONC: ["High-Grade Non-Hodgkin Lymphoma staging", "Post-Chemotherapy Neutropenic Fever", "Leukemia consolidation therapy", "Advanced Breast Cancer metastatic bone pain", "Multiple Myeloma under diagnostic protocol"]
};

// Default setup builder to seed exact slide requirements
function buildInitialDatabase() {
  const initialBeds: Bed[] = [];
  const wardConfigs: { ward: "ICU" | "CCU" | "GW3" | "OBG" | "PED" | "ONC"; maxBeds: number; occupiedCount: number }[] = [
    { ward: "ICU", maxBeds: 24, occupiedCount: 22 },
    { ward: "CCU", maxBeds: 12, occupiedCount: 10 },
    { ward: "GW3", maxBeds: 36, occupiedCount: 28 },
    { ward: "OBG", maxBeds: 18, occupiedCount: 14 },
    { ward: "PED", maxBeds: 22, occupiedCount: 12 },
    { ward: "ONC", maxBeds: 16, occupiedCount: 15 }
  ];

  let mrnCounter = 4851;

  wardConfigs.forEach(({ ward, maxBeds, occupiedCount }) => {
    // Generate indices that are occupied randomly
    const occupiedIndices = new Set<number>();
    while (occupiedIndices.size < occupiedCount) {
      occupiedIndices.add(Math.floor(Math.random() * maxBeds) + 1);
    }

    // Force specific slide-required beds to be occupied
    if (ward === "ICU") occupiedIndices.add(7);
    if (ward === "GW3") occupiedIndices.add(14);
    if (ward === "ONC") occupiedIndices.add(3);

    for (let b = 1; b <= maxBeds; b++) {
      const isOccupied = occupiedIndices.has(b);
      let patient: Patient | undefined;

      if (isOccupied) {
        const pAge = ward === "PED" ? (Math.floor(Math.random() * 12) + 1) : (35 + Math.floor(Math.random() * 50));
        const pGender = getRandomElement(["Male", "Female"]);
        const pName = getRandomElement(firstNames) + " " + getRandomElement(lastNames);
        const pDiagnosis = getRandomElement(diagnosesByWard[ward]);
        const admissionDaysAgo = Math.floor(Math.random() * 8) + 1;
        const admissionDate = new Date(Date.now() - admissionDaysAgo * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const isEddSoon = Math.random() < 0.2;
        const eddDate = new Date(Date.now() + (isEddSoon ? 8 : 72) * 60 * 60 * 1000).toISOString().split("T")[0];

        patient = {
          id: `PAT-${mrnCounter++}`,
          name: pName,
          age: pAge,
          gender: pGender,
          mrn: `MRN-2026-${mrnCounter + 120}`,
          abhaId: generateRandomABHA(),
          diagnosis: pDiagnosis,
          admissionDate,
          edd: eddDate,
          eddSoon: isEddSoon,
          vitals: generateRandomVitals(ward),
          triageCategory: ward === "ICU" ? "Immediate" : (ward === "CCU" ? "Urgent" : getRandomElement(["Urgent", "Less-Urgent"])),
          status: ward === "ICU" ? "Critical" : (ward === "CCU" ? "Guarded" : "Stable"),
          soapNotes: {
            subjective: `Patient complains of mild respiratory fatigue. Admits to slight improvements compared to ward admission.`,
            objective: `Lungs reveal minor basilar rales. Vitals parameters mostly stabilized within targeted bands.`,
            assessment: `Clinical prognosis shows general positive course of recovery under therapeutic adjustment.`,
            plan: `Continue pharmacological routine. Monitor pulse oxygenation levels hourly. Schedule ward mobilization review.`,
            lastUpdated: new Date().toISOString()
          }
        };

        // Override / Enforce specialized Slide 13 patients exactly:
        if (ward === "ICU" && b === 7) {
          patient.name = "Ravi Shankar";
          patient.age = 72;
          patient.gender = "Male";
          patient.diagnosis = "Acute COPD Exacerbation";
          patient.vitals = { pulseRate: 98, bloodPressure: "138/88", spo2: 91, temperature: 99.2 };
          patient.triageCategory = "Immediate";
          patient.status = "Guarded";
          patient.warning = "PT clearance likely needed - age 72 with COPD";
        }

        if (ward === "GW3" && b === 14) {
          patient.name = "Kanaklatha Devi";
          patient.age = 65;
          patient.gender = "Female";
          patient.diagnosis = "Lobar Community Pneumonia";
          patient.vitals = { pulseRate: 78, bloodPressure: "122/75", spo2: 95, temperature: 98.4 };
          patient.triageCategory = "Urgent";
          patient.status = "Stable";
          patient.eddSoon = true;
          patient.warning = "PT clearance likely needed - age 65 with Pneumonia • Predicted EDD overrun - discharge summary not generated 24h after ready";
        }

        if (ward === "ONC" && b === 3) {
          patient.name = "Vikram Dev";
          patient.age = 59;
          patient.gender = "Male";
          patient.diagnosis = "Multiple Myeloma (Bortezomib Therapy)";
          patient.vitals = { pulseRate: 84, bloodPressure: "115/72", spo2: 98, temperature: 98.9 };
          patient.triageCategory = "Urgent";
          patient.status = "Stable";
          patient.warning = "Pharma stockout: Bortezomib 3.5mg - 2 oncology patients impacted";
        }
      }

      initialBeds.push({
        id: `${ward}-${b < 10 ? "0" + b : b}`,
        ward,
        bedNumber: b,
        occupied: isOccupied,
        patient
      });
    }
  });

  return initialBeds;
}

const defaultOutpatients: Outpatient[] = [
  {
    id: "OPD-101",
    name: "Siddharth Sharma",
    age: 38,
    gender: "Male",
    mrn: "MRN-2026-8941",
    doctor: "Dr. Ashish Verma (Cardiology)",
    appointmentTime: "10:30 AM",
    queueNo: "Q-04",
    registrationDate: "2026-06-15"
  },
  {
    id: "OPD-102",
    name: "Priya Nair",
    age: 29,
    gender: "Female",
    mrn: "MRN-2026-1189",
    doctor: "Dr. Sunita Rao (Pediatrics)",
    appointmentTime: "11:15 AM",
    queueNo: "Q-05",
    registrationDate: "2026-06-15"
  },
  {
    id: "OPD-103",
    name: "Amit Chaudhary",
    age: 45,
    gender: "Male",
    mrn: "MRN-2026-6421",
    doctor: "Dr. Rajesh Mehta (Internal Medicine)",
    appointmentTime: "12:00 PM",
    queueNo: "Q-06",
    registrationDate: "2026-06-15"
  }
];

const defaultLabReports: LabReport[] = [
  {
    id: "LAB-201",
    patientName: "Kanaklatha Devi",
    mrn: "MRN-2026-5211",
    testName: "Blood Sugar Fasting Test",
    status: "Completed",
    reportValue: "Blood Sugar Fasting: 112 mg/dL (Reference Range: 70-100 mg/dL). Clinician advised borderline dietary monitoring.",
    generatedAt: "2026-06-15T09:00:00.000Z"
  },
  {
    id: "LAB-202",
    patientName: "Ravi Shankar",
    mrn: "MRN-2026-5122",
    testName: "Pulmonary Arterial Gas Analysis",
    status: "Completed",
    reportValue: "pH: 7.36, pCO2: 48 mmHg, pO2: 62 mmHg, HCO3: 28 mEq/L. Indicates stable chronic respiratory acidosis with moderate hypoxemia.",
    generatedAt: "2026-06-15T11:30:00.000Z"
  },
  {
    id: "LAB-203",
    patientName: "Siddharth Sharma",
    mrn: "MRN-2026-8941",
    testName: "Lipid Profile Panel",
    status: "Pending",
    reportValue: "",
    generatedAt: "2026-06-15T10:45:00.000Z"
  }
];

const defaultPharmacyBills: PharmacyBill[] = [
  {
    id: "PH-9001",
    patientName: "Ravi Shankar",
    mrn: "MRN-2026-5122",
    drugs: [
      { name: "Albuterol inhaler (100mcg/actuation)", price: 450, quantity: 2 },
      { name: "Prednisone 10mg tablets", price: 15, quantity: 10 }
    ],
    totalAmount: 1050,
    discount: 10,
    gst: 18,
    finalAmount: 1115,
    referredBy: "Dr. Ashish Verma (Cardiology)",
    generatedAt: "2026-06-15T14:30:00.000Z"
  },
  {
    id: "PH-9002",
    patientName: "Kanaklatha Devi",
    mrn: "MRN-2026-5211",
    drugs: [
      { name: "Augmentin 625mg tablets", price: 140, quantity: 14 },
      { name: "Paracetamol 650mg tablets", price: 5, quantity: 20 }
    ],
    totalAmount: 2060,
    discount: 5,
    gst: 18,
    finalAmount: 2309,
    referredBy: "Dr. Sunita Rao (Pediatrics)",
    generatedAt: "2026-06-15T15:20:00.000Z"
  }
];

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [outpatients, setOutpatients] = useState<Outpatient[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [pharmacyBills, setPharmacyBills] = useState<PharmacyBill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedBeds = localStorage.getItem("vigilor_beds");
      const savedOutpatients = localStorage.getItem("vigilor_outpatients");
      const savedLabReports = localStorage.getItem("vigilor_labReports");
      const savedPharmacyBills = localStorage.getItem("vigilor_pharmacyBills");

      if (savedBeds) setBeds(JSON.parse(savedBeds));
      else {
        const b = buildInitialDatabase();
        setBeds(b);
        localStorage.setItem("vigilor_beds", JSON.stringify(b));
      }

      if (savedOutpatients) setOutpatients(JSON.parse(savedOutpatients));
      else {
        setOutpatients(defaultOutpatients);
        localStorage.setItem("vigilor_outpatients", JSON.stringify(defaultOutpatients));
      }

      if (savedLabReports) setLabReports(JSON.parse(savedLabReports));
      else {
        setLabReports(defaultLabReports);
        localStorage.setItem("vigilor_labReports", JSON.stringify(defaultLabReports));
      }

      if (savedPharmacyBills) setPharmacyBills(JSON.parse(savedPharmacyBills));
      else {
        setPharmacyBills(defaultPharmacyBills);
        localStorage.setItem("vigilor_pharmacyBills", JSON.stringify(defaultPharmacyBills));
      }
    } catch (e) {
      console.error("Storage loading error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBeds = (newBeds: Bed[]) => {
    setBeds(newBeds);
    localStorage.setItem("vigilor_beds", JSON.stringify(newBeds));
  };

  const saveOutpatients = (newOps: Outpatient[]) => {
    setOutpatients(newOps);
    localStorage.setItem("vigilor_outpatients", JSON.stringify(newOps));
  };

  const saveLabReports = (newLabs: LabReport[]) => {
    setLabReports(newLabs);
    localStorage.setItem("vigilor_labReports", JSON.stringify(newLabs));
  };

  const savePharmacyBills = (newBills: PharmacyBill[]) => {
    setPharmacyBills(newBills);
    localStorage.setItem("vigilor_pharmacyBills", JSON.stringify(newBills));
  };

  // 1. Allocate Inpatient Bed
  const allocateBed = async (bedId: string, patient: Patient) => {
    const updated = beds.map(b => b.id === bedId ? { ...b, occupied: true, patient } : b);
    saveBeds(updated);
  };

  // 2. Discharge Inpatient
  const dischargePatient = async (bedId: string) => {
    const updated = beds.map(b => b.id === bedId ? { ...b, occupied: false, patient: undefined } : b);
    saveBeds(updated);
  };

  // 3. Update Vitals & Progress
  const updatePatient = async (bedId: string, updatedFields: Partial<Patient>) => {
    const updated = beds.map(b => {
      if (b.id === bedId && b.patient) {
        const mergedPatient = {
          ...b.patient,
          ...updatedFields,
          vitals: {
            ...b.patient.vitals,
            ...(updatedFields.vitals || {})
          }
        };
        return { ...b, patient: mergedPatient };
      }
      return b;
    });
    saveBeds(updated);
  };

  // 4. Reset entire State
  const resetDatabase = async () => {
    const freshBeds = buildInitialDatabase();
    saveBeds(freshBeds);
    saveOutpatients(defaultOutpatients);
    saveLabReports(defaultLabReports);
    savePharmacyBills(defaultPharmacyBills);
  };

  // 5. Register outpatient
  const registerOutpatient = async (outpatient: Omit<Outpatient, "id" | "queueNo" | "registrationDate">) => {
    const newId = `OPD-${100 + outpatients.length + 1}`;
    const newQueueNo = `Q-${String(outpatients.length + 4).padStart(2, "0")}`;
    const newObj: Outpatient = {
      ...outpatient,
      id: newId,
      queueNo: newQueueNo,
      registrationDate: new Date().toISOString().split("T")[0]
    };
    const updated = [...outpatients, newObj];
    saveOutpatients(updated);
    return newObj;
  };

  // 6. Request standard lab report
  const requestLabReport = async (patientName: string, mrn: string, testName: string) => {
    const newObj: LabReport = {
      id: `LAB-${300 + labReports.length + 1}`,
      patientName,
      mrn,
      testName,
      status: "Pending",
      reportValue: "",
      generatedAt: new Date().toISOString()
    };
    const updated = [...labReports, newObj];
    saveLabReports(updated);
    return newObj;
  };

  // 7. Finalize lab report
  const finalizeLabReport = async (reportId: string, reportValue: string) => {
    let matched: LabReport | undefined;
    const updated = labReports.map(r => {
      if (r.id === reportId) {
        matched = { ...r, status: "Completed" as const, reportValue, generatedAt: new Date().toISOString() };
        return matched;
      }
      return r;
    });
    if (!matched) throw new Error("Lab Report docket not found.");
    saveLabReports(updated);
    return matched;
  };

  // 8. Generate Pharmacy point of sale Bill
  const generatePharmacyBill = async (billData: Omit<PharmacyBill, "id" | "generatedAt">) => {
    const newId = `PH-${9000 + pharmacyBills.length + 1}`;
    const newObj: PharmacyBill = {
      ...billData,
      id: newId,
      generatedAt: new Date().toISOString()
    };
    const updated = [...pharmacyBills, newObj];
    savePharmacyBills(updated);
    return newObj;
  };

  // AI-powered: Triage evaluator
  const runTriage = async (params: {
    name: string;
    age: number;
    gender: string;
    subjectiveSymptoms: string;
    vitals: any;
  }): Promise<TriageResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const symptoms = params.subjectiveSymptoms.toLowerCase();
        let triageCategory: TriageResult["triageCategory"] = "Less-Urgent";
        let recommendedWard: TriageResult["recommendedWard"] = "GW3";
        let priorityScore = 45;
        let clinicalJustification = "Patient registers stable parameters. Bedside observation recommended.";
        let immediateActions = ["Record basic demographic indexes", "Initiate routine medical observation protocol"];
        let estimatedLengthOfStayDays = 3;

        // Smart symptoms triage decision matrix matching
        if (symptoms.includes("chest tightness") || symptoms.includes("infarction") || symptoms.includes("artery clogg") || symptoms.includes("heart")) {
          triageCategory = "Immediate";
          recommendedWard = "CCU";
          priorityScore = 95;
          clinicalJustification = "Critical chest distress indicates acute STEMI ischemic risk elements. High cardiac risk.";
          immediateActions = ["STAT 12-Load ECG", "Administer Aspirin 325mg chewable", "Establish secondary IV lock", "Mobilize cardiac cath team"];
          estimatedLengthOfStayDays = 5;
        } else if (symptoms.includes("breathing") || symptoms.includes("copd") || symptoms.includes("pneumonia") || symptoms.includes("respiratory") || symptoms.includes("dyspnea")) {
          triageCategory = "Immediate";
          recommendedWard = "ICU";
          priorityScore = 91;
          clinicalJustification = "Acute respiratory compromise with threat to partial oxylogation saturation grids.";
          immediateActions = ["Secure supplemental low-channel oxygen nasal cannula", "Administer nebulized bronchodilators", "Measure arterial oxygen parameters"];
          estimatedLengthOfStayDays = 6;
        } else if (symptoms.includes("maternity") || symptoms.includes("labor") || symptoms.includes("pregnancy") || symptoms.includes("contraction")) {
          triageCategory = "Urgent";
          recommendedWard = "OBG";
          priorityScore = 78;
          clinicalJustification = "Active maternal stages requiring controlled continuous obstetrics labor team supervision.";
          immediateActions = ["Link fetal cardiotachygraphy monitors", "Assess cervix dilation status", "Secure obstetric hydration channels"];
          estimatedLengthOfStayDays = 3;
        } else if (symptoms.includes("chemo") || symptoms.includes("chemotherapy") || symptoms.includes("cancer") || symptoms.includes("myeloma") || symptoms.includes("tumor")) {
          triageCategory = "Urgent";
          recommendedWard = "ONC";
          priorityScore = 80;
          clinicalJustification = "Oncology registrant demonstrating acute clinical profiles. Immunocompromised safety margins.";
          immediateActions = ["Triage absolute neutrophil index counts", "Isolate candidate ward parameters", "Monitor baseline core temperature levels"];
          estimatedLengthOfStayDays = 4;
        } else if (params.age <= 12 || symptoms.includes("croup") || symptoms.includes("pediatric") || symptoms.includes("rotavirus")) {
          triageCategory = "Less-Urgent";
          recommendedWard = "PED";
          priorityScore = 55;
          clinicalJustification = "Pediatric dehydration/fever status needing supportive hydration and pediatric screening.";
          immediateActions = ["Calculate weight-adjusted oral rehydration targets", "Administer weight-dosed paracetamol", "Watch fluid balance index charts"];
          estimatedLengthOfStayDays = 2;
        }

        resolve({
          triageCategory,
          recommendedWard,
          priorityScore,
          simulatedVitals: {
            pulseRate: params.vitals.pulseRate || (triageCategory === "Immediate" ? 110 : 82),
            bloodPressure: params.vitals.bloodPressure || "120/80",
            spo2: params.vitals.spo2 || (triageCategory === "Immediate" ? 89 : 98),
            temperature: params.vitals.temperature || 98.6
          },
          clinicalJustification,
          immediateActions,
          estimatedLengthOfStayDays
        });
      }, 500);
    });
  };

  // AI-powered: Discharge Optimizer
  const runDischargeOptimizer = async (): Promise<DischargeOutput> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Scans current beds state dynamically!
        const occupied = beds.filter(b => b.occupied && b.patient);
        const candidates = occupied.map(b => {
          const pt = b.patient!;
          let score = 75;
          let barrier = "Physical therapy review pending.";
          let action = "Schedule senior physical therapist bedside review immediately.";
          let hours = 18;

          if (pt.name === "Kanaklatha Devi") {
            score = 92;
            barrier = "Lacks biochemical discharge clearance summary matching ready status.";
            action = "Generate digital NHA-aligned billing logs to sign off biochemical-ready state.";
            hours = 24;
          } else if (pt.name === "Ravi Shankar") {
            score = 45;
            barrier = "Still dependent on heavy nasal cannula positive pressure flow rates.";
            action = "Wean to room air oxygen checks during sleeping cycles.";
            hours = 12;
          } else if (pt.status === "Recovering") {
            score = 88;
            barrier = "Pending oral medication substitution logs and take-home package.";
            action = "Prepare home dispensary package on current morning rota.";
            hours = 16;
          }

          return {
            bedId: b.id,
            patientName: pt.name,
            ward: b.ward,
            diagnosis: pt.diagnosis,
            dischargeReadinessScore: score,
            barriersToDischarge: barrier,
            actionToAccelerate: action,
            predictedImpactHours: hours
          };
        }).filter(c => c.dischargeReadinessScore > 50)
          .sort((x, y) => y.dischargeReadinessScore - x.dischargeReadinessScore);

        resolve({
          totalAnalyzedCount: occupied.length,
          topCandidates: candidates.slice(0, 3), // return top 3
          systemBenefitsSummary: `By expediting steps for ready candidates, VIGILOR can prevent potential EDD overruns and liberate upwards of ${candidates.reduce((acc, c) => acc + c.predictedImpactHours, 0)} hours of cumulative surge ward capacity.`
        });
      }, 500);
    });
  };

  // AI-powered: Capacity Mitigation Paths
  const runMitigationPaths = async (): Promise<MitigationOutput> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const occupancies = ["ICU", "CCU", "GW3", "OBG", "PED", "ONC"].map(wardKey => {
          const wardBeds = beds.filter(b => b.ward === wardKey);
          const occupiedCount = wardBeds.filter(b => b.occupied).length;
          const ratio = wardBeds.length > 0 ? (occupiedCount / wardBeds.length) : 0;
          return { wardKey, ratio };
        });

        const criticalWards = occupancies.filter(o => o.ratio > 0.85).map(o => o.wardKey);
        if (criticalWards.length === 0) {
          criticalWards.push("ICU", "ONC"); // default fallback bottlenecks
        }

        resolve({
          currentOverallOccupancy: `${Math.round((beds.filter(b => b.occupied).length / beds.length) * 100)}%`,
          criticalWards,
          paths: [
            {
              id: 1,
              title: "Early Shift-Down Protocol to Sub-Acute Wards",
              strategy: "Identify medical candidates in critical zones displaying stable parameters and shift down to general beds (GW3) immediately.",
              impact: "Frees 3 high-intensity ICU registers within 2 hours.",
              steps: [
                "Deploy senior clinician to audit high-readiness ICU candidates",
                "Expedite step-down checklists",
                "Authorize transition to General Ward"
              ],
              riskLevel: "Low"
            },
            {
              id: 2,
              title: "Rapid Discharge Discharge Fast-Lane Routing",
              strategy: "Accelerate administrative billing, insurance claims, and home-packet dispensaries for patients scored above 85% readiness.",
              impact: "Liberates cumulative general bed capacity by noon.",
              steps: [
                "Mobilize designated desk clerk to checkout ready candidates",
                "Waive pending administrative signatures with temporary tags",
                "Complete bedside digital billing clearance"
              ],
              riskLevel: "Low"
            },
            {
              id: 3,
              title: "Elective Intake Moratorium (Emergency Reserve Creation)",
              strategy: "Postpone minor non-urgent surgical bookings scheduled over next 12 hours to maintain safety ratios.",
              impact: "Halts progressive staffing ratio deterioration peaks.",
              steps: [
                "Contact elective scheduled clients to defer slots by 24h",
                "Dedicate vacant bed margins strictly as disaster-intake pools",
                "Triage arrivals via satellite OPD lanes"
              ],
              riskLevel: "Medium"
            }
          ]
        });
      }, 500);
    });
  };

  // AI-powered: Ambient consult SOAP transcribing
  const runAmbientConsult = async (transcript: string): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          soap: {
            subjective: `Patient reports experiencing acute retrosternal chest pain radiating downward and back tightness. Symptoms increased on physical exertion.`,
            objective: `Resting heart rate measured at 92 bpm, blood pressure recorded as 134/82. Clear lung auscultation with no immediate murmur spikes.`,
            assessment: `Clinical indexes suggestive of acute unstable coronary angina syndromes. Acute myocardial infarction risk requires constant surveillance.`,
            plan: `Schedule urgency serum troponin testing assays. Administer tablets Paracetamol 650mg STAT, low-dose chewable Aspirin, and log ECG.`
          }
        });
      }, 500);
    });
  };

  // AI-powered: Marketing / Finance Revenue Auditor
  const runMarketingAudit = async (): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // dynamic calculation of revenue parameters
        const bedRevenue = beds.filter(b => b.occupied).reduce((acc, b) => {
          const rate = b.ward === "ICU" ? 12050 : (b.ward === "CCU" ? 9500 : 3500);
          return acc + rate;
        }, 0);
        const pharmaRevenue = pharmacyBills.reduce((acc, b) => acc + b.finalAmount, 0);
        const labRevenue = labReports.filter(r => r.status === "Completed").length * 4500;

        const totalRevenue = bedRevenue + pharmaRevenue + labRevenue;

        const markdownReport = `### 🏥 **VIGILOR FINANCE SYSTEM INTELLIGENCE SUMMARY**
*Generated: Real-Time Operational Audit & Leakages Mitigation Pathway*

---

#### 📈 **DEPARTMENTAL REVENUE DISTRIBUTION**
*   **Specialty Inpatient Bed Capacity Revenue:** ₹${bedRevenue.toLocaleString()}
*   **Central Dispensary Pharmacy Revenue:** ₹${pharmaRevenue.toLocaleString()}
*   **Diagnostic Laboratory Clinical Testing Revenue:** ₹${labRevenue.toLocaleString()}
*   **Total Consolidated Hospital Operational Intake:** **₹${totalRevenue.toLocaleString()}**

---

#### 🚨 **REVENUE LEAKAGE ASSESSMENT & RECOMMENDATIONS**

##### **1. Bed Turnover Delay (Discharge Overrun Bottleneck)**
*   **Observation:** Several general medical wards (GW3) display clinical preparation readiness indices above 90%, yet average checkout overruns exceed 14.5 hours.
*   **Estimated Monthly Leakage:** ₹2,45,000 in missed acute transfers.
*   **Mitigation Pathway:** Implement electronic bedside NHA invoice signing to automatically trigger cleaning rotations upon biochemically-ready clearance.

##### **2. Pharmacy Out-of-Pocket Leakages (Stockout Impact)**
*   **Observation:** Critical oncology compound stockouts (*Bortezomib 3.5mg*) are triggering outside referrals, resulting in loss of dispensary and laboratory cross-link sales.
*   **Estimated Monthly Leakage:** ₹4,80,000 in drug sales.
*   **Mitigation Pathway:** Connect live ward prescription grids directly with central pharmacy replenishment schedules to trigger auto-reorders at 20% safety threshold limits.

##### **3. Unbilled Lab Panel Registrations**
*   **Observation:** Approx. 18% of suggested diagnostic test orders remain in "Pending" status for more than 12 hours without mapped procedural collections.
*   **Estimated Monthly Leakage:** ₹1,12,000 in unbilled laboratory assays.
*   **Mitigation Pathway:** Restructure clinical workflow so that patient registration barcodes are instantly flagged at pharmacy and testing centers upon intake.`;

        resolve(markdownReport);
      }, 500);
    });
  };

  return (
    <HospitalContext.Provider value={{
      beds,
      outpatients,
      labReports,
      pharmacyBills,
      loading,
      allocateBed,
      dischargePatient,
      updatePatient,
      resetDatabase,
      registerOutpatient,
      requestLabReport,
      finalizeLabReport,
      generatePharmacyBill,
      runTriage,
      runDischargeOptimizer,
      runMitigationPaths,
      runAmbientConsult,
      runMarketingAudit
    }}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) throw new Error("useHospital must be used inside a HospitalProvider");
  return context;
};
