/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Building2, Users, FileText, Landmark, ChevronDown, ChevronUp, X, RefreshCw, Zap, ArrowLeft, Save } from "lucide-react";
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
  consumerNo: string;
  consumerName: string;
  electricityProvider: string;
}

interface OwnerAssignment {
  ownerId: string;
  ownerName: string;          // display only
  ownershipPercentage: number | "";
  ownerMonthlyRent: number | "";
  // Bank account for this site — either one of the owner's existing accounts, or a new one
  bankMode: "existing" | "new"; // 'existing' = pick from owner's list, 'new' = enter manually
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddSiteForm() {
  const router = useRouter();
  // Centre
  const [centres, setCentres] = useState<Centre[]>([]);
  const [centresLoading, setCentresLoading] = useState(false);

  // All owners (for the owner picker)
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [isNewOwnerModalOpen, setIsNewOwnerModalOpen] = useState(false);
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");

  // Owner assignments for this site
  const [assignments, setAssignments] = useState<OwnerAssignment[]>([]);
  const [expandedAssign, setExpandedAssign] = useState<boolean[]>([]);

  // Consumers
  const [allConsumers, setAllConsumers] = useState<any[]>([]);
  const [electricityConsumerIds, setElectricityConsumerIds] = useState<string[]>([]);

  // Form
  const [form, setForm] = useState({
    centreId: "",
    code: "",
    siteName: "",
    propertyType: "",
    propertyLocation: "",
    propertyAddress: "",
    city: "",
    pincode: "",
    areaSize: "",
    unit: "",
    glocationLink: "",
    websiteLink: "",
    gdriveLink: "",
    siteMobileNo: "",
    tenantName: "",
    tenantAddress: "",
    tenantMobileNo: "",
    tenantEmail: "",
    agreementDate: "",
    agreementExpiring: "",
    agreementYears: "",
    rentStartDate: "",
    fitoutTime: "",
    rentType: "",
    monthlyRent: "",
    increasedRent: "",
    deposit: "",
    yearlyEscalationPercentage: "",
    escalationPercentage: "",
    maintenanceCharges: "",
    municipalTax: "",
    cmaCharges: "",
    gstCharges: "",
    waterCharges: "",
    msebDeposit: "",
    agentDetails: "",
    agentCost: "",
    managedBy: "",
    authorisedBy: "",
    authorisedPersonCommission: "",
    paymentDay: "",
    status: "active",
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Load user's centres ─────────────────────────────────────────────────────
  const fetchCentres = useCallback(async () => {
    setCentresLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = token ? parseJwt(token) : null;
      const userId = payload?._id || payload?.id;
      if (!userId) { toast.error("Could not identify user"); return; }
      const res = await fetch(`${API}/api/users/${userId}`, { headers: authHeaders() });
      const json = await res.json();
      const user = json.data || json;
      // Centres assigned to user
      const assigned: Centre[] = (user.centreIds || []).map((c: any) =>
        typeof c === "object" ? { _id: c._id, name: c.name, shortCode: c.shortCode } : { _id: c, name: c }
      );
      setCentres(assigned);
    } catch { toast.error("Failed to load centres"); }
    finally { setCentresLoading(false); }
  }, []);

  // ── Load owners ─────────────────────────────────────────────────────────────
  const fetchOwners = useCallback(async () => {
    setOwnersLoading(true);
    try {
      const res = await fetch(`${API}/api/rent/owners/?page=1&limit=100`, { headers: authHeaders() });
      const json = await res.json();
      setAllOwners(json.data ?? []);
    } catch { toast.error("Failed to load owners"); }
    finally { setOwnersLoading(false); }
  }, []);

  useEffect(() => {
    fetchCentres();
    fetchOwners();
    fetchConsumers();
  }, [fetchCentres, fetchOwners]);

  const fetchConsumers = async () => {
    try {
      const response = await fetch(`${API}/api/rent/siteConsumer/all?page=1&limit=500`, { headers: authHeaders() });
      const json = await response.json();
      setAllConsumers(json.data || json || []);
    } catch (e) {
      console.error("Failed to fetch consumers", e);
    }
  };

  // ── Form field helper ───────────────────────────────────────────────────────
  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));
  const setSelect = (field: string) => (value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  // ── Owner Assignments ───────────────────────────────────────────────────────
  const addOwnerAssignment = (owner: Owner) => {
    if (assignments.find((a) => a.ownerId === owner._id)) {
      toast.error("Owner already added");
      return;
    }
    const newAssign: OwnerAssignment = {
      ownerId: owner._id,
      ownerName: owner.ownerName,
      ownershipPercentage: "",
      ownerMonthlyRent: "",
      bankMode: owner.bankAccounts?.length ? "existing" : "new",
      selectedBankAccountId: owner.bankAccounts?.[0]?._id ?? "",
      newBank: { ...EMPTY_NEW_BANK },
    };
    setAssignments((prev) => [...prev, newAssign]);
    setExpandedAssign((prev) => [...prev, true]);
    setOwnerPickerOpen(false);
    setOwnerSearch("");
  };

  const removeAssignment = (idx: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== idx));
    setExpandedAssign((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAssignment = (idx: number, field: keyof OwnerAssignment, value: any) => {
    setAssignments((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const updateNewBank = (idx: number, field: string, value: string) => {
    setAssignments((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], newBank: { ...copy[idx].newBank, [field]: value } };
      return copy;
    });
  };

  // ── Electricity Consumer Management managed via ConsumerSelect ──
  const handleConsumerChange = (ids: string[]) => {
    setElectricityConsumerIds(ids);
  };

  // Total ownership percent
  const totalPct = assignments.reduce((sum, a) => sum + (Number(a.ownershipPercentage) || 0), 0);

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

      // 3. Refresh owner list to include newly created owner
      await fetchOwners();
      
      // 4. Find the newly created owner in the refreshed list and auto-assign
      // We search for it to get the object with populated bank accounts if any
      toast.success("Owner created and selected!");
      
      // We can use the information from the savedResponse if needed, but a fresh fetch ensures consistency
      // However, fetchOwners() updates allOwners state. We need to find it there or use the saved one.
      // But allOwners might not have updated yet in the current closure. 
      // Let's call addOwnerAssignment directly with the data we have or the returned data.
      
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.centreId) { toast.error("Please select a centre"); return; }
    if (!form.siteName.trim()) { toast.error("Site name is required"); return; }
    if (totalPct > 100) { toast.error(`Total ownership ${totalPct}% exceeds 100%`); return; }

    setSubmitting(true);
    try {
      // Step 1: Create the site
      const sitePayload: any = {};
      Object.entries(form).forEach(([k, v]) => { if (v !== "") sitePayload[k] = v; });

      const siteRes = await fetch(`${API}/api/rent/sites/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(sitePayload),
      });
      const siteJson = await siteRes.json();
      if (!siteRes.ok) throw new Error(siteJson.message ?? "Failed to create site");

      const siteId = siteJson.data?._id;

      // Step 2: Assign each owner to the site
      for (const assign of assignments) {
        if (!assign.ownerId || !assign.ownershipPercentage) continue;

        const assignPayload: any = {
          siteId,
          ownerId: assign.ownerId,
          ownershipPercentage: Number(assign.ownershipPercentage),
        };
        if (assign.ownerMonthlyRent) assignPayload.ownerMonthlyRent = Number(assign.ownerMonthlyRent);

        // Bank account for this site
        if (assign.bankMode === "new" && assign.newBank.accountNo) {
          Object.assign(assignPayload, assign.newBank);
        } else if (assign.bankMode === "existing" && assign.selectedBankAccountId) {
          // Find the selected bank from the owner's accounts and send its details
          const owner = allOwners.find((o) => o._id === assign.ownerId);
          const bank = owner?.bankAccounts?.find((b) => b._id === assign.selectedBankAccountId);
          if (bank) {
            assignPayload.accountHolder = bank.accountHolder;
            assignPayload.accountNo = bank.accountNo;
            assignPayload.bankName = bank.bankName;
            assignPayload.ifsc = bank.ifsc;
            if (bank.branchName) assignPayload.branchName = bank.branchName;
          }
        }

        await fetch(`${API}/api/rent/owners/site-owner/assign`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(assignPayload),
        });
      }

      // Step 3: Create Electricity Consumer Assignments
      for (const consumerId of electricityConsumerIds) {
        try {
          const assignRes = await fetch(`${API}/api/rent/siteConsumer/assign`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ siteId, consumerId }),
          });
          if (!assignRes.ok) console.error("Failed to assign consumer:", consumerId);
        } catch (err) {
          console.error("Error assigning consumer:", err);
        }
      }

      toast.success("Site created and details assigned successfully!");

      // Reset
      setForm({
        centreId: "", code: "", siteName: "", propertyType: "", propertyLocation: "", propertyAddress: "", city: "", pincode: "",
        areaSize: "", unit: "", glocationLink: "", websiteLink: "", gdriveLink: "", siteMobileNo: "", tenantName: "",
        tenantAddress: "", tenantMobileNo: "", tenantEmail: "", agreementDate: "", agreementExpiring: "", agreementYears: "",
        rentStartDate: "", fitoutTime: "", rentType: "", monthlyRent: "", increasedRent: "", deposit: "",
        yearlyEscalationPercentage: "", escalationPercentage: "", maintenanceCharges: "", municipalTax: "", cmaCharges: "",
        gstCharges: "", waterCharges: "", msebDeposit: "", agentDetails: "", agentCost: "", managedBy: "", authorisedBy: "",
        authorisedPersonCommission: "", paymentDay: "", status: "active",
      });
      setAssignments([]);
      setElectricityConsumerIds([]);
      setExpandedAssign([]);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered owners for picker
  const filteredOwners = allOwners.filter(
    (o) =>
      !assignments.find((a) => a.ownerId === o._id) &&
      (o.ownerName?.toLowerCase().includes(ownerSearch.toLowerCase()) ||
        o.mobileNo?.includes(ownerSearch))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Cancel</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">Add New Site</h1>
      </div>

      {/* ── Page Hero ── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white shadow-lg shadow-indigo-500/20">
        <h2 className="text-xl font-bold">Site Configuration</h2>
        <p className="text-indigo-100 text-sm mt-1">Configure all site parameters, tenant info, and owner assignments in one place.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section: Centre Assignment ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Building2} title="Centre Assignment" subtitle="Select the centre this site belongs to" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Centre *</Label>
              <div className="relative">
                <select
                  value={form.centreId}
                  onChange={(e) => setForm((p) => ({ ...p, centreId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none pr-8"
                >
                  <option value="">
                    {centresLoading ? "Loading centres..." : "Select a centre"}
                  </option>
                  {centres.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}{c.shortCode ? ` (${c.shortCode})` : ""}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDownIcon />
                </span>
              </div>
              {centres.length === 0 && !centresLoading && (
                <p className="text-xs text-amber-500 mt-1">No centres assigned to your account. Contact admin.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section: Basic Info ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Building2} title="Basic Site Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Site Code"><Input type="text" value={form.code} onChange={setField("code")} placeholder="e.g. SITE-001" /></Field>
            <Field label="Site Name *"><Input type="text" value={form.siteName} onChange={setField("siteName")} placeholder="Name of the site" required /></Field>
            <Field label="Site Mobile No."><Input type="tel" value={form.siteMobileNo} onChange={setField("siteMobileNo")} placeholder="Contact number" /></Field>
            <Field label="Property Type">
              <div className="relative">
                <Select options={PROPERTY_TYPES} placeholder="Select type" value={form.propertyType} onChange={setSelect("propertyType")} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
              </div>
            </Field>
            <Field label="Status">
              <div className="relative">
                <Select options={STATUS_OPTS} value={form.status} onChange={setSelect("status")} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
              </div>
            </Field>
            <Field label="Payment Day"><Input type="number" value={form.paymentDay} onChange={setField("paymentDay")} placeholder="e.g. 5" /></Field>
            <Field label="Property Location" span2><Input type="text" value={form.propertyLocation} onChange={setField("propertyLocation")} placeholder="Area/locality" /></Field>
            <Field label="Property Address" span2><Input type="text" value={form.propertyAddress} onChange={setField("propertyAddress")} placeholder="Full address" /></Field>
            <Field label="City"><Input type="text" value={form.city} onChange={setField("city")} placeholder="City" /></Field>
            <Field label="Pincode"><Input type="text" value={form.pincode} onChange={setField("pincode")} placeholder="6-digit pincode" /></Field>
            <Field label="Area Size"><Input type="number" value={form.areaSize} onChange={setField("areaSize")} placeholder="Size" /></Field>
            <Field label="Unit (sq.ft / sq.m)"><Input type="text" value={form.unit} onChange={setField("unit")} placeholder="sq.ft" /></Field>
            <Field label="Google Maps Link" span2><Input type="url" value={form.glocationLink} onChange={setField("glocationLink")} placeholder="https://maps.google.com/..." /></Field>
            <Field label="Website Link"><Input type="url" value={form.websiteLink} onChange={setField("websiteLink")} placeholder="https://" /></Field>
            <Field label="Google Drive Link"><Input type="url" value={form.gdriveLink} onChange={setField("gdriveLink")} placeholder="https://drive.google.com/..." /></Field>
            <Field label="Managed By"><Input type="text" value={form.managedBy} onChange={setField("managedBy")} placeholder="Manager name" /></Field>
            <Field label="Authorised By"><Input type="text" value={form.authorisedBy} onChange={setField("authorisedBy")} placeholder="Authoriser name" /></Field>
            <Field label="Commission (Authorised Person)"><Input type="number" value={form.authorisedPersonCommission} onChange={setField("authorisedPersonCommission")} placeholder="₹" /></Field>
          </div>
        </div>

        {/* ── Section: Tenant Info ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={FileText} title="Tenant Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Tenant Name"><Input type="text" value={form.tenantName} onChange={setField("tenantName")} placeholder="Tenant / organisation name" /></Field>
            <Field label="Tenant Mobile"><Input type="tel" value={form.tenantMobileNo} onChange={setField("tenantMobileNo")} placeholder="Mobile number" /></Field>
            <Field label="Tenant Email"><Input type="email" value={form.tenantEmail} onChange={setField("tenantEmail")} placeholder="Email" /></Field>
            <Field label="Tenant Address" span2><Input type="text" value={form.tenantAddress} onChange={setField("tenantAddress")} placeholder="Address" /></Field>
          </div>
        </div>

        {/* ── Section: Financial & Rent Details ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Landmark} title="Financial & Rent Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Rent Type">
              <div className="relative">
                <Select options={RENT_TYPE_OPTS} placeholder="Select rent type" value={form.rentType} onChange={setSelect("rentType")} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
              </div>
            </Field>
            <Field label="Monthly Rent (₹)"><Input type="number" value={form.monthlyRent} onChange={setField("monthlyRent")} placeholder="0" /></Field>
            <Field label="Increased Rent (₹)"><Input type="number" value={form.increasedRent} onChange={setField("increasedRent")} placeholder="0" /></Field>
            <Field label="Deposit (₹)"><Input type="number" value={form.deposit} onChange={setField("deposit")} placeholder="0" /></Field>
            <Field label="Maintenance Charges (₹)"><Input type="number" value={form.maintenanceCharges} onChange={setField("maintenanceCharges")} placeholder="0" /></Field>
            <Field label="Municipal Tax (₹)"><Input type="number" value={form.municipalTax} onChange={setField("municipalTax")} placeholder="0" /></Field>
            <Field label="CMA / CAM Charges (₹)"><Input type="number" value={form.cmaCharges} onChange={setField("cmaCharges")} placeholder="0" /></Field>
            <Field label="GST Charges (₹)"><Input type="number" value={form.gstCharges} onChange={setField("gstCharges")} placeholder="0" /></Field>
            <Field label="Water Charges (₹)"><Input type="number" value={form.waterCharges} onChange={setField("waterCharges")} placeholder="0" /></Field>
            <Field label="MSEB Deposit (₹)"><Input type="number" value={form.msebDeposit} onChange={setField("msebDeposit")} placeholder="0" /></Field>
            <Field label="Yearly Escalation (%)"><Input type="number" value={form.yearlyEscalationPercentage} onChange={setField("yearlyEscalationPercentage")} placeholder="0" /></Field>
            <Field label="Escalation (%)"><Input type="number" value={form.escalationPercentage} onChange={setField("escalationPercentage")} placeholder="0" /></Field>
            <Field label="Agent Details"><Input type="text" value={form.agentDetails} onChange={setField("agentDetails")} placeholder="Agent name / info" /></Field>
            <Field label="Agent Cost (₹)"><Input type="number" value={form.agentCost} onChange={setField("agentCost")} placeholder="0" /></Field>
          </div>
        </div>

        {/* ── Section: Agreement Details ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={FileText} title="Agreement Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Agreement Start Date"><Input type="date" value={form.agreementDate} onChange={setField("agreementDate")} /></Field>
            <Field label="Agreement Expiry Date"><Input type="date" value={form.agreementExpiring} onChange={setField("agreementExpiring")} /></Field>
            <Field label="Agreement Years"><Input type="number" value={form.agreementYears} onChange={setField("agreementYears")} placeholder="e.g. 3" /></Field>
            <Field label="Rent Start Date"><Input type="date" value={form.rentStartDate} onChange={setField("rentStartDate")} /></Field>
            <Field label="Fitout Date"><Input type="date" value={form.fitoutTime} onChange={setField("fitoutTime")} /></Field>
          </div>
        </div>

        {/* ── Section: Electricity Consumers ── */}
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

        {/* ── Section: Owner Assignments ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader
            icon={Users}
            title="Owner Assignments"
            subtitle={totalPct > 0 ? `Total assigned: ${totalPct}% ownership` : "Assign one or more owners to this site"}
            action={
              <div className="flex items-center gap-2">
                <button type="button" onClick={fetchOwners} className="p-1.5 border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-400 hover:text-indigo-500 transition-colors" title="Refresh owners">
                  <RefreshCw size={13} />
                </button>
                <button type="button" onClick={() => setIsNewOwnerModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-indigo-300 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                  <Plus size={12} /> New Owner
                </button>
                <button type="button" onClick={() => setOwnerPickerOpen((p) => !p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                  <Plus size={12} /> Add Owner
                </button>
              </div>
            }
          />

          {/* Owner Picker Dropdown */}
          {ownerPickerOpen && (
            <div className="mb-4 border border-gray-100 dark:border-white/[0.08] rounded-xl overflow-hidden">
              <div className="p-3 bg-gray-50 dark:bg-white/[0.03]">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search owners by name or mobile..."
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-white/[0.04]">
                {ownersLoading ? (
                  <div className="p-4 text-center text-sm text-gray-400">Loading owners...</div>
                ) : filteredOwners.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    {ownerSearch ? "No matching owners" : "All available owners already added"}
                  </div>
                ) : (
                  filteredOwners.map((owner) => (
                    <button key={owner._id} type="button" onClick={() => addOwnerAssignment(owner)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50/60 dark:hover:bg-white/[0.03] transition-colors text-left">
                      <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-white">{owner.ownerName}</p>
                        <p className="text-xs text-gray-400">{owner.mobileNo} · {owner.bankAccounts?.length || 0} bank account(s)</p>
                      </div>
                      <Plus size={14} className="text-indigo-500" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Ownership percentage warning */}
          {totalPct > 100 && (
            <div className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg text-sm text-red-600 dark:text-red-400">
              ⚠ Total ownership {totalPct}% exceeds 100%. Please adjust the percentages.
            </div>
          )}

          {/* Assignment cards */}
          {assignments.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl">
              <Users size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-400">No owners assigned yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Click "Add Owner" to assign an owner to this site</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assign, idx) => {
                const ownerData = allOwners.find((o) => o._id === assign.ownerId);
                return (
                  <div key={assign.ownerId} className="border border-gray-100 dark:border-white/[0.08] rounded-xl overflow-hidden">
                    {/* Assignment header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/[0.03] cursor-pointer"
                      onClick={() => setExpandedAssign((prev) => { const n = [...prev]; n[idx] = !n[idx]; return n; })}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {assign.ownerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800 dark:text-white">{assign.ownerName}</p>
                          <p className="text-xs text-gray-400">
                            {assign.ownershipPercentage ? `${assign.ownershipPercentage}% ownership` : "Set ownership %"}
                            {assign.ownerMonthlyRent ? ` · ₹${assign.ownerMonthlyRent}/mo` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeAssignment(idx); }}
                          className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <X size={14} />
                        </button>
                        {expandedAssign[idx] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* Assignment body */}
                    {expandedAssign[idx] && (
                      <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
                        {/* Ownership & rent */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label>Ownership % *</Label>
                            <Input type="number" min={0} max={100}
                              value={assign.ownershipPercentage}
                              onChange={(e) => updateAssignment(idx, "ownershipPercentage", e.target.value)}
                              placeholder="e.g. 50"
                            />
                          </div>
                          <div>
                            <Label>Owner Monthly Rent (₹)</Label>
                            <Input type="number"
                              value={assign.ownerMonthlyRent}
                              onChange={(e) => updateAssignment(idx, "ownerMonthlyRent", e.target.value)}
                              placeholder="e.g. 25000"
                            />
                          </div>
                        </div>

                        {/* Bank account selection */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Landmark size={13} className="text-indigo-500" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Account for this Site</span>
                          </div>

                          {ownerData?.bankAccounts?.length ? (
                            <div className="flex gap-3 mb-3">
                              <button type="button"
                                onClick={() => updateAssignment(idx, "bankMode", "existing")}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${assign.bankMode === "existing" ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 dark:border-white/[0.08] text-gray-500 hover:bg-gray-50"}`}>
                                Use Existing Bank
                              </button>
                              <button type="button"
                                onClick={() => updateAssignment(idx, "bankMode", "new")}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${assign.bankMode === "new" ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 dark:border-white/[0.08] text-gray-500 hover:bg-gray-50"}`}>
                                Use New Bank
                              </button>
                            </div>
                          ) : null}

                          {assign.bankMode === "existing" && ownerData?.bankAccounts?.length ? (
                            <div className="relative">
                              <select
                                value={assign.selectedBankAccountId}
                                onChange={(e) => updateAssignment(idx, "selectedBankAccountId", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none pr-8"
                              >
                                <option value="">Select bank account</option>
                                {ownerData.bankAccounts.map((b) => (
                                  <option key={b._id} value={b._id}>
                                    {b.bankName} — {b.accountHolder} — ••{b.accountNo.slice(-4)}
                                  </option>
                                ))}
                              </select>
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
                            </div>
                          ) : (
                            // New bank form
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg border border-gray-100 dark:border-white/[0.06]">
                              <div><Label>Account Holder</Label><Input type="text" value={assign.newBank.accountHolder} onChange={(e) => updateNewBank(idx, "accountHolder", e.target.value)} placeholder="Name on account" /></div>
                              <div><Label>Account Number</Label><Input type="text" value={assign.newBank.accountNo} onChange={(e) => updateNewBank(idx, "accountNo", e.target.value)} placeholder="Account number" /></div>
                              <div><Label>Bank Name</Label><Input type="text" value={assign.newBank.bankName} onChange={(e) => updateNewBank(idx, "bankName", e.target.value)} placeholder="e.g. SBI" /></div>
                              <div><Label>IFSC Code</Label><Input type="text" value={assign.newBank.ifsc} onChange={(e) => updateNewBank(idx, "ifsc", e.target.value)} placeholder="e.g. SBIN0001234" /></div>
                              <div><Label>Branch</Label><Input type="text" value={assign.newBank.branchName} onChange={(e) => updateNewBank(idx, "branchName", e.target.value)} placeholder="optional" /></div>
                              <div><Label>Notes</Label><Input type="text" value={assign.newBank.details} onChange={(e) => updateNewBank(idx, "details", e.target.value)} placeholder="optional" /></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">
            {assignments.length > 0 && (
              <span className={totalPct > 100 ? "text-red-500" : totalPct === 100 ? "text-green-500" : "text-amber-500"}>
                {totalPct}% ownership allocated{totalPct === 100 ? " ✓" : totalPct > 100 ? " — exceeds 100%!" : ` — ${100 - totalPct}% remaining`}
              </span>
            )}
          </p>
          <button
            type="submit"
            disabled={submitting || totalPct > 100}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            {submitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Creating Site...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Create Site & Assign Details</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* New Owner Modal */}
      <OwnerModal
        isOpen={isNewOwnerModalOpen}
        onClose={() => setIsNewOwnerModalOpen(false)}
        onSave={handleNewOwnerSaved}
      />
    </div>
  );
}