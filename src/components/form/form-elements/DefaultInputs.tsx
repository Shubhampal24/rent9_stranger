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
interface Owner { _id: string; ownerName: string; mobileNo: string; ownerDetails?: string; bankAccounts: BankAccount[]; }

interface ElectricityConsumer {
  consumerNo: string;
  consumerName: string;
  electricityProvider: string;
}

interface BankPayout {
  accountHolder: string;
  accountNo: string;
  bankName: string;
  ifsc: string;
  branchName: string;
  details: string;
}

interface OwnerAssignment {
  ownerId: string;
  ownerName: string;          // display only
  ownerMobile?: string;       // display only
  ownerDetails?: string;      // display only
  ownerMonthlyRent: number | "";
  bankPayouts: BankPayout[];
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
  const [fullElectricityConsumers, setFullElectricityConsumers] = useState<any[]>([]);

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
      const uJson = await res.json();
      const user = uJson.data || uJson;
      let assigned = (user.centreIds || []).map((c: any) => typeof c === "object" ? { _id: c._id, name: c.name, shortCode: c.shortCode } : { _id: c, name: c });

      // Admin fallback
      if (user.role === "admin" && assigned.length === 0) {
        try {
          const mRes = await fetch(`${API}/api/rent/master/`, { headers: authHeaders() });
          const mJson = await mRes.json();
          const masterData = mJson.data || mJson || [];
          if (Array.isArray(masterData)) {
            assigned = masterData.map((m: any) => ({
              _id: m._id || m.id,
              name: m.spaName || "Unknown Center",
              shortCode: m.spaCode || ""
            }));
          }
        } catch (e) { console.error("Admin center fetch failed", e); }
      }

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
  const addOwnerAssignment = (owner?: Owner) => {
    const newAssign: OwnerAssignment = {
      ownerId: owner?._id || "",
      ownerName: owner?.ownerName || "",
      ownerMobile: owner?.mobileNo || "",
      ownerDetails: (owner as any)?.ownerDetails || "",
      bankPayouts: owner?.bankAccounts?.length 
        ? owner.bankAccounts.map(b => ({
            ...EMPTY_NEW_BANK,
            accountHolder: b.accountHolder || owner.ownerName || "",
            accountNo: b.accountNo || "",
            bankName: b.bankName || "",
            ifsc: b.ifsc || "",
            branchName: b.branchName || "",
          }))
        : [{
            ...EMPTY_NEW_BANK,
            accountHolder: owner?.ownerName || "",
          }],
      ownerMonthlyRent: "",
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

  const updateAssignment = (idx: number, field: keyof OwnerAssignment, val: any) => {
    setAssignments(p => {
      const n = [...p];
      n[idx] = { ...n[idx], [field]: val };
      return n;
    });
  };

  const updateBankPayout = (assignIdx: number, bankIdx: number, field: keyof BankPayout, val: any) => {
    setAssignments(p => {
      const n = [...p];
      const banks = [...n[assignIdx].bankPayouts];
      banks[bankIdx] = { ...banks[bankIdx], [field]: val };
      n[assignIdx] = { ...n[assignIdx], bankPayouts: banks };
      return n;
    });
  };

  const addBankPayout = (assignIdx: number) => {
    setAssignments(p => {
      const n = [...p];
      n[assignIdx] = { 
        ...n[assignIdx], 
        bankPayouts: [...n[assignIdx].bankPayouts, { ...EMPTY_NEW_BANK }] 
      };
      return n;
    });
  };

  const removeBankPayout = (assignIdx: number, bankIdx: number) => {
    setAssignments(p => {
      const n = [...p];
      if (n[assignIdx].bankPayouts.length > 1) {
        n[assignIdx].bankPayouts = n[assignIdx].bankPayouts.filter((_, i) => i !== bankIdx);
      } else {
        toast.error("At least one bank payout is required");
      }
      return n;
    });
  };

  // ── Electricity Consumer Management managed via ConsumerSelect ──
  const handleConsumerChange = (ids: string[]) => {
    setElectricityConsumerIds(ids);
  };

  // ── Handle new owner created in modal ──────────────────────────────────────
  const handleNewOwnerSaved = async (formData: any) => {
    try {
      // 1. Create Owner Profile with all bank accounts in one call
      console.log("🚀 [Add Site] Creating Owner Profile via Modal:", formData);
      const res = await fetch(`${API}/api/rent/owners/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create owner profile");
      }

      const savedResponse = await res.json();
      const ownerId = savedResponse.data?._id;

      // 2. Refresh owner list
      await fetchOwners();
      
      toast.success("Owner created and selected!");

      const newOwnerObj: Owner = {
        _id: ownerId,
        ownerName: formData.ownerName,
        mobileNo: formData.mobileNo,
        ownerDetails: formData.ownerDetails,
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

    setSubmitting(true);
    try {
      // Step 1: Create Owners first (if new)
      const finalizedAssignments = [];
      for (const assign of assignments) {
        let ownerId = assign.ownerId;
        if (!ownerId && assign.ownerName) {
          const ownerPayload = {
            ownerName: assign.ownerName,
            mobileNo: assign.ownerMobile,
            ownerDetails: assign.ownerDetails,
            bankAccounts: assign.bankPayouts.map(p => ({
              accountHolder: p.accountHolder,
              accountNo: p.accountNo,
              bankName: p.bankName,
              ifsc: p.ifsc,
              branchName: p.branchName,
              details: p.details
            }))
          };
          console.log("🚀 [Add Site] Creating Owner Profile with multiple banks:", ownerPayload);
          
          const ownerRes = await fetch(`${API}/api/rent/owners/`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(ownerPayload),
          });
          if (ownerRes.ok) {
            const ownerJson = await ownerRes.json();
            ownerId = ownerJson.data?._id || ownerJson._id;
          } else {
            const errJson = await ownerRes.json().catch(() => ({}));
            console.error("❌ [Add Site] Owner Creation Failed:", errJson);
          }
        }
        finalizedAssignments.push({ ...assign, ownerId });
      }

      // Step 2: Create Master Consumers
      const consumerIds: string[] = [];
      for (const c of fullElectricityConsumers) {
        try {
          const consumerPayload = {
            consumerNo: c.consumerNo,
            consumerName: c.consumerName,
            electricityProvider: c.electricityProvider
          };
          console.log("🚀 [Add Site] Creating Consumer Profile:", consumerPayload);

          const cRes = await fetch(`${API}/api/rent/siteConsumer`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(consumerPayload)
          });
          if (cRes.ok) {
            const cData = await cRes.json();
            const consumerId = cData.data?._id || cData._id;
            if (consumerId) consumerIds.push(consumerId);
          } else {
            const errJson = await cRes.json().catch(() => ({}));
            console.error("❌ [Add Site] Consumer Creation Failed:", errJson);
          }
        } catch (err) {
          console.error("Error creating master consumer:", err);
        }
      }

      // Step 3: Create the Site
      const sitePayload: any = {};
      Object.entries(form).forEach(([k, v]) => { if (v !== "") sitePayload[k] = v; });

      console.log("🚀 [Add Site] Submitting Site Payload:", sitePayload);

      const siteRes = await fetch(`${API}/api/rent/sites/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(sitePayload),
      });
      const siteJson = await siteRes.json();
      if (!siteRes.ok) {
        console.error("❌ [Add Site] Site Creation Failed:", siteJson);
        throw new Error(siteJson.message ?? "Failed to create site");
      }

      // Robust siteId extraction
      const siteId = siteJson.data?._id || siteJson.site?._id || siteJson._id;
      console.log("✅ [Add Site] Site Created successfully. ID:", siteId);

      // Step 4: Perform Assignments using the new siteId
      // A. Owners
      for (const assign of finalizedAssignments) {
        if (!assign.ownerId) continue;
        
        const assignPayload: any = {
          siteId,
          ownerId: assign.ownerId,
          ownerMonthlyRent: Number(assign.ownerMonthlyRent) || 0,
        };
        console.log("🚀 [Add Site] Assigning Owner to Site:", assignPayload);
        
        const aRes = await fetch(`${API}/api/rent/owners/site-owner/assign`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(assignPayload),
        });
        if (!aRes.ok) {
          const errJson = await aRes.json().catch(() => ({}));
          console.error("❌ [Add Site] Owner Assignment Failed:", errJson);
        }
      }

      // B. Consumers
      for (const consumerId of consumerIds) {
        const assignPayload = { siteId, consumerId };
        console.log("🚀 [Add Site] Assigning Consumer to Site:", assignPayload);

        const aRes = await fetch(`${API}/api/rent/siteConsumer/assign`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(assignPayload),
        });
        if (!aRes.ok) {
          const errJson = await aRes.json().catch(() => ({}));
          console.error("❌ [Add Site] Consumer Assignment Failed:", errJson);
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
      setFullElectricityConsumers([]);
      setExpandedAssign([]);
      setOwnerSearch("");
      setOwnerPickerOpen(false);
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
      {/* Page Header (Cancel/Add) removed as per user request */}

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
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none pr-8"
                >
                  <option value="" className="dark:bg-gray-950">
                    {centresLoading ? "Loading centres..." : "Select a centre"}
                  </option>
                  {centres.map((c) => (
                    <option key={c._id} value={c._id} className="dark:bg-gray-950">
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
           <SectionHeader icon={Zap} title="Electricity Consumers" action={
             <button
               type="button"
               onClick={() => {
                 const newC = { _id: `new-${Date.now()}`, consumerNo: "", consumerName: "", electricityProvider: "" };
                 setFullElectricityConsumers([...fullElectricityConsumers, newC]);
               }}
               className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
             >
               <Plus size={14} /> Add Consumer
             </button>
           }/>

           {/* Detailed Cards for added consumers (Inline Editable) */}
           <div className="mt-4 space-y-4">
             {fullElectricityConsumers.map((c, idx) => (
                <div key={idx} className="p-5 border border-gray-100 dark:border-white/[0.08] rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] space-y-4 relative group">
                  <button
                    type="button"
                    onClick={() => {
                      const newList = fullElectricityConsumers.filter((_, i) => i !== idx);
                      setFullElectricityConsumers(newList);
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Zap size={20} fill="currentColor" />
                     </div>
                     <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">{c.consumerNo || "New Consumer"}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.electricityProvider || "Provider TBD"}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Consumer Number">
                      <Input
                        value={c.consumerNo}
                        onChange={e => {
                          const newList = [...fullElectricityConsumers];
                          newList[idx].consumerNo = e.target.value;
                          setFullElectricityConsumers(newList);
                        }}
                        placeholder="Meter ID"
                      />
                    </Field>
                    <Field label="Consumer Name / Label">
                      <Input
                        value={c.consumerName}
                        onChange={e => {
                          const newList = [...fullElectricityConsumers];
                          newList[idx].consumerName = e.target.value;
                          setFullElectricityConsumers(newList);
                        }}
                        placeholder="e.g. Ground Floor"
                      />
                    </Field>
                    <Field label="Electricity Provider">
                      <Input
                        value={c.electricityProvider}
                        onChange={e => {
                          const newList = [...fullElectricityConsumers];
                          newList[idx].electricityProvider = e.target.value;
                          setFullElectricityConsumers(newList);
                        }}
                        placeholder="e.g. TATA, Adani"
                      />
                    </Field>
                  </div>
                </div>
             ))}
             {fullElectricityConsumers.length === 0 && (
               <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-2xl">
                 <p className="text-sm text-gray-400 font-medium">No electricity consumers added yet.</p>
               </div>
             )}
           </div>
        </div>

        {/* ── Section: Owner Assignments ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader
            icon={Users}
            title="Owner Assignments"
            action={
               <button type="button" onClick={() => addOwnerAssignment()}
                 className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                 <Plus size={14} /> Add Owner
               </button>
            }
          />

          {/* Assignment cards */}
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl">
                <Users size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-400">No owners added yet</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Click "Add Owner" to begin</p>
              </div>
            ) : (
              assignments.map((a, idx) => (
                <div key={idx} className="border border-gray-100 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900/50">
                  <div 
                    className="flex items-center justify-between px-5 py-4 bg-gray-50/50 dark:bg-white/[0.02] cursor-pointer group/header"
                    onClick={() => setExpandedAssign(prev => { const n = [...prev]; n[idx] = !n[idx]; return n; })}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shadow-inner group-hover/header:scale-110 transition-transform">
                        {a.ownerName ? a.ownerName.charAt(0).toUpperCase() : <Users size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">{a.ownerName || "New Owner Assignment"}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                           <span className="text-[10px] font-medium text-gray-400">{a.ownerMobile || "No Mobile"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         type="button" 
                         onClick={(e) => { e.stopPropagation(); removeAssignment(idx); }}
                         className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                       >
                         <Trash2 size={16} />
                       </button>
                       {expandedAssign[idx] ? <ChevronUp size={18} className="text-gray-300" /> : <ChevronDown size={18} className="text-gray-300" />}
                    </div>
                  </div>

                  {expandedAssign[idx] && (
                    <div className="p-5 space-y-6 border-t border-gray-50 dark:border-white/[0.02]">
                       <div>
                          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-white/[0.04] pb-2">
                             <Users size={14} className="text-indigo-500" />
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Identity</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Owner Name"><Input value={a.ownerName} onChange={e => updateAssignment(idx, "ownerName", e.target.value)} /></Field>
                            <Field label="Mobile No."><Input value={a.ownerMobile} onChange={e => updateAssignment(idx, "ownerMobile", e.target.value)} /></Field>
                          </div>
                       </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Monthly Rent (₹)"><Input type="number" value={a.ownerMonthlyRent} onChange={e => updateAssignment(idx, "ownerMonthlyRent", e.target.value)} /></Field>
                          <Field label="Address / Remarks"><Input value={a.ownerDetails} onChange={e => updateAssignment(idx, "ownerDetails", e.target.value)} /></Field>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2 group/bank">
                               <Landmark size={14} className="text-indigo-500 transition-transform" />
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bank Payout Configuration</span>
                             </div>
                             <button 
                               type="button" 
                               onClick={() => addBankPayout(idx)}
                               className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                             >
                               <Plus size={12} /> Add Bank Account
                             </button>
                          </div>

                          {a.bankPayouts.map((bank, bIdx) => (
                            <div key={bIdx} className="relative p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/[0.06]">
                               {a.bankPayouts.length > 1 && (
                                 <button 
                                   type="button" 
                                   onClick={() => removeBankPayout(idx, bIdx)}
                                   className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-md"
                                 >
                                   <Trash2 size={12} />
                                 </button>
                               )}
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <Field label="Account Holder"><Input placeholder="Account Holder" value={bank.accountHolder} onChange={e => updateBankPayout(idx, bIdx, "accountHolder", e.target.value)} /></Field>
                                  <Field label="Account Number"><Input placeholder="Account Number" value={bank.accountNo} onChange={e => updateBankPayout(idx, bIdx, "accountNo", e.target.value)} /></Field>
                                  <Field label="Bank Name"><Input placeholder="Bank Name" value={bank.bankName} onChange={e => updateBankPayout(idx, bIdx, "bankName", e.target.value)} /></Field>
                                  <Field label="IFSC Code"><Input placeholder="IFSC Code" value={bank.ifsc} onChange={e => updateBankPayout(idx, bIdx, "ifsc", e.target.value)} /></Field>
                                  <Field label="Branch Name"><Input placeholder="Branch Name" value={bank.branchName} onChange={e => updateBankPayout(idx, bIdx, "branchName", e.target.value)} /></Field>
                                  <Field label="Payout Notes" span2><Input placeholder="Payout Notes" value={bank.details} onChange={e => updateBankPayout(idx, bIdx, "details", e.target.value)} /></Field>
                               </div>
                            </div>
                          ))}
                        </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400"></p>
          <button
            type="submit"
            disabled={submitting}
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