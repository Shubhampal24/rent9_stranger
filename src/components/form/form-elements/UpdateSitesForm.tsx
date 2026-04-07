/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Building2, Users, FileText, Landmark, ChevronDown, ChevronUp, X, RefreshCw, ArrowLeft, Save, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import Label from "../Label";
import Input from "../input/InputField";
import Select from "../Select";
import { ChevronDownIcon } from "../../../icons";
import OwnerModal from "../../owners/OwnerModal";
import ConsumerSelect from "../../consumers/ConsumerSelect";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Centre { _id: string; name: string; shortCode?: string; }
interface BankAccount { _id: string; accountHolder: string; accountNo: string; bankName: string; ifsc: string; branchName?: string; }
interface Owner { _id: string; ownerName: string; mobileNo: string; bankAccounts: BankAccount[]; }

interface ElectricityConsumer {
  _id?: string;
  consumerNo: string;
  consumerName: string;
  electricityProvider: string;
}

interface OwnerAssignment {
  _id?: string; // The assignment ID from backend
  ownerId: string;
  ownerName: string;          // display only
  ownershipPercentage: number | "";
  ownerMonthlyRent: number | "";
  bankMode: "existing" | "new";
  selectedBankAccountId: string;
  newBank: { accountHolder: string; accountNo: string; bankName: string; ifsc: string; branchName: string; details: string; };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" });

const PROPERTY_TYPES = [
  { value: "commercial", label: "Commercial" },
  { value: "residential", label: "Residential" },
  { value: "industrial", label: "Industrial" },
  { value: "retail", label: "Retail" },
];
const STATUS_OPTS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];
const RENT_TYPE_OPTS = [
  { value: "fixed", label: "Fixed" },
  { value: "variable", label: "Variable" },
  { value: "escalation", label: "Escalation" },
];

function parseJwt(token: string) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

const EMPTY_NEW_BANK = { accountHolder: "", accountNo: "", bankName: "", ifsc: "", branchName: "", details: "" };

const INITIAL_FORM = {
  centreId: "", code: "", siteName: "", propertyType: "", propertyLocation: "", propertyAddress: "", city: "", pincode: "",
  areaSize: "", unit: "", glocationLink: "", websiteLink: "", gdriveLink: "", siteMobileNo: "", tenantName: "",
  tenantAddress: "", tenantMobileNo: "", tenantEmail: "", agreementDate: "", agreementExpiring: "", agreementYears: "",
  rentStartDate: "", fitoutTime: "", rentType: "", monthlyRent: "", increasedRent: "", deposit: "",
  yearlyEscalationPercentage: "", escalationPercentage: "", maintenanceCharges: "", municipalTax: "", cmaCharges: "",
  gstCharges: "", waterCharges: "", msebDeposit: "", agentDetails: "", agentCost: "", managedBy: "", authorisedBy: "",
  authorisedPersonCommission: "", paymentDay: "", status: "active",
};

