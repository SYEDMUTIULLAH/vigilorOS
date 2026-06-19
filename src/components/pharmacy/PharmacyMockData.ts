import { MedicineItem, Supplier, GenericAlternative } from "./PharmacyTypes";

export const INITIAL_INVENTORY: MedicineItem[] = [
  {
    id: "MED-001",
    name: "Augmentin 625mg tablets",
    generic: "Amoxicillin + Clavulanic Acid",
    category: "Antibacterial",
    batch: "AUG-3204",
    expiry: "2027-04-18",
    mrp: 140,
    purchasePrice: 90,
    salePrice: 110,
    rack: "Rack A-3",
    stock: 120,
    reorderLevel: 30
  },
  {
    id: "MED-002",
    name: "Metformin 500mg tablets",
    generic: "Metformin Hydrochloride",
    category: "Antidiabetic",
    batch: "MET-1945",
    expiry: "2026-07-20", // Near expiry (June 2026 current time)
    mrp: 5,
    purchasePrice: 2,
    salePrice: 4,
    rack: "Rack B-1",
    stock: 1540,
    reorderLevel: 200
  },
  {
    id: "MED-003",
    name: "Atorvastatin 10mg tablets",
    generic: "Atorvastatin Calcium",
    category: "Antihyperlipidemic",
    batch: "ATO-7551",
    expiry: "2027-09-30",
    mrp: 12,
    purchasePrice: 7,
    salePrice: 10,
    rack: "Rack B-2",
    stock: 950,
    reorderLevel: 100
  },
  {
    id: "MED-004",
    name: "Paracetamol 650mg tablets",
    generic: "Acetaminophen",
    category: "Analgesic",
    batch: "PAR-9921",
    expiry: "2026-07-10", // Near expiry!
    mrp: 3,
    purchasePrice: 1.2,
    salePrice: 2.2,
    rack: "Rack C-1",
    stock: 2500,
    reorderLevel: 500
  },
  {
    id: "MED-005",
    name: "Pantoprazole 40mg tablets",
    generic: "Pantoprazole Sodium",
    category: "Proton Pump Inhibitor",
    batch: "PAN-4431",
    expiry: "2028-02-15",
    mrp: 8,
    purchasePrice: 4,
    salePrice: 4.3, // Low margin under 10% (0.3 / 4.0 = 7.5%)
    rack: "Rack A-1",
    stock: 1800,
    reorderLevel: 150
  },
  {
    id: "MED-006",
    name: "Albuterol inhaler (100mcg/actuation)",
    generic: "Salbutamol Sulfate",
    category: "Bronchodilator",
    batch: "ALB-0812",
    expiry: "2027-01-20",
    mrp: 450,
    purchasePrice: 310,
    salePrice: 380,
    rack: "Rack D-4",
    stock: 15, // Low stock under reorder level of 20
    reorderLevel: 20
  },
  {
    id: "MED-007",
    name: "Clopidogrel 75mg tablets",
    generic: "Clopidogrel Bisulfate",
    category: "Antiplatelet",
    batch: "CLO-5112",
    expiry: "2027-11-12",
    mrp: 18,
    purchasePrice: 11,
    salePrice: 15,
    rack: "Rack B-4",
    stock: 340,
    reorderLevel: 50
  },
  {
    id: "MED-008",
    name: "Bortezomib 3.5mg critical injection",
    generic: "Bortezomib",
    category: "Oncology Chemo",
    batch: "BOR-003A",
    expiry: "2026-06-30", // Near expiry!
    mrp: 6500,
    purchasePrice: 4500,
    salePrice: 5900,
    rack: "In-safe Lock B",
    stock: 2, // Low stock under reorder level of 5
    reorderLevel: 5
  },
  {
    id: "MED-009",
    name: "Prednisone 10mg tablets",
    generic: "Prednisolone",
    category: "Corticosteroid",
    batch: "PRE-8841",
    expiry: "2027-03-24",
    mrp: 15,
    purchasePrice: 9,
    salePrice: 12,
    rack: "Rack A-5",
    stock: 450,
    reorderLevel: 60
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "SUP-001",
    name: "Apex Pharmaceutical Wholesalers Pvt Ltd",
    contact: "+91-98765-43210",
    email: "info@apexpharma.in",
    gstin: "07AAAAX1234F1Z1",
    balance: 45000
  },
  {
    id: "SUP-002",
    name: "Indraprastha Medical & Drug Distributors",
    contact: "+91-98112-23344",
    email: "orders@indraprasthamed.co.in",
    gstin: "07BBBBX5678G2Z2",
    balance: 18200
  },
  {
    id: "SUP-003",
    name: "National Biotech & Chemical Labs Ltd",
    contact: "+91-99887-76655",
    email: "supply@nationalbiotech.org",
    gstin: "07CCCCX9012H3Z3",
    balance: 0
  }
];

