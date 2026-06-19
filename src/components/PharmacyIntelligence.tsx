import React, { useState, useEffect } from "react";
import { Bed, Patient } from "../types";
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
  CheckCircle2, 
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
  Edit2,
  ShieldCheck,
  Megaphone,
  BrainCircuit,
  Receipt
} from "lucide-react";

interface PharmacyIntelligenceProps {
  beds: Bed[];
  onUpdatePatient: (bedId: string, updatedData: Partial<Patient>) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function PharmacyIntelligence({ beds, onUpdatePatient, onRefresh }: PharmacyIntelligenceProps) {
  const { outpatients, pharmacyBills } = useHospital();

  // Active top-level managerial section inside Intel
  const [activeTab, setActiveTab] = useState<"inventory" | "procurement" | "returns_ledger" | "business_analytics" | "ai_foresight" | "compliance">("inventory");

  // Inner sub-tabs
  const [invSubTab, setInvSubTab] = useState<"ledger" | "batch" | "rack" | "reorder" | "expiry">("ledger");
  const [procSubTab, setProcSubTab] = useState<"po_builder" | "pos_list" | "suppliers_list" | "vendor_compare">("po_builder");

  // Local state mirrored with localStorage
  const [inventory, setInventory] = useState<MedicineItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // UX Notices
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Search queries
  const [invSearchQuery, setInvSearchQuery] = useState("");
  const [supSearchQuery, setSupSearchQuery] = useState("");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");

  // Modals & form fields
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

  const [invEditingItem, setInvEditingItem] = useState<MedicineItem | null>(null);

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supGSTIN, setSupGSTIN] = useState("07GSTIN1234F");
  const [supBalance, setSupBalance] = useState(0);

  const [payAmount, setPayAmount] = useState<Record<string, number>>({});

  // Procurement PO builder state
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [poLines, setPoLines] = useState<{ medicineId: string; name: string; quantity: number; cost: number }[]>([]);
  const [poLineQty, setPoLineQty] = useState(100);
  const [selectedPoDrugIdx, setSelectedPoDrugIdx] = useState(0);

  // Return Transaction state
  const [rtType, setRtType] = useState<ReturnRecord["type"]>("Sales Rent");
  const [rtItemIdx, setRtItemIdx] = useState(0);
  const [rtQty, setRtQty] = useState(1);
  const [rtEntity, setRtEntity] = useState("");
  const [rtReason, setRtReason] = useState("");

  // Leakage compass simulation slider states
  const [matchDiscountPercent, setMatchDiscountPercent] = useState(15);
  const [waitingReductionMinutes, setWaitingReductionMinutes] = useState(15);
  const [bedClearanceSpeedup, setBedClearanceSpeedup] = useState(3);

  // Load state from local storage & bind listener for active POS updates
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
      else setPurchaseOrders([]);

      const storedRet = localStorage.getItem("vigilor_returns");
      if (storedRet) setReturns(JSON.parse(storedRet));
      else setReturns([]);