// ─── Section header helper ────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between pb-3 mb-4 border-b border-gray-100 dark:border-white/[0.05]">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ─── Main Component: Site Edit Form ───────────────────────────────────────────
export default function UpdateSitesForm() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Centres & Owners for pickers
  const [centres, setCentres] = useState<Centre[]>([]);
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [isNewOwnerModalOpen, setIsNewOwnerModalOpen] = useState(false);
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");

  // Form State
  const [form, setForm] = useState(INITIAL_FORM as any);

  const [assignments, setAssignments] = useState<OwnerAssignment[]>([]);
  const [expandedAssign, setExpandedAssign] = useState<boolean[]>([]);
  const [removedOwnerIds, setRemovedOwnerIds] = useState<string[]>([]);

  const [electricityConsumerIds, setElectricityConsumerIds] = useState<string[]>([]);
  const [initialConsumerIds, setInitialConsumerIds] = useState<string[]>([]);
  const [allConsumers, setAllConsumers] = useState<any[]>([]);

  // ── Fetch Initial Data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const siteId = params.id;
      // 1. Fetch Centres
      const token = localStorage.getItem("token");
      const payload = token ? parseJwt(token) : null;
      const userId = payload?._id || payload?.id;
      if (userId) {
        const uRes = await fetch(`${API}/api/users/${userId}`, { headers: authHeaders() });
        const uJson = await uRes.json();
        const user = uJson.data || uJson;
        setCentres((user.centreIds || []).map((c: any) => typeof c === "object" ? { _id: c._id, name: c.name, shortCode: c.shortCode } : { _id: c, name: c }));
      }

      // 2. Fetch Owners and Consumers
      await Promise.all([fetchOwners(), fetchConsumers()]);

      // 3. Fetch Site Details
      const sRes = await fetch(`${API}/api/rent/sites/${siteId}`, { headers: authHeaders() });
      const sJson = await sRes.json();
      const siteData = sJson.data || sJson;

      // Map site core fields
      const newForm: any = { ...INITIAL_FORM };
      Object.keys(INITIAL_FORM).forEach(k => {
        if (siteData[k] !== undefined) {
           if (k.toLowerCase().includes("date") && siteData[k]) {
             newForm[k] = siteData[k].split("T")[0];
           } else {
             newForm[k] = siteData[k] === null ? "" : siteData[k];
           }
        }
      });
      if (siteData.centreId?._id) newForm.centreId = siteData.centreId._id;
      setForm(newForm);

      // Map Owners
      if (siteData.owners) {
        const mappedOwners: OwnerAssignment[] = siteData.owners.map((o: any) => ({
          _id: o._id,
          ownerId: o.ownerId?._id || o.ownerId,
          ownerName: o.ownerId?.ownerName || "Unknown",
          ownershipPercentage: o.ownershipPercentage,
          ownerMonthlyRent: o.ownerMonthlyRent,
          bankMode: "existing",
          selectedBankAccountId: "", // We'll just show existing bank info if needed, but for edit we might need to pick again
          newBank: {
            accountHolder: o.accountHolder || "",
            accountNo: o.accountNo || "",
            bankName: o.bankName || "",
            ifsc: o.ifsc || "",
            branchName: o.branchName || "",
            details: ""
          }
        }));
        setAssignments(mappedOwners);
        setExpandedAssign(mappedOwners.map(() => false));
      }

      // Map Consumers
      if (siteData.electricityConsumers) {
        const ids = siteData.electricityConsumers.map((c: any) => c._id);
        setElectricityConsumerIds(ids);
        setInitialConsumerIds(ids);
      }

    } catch (err) {
      toast.error("Failed to load site data");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchOwners = async () => {
    try {
      const oRes = await fetch(`${API}/api/rent/owners/?page=1&limit=250`, { headers: authHeaders() });
      const oJson = await oRes.json();
      setAllOwners(oJson.data ?? []);
    } catch (e) {
      console.error("Failed to fetch owners", e);
    }
  };

  const fetchConsumers = async () => {
    try {
      const cRes = await fetch(`${API}/api/rent/siteConsumer/all?page=1&limit=250`, { headers: authHeaders() });
      const cJson = await cRes.json();
      setAllConsumers(cJson.data || cJson || []);
    } catch (e) {
      console.error("Failed to fetch consumers", e);
    }
  };

  useEffect(() => { if (params.id) fetchData(); }, [params.id, fetchData]);

  // ── Form Handlers ───────────────────────────────────────────────────────────
  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, [field]: e.target.value }));
  const setSelect = (field: string) => (value: string) => setForm((p: any) => ({ ...p, [field]: value }));

  // Owners
  const addOwnerAssignment = (owner: Owner) => {
    if (assignments.find(a => a.ownerId === owner._id)) { toast.error("Owner already added"); return; }
    const newA: OwnerAssignment = {
      ownerId: owner._id,
      ownerName: owner.ownerName,
      ownershipPercentage: "",
      ownerMonthlyRent: "",
      bankMode: owner.bankAccounts?.length ? "existing" : "new",
      selectedBankAccountId: owner.bankAccounts?.[0]?._id ?? "",
      newBank: { ...EMPTY_NEW_BANK }
    };
    setAssignments(p => [...p, newA]);
    setExpandedAssign(p => [...p, true]);
    setOwnerPickerOpen(false);
  };

  const removeAssignment = (idx: number) => {
    const target = assignments[idx];
    if (target._id) setRemovedOwnerIds(p => [...p, target._id!]);
    setAssignments(p => p.filter((_, i) => i !== idx));
    setExpandedAssign(p => p.filter((_, i) => i !== idx));
  };

  const updateAssignment = (idx: number, field: keyof OwnerAssignment, value: any) => {
    setAssignments(p => { const c = [...p]; c[idx] = { ...c[idx], [field]: value }; return c; });
  };

  // Consumers logic managed by ConsumerSelect
  const handleConsumerChange = (ids: string[]) => {
    setElectricityConsumerIds(ids);
  };

  const totalPct = assignments.reduce((sum, a) => sum + (Number(a.ownershipPercentage) || 0), 0);

  // ── SUBMIT ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPct > 100) { toast.error("Total ownership exceeds 100%"); return; }
    setSubmitting(true);

    try {
      const siteId = params.id;
      // 1. Update Site Core
      const sitePayload: any = {};
      Object.entries(form).forEach(([k, v]) => { if (v !== "") sitePayload[k] = v; });
      const siteRes = await fetch(`${API}/api/rent/sites/${siteId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(sitePayload)
      });
      if (!siteRes.ok) throw new Error("Failed to update site info");

      // 2. Handle Owners
      // Delete removed
      for (const id of removedOwnerIds) {
        await fetch(`${API}/api/rent/owners/site-owner/${id}`, { method: "DELETE", headers: authHeaders() });
      }
      // Update or Add
      for (const a of assignments) {
        const payload: any = { siteId, ownerId: a.ownerId, ownershipPercentage: Number(a.ownershipPercentage), ownerMonthlyRent: Number(a.ownerMonthlyRent) };
        if (a.bankMode === "new") Object.assign(payload, a.newBank);
        else if (a.selectedBankAccountId) {
          const owner = allOwners.find(o => o._id === a.ownerId);
          const bank = owner?.bankAccounts?.find(b => b._id === a.selectedBankAccountId);
          if (bank) {
             payload.accountHolder = bank.accountHolder; payload.accountNo = bank.accountNo;
             payload.bankName = bank.bankName; payload.ifsc = bank.ifsc; payload.branchName = bank.branchName;
          }
        } else {
          // Keep existing if no change
          Object.assign(payload, a.newBank);
        }

        if (a._id) {
          // Update existing assignment
          await fetch(`${API}/api/rent/owners/site-owner/${a._id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
        } else {
          // Create new assignment
          await fetch(`${API}/api/rent/owners/site-owner/assign`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
        }
      }

      // 3. Handle Consumers
      // Find added and removed
      const addedConsumerIds = electricityConsumerIds.filter(id => !initialConsumerIds.includes(id));
      const removedConsumerIds = initialConsumerIds.filter(id => !electricityConsumerIds.includes(id));

      // Assign added
      for (const consumerId of addedConsumerIds) {
        await fetch(`${API}/api/rent/siteConsumer/assign`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ siteId, consumerId })
        });
      }
      // Remove removed
      for (const consumerId of removedConsumerIds) {
        await fetch(`${API}/api/rent/siteConsumer/remove`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ siteId, consumerId })
        });
      }

      toast.success("Site updated successfully!");
      router.push(`/sites/${siteId}`);
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle new owner created in modal ──────────────────────────────────────
  const handleNewOwnerSaved = async (formData: any) => {
    try {
      // 1. Create Owner Profile (Basic info + first bank)
      const res = await fetch(`${API}/api/rent/owners/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ownerName: formData.ownerName,
          mobileNo: formData.mobileNo,
          ownerDetails: formData.ownerDetails,
          ...(formData.bankAccounts?.[0] || {})
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create owner profile");
      }

      const savedResponse = await res.json();
      const ownerId = savedResponse.data?._id;

      // 2. Add extra bank accounts if any
      if (ownerId && formData.bankAccounts && formData.bankAccounts.length > 1) {
        for (let i = 1; i < formData.bankAccounts.length; i++) {
          const bank = formData.bankAccounts[i];
          await fetch(`${API}/api/rent/owners/${ownerId}/bank-accounts`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              accountHolder: bank.accountHolder,
              accountNo: bank.accountNo,
              bankName: bank.bankName,
              ifsc: bank.ifsc,
              branchName: bank.branchName,
              details: bank.details,
            }),
          });
        }
      }

      // 3. Refresh owner list
      await fetchOwners();
      
      toast.success("Owner created and selected!");
      
      const newOwnerObj: Owner = {
        _id: ownerId,
        ownerName: formData.ownerName,
        mobileNo: formData.mobileNo,
        bankAccounts: formData.bankAccounts || []
      };
      
      addOwnerAssignment(newOwnerObj);

    } catch (err: any) {
      toast.error(err.message || "Something went wrong creating owner");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading site for edit...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Cancel Edit</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">Edit Site: {form.siteName}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section: Metadata & Links ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Building2} title="Site Metadata & Links" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="sm:col-span-2">
               <Label>Centre *</Label>
               <div className="relative">
                 <select value={form.centreId} onChange={(e) => setForm((p: any) => ({ ...p, centreId: e.target.value }))} required className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white appearance-none pr-8">
                   <option value="">Select Centre</option>
                   {centres.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                 </select>
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
               </div>
             </div>
             <Field label="Site Code"><Input value={form.code} onChange={setField("code")} /></Field>
             <Field label="Site Name *"><Input value={form.siteName} onChange={setField("siteName")} required /></Field>
             <Field label="Site Mobile No."><Input value={form.siteMobileNo} onChange={setField("siteMobileNo")} /></Field>
             <Field label="Property Type"><div className="relative"><Select options={PROPERTY_TYPES} value={form.propertyType} onChange={setSelect("propertyType")} /><span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span></div></Field>
             <Field label="Status"><div className="relative"><Select options={STATUS_OPTS} value={form.status} onChange={setSelect("status")} /><span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span></div></Field>
             <Field label="Payment Day"><Input type="number" value={form.paymentDay} onChange={setField("paymentDay")} /></Field>
             <Field label="Property Location" span2><Input value={form.propertyLocation} onChange={setField("propertyLocation")} /></Field>
             <Field label="Property Address" span2><Input value={form.propertyAddress} onChange={setField("propertyAddress")} /></Field>
             <Field label="City"><Input value={form.city} onChange={setField("city")} /></Field>
             <Field label="Pincode"><Input value={form.pincode} onChange={setField("pincode")} /></Field>
             <Field label="Area Size"><Input value={form.areaSize} onChange={setField("areaSize")} /></Field>
             <Field label="Unit (sq.ft / sq.m)"><Input value={form.unit} onChange={setField("unit")} /></Field>
             <Field label="Google Maps Link"><Input value={form.glocationLink} onChange={setField("glocationLink")} placeholder="https://maps..." /></Field>
             <Field label="Website Link"><Input value={form.websiteLink} onChange={setField("websiteLink")} placeholder="https://..." /></Field>
             <Field label="Google Drive Link"><Input value={form.gdriveLink} onChange={setField("gdriveLink")} placeholder="https://drive..." /></Field>
          </div>
        </div>

        {/* ── Section: Tenant Details ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Users} title="Tenant Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <Field label="Tenant Name"><Input value={form.tenantName} onChange={setField("tenantName")} /></Field>
             <Field label="Tenant Mobile"><Input value={form.tenantMobileNo} onChange={setField("tenantMobileNo")} /></Field>
             <Field label="Tenant Email"><Input type="email" value={form.tenantEmail} onChange={setField("tenantEmail")} /></Field>
             <Field label="Tenant Address" span2><Input value={form.tenantAddress} onChange={setField("tenantAddress")} /></Field>
          </div>
        </div>

        {/* ── Section: Rent & Agreement ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Landmark} title="Financial & Agreement" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <Field label="Rent Type"><div className="relative"><Select options={RENT_TYPE_OPTS} value={form.rentType} onChange={setSelect("rentType")} /><span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span></div></Field>
             <Field label="Monthly Rent (₹)"><Input type="number" value={form.monthlyRent} onChange={setField("monthlyRent")} /></Field>
             <Field label="Increased Rent (₹)"><Input type="number" value={form.increasedRent} onChange={setField("increasedRent")} /></Field>
             <Field label="Deposit (₹)"><Input type="number" value={form.deposit} onChange={setField("deposit")} /></Field>
             <Field label="Yearly Escalation (%)"><Input type="number" value={form.yearlyEscalationPercentage} onChange={setField("yearlyEscalationPercentage")} /></Field>
             <Field label="Escalation (%)"><Input type="number" value={form.escalationPercentage} onChange={setField("escalationPercentage")} /></Field>
             <Field label="Agreement Start Date"><Input type="date" value={form.agreementDate} onChange={setField("agreementDate")} /></Field>
             <Field label="Agreement Expiry Date"><Input type="date" value={form.agreementExpiring} onChange={setField("agreementExpiring")} /></Field>
             <Field label="Agreement Years"><Input type="number" value={form.agreementYears} onChange={setField("agreementYears")} /></Field>
             <Field label="Rent Start Date"><Input type="date" value={form.rentStartDate} onChange={setField("rentStartDate")} /></Field>
             <Field label="Fitout Date"><Input type="date" value={form.fitoutTime} onChange={setField("fitoutTime")} /></Field>
             <Field label="MSEB Deposit (₹)"><Input type="number" value={form.msebDeposit} onChange={setField("msebDeposit")} /></Field>
          </div>
        </div>

        {/* ── Section: Statutory & Financials ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Landmark} title="Statutory & Additional Charges" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <Field label="Maintenance Charges (₹)"><Input type="number" value={form.maintenanceCharges} onChange={setField("maintenanceCharges")} /></Field>
             <Field label="Municipal Tax (₹)"><Input type="number" value={form.municipalTax} onChange={setField("municipalTax")} /></Field>
             <Field label="CMA / CAM Charges (₹)"><Input type="number" value={form.cmaCharges} onChange={setField("cmaCharges")} /></Field>
             <Field label="GST Charges (₹)"><Input type="number" value={form.gstCharges} onChange={setField("gstCharges")} /></Field>
             <Field label="Water Charges (₹)"><Input type="number" value={form.waterCharges} onChange={setField("waterCharges")} /></Field>
             <Field label="Managed By"><Input value={form.managedBy} onChange={setField("managedBy")} /></Field>
          </div>
        </div>

        {/* ── Section: Authority & Agency ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Users} title="Authority & Agency" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <Field label="Authorised By"><Input value={form.authorisedBy} onChange={setField("authorisedBy")} /></Field>
             <Field label="Commission (Authorised Person)"><Input type="number" value={form.authorisedPersonCommission} onChange={setField("authorisedPersonCommission")} /></Field>
             <Field label="Agent Cost (₹)"><Input type="number" value={form.agentCost} onChange={setField("agentCost")} /></Field>
             <Field label="Agent Details" span2><Input value={form.agentDetails} onChange={setField("agentDetails")} /></Field>
          </div>
        </div>

        {/* ── Section: Owners ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Users} title="Owner Assignments" action={
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsNewOwnerModalOpen(true)} className="px-3 py-1.5 border border-dashed border-indigo-300 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-50 transition-colors">New Owner</button>
              <button type="button" onClick={() => setOwnerPickerOpen(!ownerPickerOpen)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Add Existing</button>
            </div>
          }/>

          {ownerPickerOpen && (
            <div className="mb-4 border border-gray-100 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
               <div className="p-3 bg-gray-50 dark:bg-white/[0.03]">
                 <input type="text" placeholder="Search owners..." value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
               </div>
               <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-white/[0.04]">
                  {allOwners.filter(o => !assignments.find(a => a.ownerId === o._id) && (o.ownerName.toLowerCase().includes(ownerSearch.toLowerCase()))).map(owner => (
                    <button key={owner._id} type="button" onClick={() => addOwnerAssignment(owner)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 dark:hover:bg-white/[0.03] transition-colors text-left">
                       <div><p className="font-medium text-sm text-gray-800 dark:text-white">{owner.ownerName}</p><p className="text-xs text-gray-400">{owner.mobileNo}</p></div>
                       <Plus size={14} className="text-indigo-500" />
                    </button>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-3">
            {assignments.map((a, idx) => (
              <div key={idx} className="border border-gray-100 dark:border-white/[0.08] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/[0.03] cursor-pointer" onClick={() => setExpandedAssign(p => { const c = [...p]; c[idx] = !c[idx]; return c; })}>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">{a.ownerName.charAt(0)}</div>
                     <div><p className="font-semibold text-sm text-gray-800 dark:text-white">{a.ownerName}</p><p className="text-xs text-indigo-500">{a.ownershipPercentage || 0}% Ownership</p></div>
                   </div>
                   <div className="flex items-center gap-2">
                     <button type="button" onClick={(e) => { e.stopPropagation(); removeAssignment(idx); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                     {expandedAssign[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                   </div>
                </div>
                {expandedAssign[idx] && (
                  <div className="p-4 space-y-4 bg-white dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Field label="Ownership %"><Input type="number" value={a.ownershipPercentage} onChange={e => updateAssignment(idx, "ownershipPercentage", e.target.value)} /></Field>
                     <Field label="Monthly Rent (₹)"><Input type="number" value={a.ownerMonthlyRent} onChange={e => updateAssignment(idx, "ownerMonthlyRent", e.target.value)} /></Field>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Section: Electricity ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
           <SectionHeader icon={Zap} title="Electricity Consumers" subtitle="Manage consumer assignments for this site" />
           <ConsumerSelect 
             selectedConsumerIds={electricityConsumerIds} 
             onChange={handleConsumerChange} 
             label="" 
           />
           {/* Detailed Cards for selected consumers */}
           {electricityConsumerIds.length > 0 && (
             <div className="mt-4 space-y-3">
               {electricityConsumerIds.map((id) => {
                 const c = allConsumers.find(item => item._id === id);
                 if (!c) return null;
                 return (
                   <div key={id} className="p-4 border border-gray-100 dark:border-white/[0.08] rounded-xl bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between group">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                           <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                           <p className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">{c.consumerNo}</p>
                           <p className="text-xs text-gray-400 font-medium">{c.consumerName || "Untitled Consumer"} • {c.electricityProvider || "General"}</p>
                        </div>
                     </div>
                     <button
                       type="button"
                       onClick={() => handleConsumerChange(electricityConsumerIds.filter(cid => cid !== id))}
                       className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/[0.05] pt-6">
           <p className="text-xs text-gray-400">{totalPct}% ownership allocated</p>
           <button type="submit" disabled={submitting || totalPct > 100} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
              <Save size={18} />
              {submitting ? "Updating Site..." : "Save Changes"}
           </button>
        </div>
      </form>

      <OwnerModal isOpen={isNewOwnerModalOpen} onClose={() => setIsNewOwnerModalOpen(false)} onSave={handleNewOwnerSaved} />
    </div>
  );
}