export const GENERIC_ALTERNATIVES: GenericAlternative[] = [
  {
    brandName: "Augmentin 625mg tablets",
    genericName: "Amoxicillin + Clavulanic Acid",
    alternativeBrand: "Co-Amoxiclav 625mg Generic",
    alternativePrice: 70
  },
  {
    brandName: "Metformin 500mg tablets",
    genericName: "Metformin Hydrochloride",
    alternativeBrand: "Glycomet 500mg Generic",
    alternativePrice: 2.8
  },
  {
    brandName: "Atorvastatin 10mg tablets",
    genericName: "Atorvastatin Calcium",
    alternativeBrand: "Atorva 10mg Generic",
    alternativePrice: 6.2
  },
  {
    brandName: "Paracetamol 650mg tablets",
    genericName: "Acetaminophen",
    alternativeBrand: "Dolo 650mg Generic",
    alternativePrice: 1.5
  },
  {
    brandName: "Pantoprazole 40mg tablets",
    genericName: "Pantoprazole Sodium",
    alternativeBrand: "Pan-40mg Generic",
    alternativePrice: 5.5
  }
];

export const getSmartPrescription = (diagnosis: string, patientName: string) => {
  const dx = diagnosis.toLowerCase();
  const name = patientName.toLowerCase();

  if (dx.includes("copd") || dx.includes("respiratory")) {
    return [
      { name: "Albuterol inhaler (100mcg/actuation)", quantity: 2, instruction: "1 puff inhale q4h" },
      { name: "Prednisone 10mg tablets", quantity: 10, instruction: "1 tab daily after meals" }
    ];
  } else if (dx.includes("pneumonia") || dx.includes("cough")) {
    return [
      { name: "Augmentin 625mg tablets", quantity: 14, instruction: "1 tab twice daily for 7 days" },
      { name: "Paracetamol 650mg tablets", quantity: 20, instruction: "1 tab as needed for fever" }
    ];
  } else if (dx.includes("myeloma") || dx.includes("cancer") || dx.includes("oncology")) {
    return [
      { name: "Bortezomib 3.5mg critical injection", quantity: 1, instruction: "Oncology ward infusion" }
    ];
  } else if (dx.includes("sugar") || dx.includes("diabet") || name.includes("amit")) {
    return [
      { name: "Metformin 500mg tablets", quantity: 60, instruction: "1 tab bid with breakfast/dinner" },
      { name: "Pantoprazole 40mg tablets", quantity: 14, instruction: "1 tab empty stomach daily" }
    ];
  } else if (dx.includes("heart") || dx.includes("cardiac") || name.includes("siddharth")) {
    return [
      { name: "Atorvastatin 10mg tablets", quantity: 30, instruction: "1 tab at night bedtime" },
      { name: "Clopidogrel 75mg tablets", quantity: 10, instruction: "1 tab daily after lunch" }
    ];
  }

  // default safety fallback
  return [
    { name: "Paracetamol 650mg tablets", quantity: 10, instruction: "1 tablet as needed for bodyache" }
  ];
};

export const REFERRAL_DOCTORS = [
  "Dr. Ashish Verma (Cardiology)",
  "Dr. Sunita Rao (Pediatrics)",
  "Dr. Rajesh Mehta (Internal Medicine)",
  "Dr. Shalini Sen (OBG / Gynecology)",
  "Dr. Sanjay Dutt (Oncology)",
  "Dr. Vikram Patel (General Surgery)",
  "None / Outside Chemist Refer"
];
