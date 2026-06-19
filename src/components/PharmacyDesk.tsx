import React, { useState, useEffect } from "react";
import { useHospital } from "../context/HospitalContext";
import { MedicineItem, Supplier, PurchaseOrder, ReturnRecord, AuditLog } from "./pharmacy/PharmacyTypes";
import { 
  INITIAL_INVENTORY, 
  INITIAL_SUPPLIERS, 
  GENERIC_ALTERNATIVES, 
  getSmartPrescription, 
  REFERRAL_DOCTORS 
} from "./pharmacy/PharmacyMockData";
import { 
  Plus, 
  Search, 
  Trash2, 
  Calculator, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  RefreshCw, 
  ShoppingCart, 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  ArrowLeftRight, 
  ShieldAlert, 
  History,
  Activity,
  Award,
  DollarSign,
  Printer,
  ChevronRight,
  Sparkles,
  Edit2
} from "lucide-react";

interface PharmacyDeskProps {
  onRefreshGlobal?: () => Promise<void>;
}

export default function PharmacyDesk({ onRefreshGlobal }: PharmacyDeskProps) {
  const { beds, outpatients, pharmacyBills, generatePharmacyBill } = useHospital();

  // Active sub-tab inside ERP
  const [activeTab, setActiveTab ] = useState<"pos" | "prescriptions" | "inventory" | "suppliers" | "purchase" | "returns" | "alerts" | "analytics" | "audit">("pos");

  // User Role Switcher
  const [activeRole, setActiveRole] = useState<"Admin" | "Pharmacist" | "Cashier">("Admin");

  // Real data state (persisted via localStorage)
  const [inventory, setInventory] = useState<MedicineItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Dispensed internal prescription markers to avoid repeating
  const [dispensedPrescriptions, setDispensedPrescriptions] = useState<Record<string, boolean>>({});

  // Loaded/Created Flags
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Load from local storage or fallback to seed mocks
  const loadFromStorage = () => {
    try {
      const storedInv = localStorage.getItem("vigilor_inventory");
      if (storedInv) {
        setInventory(JSON.parse(storedInv));
      } else {
        setInventory(INITIAL_INVENTORY);
        localStorage.setItem("vigilor_inventory", JSON.stringify(INITIAL_INVENTORY));
      }

      const storedSupp = localStorage.getItem("vigilor_suppliers");
      if (storedSupp) {
        setSuppliers(JSON.parse(storedSupp));
      } else {
        setSuppliers(INITIAL_SUPPLIERS);
        localStorage.setItem("vigilor_suppliers", JSON.stringify(INITIAL_SUPPLIERS));
      }

      const storedPO = localStorage.getItem("vigilor_purchase_orders");
      if (storedPO) setPurchaseOrders(JSON.parse(storedPO));

      const storedRet = localStorage.getItem("vigilor_returns");
      if (storedRet) setReturns(JSON.parse(storedRet));

      const storedAudit = localStorage.getItem("vigilor_audit_logs");
      if (storedAudit) {
        setAuditLogs(JSON.parse(storedAudit));
      } else {
        const initialLog: AuditLog = {
          id: "LOG-100",
          timestamp: new Date().toISOString(),
          userRole: "Admin",
          category: "Inventory",
          action: "Vigilor ERP System Initialized with 9 formulation compounds."
        };
        setAuditLogs([initialLog]);
        localStorage.setItem("vigilor_audit_logs", JSON.stringify([initialLog]));
      }

      const storedDispPresc = localStorage.getItem("vigilor_dispensed_prescriptions");
      if (storedDispPresc) setDispensedPrescriptions(JSON.parse(storedDispPresc));

    } catch (e) {
      console.error("Error loading Vigilor ERP localized states", e);
    }
  };

  useEffect(() => {
    loadFromStorage();
    const handleStorageChange = () => {
      loadFromStorage();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Save states helper
  const saveInventoryState = (newInv: MedicineItem[]) => {
    setInventory(newInv);
    localStorage.setItem("vigilor_inventory", JSON.stringify(newInv));
    window.dispatchEvent(new Event("storage"));
  };

  const saveSupplierState = (newSupps: Supplier[]) => {
    setSuppliers(newSupps);
    localStorage.setItem("vigilor_suppliers", JSON.stringify(newSupps));
    window.dispatchEvent(new Event("storage"));
  };

  const savePOState = (newPOs: PurchaseOrder[]) => {
    setPurchaseOrders(newPOs);
    localStorage.setItem("vigilor_purchase_orders", JSON.stringify(newPOs));
    window.dispatchEvent(new Event("storage"));
  };

  const saveReturnsState = (newRets: ReturnRecord[]) => {
    setReturns(newRets);
    localStorage.setItem("vigilor_returns", JSON.stringify(newRets));
    window.dispatchEvent(new Event("storage"));
  };

  const addAuditLog = (category: AuditLog["category"], action: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      userRole: activeRole,
      category,
      action
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem("vigilor_audit_logs", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  // Dynamic derivation of patients (Inpatients with Bed occupancies + Outpatients registered in queue)
  const combinedPatients = [
    ...outpatients.map(o => ({
      id: o.id,
      name: o.name,
      age: o.age,
      gender: o.gender,
      mrn: o.mrn,
      type: "Outpatient" as const,
      doctorName: o.doctor || "General Outpatient Clinic",
      diagnosis: "OPD Consultation Audit"
    })),
    ...beds.filter(b => b.occupied && b.patient).map(b => ({
      id: b.patient!.id,
      name: b.patient!.name,
      age: b.patient!.age,
      gender: b.patient!.gender,
      mrn: b.patient!.mrn,
      type: "Inpatient" as const,
      doctorName: b.id.startsWith("ICU") ? "Dr. Ashish Verma (Cardiology)" : "Dr. Rajesh Mehta (Internal Medicine)",
      diagnosis: b.patient!.diagnosis
    }))
  ];

  /* =========================================================================
     1. BILLING POS STATE VARIABLES
     ========================================================================= */
  const [posPatientSearch, setPosPatientSearch] = useState("");
  const [posSelectedPatient, setPosSelectedPatient] = useState<typeof combinedPatients[0] | null>(null);
  
  const [posDrugSearch, setPosDrugSearch] = useState("");
  const [posCart, setPosCart] = useState<{
    id: string;
    name: string;
    generic: string;
    batch: string;
    expiry: string;
    price: number;
    quantity: number;
    isAlternativeUsed?: boolean;
    originalBrandName?: string;
  }[]>([]);
  
  const [posQty, setPosQty] = useState(10);
  const [posDiscount, setPosDiscount] = useState(10); // default 10% promo
  const [posReferredBy, setPosReferredBy] = useState(REFERRAL_DOCTORS[0]);

  // Split payment allocations
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [splitUPI, setSplitUPI] = useState<number>(0);

  // Receipt printed bill cached state
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  // Set split cash as default when cart changes
  const subTotalAmount = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountVal = Math.round(subTotalAmount * (posDiscount / 100));
  const preTaxCost = subTotalAmount - discountVal;
  const gstVal = Math.round(preTaxCost * 0.18); // flat 18% slab
  const totalPayableCost = preTaxCost + gstVal;

  useEffect(() => {
    setSplitCash(totalPayableCost);
    setSplitCard(0);
    setSplitUPI(0);
  }, [totalPayableCost]);

  // Handle adding drug to cart
  const handleAddDrugToPOSCart = (drug: MedicineItem, qtyToAdd: number, useAlternative: boolean = false) => {
    if (drug.stock <= 0) {
      setErrorNotice(`Stockout! ${drug.name} has no units left in shelf.`);
      return;
    }

    let itemToAdd = {
      id: drug.id,
      name: drug.name,
      generic: drug.generic,
      batch: drug.batch,
      expiry: drug.expiry,
      price: drug.salePrice,
      quantity: Math.min(qtyToAdd, drug.stock),
      isAlternativeUsed: false,
      originalBrandName: drug.name
    };

    // If generic alternative requested, swap values
    if (useAlternative) {
      const altMatch = GENERIC_ALTERNATIVES.find(a => a.brandName === drug.name || a.genericName === drug.generic);
      if (altMatch) {
        itemToAdd = {
          ...itemToAdd,
          name: altMatch.alternativeBrand,
          price: altMatch.alternativePrice,
          isAlternativeUsed: true
        };
      }
    }

    const existsIndex = posCart.findIndex(i => i.id === itemToAdd.id && i.name === itemToAdd.name);
    if (existsIndex >= 0) {
      const updated = [...posCart];
      const nextQty = updated[existsIndex].quantity + itemToAdd.quantity;
      if (nextQty > drug.stock) {
        updated[existsIndex].quantity = drug.stock;
        setSuccessNotice(`Adjusted ${drug.name} to max available shelf stock (${drug.stock}).`);
      } else {
        updated[existsIndex].quantity = nextQty;
      }
      setPosCart(updated);
    } else {
      setPosCart([...posCart, itemToAdd]);
    }
    setPosDrugSearch("");
    setErrorNotice(null);
  };

  const handleCheckoutPOS = async () => {
    if (!posSelectedPatient) {
      setErrorNotice("Patient Assignment Required: Please select an active patient from the lookup bar.");
      return;
    }
    if (posCart.length === 0) {
      setErrorNotice("Empty Basket: Please add at least one formulation to checkout.");
      return;
    }

    // Role safety restrictions
    if (activeRole !== "Admin" && activeRole !== "Cashier") {
      setErrorNotice("Access Denied: Only Admin or Cashier roles are authorized to finalize transactions.");
      return;
    }

    // Verify split payment sums up correctly
    const paymentSum = Number(splitCash) + Number(splitCard) + Number(splitUPI);
    if (Math.abs(paymentSum - totalPayableCost) > 1) {
      setErrorNotice(`Split Payment Mismatch: Sum of Cash (₹${splitCash}) + Card (₹${splitCard}) + UPI (₹${splitUPI}) must equal total bill amount (₹${totalPayableCost}). Current sum: ₹${paymentSum}`);
      return;
    }

    // Reduce inventory stocks
    const nextInv = [...inventory];
    let stockAlertTriggers: string[] = [];

    posCart.forEach(cartItem => {
      const matchIndex = nextInv.findIndex(inv => inv.id === cartItem.id);
      if (matchIndex >= 0) {
        const item = nextInv[matchIndex];
        item.stock = Math.max(0, item.stock - cartItem.quantity);
        if (item.stock <= item.reorderLevel) {
          stockAlertTriggers.push(`${item.name} stock fell below reorder level. Remaining: ${item.stock}`);
        }
      }
    });

    saveInventoryState(nextInv);

    // Save billing data globally through HospitalContext
    try {
      const syncedBill = await generatePharmacyBill({
        patientName: posSelectedPatient.name,
        mrn: posSelectedPatient.mrn,
        drugs: posCart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity })),
        discount: posDiscount,
        gst: 18,
        referredBy: posReferredBy,
        totalAmount: subTotalAmount,
        finalAmount: totalPayableCost
      });

      // Cache invoice receipt
      setActiveReceipt({
        ...syncedBill,
        splitCash,
        splitCard,
        splitUPI,
        gstAmount: gstVal,
        discountAmount: discountVal,
        patientType: posSelectedPatient.type
      });

      // Record audit trails
      addAuditLog("Billing", `POS Checkout ${syncedBill.id} for patient ${posSelectedPatient.name}. Final amount ₹${totalPayableCost}.`);
      if (stockAlertTriggers.length > 0) {
        stockAlertTriggers.forEach(alert => {
          addAuditLog("Inventory", `Stock shortage trigger: ${alert}`);
        });
      }

      // If patient had an active prescription linked, mark as dispensed
      const updatedPresc = { ...dispensedPrescriptions, [posSelectedPatient.id]: true };
      setDispensedPrescriptions(updatedPresc);
      localStorage.setItem("vigilor_dispensed_prescriptions", JSON.stringify(updatedPresc));

      // Reset local cart fields
      setPosCart([]);
      setPosDiscount(10);
      setPosPatientSearch("");
      setPosSelectedPatient(null);
      setSuccessNotice(`Dispensary Invoice ${syncedBill.id} checked out successfully. Stock adjusted.`);
      setErrorNotice(null);

      if (onRefreshGlobal) {
        await onRefreshGlobal();
      }
    } catch (err) {
      console.error(err);
      setErrorNotice("Failure submitting invoice to central billing core.");
    }
  };


  /* =========================================================================
     2. INVENTORY REGISTER FORMS & EDITS
     ========================================================================= */
  const [invSearchQuery, setInvSearchQuery] = useState("");
  const [invEditingItem, setInvEditingItem] = useState<MedicineItem | null>(null);
  
  // Custom Add Medicine states
  const [showAddInvModal, setShowAddInvModal] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newGeneric, setNewGeneric] = useState("");
  const [newCategory, setNewCategory] = useState("Analgesic");
  const [newBatch, setNewBatch] = useState("BAT-2026");
  const [newExpiry, setNewExpiry] = useState("2027-12-31");
  const [newMRP, setNewMRP] = useState(10);
  const [newPurchasePrice, setNewPurchasePrice] = useState(6);
  const [newSalePrice, setNewSalePrice] = useState(8);
  const [newRack, setNewRack] = useState("Rack A-1");
  const [newStock, setNewStock] = useState(100);
  const [newReorderLevel, setNewReorderLevel] = useState(25);

  const handleCreateMedicine = () => {
    if (activeRole === "Cashier") {
      setErrorNotice("Access Denied: Cashier role is not permitted to modify formulation indexes.");
      return;
    }
    if (!newBrand || !newGeneric) {
      setErrorNotice("Validation Failure: Please specify both Brand Name and Generic Compound.");
      return;
    }

    const newItem: MedicineItem = {
      id: `MED-${Date.now().toString().slice(-4)}`,
      name: newBrand,
      generic: newGeneric,
      category: newCategory,
      batch: newBatch,
      expiry: newExpiry,
      mrp: Number(newMRP),
      purchasePrice: Number(newPurchasePrice),
      salePrice: Number(newSalePrice),
      rack: newRack,
      stock: Number(newStock),
      reorderLevel: Number(newReorderLevel)
    };

    const next = [...inventory, newItem];
    saveInventoryState(next);
    addAuditLog("Inventory", `Added brand ${newBrand} (Chem: ${newGeneric}) to central register with ${newStock} initial units.`);
    
    // reset form fields
    setNewBrand("");
    setNewGeneric("");
    setNewMRP(10);
    setNewPurchasePrice(6);
    setNewSalePrice(8);
    setNewStock(100);
    setShowAddInvModal(false);
    setSuccessNotice(`Sourced compound drug ${newItem.name} successfully.`);
    setErrorNotice(null);
  };

  const handleSaveEditInventory = () => {
    if (!invEditingItem) return;
    if (activeRole === "Cashier") {
      setErrorNotice("Access Denied: Cashier is restricted from updating compounding records.");
      return;
    }

    const updated = inventory.map(item => item.id === invEditingItem.id ? invEditingItem : item);
    saveInventoryState(updated);
    addAuditLog("Inventory", `Manual update applied to drug ${invEditingItem.name}. New Stock: ${invEditingItem.stock}, Sale Price: ₹${invEditingItem.salePrice}.`);
    
    setInvEditingItem(null);
    setSuccessNotice(`Modified compound information successfully.`);
    setErrorNotice(null);
  };

  const handleDeleteInventory = (id: string, name: string) => {
    if (activeRole !== "Admin") {
      setErrorNotice("Access Denied: Only Admin role is authenticated to purge catalog items.");
      return;
    }
    if (!confirm(`Are you sure you want to completely delete ${name} from pharmacy inventory?`)) return;

    const updated = inventory.filter(i => i.id !== id);
    saveInventoryState(updated);
    addAuditLog("Inventory", `Purged compound brand ${name} [${id}] permanently from dispensary registers.`);
    setSuccessNotice(`Successfully removed medicine compound.`);
    setErrorNotice(null);
  };


  /* =========================================================================
     3. SUPPLIERS STATE
     ========================================================================= */
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supGSTIN, setSupGSTIN] = useState("07GSTIN1234F");
  const [supBalance, setSupBalance] = useState(0);

  const handleCreateSupplier = () => {
    if (activeRole === "Cashier") {
      setErrorNotice("Access Restricted: Unauthorized cashier action.");
      return;
    }
    if (!supName) {
      setErrorNotice("Validation Failure: Supplier Name is required.");
      return;
    }

    const newSup: Supplier = {
      id: `SUP-${Date.now().toString().slice(-3)}`,
      name: supName,
      contact: supContact,
      email: supEmail,
      gstin: supGSTIN,
      balance: Number(supBalance)
    };

    const next = [...suppliers, newSup];
    saveSupplierState(next);
    addAuditLog("Purchase", `Registered trade wholesale supplier ${supName} other-side credit limit.`);

    setSupName("");
    setSupContact("");
    setSupEmail("");
    setShowAddSupplierModal(false);
    setSuccessNotice(`Sourced wholesale trade supplier ${newSup.name} successfully.`);
    setErrorNotice(null);
  };


  /* =========================================================================
     4. PURCHASE ORDER FLOWS & REPLENISHMENTS
     ========================================================================= */
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [poLines, setPoLines] = useState<{ medicineId: string; name: string; quantity: number; cost: number }[]>([]);
  const [poLineQty, setPoLineQty] = useState(100);
  const [selectedPoDrugIdx, setSelectedPoDrugIdx] = useState(0);

  const handleAddLineToPO = () => {
    const med = inventory[selectedPoDrugIdx];
    if (!med) return;

    const existsIndex = poLines.findIndex(l => l.medicineId === med.id);
    if (existsIndex >= 0) {
      const next = [...poLines];
      next[existsIndex].quantity += Number(poLineQty);
      setPoLines(next);
    } else {
      setPoLines([...poLines, {
        medicineId: med.id,
        name: med.name,
        quantity: Number(poLineQty),
        cost: med.purchasePrice
      }]);
    }
  };

  const handleFinalizePO = () => {
    if (!selectedSupplierId) {
      setErrorNotice("Wholesaler Target Bound: Please select a wholesale distributor.");
      return;
    }
    if (poLines.length === 0) {
      setErrorNotice("Empty Bill: Please select compounding products to register trade purchase orders.");
      return;
    }

    const supplierMatch = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplierMatch) return;

    const totalPOVal = poLines.reduce((acc, current) => acc + (current.cost * current.quantity), 0);

    const newPO: PurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: supplierMatch.id,
      supplierName: supplierMatch.name,
      date: new Date().toISOString().split("T")[0],
      items: poLines.map(l => ({
        medicineId: l.medicineId,
        name: l.name,
        quantity: l.quantity,
        purchasePrice: l.cost
      })),
      totalAmount: totalPOVal,
      status: "Created"
    };

    const nextPOs = [newPO, ...purchaseOrders];
    savePOState(nextPOs);
    addAuditLog("Purchase", `Created wholesale procurement order ${newPO.id} with distributor ${supplierMatch.name} for ₹${totalPOVal}.`);

    setPoLines([]);
    setSuccessNotice(`Draft Purchase Order ${newPO.id} cataloged.`);
    setErrorNotice(null);
  };

  // Receive stock logic
  const handleReceiveStock = (poId: string) => {
    if (activeRole === "Cashier") {
      setErrorNotice("Access Denied: Only Administrator and Pharmacist roles can receive inventory stock.");
      return;
    }

    const targetedPOIndex = purchaseOrders.findIndex(p => p.id === poId);
    if (targetedPOIndex < 0) return;

    const po = purchaseOrders[targetedPOIndex];
    if (po.status === "Received") {
      setErrorNotice("Action Cancelled: This package is already checked and received, duplicate entry blocked.");
      return;
    }

    // Update active stock inventories
    const nextInv = [...inventory];
    po.items.forEach(orderedItem => {
      const invIdx = nextInv.findIndex(i => i.id === orderedItem.medicineId);
      if (invIdx >= 0) {
        nextInv[invIdx].stock += orderedItem.quantity;
      }
    });
    saveInventoryState(nextInv);

    // Update trade supplier outstanding debt balances
    const nextSupp = suppliers.map(s => {
      if (s.id === po.supplierId) {
        return { ...s, balance: s.balance + po.totalAmount };
      }
      return s;
    });
    saveSupplierState(nextSupp);

    // Update PO metadata state
    const nextPOs = [...purchaseOrders];
    nextPOs[targetedPOIndex].status = "Received";
    savePOState(nextPOs);

    addAuditLog("Purchase", `Sourced shipment delivery for order ${po.id}. Restocked ${po.items.length} materials; updated Supplier balance.`);
    setSuccessNotice(`Materials received from wholesale channels. Stocks and account balance updated.`);
    setErrorNotice(null);
  };


  /* =========================================================================
     5. RETURNS (CUSTOMER REFUNDS, DEFECTIVE DISCARD, SUPPLIER RETOURS)
     ========================================================================= */
  const [rtType, setRtType] = useState<ReturnRecord["type"]>("Sales Rent");
  const [rtItemIdx, setRtItemIdx] = useState(0);
  const [rtQty, setRtQty] = useState(1);
  const [rtEntity, setRtEntity] = useState("");
  const [rtReason, setRtReason] = useState("");

  const handleRegisterReturn = () => {
    if (!rtEntity || !rtReason) {
      setErrorNotice("Validation Failure: Please specify both customer/supplier name and explicit return comments.");
      return;
    }

    const drug = inventory[rtItemIdx];
    if (!drug) return;

    let financialRefund = 0;
    const nextInv = [...inventory];

    if (rtType === "Sales Rent") {
      // Customer returning medicine to us -> inventory goes up, we refund money (salePrice)
      financialRefund = drug.salePrice * rtQty;
      nextInv[rtItemIdx].stock += Number(rtQty);
      addAuditLog("Returns", `Processed customer refund for ${rtQty} units of ${drug.name}. Refund amount ₹${financialRefund}.`);
    } else if (rtType === "Purchase Return") {
      // Returning inventory to supplier -> inventory goes down, supplier balance reduces (purchasePrice)
      if (drug.stock < rtQty) {
        setErrorNotice(`Insufficient Stock: Only ${drug.stock} units of ${drug.name} are available with us to return.`);
        return;
      }
      financialRefund = drug.purchasePrice * rtQty;
      nextInv[rtItemIdx].stock = Math.max(0, drug.stock - Number(rtQty));

      // Subtract balance from matching supplier if matching supplier name can be found or defaults
      const nextSupp = suppliers.map(s => {
        if (s.name.toLowerCase().includes(rtEntity.toLowerCase())) {
          return { ...s, balance: Math.max(0, s.balance - financialRefund) };
        }
        return s;
      });
      saveSupplierState(nextSupp);
      addAuditLog("Returns", `Dispatched trade return of ${rtQty} units of ${drug.name} back to distributor ${rtEntity}.`);
    } else {
      // Damaged/Spoiled item -> inventory goes down, financial losses recorded (purchasePrice)
      if (drug.stock < rtQty) {
        setErrorNotice(`Insufficient Stock: Only ${drug.stock} units are currently present to report damage on.`);
        return;
      }
      financialRefund = drug.purchasePrice * rtQty; 
      nextInv[rtItemIdx].stock = Math.max(0, drug.stock - Number(rtQty));
      addAuditLog("Returns", `Reported spoiling write-off of ${rtQty} units of expired/broken formulation: ${drug.name}.`);
    }

    saveInventoryState(nextInv);

    const newRet: ReturnRecord = {
      id: `RET-${Date.now().toString().slice(-3)}`,
      type: rtType,
      date: new Date().toISOString().split("T")[0],
      entityName: rtEntity,
      itemName: drug.name,
      quantity: Number(rtQty),
      refundAmount: financialRefund,
      reason: rtReason
    };

    const nextRetList = [newRet, ...returns];
    saveReturnsState(nextRetList);

    setRtQty(1);
    setRtEntity("");
    setRtReason("");
    setSuccessNotice(`Return transaction logs persisted successfully under ledger ID ${newRet.id}.`);
    setErrorNotice(null);
  };


  /* =========================================================================
     6. ALERTS CALCULATIONS (Stock-out, Expiry in 90 Days, Low Margin < 10%)
     ========================================================================= */
  // Out of stock or low stock
  const lowStockAlerts = inventory.filter(i => i.stock <= i.reorderLevel);

  // Near expiry: current year is June 2026. Let's flag any medicines expiring between now and October 2026 (90-120 days range)
  const nearExpiryAlerts = inventory.filter(i => {
    const expiryDate = new Date(i.expiry);
    const today = new Date("2026-06-16");
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 90; // expiring in next 90 days
  });

  // Low margin: (SalePrice - PurchasePrice) / PurchasePrice * 100 < 10%
  const lowMarginAlerts = inventory.filter(i => {
    const profit = i.salePrice - i.purchasePrice;
    const marginPercent = (profit / i.purchasePrice) * 100;
    return marginPercent < 10;
  });


  /* =========================================================================
     7. VIGILOR ANALYTICS ENGINE
     ========================================================================= */
  // Daily revenue = sum of pharmacy bills
  const dailyBillsTotal = pharmacyBills.reduce((acc, b) => acc + b.finalAmount, 0);
  const returnsSum = returns.filter(r => r.type === "Sales Rent").reduce((acc, r) => acc + r.refundAmount, 0);
  const netDailyRevenue = dailyBillsTotal - returnsSum;

  // Cumulative profit. To calculate accurately, we sum up profits of all drugs processed in pharmacyBills!
  // Fallback if pharmacyBills has drugs we do not find: look up purchase price, otherwise profit is roughly 25% of sale.
  let dynamicProfitVal = 0;
  pharmacyBills.forEach(b => {
    b.drugs.forEach(d => {
      const match = inventory.find(inv => inv.name === d.name);
      if (match) {
        dynamicProfitVal += (d.price - match.purchasePrice) * d.quantity;
      } else {
        dynamicProfitVal += (d.price * 0.2) * d.quantity; // estimate 20% profit if deleted custom item
      }
    });
  });

  // Deduct returned items losses
  const returnsLosses = returns.filter(r => r.type === "Damaged Stock" || r.type === "Purchase Return").reduce((acc, r) => acc + r.refundAmount, 0);
  const netProfitTracked = Math.max(0, dynamicProfitVal - returnsLosses - (returnsSum * 0.25));

  // Top items by checkout volume
  const drugCheckoutVolume: Record<string, number> = {};
  pharmacyBills.forEach(b => {
    b.drugs.forEach(d => {
      drugCheckoutVolume[d.name] = (drugCheckoutVolume[d.name] || 0) + d.quantity;
    });
  });

  const sortedTopDrugs = Object.entries(drugCheckoutVolume)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Fast moving compound: any medicine with checkout volume > 15
  const fastMovingMedicines = Object.entries(drugCheckoutVolume)
    .filter(([_, qty]) => qty > 15)
    .map(([name, _]) => name);

  // Dead stock compounds: Medicines that have stock > 1000 and 0 checkouts recorded
  const deadStockCompounds = inventory.filter(i => i.stock >= 1000 && !drugCheckoutVolume[i.name]);


  return (
    <div className="space-y-6 font-sans">
      
      {/* 2026 Vigilor Enterprise Title Banner with Role Swapping Controls */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-mono tracking-widest font-black bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md">
              Vigilor enterprise suite
            </span>
            <span className="text-slate-500 text-xs font-semibold">• Integrated Pharmacy System</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Dispense-Link Pharmacy ERP</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
            Real-time split checkout POS, supplier credit books, OPD prescription queue trackers, stockout/expiry risk boards and direct integration with inpatient wards.
          </p>
        </div>

        {/* User login simulator context role picker */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3 min-w-[280px]">
          <div>
            <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">OPERATOR SIGNED IN:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <strong className="text-xs font-bold text-slate-800">{activeRole} Operator</strong>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 ml-auto mr-1" />
          <select
            value={activeRole}
            onChange={(e) => {
              setActiveRole(e.target.value as any);
              addAuditLog("Inventory", `Operator role shifted to ${e.target.value}.`);
            }}
            className="bg-white border border-slate-200 hover:border-slate-400 rounded-lg p-1.5 text-[11px] font-mono font-bold text-blue-600 outline-none transition"
          >
            <option value="Admin">Admin Mode</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Cashier">Cashier view</option>
          </select>
        </div>
      </div>

      {/* Persistent global alerts row if any stock issues or near expiry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Stock shortages</span>
            <strong className="block text-slate-805 text-sm">{lowStockAlerts.length} compounds critical</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Expiry warning (90d)</span>
            <strong className="block text-slate-805 text-sm">{nearExpiryAlerts.length} batches close</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Dispensary Revenue</span>
            <strong className="block text-slate-805 text-sm">₹{netDailyRevenue.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Success/Error Alerts display */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-850 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="ml-auto text-emerald-600 hover:text-emerald-850 font-black">×</button>
        </div>
      )}
      {errorNotice && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs font-bold text-rose-850 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="ml-auto text-rose-600 hover:text-rose-850 font-black">×</button>
        </div>
      )}

      {/* Modular Navigation Tabs with standard ERP branding */}
      <div className="border-b border-slate-200 bg-white p-2.5 rounded-xl flex gap-1 flex-wrap shadow-xs">
        {[
          { tab: "pos", icon: ShoppingCart, label: "POS billing screen" },
          { tab: "prescriptions", icon: FileText, label: "Doctor prescriptions" },
          { tab: "alerts", icon: ShieldAlert, label: "Alerts center" },
        ].map((btn) => {
          const IconComponent = btn.icon;
          return (
            <button
              key={btn.tab}
              onClick={() => {
                setActiveTab(btn.tab as any);
                setSuccessNotice(null);
                setErrorNotice(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition flex items-center gap-2 cursor-pointer ${activeTab === btn.tab ? "bg-blue-600 text-white font-bold shadow-xs scale-[1.02]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODULE WORKSPACE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs min-h-[500px]">

        {/* =====================================================================
           1. BILLING POS SCREEN
           ===================================================================== */}
        {activeTab === "pos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left form compiler panel (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-blue-600" /> Split checkout register POS
                </h3>
                <p className="text-[11px] text-slate-400">Instantly checkout prescriptions with barcode scanning simulation, alternative chemical suggestions & real stock updates.</p>
              </div>

              {/* Patient assignment lookup bar */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-extrabold uppercase block">
                  1. Bind target patient (OPD / Ward Bed)
                </span>
                
                <div className="relative text-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search patient name, clinic MRN index or ward ID..."
                    value={posPatientSearch}
                    onChange={(e) => {
                      setPosPatientSearch(e.target.value);
                      if (posSelectedPatient) setPosSelectedPatient(null);
                    }}
                    className="w-full bg-white border border-slate-250 py-2.5 pl-9 pr-4 rounded-lg font-medium outline-none text-slate-800 focus:border-slate-950 transition text-xs"
                  />

                  {/* Suggesions picker */}
                  {posPatientSearch && !posSelectedPatient && (
                    <div className="absolute left-0 top-12 w-full bg-white border border-slate-200 shadow-2xl rounded-xl p-2 z-40 max-h-48 overflow-y-auto space-y-1">
                      {combinedPatients.filter(p => p.name.toLowerCase().includes(posPatientSearch.toLowerCase()) || p.mrn.toLowerCase().includes(posPatientSearch.toLowerCase())).length > 0 ? (
                        combinedPatients
                          .filter(p => p.name.toLowerCase().includes(posPatientSearch.toLowerCase()) || p.mrn.toLowerCase().includes(posPatientSearch.toLowerCase()))
                          .map(pat => (
                            <button
                              key={pat.id}
                              onClick={() => {
                                setPosSelectedPatient(pat);
                                setPosPatientSearch(pat.name);
                              }}
                              className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-xs flex justify-between items-center transition"
                            >
                              <div>
                                <strong className="text-slate-850 font-bold block">{pat.name} ({pat.age}y {pat.gender})</strong>
                                <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest">{pat.type} • {pat.mrn}</span>
                              </div>
                              <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded">
                                {pat.id}
                              </span>
                            </button>
                          ))
                      ) : (
                        <div className="p-3 text-center text-[11px] text-slate-400 font-medium">No active patient matching search found.</div>
                      )}
                    </div>
                  )}
                </div>

                {posSelectedPatient && (
                  <div className="bg-white border border-slate-205 p-3.5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="space-y-1 text-slate-600">
                      <div>Patient Name: <strong className="text-slate-900 font-bold">{posSelectedPatient.name}</strong></div>
                      <div>MRN Coordinates: <span className="font-mono text-slate-800 font-bold">{posSelectedPatient.mrn}</span></div>
                      <div>Clinic diagnosis: <span className="font-bold text-slate-700">{posSelectedPatient.diagnosis}</span></div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 font-mono text-[9px] uppercase font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded">
                        {posSelectedPatient.type}
                      </span>
                      <div className="text-[10px] text-slate-450 font-medium mt-2">Active Doctor: {posSelectedPatient.doctorName}</div>
                      
                      {/* Check if already dispensed */}
                      {dispensedPrescriptions[posSelectedPatient.id] && (
                        <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-1 rounded inline-block mt-1 font-bold">
                          ⚠️ Stock dispensed for this prescription cycle
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drug Compounding Finder */}
              <div className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-extrabold uppercase block">
                  2. Sift drugs catalog & add compounds
                </span>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Combobox simulator text search */}
                  <div className="md:col-span-6 space-y-1.5 relative">
                    <label className="text-[10px] text-slate-500 font-bold">Fast search or scan Barcode code details:</label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Type (e.g. Paracetamol, Augmentin, Bortezomib...)"
                        value={posDrugSearch}
                        onChange={(e) => setPosDrugSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 py-2 pl-9 pr-4 rounded-lg text-xs font-medium outline-none"
                      />
                    </div>

                    {posDrugSearch && (
                      <div className="absolute left-0 top-14 w-full bg-white border border-slate-200 shadow-2xl rounded-xl p-2 z-40 max-h-48 overflow-y-auto space-y-1 text-xs">
                        {inventory.filter(i => i.name.toLowerCase().includes(posDrugSearch.toLowerCase()) || i.generic.toLowerCase().includes(posDrugSearch.toLowerCase())).length > 0 ? (
                          inventory
                            .filter(i => i.name.toLowerCase().includes(posDrugSearch.toLowerCase()) || i.generic.toLowerCase().includes(posDrugSearch.toLowerCase()))
                            .map((drug) => {
                              const altAvailable = GENERIC_ALTERNATIVES.find(g => g.brandName === drug.name);
                              return (
                                <div key={drug.id} className="p-2 border-b border-slate-50 flex justify-between items-center hover:bg-slate-50 transition rounded">
                                  <div>
                                    <strong className="text-slate-900 block">{drug.name} (₹{drug.salePrice}/u)</strong>
                                    <span className="text-[10px] text-slate-450 block font-mono">{drug.generic} • Stock: {drug.stock}</span>
                                    {altAvailable && (
                                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] uppercase tracking-wider font-extrabold px-1.5 rounded mt-0.5 inline-block">
                                        Cheaper Generic substitute: {altAvailable.alternativeBrand} (₹{altAvailable.alternativePrice}/u)
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleAddDrugToPOSCart(drug, posQty, false)}
                                      className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold font-mono text-[10px] rounded"
                                    >
                                      Add Brand
                                    </button>
                                    {altAvailable && (
                                      <button
                                        onClick={() => handleAddDrugToPOSCart(drug, posQty, true)}
                                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-[10px] rounded"
                                      >
                                        Add Substitute
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="p-3 text-center text-slate-400">No formulate matches found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold">Qty (Pills / Injections):</label>
                    <input
                      type="number"
                      min={1}
                      value={posQty}
                      onChange={(e) => setPosQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 text-xs">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">POS keyboard shortcut keys</span>
                    <div className="p-1 px-2.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono text-center font-bold uppercase">
                      [F2] Add Compound
                    </div>
                  </div>
                </div>
              </div>

              {/* Basket list view */}
              <div className="space-y-3.5 pt-2">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-extrabold uppercase block">
                  3. Prescription billing lines items list ({posCart.length})
                </span>

                {posCart.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-150 rounded-xl no-scrollbar">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono text-[9px] uppercase font-bold py-2">
                          <th className="py-2.5 px-4">Compound Formulation Description</th>
                          <th className="py-2.5 px-4 font-mono">Price (Rate)</th>
                          <th className="py-2.5 px-4 font-mono">Qty</th>
                          <th className="py-2.5 px-4 font-mono">Total (INR)</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold font-sans">
                        {posCart.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                <span>Batch: {item.batch}</span>
                                <span>•</span>
                                <span>Expiry: {item.expiry}</span>
                                {item.isAlternativeUsed && (
                                  <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 font-black px-1.5 px-[3px] rounded text-[8px] uppercase">
                                    Swapped with generic
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono">₹{item.price}</td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => {
                                  const updated = [...posCart];
                                  updated[index].quantity = Math.max(1, Number(e.target.value));
                                  setPosCart(updated);
                                }}
                                className="w-16 bg-slate-50 border border-slate-200 font-mono p-1 rounded font-bold text-xs"
                              />
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-950 font-bold">₹{(item.price * item.quantity).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setPosCart(posCart.filter((_, i) => i !== index))}
                                className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 ml-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-xs">
                    POS Prescription cart is currently empty. Use the finder compound picker or bind written doctor prescriptions to load materials.
                  </div>
                )}
              </div>

            </div>

            {/* Right billing summary panel (4 cols) */}
            <div className="lg:col-span-4 bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-5 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-black text-slate-905 uppercase tracking-wider font-mono">
                    Checkout Summary Ledger
                  </h3>
                  <span className="text-[10px] text-slate-400">Total payable tax calculations and split pay sliders.</span>
                </div>

                <div className="space-y-4 pt-4 text-xs font-normal">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Sales Subtotal:</span>
                    <strong className="font-mono text-slate-800 font-bold">₹{subTotalAmount.toLocaleString()}</strong>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Interactive Discount (%):</span>
                      <strong className="font-mono text-emerald-600 font-bold">-{posDiscount}%</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={posDiscount}
                      onChange={(e) => setPosDiscount(Number(e.target.value))}
                      className="w-full accent-slate-900 cursor-pointer h-1.5"
                    />
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span className="font-medium">Flat GST (18.0% CGST+SGST):</span>
                    <span className="font-mono text-slate-800 font-semibold">+₹{gstVal.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-slate-205 pt-3.5 flex justify-between items-center">
                    <span className="font-black text-slate-905 uppercase text-[11px] tracking-wider">TOTAL DUE:</span>
                    <strong className="text-lg font-mono text-slate-950 font-black">₹{totalPayableCost.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Split Payments Allocation */}
                <div className="border-t border-slate-200 pt-5 mt-5 space-y-3">
                  <span className="text-[10px] font-mono tracking-wider text-slate-450 font-extrabold uppercase block">
                    Split Payment Method Setup
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-450 block font-bold">CASH:</label>
                      <input
                        type="number"
                        value={splitCash}
                        onChange={(e) => setSplitCash(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 font-mono text-xs p-1.5 font-bold rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-455 block font-bold">CARD CC/DC:</label>
                      <input
                        type="number"
                        value={splitCard}
                        onChange={(e) => setSplitCard(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 font-mono text-xs p-1.5 font-bold rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-455 block font-bold">UPI APPS:</label>
                      <input
                        type="number"
                        value={splitUPI}
                        onChange={(e) => setSplitUPI(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 font-mono text-xs p-1.5 font-bold rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="text-[10px] font-semibold text-slate-450 font-mono text-center pt-1">
                    Sum Paid: <span className="font-black text-slate-800">₹{(Number(splitCash) + Number(splitCard) + Number(splitUPI)).toLocaleString()}</span> / Target: ₹{totalPayableCost.toLocaleString()}
                  </div>
                </div>

                {/* Doctor Referral */}
                <div className="space-y-1.5 pt-4 mt-2">
                  <label className="text-[10px] font-mono uppercase text-slate-450 font-black block">Referring Specialty Doctor:</label>
                  <select
                    value={posReferredBy}
                    onChange={(e) => setPosReferredBy(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 text-xs font-semibold rounded-lg text-slate-700 outline-none"
                  >
                    {REFERRAL_DOCTORS.map((doc, idx) => (
                      <option key={idx} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  type="button"
                  onClick={handleCheckoutPOS}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 transition uppercase tracking-wider"
                >
                  <Calculator className="w-4 h-4" /> Finalize Bill & Lock Stock
                </button>
              </div>
            </div>

          </div>
        )}

        {/* =====================================================================
           2. OPD & WARD PRESCRIPTIONS INTERFACE
           ===================================================================== */}
        {activeTab === "prescriptions" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" /> Linked Doctor Prescriptions
                </h3>
                <p className="text-[11px] text-slate-400">Direct transmission logs from diagnostics, consulting doctors and active patient triage desks.</p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-xs font-mono font-extrabold text-indigo-700">
                {combinedPatients.length} active consult targets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combinedPatients.map((patient) => {
                const rx = getSmartPrescription(patient.diagnosis, patient.name);
                const isDispensed = dispensedPrescriptions[patient.id] === true;

                return (
                  <div key={patient.id} className="border border-slate-150 rounded-xl p-5 bg-white shadow-xs space-y-4 hover:border-indigo-200 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm font-bold text-slate-900 font-sans block">{patient.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono uppercase font-black">{patient.type} • MRN: {patient.mrn}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded ${patient.type === "Inpatient" ? "bg-blue-50 text-blue-700 font-mono" : "bg-emerald-50 text-emerald-700 font-mono"}`}>
                        {patient.type}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 text-xs text-slate-600 border border-slate-150">
                      <div className="font-mono text-[9px] uppercase font-black text-indigo-700 block mb-1">
                        Physician prescription: {patient.doctorName}
                      </div>

                      {rx.map((drug, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-slate-100/60 pb-1 last:border-b-0 leading-tight">
                          <div>
                            <strong className="text-slate-800 block font-bold">{drug.name} (Qty: {drug.quantity})</strong>
                            <span className="text-[9.5px] text-slate-400 font-mono italic">{drug.instruction}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div>
                        {isDispensed ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 font-mono font-extrabold px-2 py-0.5 rounded text-[9px]">
                            ✅ Prescripts Sized & Dispensed
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-100 font-mono font-bold px-2 py-0.5 rounded text-[9px]">
                            ⏳ Pending Pickup checkout
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          // Bind patient
                          setPosSelectedPatient(patient);
                          setPosPatientSearch(patient.name);

                          // Populate cart lines matching prescription compounds
                          const currentPosCart = rx.map(item => {
                            const invMatch = inventory.find(i => i.name === item.name);
                            return {
                              id: invMatch ? invMatch.id : `MED-${Date.now().toString().slice(-3)}`,
                              name: item.name,
                              generic: invMatch ? invMatch.generic : "Matched Generic Class",
                              batch: invMatch ? invMatch.batch : "BCH-BATCH",
                              expiry: invMatch ? invMatch.expiry : "2027-12-31",
                              price: invMatch ? invMatch.salePrice : 15,
                              quantity: item.quantity,
                            };
                          });
                          setPosCart(currentPosCart);

                          // Auto switch activeTab to Billing POS
                          setActiveTab("pos");
                          setSuccessNotice(`Linked ${patient.name}'s prescription items instantly to the checkout register.`);
                        }}
                        className="p-1.5 bg-indigo-650 hover:bg-indigo-750 text-white font-mono text-[10px] font-bold rounded-lg transition tracking-wide cursor-pointer flex items-center gap-1 uppercase"
                      >
                        Load into checkout POS <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
           3. INVENTORY REGISTER LEDGER
           ===================================================================== */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" /> Dispensary Formulation Ledger
                </h3>
                <p className="text-[11px] text-slate-400">Total physical materials available on-site, locations, safety stock levels & purchase margins.</p>
              </div>

              <div className="flex gap-2">
                <div className="relative text-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search brand or generic formula..."
                    value={invSearchQuery}
                    onChange={(e) => setInvSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-220 rounded-lg p-1.5 pl-8 font-medium w-48 outline-none text-xs"
                  />
                </div>
                <button
                  onClick={() => setShowAddInvModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold rounded-lg flex items-center gap-1.5 uppercase transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Sift New Compound
                </button>
              </div>
            </div>

            {/* Editing Compound Section */}
            {invEditingItem && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4 text-xs font-sans">
                <strong className="block text-slate-950 font-bold uppercase tracking-wider text-[11px]">
                  🔧 Edit drug compounding dimensions: {invEditingItem.name}
                </strong>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Rack Coordinate Location:</label>
                    <input
                      type="text"
                      value={invEditingItem.rack}
                      onChange={(e) => setInvEditingItem({ ...invEditingItem, rack: e.target.value })}
                      className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Physical Stock Count:</label>
                    <input
                      type="number"
                      value={invEditingItem.stock}
                      onChange={(e) => setInvEditingItem({ ...invEditingItem, stock: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Purchase Price (₹):</label>
                    <input
                      type="number"
                      value={invEditingItem.purchasePrice}
                      onChange={(e) => setInvEditingItem({ ...invEditingItem, purchasePrice: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Retail Sale Price (₹):</label>
                    <input
                      type="number"
                      value={invEditingItem.salePrice}
                      onChange={(e) => setInvEditingItem({ ...invEditingItem, salePrice: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Min Reorder Level:</label>
                    <input
                      type="number"
                      value={invEditingItem.reorderLevel}
                      onChange={(e) => setInvEditingItem({ ...invEditingItem, reorderLevel: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 text-[10px] font-mono uppercase font-black">
                  <button onClick={() => setInvEditingItem(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded">Cancel</button>
                  <button onClick={handleSaveEditInventory} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded">Save Overrides</button>
                </div>
              </div>
            )}

            {/* Add New Inventory Modal-like section */}
            {showAddInvModal && (
              <div className="p-4 border border-teal-220 bg-emerald-50/20 rounded-xl space-y-4 text-xs font-sans">
                <strong className="block text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                  ✍️ Sift and Catalog New Medicine Compound (NHA Aligned)
                </strong>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Medicine Brand Name:</label>
                    <input type="text" placeholder="e.g. Calpol 650mg" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} className="w-full bg-white border border-slate-220 p-2 rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Generic Base Chemical Compound:</label>
                    <input type="text" placeholder="e.g. Acetaminophen" value={newGeneric} onChange={(e) => setNewGeneric(e.target.value)} className="w-full bg-white border border-slate-220 p-2 rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Slab category:</label>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-white border border-slate-220 p-2 rounded">
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antihyperlipidemic">Antihyperlipidemic</option>
                      <option value="Antibacterial">Antibacterial</option>
                      <option value="Antidiabetic">Antidiabetic</option>
                      <option value="Corticosteroid">Corticosteroid</option>
                      <option value="Oncology Chemo">Oncology Chemo</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Batch Code No:</label>
                    <input type="text" value={newBatch} onChange={(e) => setNewBatch(e.target.value)} className="w-full bg-white border border-slate-220 p-2 rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Expiry Threshold:</label>
                    <input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} className="w-full bg-white border border-slate-220 p-2 rounded font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">MRP Value (₹):</label>
                    <input type="number" value={newMRP} onChange={(e) => setNewMRP(Number(e.target.value))} className="w-full bg-white border border-slate-220 p-2 rounded font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Purchase Wholesale Unit Cost (₹):</label>
                    <input type="number" value={newPurchasePrice} onChange={(e) => setNewPurchasePrice(Number(e.target.value))} className="w-full bg-white border border-slate-220 p-2 rounded font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Active Sale Unit Price (₹):</label>
                    <input type="number" value={newSalePrice} onChange={(e) => setNewSalePrice(Number(e.target.value))} className="w-full bg-white border border-slate-220 p-2 rounded font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Rack Slot ID:</label>
                    <input type="text" value={newRack} onChange={(e) => setNewRack(e.target.value)} className="w-full bg-white border border-slate-220 p-2 rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Initial Stock Units:</label>
                    <input type="number" value={newStock} onChange={(e) => setNewStock(Number(e.target.value))} className="w-full bg-white border border-slate-220 p-2 rounded font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Safety Limit Warning Reorder:</label>
                    <input type="number" value={newReorderLevel} onChange={(e) => setNewReorderLevel(Number(e.target.value))} className="w-full bg-white border border-slate-220 p-2 rounded font-mono" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 text-[10px] font-mono font-black uppercase">
                  <button onClick={() => setShowAddInvModal(false)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded">Cancel Form</button>
                  <button onClick={handleCreateMedicine} className="px-3 py-1.5 bg-teal-700 text-white rounded">Submit Formula</button>
                </div>
              </div>
            )}

            {/* Inventory table */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl no-scrollbar">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                    <th className="py-2.5 px-4">Compound Info / Batch</th>
                    <th className="py-2.5 px-4 font-mono">Location</th>
                    <th className="py-2.5 px-4 font-mono">Wholesale Price</th>
                    <th className="py-2.5 px-4 font-mono">MRP / Retail</th>
                    <th className="py-2.5 px-4 font-mono">Current Stock</th>
                    <th className="py-2.5 px-4 font-mono">Net Profit margin</th>
                    <th className="py-2.5 px-4 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                  {inventory
                    .filter(i => i.name.toLowerCase().includes(invSearchQuery.toLowerCase()) || i.generic.toLowerCase().includes(invSearchQuery.toLowerCase()))
                    .map((item) => {
                      const isLowStock = item.stock <= item.reorderLevel;
                      const profit = item.salePrice - item.purchasePrice;
                      const profitMarginPercent = Math.round((profit / item.purchasePrice) * 100);
                      const isLowMargin = profitMarginPercent < 10;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4">
                            <strong className="text-slate-905 block">{item.name}</strong>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>Batch: {item.batch}</span>
                              <span>•</span>
                              <span>Exp: {item.expiry}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{item.rack}</td>
                          <td className="py-3 px-4 font-mono text-slate-800">₹{item.purchasePrice}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-950">₹{item.salePrice}</td>
                          <td className="py-3 px-4 font-mono">
                            <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${isLowStock ? "bg-rose-50 text-rose-700 font-extrabold" : "bg-slate-50 text-slate-800"}`}>
                              {item.stock} u {isLowStock && "(Reorder)"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${isLowMargin ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                              ₹{profit.toFixed(1)} ({profitMarginPercent}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setInvEditingItem(item)}
                              className="px-2.5 py-1 text-[10px] font-mono uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteInventory(item.id, item.name)}
                              className="px-2.5 py-1 text-[10px] font-mono uppercase bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded cursor-pointer"
                            >
                              Purge
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
           4. SUPPLIERS DIRECTORY
           ===================================================================== */}
        {activeTab === "suppliers" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center whitespace-normal">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" /> Authorized Trade Wholesale Suppliers
                </h3>
                <p className="text-[11px] text-slate-400">Manage drug distributors, outstanding payables records, trade credits and GST filing details.</p>
              </div>
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold rounded-lg flex items-center gap-1.5 uppercase cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Bind Wholesaler
              </button>
            </div>

            {/* Supplier Add Form */}
            {showAddSupplierModal && (
              <div className="p-4 border border-blue-200 bg-blue-50/15 rounded-xl space-y-4 text-xs font-sans">
                <strong className="block text-slate-800 font-black uppercase tracking-wider text-[10px]">
                  ✍️ Add Wholesale trade partner info
                </strong>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px]">Supplier Company name:</label>
                    <input type="text" placeholder="Apex Wholesalers Ltd" value={supName} onChange={(e) => setSupName(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px]">Contact Phone:</label>
                    <input type="text" placeholder="+91-99..." value={supContact} onChange={(e) => setSupContact(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px]">Email Coordinate:</label>
                    <input type="email" placeholder="orders@wholesaler.com" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px]">Trade GSTIN Code:</label>
                    <input type="text" value={supGSTIN} onChange={(e) => setSupGSTIN(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px]">Outstanding trade Credit (₹):</label>
                    <input type="number" value={supBalance} onChange={(e) => setSupBalance(Number(e.target.value))} className="w-full bg-white border border-slate-200 p-2 rounded font-mono text-xs" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 text-[10px] font-mono uppercase font-black">
                  <button onClick={() => setShowAddSupplierModal(false)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded">Cancel</button>
                  <button onClick={handleCreateSupplier} className="px-3 py-1.5 bg-blue-700 text-white rounded">Register Supplier</button>
                </div>
              </div>
            )}

            {/* Suppliers credit table */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl no-scrollbar">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                    <th className="py-2.5 px-4">Distributor Company Profile</th>
                    <th className="py-2.5 px-4 font-mono">Contact Coordinates</th>
                    <th className="py-2.5 px-4 font-mono">Trade GSTIN code</th>
                    <th className="py-2.5 px-4 font-mono">Outstanding Payable Balance</th>
                    <th className="py-2.5 px-4 text-right">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700 font-medium">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block font-bold">{sup.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">Distributor ID: {sup.id}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="block text-slate-700">{sup.contact}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">{sup.email}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{sup.gstin}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`px-2.5 py-0.5 rounded font-extrabold text-[11px] ${sup.balance > 0 ? "bg-amber-50 text-amber-705 border border-amber-100" : "bg-slate-50 text-slate-500"}`}>
                          ₹{sup.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {sup.balance > 0 ? (
                          <button
                            onClick={() => {
                              if (activeRole !== "Admin") {
                                setErrorNotice("Access Denied: Only Admin can clear wholesale balance checks.");
                                return;
                              }
                              const payAmount = Number(prompt(`Enter the payment sum to clear with ${sup.name}:`, String(sup.balance)));
                              if (!payAmount || payAmount <= 0) return;

                              const updated = suppliers.map(s => s.id === sup.id ? { ...s, balance: Math.max(0, s.balance - payAmount) } : s);
                              saveSupplierState(updated);
                              addAuditLog("Purchase", `Settle trade deposit: Disbursed payment ₹${payAmount} to wholesaler ${sup.name}.`);
                              setSuccessNotice(`Adjusted trade books. Balance reduced.`);
                            }}
                            className="p-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition shadow-sm"
                          >
                            Pay Wholesale Account
                          </button>
                        ) : (
                          <span className="text-slate-450 font-mono text-[10px] font-bold">Clear Ledger</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* =====================================================================
           5. PROCUREMENT PO SLATE
           ===================================================================== */}
        {activeTab === "purchase" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-600" /> Procurement Purchase Orders
              </h3>
              <p className="text-[11px] text-slate-400">Order materials from registered wholesalers to replenish physical stocks automatically on delivery checklists.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Draft compiler panel */}
              <div className="lg:col-span-1 bg-slate-50/50 border border-slate-150 p-5 rounded-xl space-y-4 text-xs font-sans">
                <strong className="block text-slate-950 font-bold uppercase tracking-wider text-[11px]">
                  Draft Wholesale PO
                </strong>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold">Select Wholesale Distributor:</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-white border border-slate-205 p-2 text-xs font-semibold rounded-lg outline-none"
                  >
                    <option value="">-- Choose Wholesaler --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-slate-200/80 pt-3 space-y-2.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                    Add restocking line item
                  </span>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-550 block">Select Target drug brand:</label>
                    <select
                      value={selectedPoDrugIdx}
                      onChange={(e) => setSelectedPoDrugIdx(Number(e.target.value))}
                      className="w-full bg-white p-2 text-xs font-semibold rounded-lg border border-slate-200"
                    >
                      {inventory.map((m, idx) => (
                        <option key={m.id} value={idx}>
                          {m.name} [Wholesale rate: ₹{m.purchasePrice}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-550 block">Quantity to Order:</label>
                    <input
                      type="number"
                      min={10}
                      value={poLineQty}
                      onChange={(e) => setPoLineQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>

                  <button
                    onClick={handleAddLineToPO}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-[10px] uppercase font-black rounded-lg transition cursor-pointer"
                  >
                    Add Product Line
                  </button>
                </div>

                {poLines.length > 0 && (
                  <div className="border-t border-slate-200 pt-3.5 space-y-2">
                    <span className="text-[10px] font-mono tracking-wider text-slate-450 uppercase block font-bold">PO basket draft lines</span>
                    {poLines.map((line, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] leading-tight text-slate-600 bg-white p-2 rounded border border-slate-150">
                        <div>
                          <strong>{line.name}</strong>
                          <span className="block text-[10px] text-slate-400">{line.quantity} units x ₹{line.cost}</span>
                        </div>
                        <button onClick={() => setPoLines(poLines.filter((_, i) => i !== idx))} className="text-red-505 font-bold hover:underline">Remove</button>
                      </div>
                    ))}

                    <div className="font-mono text-center text-xs font-black pt-1 bg-slate-100 p-2 rounded">
                      Total cost: ₹{poLines.reduce((acc, c) => acc + (c.quantity * c.cost), 0).toLocaleString()}
                    </div>

                    <button
                      onClick={handleFinalizePO}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-black uppercase rounded-lg cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      Draft Procurement PO
                    </button>
                  </div>
                )}
              </div>

              {/* Purchase order list and processing register */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-black uppercase block">
                  Active Procurement Ledger log
                </span>

                {purchaseOrders.length > 0 ? (
                  <div className="space-y-3">
                    {purchaseOrders.map((po) => (
                      <div key={po.id} className="p-4 bg-white border border-slate-150 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-500">{po.id}</span>
                            <span className={`px-2 py-[1px] text-[8px] uppercase font-bold rounded ${po.status === "Received" ? "bg-emerald-50 border border-emerald-105 text-emerald-700" : "bg-blue-50 border border-blue-105 text-blue-700"}`}>
                              {po.status}
                            </span>
                          </div>
                          <strong className="text-slate-900 block mt-1 font-bold">{po.supplierName}</strong>
                          <span className="text-[10px] text-slate-450 font-mono">Date Sourced: {po.date}</span>
                        </div>

                        <div className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          <strong className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block mb-0.5">Shipment Compounds:</strong>
                          {po.items.map((it, idx) => (
                            <div key={idx} className="text-[10px] font-semibold">
                              - {it.name} ({it.quantity} u)
                            </div>
                          ))}
                        </div>

                        <div className="text-right space-y-2">
                          <div className="font-mono font-bold text-slate-900 block text-xs">
                            Total Trade Payable: ₹{po.totalAmount.toLocaleString()}
                          </div>

                          {po.status === "Created" ? (
                            <button
                              onClick={() => handleReceiveStock(po.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold uppercase rounded-lg transition cursor-pointer shadow-sm"
                            >
                              Receive Delivery & Adjust Stocks
                            </button>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2.5 py-1 text-[9px] font-mono font-extrabold uppercase ml-auto inline-block">
                              Restocked ✓
                            </span>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-center text-slate-400 text-xs">
                    No procurement trade orders recorded. Select wholesaler and product compounds on the draft panel to compile.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* =====================================================================
           6. RETURNS DESK
           ===================================================================== */}
        {activeTab === "returns" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-teal-600" /> Active Returns & Refunds Register
              </h3>
              <p className="text-[11px] text-slate-400">Manage customer billing sales returns, wholesale returns dispatched to suppliers, and spoiled writeoffs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Return Logger panel */}
              <div className="lg:col-span-1 bg-slate-50/50 border border-slate-150 p-5 rounded-xl space-y-4 text-xs font-sans">
                <strong className="block text-slate-905 font-black uppercase tracking-wider text-[11px]">
                  File Returns Docket
                </strong>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold">Return Ledger Category:</label>
                  <select
                    value={rtType}
                    onChange={(e) => setRtType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 p-2.5 text-xs font-semibold rounded-lg text-slate-705"
                  >
                    <option value="Sales Rent">Sales Return (Customer Refund)</option>
                    <option value="Purchase Return">Purchase Return (To Supplier)</option>
                    <option value="Damaged Stock">Damaged Stock Write-off Loss</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold">Select medicine compound:</label>
                  <select
                    value={rtItemIdx}
                    onChange={(e) => setRtItemIdx(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 p-2 text-xs font-semibold rounded-lg text-slate-705"
                  >
                    {inventory.map((m, idx) => (
                      <option key={m.id} value={idx}>
                        {m.name} [Available Stock: {m.stock} u]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-550 block">Quantity to return:</label>
                  <input
                    type="number"
                    min={1}
                    value={rtQty}
                    onChange={(e) => setRtQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-550 block">
                    {rtType === "Sales Rent" ? "Patient Name / MRN ID:" : rtType === "Purchase Return" ? "Supplier Brand Wholesaler name:" : "Loss Division Name (e.g. Expired):"}
                  </label>
                  <input
                    type="text"
                    value={rtEntity}
                    onChange={(e) => setRtEntity(e.target.value)}
                    placeholder="Provide name description detail..."
                    className="w-full bg-white border border-[#DDD] p-2 text-xs font-semibold rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-550 block">Explicit Audit Reason:</label>
                  <textarea
                    value={rtReason}
                    onChange={(e) => setRtReason(e.target.value)}
                    placeholder="Type comments trigger reasons (e.g. Broken vial seals, doctor prescription adjusted value)..."
                    className="w-full bg-white border border-[#DDD] p-2.5 text-xs font-medium rounded-lg h-16 outline-none"
                  />
                </div>

                <button
                  onClick={handleRegisterReturn}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10.5px] font-black uppercase rounded-lg cursor-pointer transition shadow-sm"
                >
                  Post Refund Transaction
                </button>
              </div>

              {/* Transactions Ledger Grid */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-black uppercase block">
                  Returns & write-offs transactions log
                </span>

                <div className="overflow-x-auto border border-slate-150 rounded-xl no-scrollbar">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-205 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                        <th className="py-2 px-3">Docket ID</th>
                        <th className="py-2 px-3 font-mono">Category</th>
                        <th className="py-2 px-3">Compound description</th>
                        <th className="py-2 px-3 font-mono">Qty</th>
                        <th className="py-2 px-3 font-mono">Refund Rate Amount</th>
                        <th className="py-2 px-3">Trace reasons</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-slate-705 font-medium">
                      {returns.length > 0 ? (
                        returns.map((ret, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 px-3 font-mono text-[10px] font-bold text-slate-400">{ret.id}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 font-bold rounded text-[9px] font-mono uppercase ${ret.type === "Sales Rent" ? "bg-blue-50 text-blue-700" : ret.type === "Purchase Return" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                                {ret.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{ret.itemName}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{ret.quantity}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-950">₹{ret.refundAmount.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-[11px] italic text-slate-450 leading-tight">
                              {ret.reason} ({ret.entityName})
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">No returns recorded in local memory session.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =====================================================================
           7. ALERTS HUB
           ===================================================================== */}
        {activeTab === "alerts" && (
          <div className="space-y-6 animate-fade-in text-xs font-sans">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Margin, Expiry & Stock shortage Alerts
              </h3>
              <p className="text-[11px] text-slate-400">Central board evaluating compound risks immediately before compounding and pharmacy packaging checkmarks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Stock shortage */}
              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase font-black tracking-widest text-slate-400">
                  <span>Shortages ({lowStockAlerts.length})</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                </div>

                <div className="space-y-3">
                  {lowStockAlerts.map(i => (
                    <div key={i.id} className="p-3 bg-white border border-rose-100 rounded-lg shadow-2xs space-y-1.5">
                      <strong className="text-slate-900 font-bold block">{i.name}</strong>
                      <div className="text-[10px] text-slate-500 font-mono">Available Stock: <span className="text-rose-600 font-extrabold">{i.stock} units</span> / Reorder limit: {i.reorderLevel}</div>
                      
                      <button
                        onClick={() => {
                          setSelectedSupplierId("");
                          setActiveTab("purchase");
                          setSuccessNotice(`Sourced PO compiler coordinates for replenishing: ${i.name}`);
                        }}
                        className="p-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[9px] uppercase font-bold rounded cursor-pointer"
                      >
                        Create Purchase Order PO
                      </button>
                    </div>
                  ))}
                  {lowStockAlerts.length === 0 && (
                    <div className="py-6 text-center text-slate-400 italic">No inventory quantities currently below reorder bounds.</div>
                  )}
                </div>
              </div>

              {/* Expiring batch materials */}
              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase font-black tracking-widest text-slate-400">
                  <span>Batch expiries ({nearExpiryAlerts.length})</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                </div>

                <div className="space-y-3">
                  {nearExpiryAlerts.map(i => (
                    <div key={i.id} className="p-3 bg-white border border-amber-100 rounded-lg shadow-2xs space-y-1.5">
                      <strong className="text-slate-900 font-bold block">{i.name}</strong>
                      <div className="text-[10px] text-slate-500 font-mono">Batch Code: <span className="font-extrabold text-slate-700">{i.batch}</span></div>
                      <div className="text-[10px] text-amber-700 font-mono">Expires On: <strong className="font-semibold underline">{i.expiry}</strong> (Soon!)</div>
                      
                      <button
                        onClick={() => {
                          setRtType("Damaged Stock");
                          setRtEntity("Expired Batch write-off");
                          setRtReason(`Damaged: Manual clearing expiring compound batch code: ${i.batch}`);
                          setActiveTab("returns");
                          setSuccessNotice(`Loaded Expired Return configuration parameters.`);
                        }}
                        className="p-1 px-2.5 bg-amber-600 text-white font-mono text-[9px] uppercase font-bold rounded cursor-pointer"
                      >
                        Spoilage Write-Off
                      </button>
                    </div>
                  ))}
                  {nearExpiryAlerts.length === 0 && (
                    <div className="py-6 text-center text-slate-400 italic">Excellent! All compound batches show healthy expiry schedules.</div>
                  )}
                </div>
              </div>

              {/* Low Margin alerts */}
              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase font-black tracking-widest text-slate-400">
                  <span>Low Margin warn ({lowMarginAlerts.length})</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                </div>

                <div className="space-y-3">
                  {lowMarginAlerts.map(i => {
                    const profit = i.salePrice - i.purchasePrice;
                    return (
                      <div key={i.id} className="p-3 bg-white border border-blue-50 rounded-lg shadow-2xs space-y-1.5">
                        <strong className="text-slate-900 font-bold block">{i.name}</strong>
                        <div className="text-[10px] text-slate-500 font-mono">Wholesale Price: ₹{i.purchasePrice} / Retails: ₹{i.salePrice}</div>
                        <div className="text-[10.5px] font-mono font-bold text-slate-800">Slab Profit Rate: <span className="text-indigo-650 font-bold">₹{profit.toFixed(1)}</span> (Value too low)</div>
                        
                        <button
                          onClick={() => {
                            setInvEditingItem(i);
                            setActiveTab("inventory");
                            setSuccessNotice(`Override values to secure adequate trade profit margins.`);
                          }}
                          className="p-1 px-2.5 bg-slate-200 text-slate-700 font-mono text-[9px] uppercase font-bold rounded cursor-pointer"
                        >
                          Modify Selling Rate
                        </button>
                      </div>
                    );
                  })}
                  {lowMarginAlerts.length === 0 && (
                    <div className="py-6 text-center text-slate-400 italic">No medicine compounds below retail target margin goals.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =====================================================================
           8. DYNAMIC OPERATIONAL ANALYTICS
           ===================================================================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-905" /> Operational Intelligence Dashboard
              </h3>
              <p className="text-[11px] text-slate-400">Deep real-time metrics calculating wholesale costs, profit margins, compounding fast turners, and slow stagnant dead stock.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">NET DISPENSARY SALES REVENUE</span>
                <strong className="text-lg font-mono text-slate-900 block font-black">₹{netDailyRevenue.toLocaleString()}</strong>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">CUMULATIVE EARNED PROFIT</span>
                <strong className="text-lg font-mono text-blue-700 block font-black">₹{netProfitTracked.toLocaleString()}</strong>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">TOTAL COMPLETED DISPENSES</span>
                <strong className="text-lg font-mono text-slate-900 block font-black">{pharmacyBills.length} Invoices</strong>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">RETURNS DRAFTS HANDLED</span>
                <strong className="text-lg font-mono text-slate-900 block font-black">{returns.length} ledger sheets</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans text-slate-705">
              
              {/* Top medicines by volume */}
              <div className="border border-slate-150 p-4 rounded-xl shadow-2xs space-y-3.5">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-extrabold uppercase block p-1">
                  🔥 Top Sold Compounds
                </span>
                <div className="space-y-2">
                  {sortedTopDrugs.map(([name, qty]) => (
                    <div key={name} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">{name}</span>
                      <span className="text-slate-500 font-mono uppercase bg-slate-100 rounded px-2">{qty} units</span>
                    </div>
                  ))}
                  {sortedTopDrugs.length === 0 && (
                    <div className="py-8 text-center text-slate-400 italic">No checkout transactions processed today.</div>
                  )}
                </div>
              </div>

              {/* Fast-Moving medicines */}
              <div className="border border-slate-150 p-4 rounded-xl shadow-2xs space-y-3.5">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-extrabold uppercase block p-1">
                  ⚡ Fast Turnover Compounds (&gt;15 units)
                </span>
                <div className="space-y-2">
                  {fastMovingMedicines.map((name) => (
                    <div key={name} className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded font-bold text-[11px] leading-tight flex items-center justify-between">
                      <span className="truncate max-w-[200px]">{name}</span>
                      <span className="text-[9px] font-mono uppercase">High Turnover</span>
                    </div>
                  ))}
                  {fastMovingMedicines.length === 0 && (
                    <div className="p-4 bg-slate-50 rounded text-center text-slate-400 italic leading-snug">
                      Compounds are running under baseline constant pace. Currently no rapid depletion warn.
                    </div>
                  )}
                </div>
              </div>

              {/* Dead Stock Inventory */}
              <div className="border border-slate-150 p-4 rounded-xl shadow-2xs space-y-3.5">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-extrabold uppercase block p-1">
                  💤 Dead Stock Compounds (&gt;1000 units with 0 sales)
                </span>
                <div className="space-y-2">
                  {deadStockCompounds.map((d) => (
                    <div key={d.id} className="p-2 bg-slate-50 border border-slate-150 rounded leading-tight">
                      <strong className="text-slate-800 block text-[11px] font-bold">{d.name}</strong>
                      <div className="text-[10px] text-slate-450 font-mono mt-0.5">Physical Count: {d.stock} units stagnant in {d.rack}</div>
                    </div>
                  ))}
                  {deadStockCompounds.length === 0 && (
                    <div className="py-8 text-center text-slate-400 italic">Excellent! Outstanding compound shelf turns. Stagnant list is empty.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =====================================================================
           9. AUDITING LEDGER LOG
           ===================================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center whitespace-normal">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <History className="w-4 h-4 text-purple-600" /> Chronological Pharmacy Audit Trail
                </h3>
                <p className="text-[11px] text-slate-400">Immutable ledger logging cashier sales, purchase replenishments, manual compounding overrides and return notes.</p>
              </div>

              <button
                onClick={() => {
                  if (activeRole !== "Admin") {
                    setErrorNotice("Access Denied: Only Admin users can purge audit trails.");
                    return;
                  }
                  if (confirm("Reset audit trails?")) {
                    setAuditLogs([]);
                    localStorage.removeItem("vigilor_audit_logs");
                  }
                }}
                className="p-1.5 bg-slate-100 hover:bg-slate-205 text-slate-600 font-mono text-[9px] uppercase font-bold rounded-lg cursor-pointer"
              >
                Clear Ledger
              </button>
            </div>

            <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs text-xs font-sans">
              <div className="bg-slate-50 p-2 border-b border-slate-200 text-slate-500 font-mono text-[9.5px] font-bold uppercase tracking-wider flex justify-between">
                <span>Verification Trail Entry</span>
                <span>Role stamp</span>
              </div>
              <div className="bg-white divide-y divide-slate-100 max-h-96 overflow-y-auto font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 hover:bg-slate-50/50 transition flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">[{log.id}]</span>
                        <span className="text-slate-450 italic">{new Date(log.timestamp).toLocaleString()}</span>
                        <span className={`text-[9px] px-1.5 rounded uppercase font-bold ${log.category === "Billing" ? "bg-indigo-50 border border-indigo-120 text-indigo-705" : log.category === "Inventory" ? "bg-emerald-50 border border-emerald-120 text-emerald-705" : log.category === "Purchase" ? "bg-amber-50 border border-amber-120 text-amber-705" : "bg-rose-50 border border-rose-121 text-rose-705"}`}>
                          {log.category}
                        </span>
                      </div>
                      <p className="text-slate-800 font-sans leading-tight mt-1">{log.action}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-650 bg-blue-50 border border-blue-105 px-2 rounded-md h-fit">
                      {log.userRole}
                    </span>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="py-12 p-4 text-center text-slate-400 italic font-medium font-sans">No verification audits registered during session.</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modern Enterprise Stylized Receipt modal popover if activeReceipt */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up font-mono text-[11px] text-slate-800">
            
            <div className="text-center pb-3 border-b border-slate-205 relative font-mono">
              <button
                onClick={() => setActiveReceipt(null)}
                className="absolute right-0 top-0 text-slate-400 hover:text-slate-900 font-bold text-sm bg-slate-100 px-1.5 rounded-full"
              >
                ×
              </button>
              <strong className="text-[12px] uppercase tracking-wider font-black text-slate-950 block">COSMO DISPENSARY PRIVATE LTD</strong>
              <span className="text-[9.5px] text-slate-450 block leading-tight mt-0.5">Apex Central, Ring Road Ward Area • GSTIN: 07AAACV9842K1Z9</span>
              <strong className="text-[10.5px] text-emerald-800 block uppercase font-black tracking-widest mt-2 border border-dashed border-emerald-250 py-0.5">Dispensed invoice receipt</strong>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-2 border-b border-dashed border-slate-220 leading-snug">
              <div>
                <div>Patient: <strong className="text-slate-950 font-bold">{activeReceipt.patientName}</strong></div>
                <div>MRN Code: <span className="font-bold text-slate-700">{activeReceipt.mrn}</span></div>
                <div>Type: <span className="text-indigo-705 font-bold">{activeReceipt.patientType}</span></div>
              </div>
              <div className="text-right">
                <div>Invoice Id: <strong className="text-slate-955 font-black">{activeReceipt.id}</strong></div>
                <div>Dated: <span>{new Date(activeReceipt.generatedAt).toLocaleDateString()}</span></div>
                <div>Time: <span>{new Date(activeReceipt.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              </div>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-220 pb-3">
              <strong className="text-[9px] uppercase font-black text-slate-400 block mb-1">Prescription billing item compounds:</strong>
              {activeReceipt.drugs.map((d: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="max-w-[280px] leading-tight">{d.name} (Qty {d.quantity} × ₹{d.price}):</span>
                  <span>₹{d.price * d.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal amount Rate:</span>
                <span>₹{activeReceipt.totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Interactive Promo Discount ({activeReceipt.discount}%):</span>
                <span>-₹{activeReceipt.discountAmount}</span>
              </div>
              <div className="flex justify-between text-slate-550">
                <span>Pharmaceutical flat GST (18% slab):</span>
                <span>+₹{activeReceipt.gstAmount}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-black border-t border-slate-200 mt-1.5 pt-1 text-xs">
                <span>NET COLLECTED CASH:</span>
                <span className="text-blue-700">₹{activeReceipt.finalAmount}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-205 pt-2 font-mono text-[9px] text-slate-500 leading-normal">
              <strong className="text-[8.5px] uppercase font-black text-slate-450 block mb-0.5">Split Payment Transaction Allocation details:</strong>
              {activeReceipt.splitCash > 0 && <div>- CASH DRAW: ₹{activeReceipt.splitCash.toLocaleString()}</div>}
              {activeReceipt.splitCard > 0 && <div>- CARD READER DEBIT: ₹{activeReceipt.splitCard.toLocaleString()}</div>}
              {activeReceipt.splitUPI > 0 && <div>- BHIM UPI WALLET: ₹{activeReceipt.splitUPI.toLocaleString()}</div>}
            </div>

            <div className="text-slate-450 text-[8.5px] text-center uppercase font-bold pt-1.5 border-t border-dashed border-slate-200 leading-normal">
              Refer specialty: {activeReceipt.referredBy}<br />
              Thank you! Sourced & Dispensed via Vigilor Dispensary software system
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-1 px-4 bg-slate-105 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 border border-slate-220 font-mono"
              >
                <Printer className="w-3 h-3" /> Execute Carbon Printout
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
