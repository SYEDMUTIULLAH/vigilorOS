export interface MedicineItem {
  id: string;
  name: string;
  generic: string;
  category: string;
  batch: string;
  expiry: string; // YYYY-MM-DD
  mrp: number; // Max Retail Price
  purchasePrice: number;
  salePrice: number;
  rack: string;
  stock: number;
  reorderLevel: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  gstin: string;
  balance: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: {
    medicineId: string;
    name: string;
    quantity: number;
    purchasePrice: number;
  }[];
  totalAmount: number;
  status: "Created" | "Received";
}

export interface ReturnRecord {
  id: string;
  type: "Sales Rent" | "Purchase Return" | "Damaged Stock";
  date: string;
  entityName: string; // patient name or supplier name
  itemName: string;
  quantity: number;
  refundAmount: number;
  reason: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole: "Admin" | "Pharmacist" | "Cashier";
  category: "Billing" | "Inventory" | "Purchase" | "Returns";
  action: string;
}

export interface GenericAlternative {
  brandName: string;
  genericName: string;
  alternativeBrand: string;
  alternativePrice: number;
}