      const storedAudit = localStorage.getItem("vigilor_audit_logs");
      if (storedAudit) setAuditLogs(JSON.parse(storedAudit));
      else {
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
    } catch (e) {
      console.error("Error loading localStorage states in Intel", e);
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

  // Save states helper & synchronize custom window event trigger
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
      userRole: "Admin",
      category,
      action
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem("vigilor_audit_logs", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  // Restock action specifically for oncologist bed warnings clearance (restoring original functionality securely)
  const handleRestockOncologistDrug = async (medId: string) => {
    setLoading(true);
    setSuccessNotice(null);
    try {
      const updatedInv = inventory.map(item => {
        if (item.id === medId || item.generic.toLowerCase() === "bortezomib") {
          return { ...item, stock: 50 }; // replenish code
        }
        return item;
      });
      saveInventoryState(updatedInv);

      // Locate oncology bed with stockout warning (ONC-03) and clear its warning!
      const oncologistBed = beds.find(b => b.id === "ONC-03");
      if (oncologistBed && oncologistBed.patient) {
        await onUpdatePatient("ONC-03", { warning: "" });
      }

      addAuditLog("Inventory", "Critically shortage chemical Bortezomib received & resolved oncologist clearance beds.");
      setSuccessNotice("Success! Critical Bortezomib chemical infusion restocked. Patient warning on ONC-03 has been cleared.");
      await onRefresh();
    } catch (e) {
      console.error(e);
      setErrorNotice("Error resolving pharmacology stock levels.");
    } finally {
      setLoading(false);
    }
  };

  // 1. INVENTORY ACTIONS
  const handleCreateMedicine = () => {
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

    const updated = inventory.map(item => item.id === invEditingItem.id ? invEditingItem : item);
    saveInventoryState(updated);
    addAuditLog("Inventory", `Manual update applied to drug ${invEditingItem.name}. New Stock: ${invEditingItem.stock}, Sale Price: ₹${invEditingItem.salePrice}.`);
    
    setInvEditingItem(null);
    setSuccessNotice(`Modified compound information successfully.`);
    setErrorNotice(null);
  };

  const handleDeleteInventory = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to completely delete ${name} from pharmacy inventory?`)) return;

    const updated = inventory.filter(i => i.id !== id);
    saveInventoryState(updated);
    addAuditLog("Inventory", `Purged compound brand ${name} [${id}] permanently from dispensary registers.`);
    setSuccessNotice(`Successfully removed medicine compound.`);
    setErrorNotice(null);
  };

  // 2. SUPPLIER ACTIONS
  const handleCreateSupplier = () => {
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

  // Adjust balance
  const handleSettleSupplierBalance = (supId: string) => {
    const amount = payAmount[supId] || 0;
    if (amount <= 0) {
      setErrorNotice("Invalid Payment: Specify a positive settlement amount.");
      return;
    }

    const matchSup = suppliers.find(s => s.id === supId);
    if (!matchSup) return;

    const updated = suppliers.map(s => {
      if (s.id === supId) {
        return { ...s, balance: Math.max(0, s.balance - amount) };
      }
      return s;
    });

    saveSupplierState(updated);
    addAuditLog("Purchase", `Settle trade deposit: Disbursed payment ₹${amount} to wholesaler ${matchSup.name}.`);
    setPayAmount({ ...payAmount, [supId]: 0 });
    setSuccessNotice(`Adjusted trade books. Balance reduced.`);
  };

  // 3. PROCUREMENT PO BUILDER ACTIONS
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
      setErrorNotice("Empty PO: Please select compounding products to register trade purchase orders.");
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
    setSuccessNotice(`Draft Purchase Order ${newPO.id} cataloged successfully.`);
    setErrorNotice(null);
  };

  const handleReceiveStock = (poId: string) => {
    const targetedPOIndex = purchaseOrders.findIndex(p => p.id === poId);
    if (targetedPOIndex < 0) return;

    const po = purchaseOrders[targetedPOIndex];
    if (po.status === "Received") {
      setErrorNotice("Action Cancelled: This order is already checked and received.");
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

    // Update trade supplier balances
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
    setSuccessNotice(`Materials received from wholesale channels. Stocks and account balance updated (Goods Receipt Note locked).`);
    setErrorNotice(null);
  };

  // 4. RETURNS LEDGER
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
      financialRefund = drug.salePrice * rtQty;
      nextInv[rtItemIdx].stock += Number(rtQty);
      addAuditLog("Returns", `Processed customer refund for ${rtQty} units of ${drug.name}. Refund amount ₹${financialRefund}.`);
    } else if (rtType === "Purchase Return") {
      if (drug.stock < rtQty) {
        setErrorNotice(`Insufficient Stock: Only ${drug.stock} units of ${drug.name} are available with us to return.`);
        return;
      }
      financialRefund = drug.purchasePrice * rtQty;
      nextInv[rtItemIdx].stock = Math.max(0, drug.stock - Number(rtQty));

      const nextSupp = suppliers.map(s => {
        if (s.name.toLowerCase().includes(rtEntity.toLowerCase())) {
          return { ...s, balance: Math.max(0, s.balance - financialRefund) };
        }
        return s;
      });
      saveSupplierState(nextSupp);
      addAuditLog("Returns", `Dispatched trade return of ${rtQty} units of ${drug.name} back to distributor ${rtEntity}.`);
    } else {
      if (drug.stock < rtQty) {
        setErrorNotice(`Insufficient Stock: Only {drug.stock} units are currently present to report damage on.`);
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

  // Derive dynamic analytics parameters
  const filteredInv = inventory.filter(item => 
    item.name.toLowerCase().includes(invSearchQuery.toLowerCase()) || 
    item.generic.toLowerCase().includes(invSearchQuery.toLowerCase())
  );

  const lowStockThresholdCount = inventory.filter(item => item.stock <= item.reorderLevel).length;

  const nearExpiryCount = inventory.filter(item => {
    const days = Math.round((new Date(item.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return days > 0 && days <= 365;
  }).length;

  // Leakage compass values
  const totalBillsVal = pharmacyBills.reduce((acc, b) => acc + b.finalAmount, 0);
  const calculatedLeakageRatio = totalBillsVal > 0 ? 22 : 0;
  const simulatedLeakageSaved = Math.round(184300 * (matchDiscountPercent / 15) * (waitingReductionMinutes / 15) * (bedClearanceSpeedup / 3));

  return (
    <div className="space-y-6 font-sans">
      
      {/* 2026 Vigilor Enterprise Intel Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-mono tracking-widest font-black bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md">
              Vigilor Intel OS
            </span>
            <span className="text-slate-500 text-xs font-semibold">• Pharmacy ERP & Analytics Command Center</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Enterprise Dispensary Intelligence</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
            Reconcile wholesale supplier books, track batch expiries near-term, construct procurement purchase orders, audit NDPS Schedule-H ledgers, and simulate bedside revenue leakages.
          </p>
        </div>

        {/* Dynamic State Status Overview */}
        <div className="flex flex-wrap gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[100px]">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Compounds</span>
            <strong className="text-sm font-black text-slate-850 font-mono">{inventory.length} Brands</strong>
          </div>
          <div className="p-3 bg-blue-50 text-blue-750 border border-blue-100 rounded-xl text-center min-w-[100px]">
            <span className="text-[9px] font-semibold text-blue-500 block uppercase font-mono">Near Expiries</span>
            <strong className="text-sm font-black font-mono">{nearExpiryCount} alerts</strong>
          </div>
          <div className="p-3 bg-amber-50 text-amber-750 border border-amber-100 rounded-xl text-center min-w-[100px]">
            <span className="text-[9px] font-semibold text-amber-600 block uppercase font-mono">Reorder Levels</span>
            <strong className="text-sm font-black font-mono">{lowStockThresholdCount} items</strong>
          </div>
        </div>
      </div>

      {/* Global Notice Boxes */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl flex items-center justify-between font-sans text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-500 hover:text-emerald-800 font-black cursor-pointer">×</button>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl flex items-center justify-between font-sans text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-rose-500 hover:text-rose-800 font-black cursor-pointer font-bold">×</button>
        </div>
      )}

      {/* ERP Modules Navigation Bar */}
      <div className="flex overflow-x-auto gap-2 pb-1.5 border-b border-slate-200">
        {[
          { tab: "inventory", icon: Package, label: "Inventory Ledgers" },
          { tab: "procurement", icon: ShoppingCart, label: "Procurement Hub" },
          { tab: "returns_ledger", icon: ArrowLeftRight, label: "Returns Ledger" },
          { tab: "business_analytics", icon: TrendingUp, label: "Business Analytics" },
          { tab: "ai_foresight", icon: BrainCircuit, label: "AI Forecasts" },
          { tab: "compliance", icon: History, label: "Compliance Index" },
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
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-tight transition flex items-center gap-2 cursor-pointer flex-shrink-0 border ${activeTab === btn.tab ? "bg-blue-600 border-blue-600 text-white font-black shadow-xs scale-[1.02]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[450px]">
        
        {/* =====================================================================
           I. INVENTORY SECTION 
           ===================================================================== */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            
            {/* Inner Sub-navigation for Inventory ERP */}
            <div className="flex gap-2.5 pb-2 border-b border-slate-100 text-[11px] font-mono no-scrollbar">
              {[
                { sub: "ledger", label: "Ledger Directory" },
                { sub: "batch", label: "Batch Lists" },
                { sub: "rack", label: "Rack Index" },
                { sub: "reorder", label: "Reorder Trigger Alerts" },
                { sub: "expiry", label: "Expiry Forecast Calendar" }
              ].map(opt => (
                <button
                  key={opt.sub}
                  onClick={() => setInvSubTab(opt.sub as any)}
                  className={`py-1 px-3 rounded-lg font-bold transition ${invSubTab === opt.sub ? "bg-slate-900 text-white" : "bg-slate-50 hover:bg-slate-100 text-slate-600"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Inner Views */}
            {invSubTab === "ledger" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Registered Compounds Directory</h3>
                    <p className="text-[11px] text-slate-400">Add, edit formulation specifications, and manage clinical dispense lists.</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative text-xs flex-1 sm:flex-initial">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search generic chemical or brand..."
                        value={invSearchQuery}
                        onChange={(e) => setInvSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 pl-8 font-medium w-full sm:w-48 outline-none text-xs"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddInvModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold rounded-lg flex items-center gap-1.5 uppercase cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Sift New Compound
                    </button>
                  </div>
                </div>

                {/* Edit inline block */}
                {invEditingItem && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4 text-xs font-sans">
                    <strong className="block text-slate-950 font-bold uppercase tracking-wider text-[11px]">
                      🔧 Edit compounding coordinates: {invEditingItem.name}
                    </strong>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Rack Coordinate Location:</label>
                        <input
                          type="text"
                          value={invEditingItem.rack}
                          onChange={(e) => setInvEditingItem({ ...invEditingItem, rack: e.target.value })}
                          className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Physical Stock Count:</label>
                        <input
                          type="number"
                          value={invEditingItem.stock}
                          onChange={(e) => setInvEditingItem({ ...invEditingItem, stock: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded font-mono text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Purchase Cost (₹):</label>
                        <input
                          type="number"
                          value={invEditingItem.purchasePrice}
                          onChange={(e) => setInvEditingItem({ ...invEditingItem, purchasePrice: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded font-mono text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Retail Sale price (₹):</label>
                        <input
                          type="number"
                          value={invEditingItem.salePrice}
                          onChange={(e) => setInvEditingItem({ ...invEditingItem, salePrice: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded font-mono text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Min Reorder Level:</label>
                        <input
                          type="number"
                          value={invEditingItem.reorderLevel}
                          onChange={(e) => setInvEditingItem({ ...invEditingItem, reorderLevel: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 py-1.5 p-2 rounded font-mono text-xs text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-[10px] font-mono uppercase font-black">
                      <button onClick={() => setInvEditingItem(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded">Cancel</button>
                      <button onClick={handleSaveEditInventory} className="px-3 py-1.5 bg-blue-600 text-white rounded">Save Overrides</button>
                    </div>
                  </div>
                )}

                {/* Main inventory register table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                        <th className="py-2.5 px-4">Internal ID</th>
                        <th className="py-2.5 px-4 font-sans">Brand Name</th>
                        <th className="py-2.5 px-4">Chemical Compound</th>
                        <th className="py-2.5 px-4">Location</th>
                        <th className="py-2.5 px-4">Quantity Available</th>
                        <th className="py-2.5 px-4">Pricing Dim.</th>
                        <th className="py-2.5 px-4">Net Profit Margin</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredInv.map(item => {
                        const isLowStock = item.stock <= item.reorderLevel;
                        const profit = item.salePrice - item.purchasePrice;
                        const profitPercentage = Math.round((profit / item.purchasePrice) * 100);
                        const isBortezomib = item.generic.toLowerCase() === "bortezomib";

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 px-4 font-mono text-slate-400">{item.id}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              {item.name}
                              {isBortezomib && item.stock <= item.reorderLevel && (
                                <span className="ml-1 px-1 bg-rose-100 text-rose-700 rounded font-black text-[9px]">CRITICAL</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 italic font-sans">{item.generic}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">{item.rack}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${isLowStock ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                                {item.stock} units
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">
                              <span>Buy: ₹{item.purchasePrice.toFixed(0)} • Sell: ₹{item.salePrice.toFixed(0)}</span>
                            </td>
                            <td className="py-2.5 px-4 font-sans text-slate-500 text-xs">
                              <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${profitPercentage < 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                                ₹{profit.toFixed(1)} ({profitPercentage}%)
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right space-x-1.5 flex justify-end">
                              {isBortezomib && item.stock <= item.reorderLevel && (
                                <button
                                  onClick={() => handleRestockOncologistDrug(item.id)}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-mono rounded font-black uppercase"
                                >
                                  Clear Beds Warning
                                </button>
                              )}
                              <button
                                onClick={() => setInvEditingItem(item)}
                                className="px-2 py-0.5 text-[9px] font-mono uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteInventory(item.id, item.name)}
                                className="px-2 py-0.5 text-[9px] text-rose-640 bg-rose-50 hover:bg-rose-100 font-mono uppercase rounded font-bold cursor-pointer"
                              >
                                Del
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

            {invSubTab === "batch" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Batch-wise Stock Ledger</h3>
                  <p className="text-[11px] text-slate-400">Track drug manufacturing batch IDs, active compounds shelf life, and quarantine logs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  {inventory.map(item => {
                    const daysLeft = Math.round((new Date(item.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    return (
                      <div key={item.id} className="p-4 border border-slate-200 bg-white shadow-xs rounded-xl space-y-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-900">{item.name}</span>
                          <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px]">{item.batch}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          <div>EXPIRY DATE: {item.expiry}</div>
                          <div className={`mt-1 font-bold ${daysLeft < 90 ? "text-rose-605" : "text-emerald-700"}`}>
                            {daysLeft > 0 ? `${daysLeft} days until expiry` : "EXPIRED"}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                          <span>Ledger Stock: <strong>{item.stock}</strong></span>
                          <span>Reorder Limit: <strong>{item.reorderLevel}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {invSubTab === "rack" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Dispensary Rack Locations Index</h3>
                  <p className="text-[11px] text-slate-400">Configure pharmacy shelving coordinates, cold storage limits, and fast checkout drawers.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                        <th className="py-2.5 px-4">Compound</th>
                        <th className="py-2.5 px-4 font-mono">Rack Coordinate</th>
                        <th className="py-2.5 px-4">Cold-Chain Bound</th>
                        <th className="py-2.5 px-4">Category Section</th>
                        <th className="py-2.5 px-4">Stock Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {inventory.map(item => {
                        const isColdChain = item.category.toLowerCase().includes("chemo") || item.category.toLowerCase().includes("diabetic") || item.name.toLowerCase().includes("infusion") || item.name.toLowerCase().includes("injection");
                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                            <td className="py-3 px-4 font-mono text-blue-600 font-bold">{item.rack}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-black uppercase ${isColdChain ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-50 text-slate-400"}`}>
                                {isColdChain ? "2°C - 8°C Strict" : "Ambient Room"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{item.category}</td>
                            <td className="py-3 px-4 text-slate-800 font-mono font-bold">{item.stock} available</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {invSubTab === "reorder" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Automated Reorder Level Triggers</h3>
                  <p className="text-[11px] text-slate-400">List of stock keeping elements that fell below critical safety thresholds.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inventory.filter(i => i.stock <= i.reorderLevel).map(i => (
                    <div key={i.id} className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-amber-800 font-extrabold uppercase font-mono text-[9px] block">CRITICAL STOCK WARN</span>
                        <h4 className="text-xs font-bold text-slate-900 font-sans">{i.name}</h4>
                        <p className="text-[10px] text-slate-500">Generic: {i.generic} • Region: {i.rack}</p>
                        <div className="text-[11px] font-mono text-slate-800 pt-1">
                          Current Stock: <strong className="text-rose-650">{i.stock}</strong> units (Reorder point is <strong className="text-amber-700">{i.reorderLevel}</strong>)
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("procurement");
                          setProcSubTab("po_builder");
                          setSelectedSupplierId(suppliers[0]?.id || "");
                          setSuccessNotice(`Sourced PO system for replenishment: ${i.name}`);
                        }}
                        className="p-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[9px] font-extrabold uppercase rounded-lg"
                      >
                        Source PO
                      </button>
                    </div>
                  ))}
                  {inventory.filter(i => i.stock <= i.reorderLevel).length === 0 && (
                    <div className="col-span-2 py-8 text-center text-slate-400 italic">No formulation records are below reorder minimum limits today.</div>
                  )}
                </div>
              </div>
            )}

            {invSubTab === "expiry" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Expiry Forecast Dashboard</h3>
                  <p className="text-[11px] text-slate-400">Monthly forecasting predictions regarding soon-to-expire batch inventories.</p>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex gap-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Critical (0-3 Months)</span>
                      <strong className="text-lg font-black text-rose-600 font-mono">
                        {inventory.filter(i => {
                          const days = Math.round((new Date(i.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                          return days > 0 && days <= 90;
                        }).length} compounds
                      </strong>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Medium (3-12 Months)</span>
                      <strong className="text-lg font-black text-amber-600 font-mono">
                        {inventory.filter(i => {
                          const days = Math.round((new Date(i.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                          return days > 90 && days <= 365;
                        }).length} compounds
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Upcoming Expirations Detail</span>
                    {inventory.map(i => {
                      const days = Math.round((new Date(i.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      if (days > 365) return null;
                      return (
                        <div key={i.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-slate-800">{i.name}</strong>
                            <span className="text-[10px] font-mono text-slate-400 ml-2">[{i.id}, Batch {i.batch}]</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${days < 90 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                            {i.expiry} ({days} days)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* =====================================================================
           II. PROCUREMENT SECTION 
           ===================================================================== */}
        {activeTab === "procurement" && (
          <div className="space-y-6">
            
            {/* Inner Sub-navigation for Procurement ERP */}
            <div className="flex gap-2.5 pb-2 border-b border-slate-100 text-[11px] font-mono no-scrollbar">
              {[
                { sub: "po_builder", label: "Procurement PO Compiler" },
                { sub: "pos_list", label: "Goods Receipt Notes (GRN)" },
                { sub: "suppliers_list", label: "Supplier Ledger & Credit" },
                { sub: "vendor_compare", label: "Vendor Bid Comparison" }
              ].map(opt => (
                <button
                  key={opt.sub}
                  onClick={() => setProcSubTab(opt.sub as any)}
                  className={`py-1 px-3 rounded-lg font-bold transition ${procSubTab === opt.sub ? "bg-slate-900 text-white" : "bg-slate-50 hover:bg-slate-100 text-slate-600"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {procSubTab === "po_builder" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Replenishment Order Builder</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Draft trade procurement POs to bulk wholesalers. Inventory increments upon Goods Receipt stock-in.</p>
                  </div>

                  <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Select Wholesaler Distributor:</label>
                        <select
                          value={selectedSupplierId}
                          onChange={(e) => setSelectedSupplierId(e.target.value)}
                          className="w-full bg-white border border-slate-220 p-2 rounded outline-none font-medium text-slate-800"
                        >
                          <option value="">-- Choose Trade Wholesaler --</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name} (Credit: ₹{s.balance.toFixed(0)})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Sift Medicine Brand:</label>
                        <select
                          value={selectedPoDrugIdx}
                          onChange={(e) => setSelectedPoDrugIdx(Number(e.target.value))}
                          className="w-full bg-white border border-slate-220 p-2 rounded outline-none font-medium text-slate-800"
                        >
                          {inventory.map((item, idx) => (
                            <option key={item.id} value={idx}>{item.name} [Stock: {item.stock}, cost: ₹{item.purchasePrice}]</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block text-[10px] uppercase font-mono">Procurement Quantity:</label>
                        <input
                          type="number"
                          value={poLineQty}
                          onChange={(e) => setPoLineQty(Number(e.target.value))}
                          className="bg-white border border-slate-220 rounded p-1.5 font-mono font-bold w-32 text-xs text-slate-800"
                          min={1}
                        />
                      </div>
                      
                      <button
                        onClick={handleAddLineToPO}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-mono font-black text-[10px] uppercase rounded-lg"
                      >
                        Add to Invoice PO
                      </button>
                    </div>
                  </div>

                  {/* Lines item list */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Draft PO line-items:</span>
                    <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                      <div className="grid grid-cols-4 font-mono font-bold uppercase bg-slate-100 p-2 text-[9px] text-slate-350 border-b border-slate-205">
                        <span>Brand</span>
                        <span>Unit cost</span>
                        <span>Quantity</span>
                        <span className="text-right">Line value</span>
                      </div>
                      {poLines.map((line, idx) => (
                        <div key={idx} className="grid grid-cols-4 p-2.5 font-serif border-b border-slate-50 hover:bg-slate-50/50 text-slate-800">
                          <span className="font-sans font-bold text-slate-905">{line.name}</span>
                          <span className="font-mono text-slate-505">₹{line.cost}</span>
                          <span className="font-mono text-slate-505">{line.quantity} units</span>
                          <span className="font-mono text-right text-slate-900 font-extrabold">₹{(line.cost * line.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      {poLines.length === 0 && (
                        <div className="p-8 text-center text-slate-400 italic">No wholesale compounds added to procurement bill yet.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50/50 border border-slate-150 p-5 rounded-xl space-y-4 text-xs font-sans">
                    <h3 className="font-black uppercase tracking-wide text-slate-900 text-[11px] flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-600" /> Procurement Summary
                    </h3>
                    <p className="text-[11px] text-slate-500">Drafted purchase orders require physical receipt in Goods Section (GRN) to update physical stocks.</p>

                    <div className="space-y-1 text-[11px] font-mono leading-relaxed bg-white p-3 border border-slate-100 rounded">
                      <div className="flex justify-between">
                        <span>Wholesaler:</span>
                        <span className="font-bold text-slate-800 truncate max-w-32">{suppliers.find(s => s.id === selectedSupplierId)?.name || 'None selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Draft lines:</span>
                        <span className="font-bold text-slate-880">{poLines.length} compounds</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                        <strong className="text-slate-900">PO Bulk Value:</strong>
                        <strong className="text-indigo-600">₹{poLines.reduce((acc, c) => acc + (c.cost * c.quantity), 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <button
                      onClick={handleFinalizePO}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-black uppercase rounded-lg transition"
                    >
                      Draft Procurement PO
                    </button>
                  </div>
                </div>
              </div>
            )}

            {procSubTab === "pos_list" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Goods Receipt Notes (GRN) & PO Registry</h3>
                  <p className="text-[11px] text-slate-400">Receive wholesale supplier delivery packages, check bills, and post stocks-in.</p>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                        <th className="py-2 px-4">PO Code</th>
                        <th className="py-2 px-4">Distributor Distributor</th>
                        <th className="py-2 px-4">Draft Date</th>
                        <th className="py-2 px-4">Compounding lines count</th>
                        <th className="py-2 px-4">Total wholesale Value</th>
                        <th className="py-2 px-4">Trade Status</th>
                        <th className="py-2 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {purchaseOrders.map(po => (
                        <tr key={po.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">{po.id}</td>
                          <td className="py-3 px-4 text-slate-950 font-bold">{po.supplierName}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-550">{po.date}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{po.items.length} items</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-950">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase ${po.status === "Received" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-100 text-amber-705 border border-amber-50"}`}>
                              {po.status === "Received" ? "GRN Settle (Received)" : "Transit / Created"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {po.status === "Created" ? (
                              <button
                                onClick={() => handleReceiveStock(po.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] uppercase font-extrabold rounded cursor-pointer shadow-sm"
                              >
                                Goods Stock-In (GRN)
                              </button>
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">Settled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {purchaseOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic">No procurement purchase orders on index records yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {procSubTab === "suppliers_list" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Wholesale Suppliers Directory</h3>
                    <p className="text-[11px] text-slate-400">Manage wholesaler connections, active trading licenses, and outstanding credit balances.</p>
                  </div>
                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold rounded-lg flex items-center gap-1.5 uppercase cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Bind Wholesaler
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4 font-sans">Business Agency Name</th>
                        <th className="py-3 px-4 font-mono">Contact Coordinates</th>
                        <th className="py-3 px-4 font-mono">Tax Ident (GSTIN)</th>
                        <th className="py-3 px-4">Pending Credit Balance</th>
                        <th className="py-3 px-4 text-right">Debit Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-700">
                      {suppliers.map(sup => (
                        <tr key={sup.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 font-mono text-slate-400">{sup.id}</td>
                          <td className="py-3 px-4 font-bold text-slate-950 font-sans">{sup.name}</td>
                          <td className="py-3 px-4 font-mono text-slate-550 leading-normal">
                            {sup.contact}<br />
                            <span className="text-[10px] text-slate-400 italic">{sup.email}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-500 uppercase">{sup.gstin}</td>
                          <td className="py-3 px-4 font-sans">
                            <span className={`px-2.5 py-0.5 rounded font-extrabold text-[11px] ${sup.balance > 0 ? "bg-amber-50 text-amber-705 border border-amber-100" : "bg-slate-50 text-slate-500"}`}>
                              ₹{sup.balance.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono flex items-center justify-end gap-2 text-slate-900 font-black">
                            <input
                              type="number"
                              placeholder="Settlement ₹"
                              value={payAmount[sup.id] || ""}
                              onChange={(e) => setPayAmount({ ...payAmount, [sup.id]: Number(e.target.value) })}
                              className="w-20 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs p-1 text-slate-805"
                            />
                            <button
                              onClick={() => handleSettleSupplierBalance(sup.id)}
                              className="p-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition shadow-sm"
                            >
                              Settle Account
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {procSubTab === "vendor_compare" && (
              <div className="space-y-4 font-sans text-xs">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Vendor Bid Comparison Matrix</h3>
                  <p className="text-[11px] text-slate-400">Compare wholesale fill rates, standard cash discount ranges, and outstanding payment covenants.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-extrabold">PRIME BIDDER (Fill Rate: 96%)</span>
                    <h4 className="font-bold text-slate-900">Apex Pharmaceutical Wholesalers</h4>
                    <p className="text-[11px] text-slate-500">Fast delivery within general hours. Cash discount of 15% offered on drug receipts settled within 10 trade days.</p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <span className="text-[9px] font-mono uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-extrabold">SECONDARY BIDDER (Fill Rate: 92%)</span>
                    <h4 className="font-bold text-slate-900">Astra Biotech Distribution</h4>
                    <p className="text-[11px] text-slate-500">Oncology specialized supplier. Offers cold-chain transport configurations. Cash discount baseline 12% on regular bulk POs.</p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-extrabold">BACKUP BIDDER (Fill Rate: 84%)</span>
                    <h4 className="font-bold text-slate-900">Vedic Herbal & Formulations</h4>
                    <p className="text-[11px] text-slate-500">General tablets backup. Long shipping window but offers loose payment credit loops extending up to 45 commercial days.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* =====================================================================
           III. RETURNS LEDGER SECTION 
           ===================================================================== */}
        {activeTab === "returns_ledger" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1 space-y-4 text-xs font-sans">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Post Refund Transaction</h3>
                  <p className="text-[11px] text-slate-400">Audit sales refunds, register damaged inventory write-offs, or record wholesale procure returns.</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Return Transaction Nature:</label>
                    <select
                      value={rtType}
                      onChange={(e) => setRtType(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-200 rounded outline-none font-medium text-slate-800"
                    >
                      <option value="Sales Rent">Sales Rent (Patient refund)</option>
                      <option value="Purchase Return">Purchase Return (Wholesale exit)</option>
                      <option value="Damaged Stock">Damaged Stock (Write-off loss)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Sift formulation drug:</label>
                    <select
                      value={rtItemIdx}
                      onChange={(e) => setRtItemIdx(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded outline-none font-medium text-slate-800"
                    >
                      {inventory.map((item, idx) => (
                        <option key={item.id} value={idx}>{item.name} [Available stock: {item.stock}]</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Units Quantity:</label>
                      <input
                        type="number"
                        min={1}
                        value={rtQty}
                        onChange={(e) => setRtQty(Math.max(1, Number(e.target.value)))}
                        className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-center text-slate-800 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Customer/Agency:</label>
                      <input
                        type="text"
                        placeholder="Name of entity"
                        value={rtEntity}
                        onChange={(e) => setRtEntity(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-slate-805 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Explicit Reason (Clinical/Tax Audit Justification):</label>
                    <textarea
                      placeholder="Comment..."
                      value={rtReason}
                      onChange={(e) => setRtReason(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded font-sans text-xs outline-none h-18 text-slate-800"
                    />
                  </div>

                  <button
                    onClick={handleRegisterReturn}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10.5px] font-black uppercase rounded-lg transition"
                  >
                    Post Refund Transaction
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Returns & Demaged Stocks registers</h3>
                  <p className="text-[11px] text-slate-400">Complete list of financial refunds, broken/expired write-offs ledger indexes.</p>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                        <th className="py-2.5 px-4 font-mono">ReferenceID</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Entity/Client Name</th>
                        <th className="py-2.5 px-4">Medicine Item</th>
                        <th className="py-2.5 px-4 font-mono">Quantity</th>
                        <th className="py-2.5 px-4">Refund posted Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {returns.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-2.5 px-4 font-mono text-slate-400">{rec.id}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase ${rec.type === "Sales Rent" ? "bg-blue-50 text-blue-700 border border-blue-100" : (rec.type === "Purchase Return" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700")}`}>
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500 text-[10px]">{rec.date}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{rec.entityName}</td>
                          <td className="py-2.5 px-4 text-slate-600">{rec.itemName}</td>
                          <td className="py-2.5 px-4 font-mono">{rec.quantity} units</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">₹{rec.refundAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      {returns.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic">No reverse refund transactions processed yet.</td>
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
           IV. BUSINESS ANALYTICS SECTION 
           ===================================================================== */}
        {activeTab === "business_analytics" && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-404 block">Dynamic retail turners</span>
                <span className="text-xl font-black text-blue-600 font-mono">₹{totalBillsVal.toLocaleString('en-IN')}</span>
                <div className="text-[9px] text-slate-450 uppercase font-bold">• Compiled via POS Cash drawers</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-404 block">Net retail Margin</span>
                <span className="text-xl font-black text-emerald-600 font-mono">₹{(totalBillsVal * 0.38).toFixed(0).toLocaleString()}</span>
                <span className="text-[9px] block text-slate-500">Average Profit margin: ~38%</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-404 block">Dispensary safety Stockout Level</span>
                <span className="text-xl font-black text-emerald-700 font-mono">₹2,84,000</span>
                <span className="text-[9px] block text-slate-500">Wholesale goods locked asset Value</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-404 block">Class A items ratio</span>
                <span className="text-xl font-black text-indigo-700 font-mono">74%</span>
                <span className="text-[9px] block text-slate-500">ABC revenue concentration</span>
              </div>

            </div>

            {/* Simulated Sales and Margins Graphs/Toggles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              
              <div className="lg:col-span-2 space-y-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                <h4 className="text-sm font-black text-slate-900 uppercase">ABC Classification & Margin Projections</h4>
                
                <div className="space-y-4 pt-1">
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-indigo-700">Class A (High Margin / 74% turnover): Augmentin, Insulin</span>
                      <span>₹{Math.round(totalBillsVal * 0.74).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: "74%" }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-amber-700">Class B (Moderate Margin / 18% turnover): Albuterol, Clopidogrel</span>
                      <span>₹{Math.round(totalBillsVal * 0.18).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: "18%" }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-rose-700">Class C (Stagnant Margin / 8% turnover): Bortezomib infusion</span>
                      <span>₹{Math.round(totalBillsVal * 0.08).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: "8%" }}></div>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-between gap-4 text-[10px] uppercase font-bold text-slate-500">
                  <div className="leading-snug">
                    <strong className="text-emerald-700 block text-xs">FAST-MOVING MEDICINES</strong>
                    • Augmentin, Pantoprazole, Paracetamol
                  </div>
                  <div className="leading-snug">
                    <strong className="text-rose-650 block text-xs">SLOW-MOVING MEDICINES</strong>
                    • Bortezomib critical injection, Prednisone
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 font-sans">Corporate Discharge Retention Compass</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Pre-pack outpatients medicines inside their diagnosis wards to recover other-side leakage. Simulate discount promo match impacts below.
                  </p>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3 font-sans text-xs">
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-700 font-bold">
                        <span>Apothecary Discount Match</span>
                        <strong className="text-indigo-650 font-mono">{matchDiscountPercent}% discount</strong>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={25}
                        step={1}
                        value={matchDiscountPercent}
                        onChange={(e) => setMatchDiscountPercent(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-700 font-bold">
                        <span>Intake Waiting Reduction</span>
                        <strong className="text-indigo-650 font-mono">-{waitingReductionMinutes} mins</strong>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={30}
                        step={1}
                        value={waitingReductionMinutes}
                        onChange={(e) => setWaitingReductionMinutes(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-700 font-bold">
                        <span>Bed discharge Speedup</span>
                        <strong className="text-indigo-650 font-mono">+{bedClearanceSpeedup}h speedup</strong>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={1}
                        value={bedClearanceSpeedup}
                        onChange={(e) => setBedClearanceSpeedup(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Overall Simulated Retention Recovered</span>
                      <strong className="text-emerald-700 font-mono text-sm block font-black">+₹{simulatedLeakageSaved.toLocaleString('en-IN')} / year predicted</strong>
                    </div>

                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =====================================================================
           V. AI FORESIGHT SECTION 
           ===================================================================== */}
        {activeTab === "ai_foresight" && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50/50 border border-blue-150 rounded-2xl flex items-start gap-4">
              <BrainCircuit className="w-8 h-8 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black">AI PREDICTIVE OUTCOMES (Monsoon Forecast)</span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">Gaining foresight on formulary stockpiles</h4>
                <p className="text-slate-600 font-sans leading-relaxed mt-0.5">
                  Vigilor AI dynamically matches upcoming geographic weather patterns against historical diagnosis logs (e.g. wet rainfalls on set 90 days from now). We project respiratory and anti-allergenic requirements to jump as much as +45% starting next month.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-800">
              
              <div className="p-5 border border-slate-200 rounded-2xl space-y-3.5 bg-white shadow-xs">
                <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-extrabold uppercase">FORMULARY STOCK OPTIMIZATION</span>
                <h4 className="font-bold text-slate-900 text-sm">Automated Safety Level Recommendations</h4>
                
                <div className="space-y-2 font-mono text-[11px] leading-snug">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded flex justify-between">
                    <span>Augmentin standard safety multiplier:</span>
                    <strong className="text-emerald-700">Recommend Increase (Safety +200 units)</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded flex justify-between">
                    <span>Albuterol Bronchodilators safety:</span>
                    <strong className="text-emerald-700">Recommend doubling par to 40</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded flex justify-between">
                    <span>Stagnant Bortezomib allocations:</span>
                    <strong className="text-slate-500">Maintain baseline (Limit surplus PO blocks)</strong>
                  </div>
                </div>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl space-y-3.5 bg-white shadow-xs">
                <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-extrabold uppercase">GENERIC SUBSTITUTE ADOPTION OUTCOMES</span>
                <h4 className="font-bold text-slate-900 text-sm">Substitution margins tracking</h4>
                
                <p className="font-sans leading-relaxed text-slate-600">
                  By recommending medical alternatives (like replacing branded Clopidogrel with generic Clopidogrel Bisulfate), average client check-out cost decreases by 28% while improving pharmacy gross margins by 4.8%.
                </p>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-mono">
                  <span>Standard generic uptake: <strong>81.5%</strong></span>
                  <span className="text-emerald-700 font-extrabold">+12.4% adoption QoQ</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =====================================================================
           VI. COMPLIANCE & AUDIT SECTION 
           ===================================================================== */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
              
              <div className="lg:col-span-1 p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase">Regulatory Clearance Indicator</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">License numbers, psychotropic vault clearance benchmarks.</p>
                </div>

                <div className="space-y-3 font-mono text-[11px] leading-relaxed bg-white p-3 border border-slate-150 rounded-xl shadow-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span>Narcotic Vault Dual-sign:</span>
                    <strong className="text-emerald-700">✓ SECURED (Active)</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Schedule H Records Index:</span>
                    <strong className="text-emerald-700">✓ ACTIVE AUDITED</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Retail licensing (Form 20/21):</span>
                    <strong className="text-slate-900">UP TO DATE (Valid 2028)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>NDPS clearance checklist:</span>
                    <strong className="text-emerald-700">✓ RACK LOCK MATCHED</strong>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg leading-relaxed text-[11px] font-sans">
                  <strong>NDPS restricted vault warning:</strong> All narcotics, antiarrhythmics, or specialty infusions must have patient MRN registered and signed by an approved Chief Pharmacist at checkout.
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Interactive System Auditing Index</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Search logs by operator, category, stamp, or database changes.</p>
                  </div>
                  <div className="relative text-xs w-full sm:w-auto">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search audit trail..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-1.5 pl-8 font-medium w-full sm:w-48 outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="sticky top-0 bg-slate-10">
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold py-2">
                        <th className="py-2.5 px-4 font-mono">Audit ID</th>
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Operator</th>
                        <th className="py-2.5 px-4 font-sans">Audit category</th>
                        <th className="py-2.5 px-4">Action Registered Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-650">
                      {auditLogs.filter(log => log.action.toLowerCase().includes(auditSearchQuery.toLowerCase())).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 text-slate-400 font-bold">{log.id}</td>
                          <td className="py-2.5 px-4 text-slate-500 font-medium text-[10px] whitespace-nowrap">{log.timestamp.slice(0, 16).replace("T", " ")}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{log.userRole}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">{log.category}</span>
                          </td>
                          <td className="py-2.5 px-4 font-sans text-slate-800 leading-snug">{log.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* =====================================================================
         MODAL: Sift/Register New Compound
         ===================================================================== */}
      {showAddInvModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up text-xs font-sans text-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded font-bold">
                  SIFT FORMULATION REGISTER INDEX
                </span>
                <h4 className="text-base font-black text-slate-900 mt-2 font-sans tracking-tight">Create New Medicine Compound</h4>
              </div>
              <button onClick={() => setShowAddInvModal(false)} className="text-slate-400 hover:text-slate-900 font-bold text-sm bg-slate-100 px-2 py-0.5 rounded-full">×</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Brand Name Reference:</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 650mg"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Generic Formula (Therapeutic Group):</label>
                <input
                  type="text"
                  placeholder="e.g. Acetaminophen"
                  value={newGeneric}
                  onChange={(e) => setNewGeneric(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category Section Classifier:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 p-2 rounded text-xs text-slate-808 font-bold"
                >
                  <option value="Analgesic">Analgesic (Pain reliever)</option>
                  <option value="Proton Pump Inhibitor">Proton Pump Inhibitor</option>
                  <option value="Antiarrhythmic">Antiarrhythmic (Cardiac CCU)</option>
                  <option value="Emergency Vaso">Emergency Vasodilator/Pressor</option>
                  <option value="Macrolide Antibiotic">Macrolide Antibiotic</option>
                  <option value="Bronchodilator">Bronchodilator (Asthma)</option>
                  <option value="Oncology Chemo">Oncology Chemo (Specialized)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Active Batch Code:</label>
                <input
                  type="text"
                  value={newBatch}
                  onChange={(e) => setNewBatch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-808"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Manufacturing Expiry (YYYY-MM-DD):</label>
                <input
                  type="text"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-808"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Maximum Retail Price (MRP ₹):</label>
                <input
                  type="number"
                  value={newMRP}
                  onChange={(e) => setNewMRP(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-808"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 col-span-1 sm:col-span-2 border-t pt-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Wholesale Purchase Cost (₹):</label>
                  <input
                    type="number"
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-808"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Retail Sale price (₹):</label>
                  <input
                    type="number"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-808"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Rack Coordinate Shelving:</label>
                <input
                  type="text"
                  value={newRack}
                  onChange={(e) => setNewRack(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-808"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Safety Stock Limit (Reorder boundary):</label>
                <input
                  type="number"
                  value={newReorderLevel}
                  onChange={(e) => setNewReorderLevel(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-808"
                />
              </div>

              <div className="space-y-1 col-span-1 sm:col-span-2">
                <label className="font-bold text-slate-700">Initial Quantity Sift-In:</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono font-bold text-slate-808"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 font-mono uppercase font-black">
              <button onClick={() => setShowAddInvModal(false)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded">Cancel Form</button>
              <button onClick={handleCreateMedicine} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded">Draft Sift Compound</button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
         MODAL: Bind New Wholesaler
         ===================================================================== */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up text-xs font-sans text-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded font-bold">
                  REGISTER COMMERCIAL SUPPLY CHANNELS
                </span>
                <h4 className="text-base font-black text-slate-900 mt-2 font-sans tracking-tight">Bind New Supplier Wholesaler</h4>
              </div>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-slate-900 font-bold text-sm bg-slate-100 px-2 py-0.5 rounded-full">×</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Supplier Enterprise Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Biotech Agencies Ltd"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-808 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Primary Contact Coordinate (Phone/Mobile):</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9988776655"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-808"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Official Communication Email:</label>
                <input
                  type="email"
                  placeholder="e.g. partner@metrobiotech.com"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-808"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">State GSTIN identifier (Tax identity):</label>
                <input
                  type="text"
                  value={supGSTIN}
                  onChange={(e) => setSupGSTIN(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-802 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Starting Pending outstanding credit balance (Debit ₹):</label>
                <input
                  type="number"
                  value={supBalance}
                  onChange={(e) => setSupBalance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono font-bold text-slate-802"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 font-mono uppercase font-black">
              <button onClick={() => setShowAddSupplierModal(false)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded">Cancel</button>
              <button onClick={handleCreateSupplier} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded">Bind Distributor</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
