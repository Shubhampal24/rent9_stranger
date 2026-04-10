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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Centre { _id: string; name: string; shortCode?: string; }
interface BankAccount { _id: string; accountHolder: string; accountNo: string; bankName: string; ifsc: string; branchName?: string; }
interface Owner { _id: string; ownerName: string; mobileNo: string; ownerDetails?: string; bankAccounts: BankAccount[]; }

interface BankPayout {
  _id?: string;           // SiteOwner record ID
  bankId?: string;        // Owner Profile Bank Account ID
  accountHolder: string;
  accountNo: string;
  bankName: string;
  ifsc: string;
  branchName: string;
  details: string;
  isDeleted?: boolean;
}

interface OwnerAssignment {
  _id?: string;
  ownerId: string;
  ownerName: string;
  ownerMobile?: string;
  ownerDetails?: string;
  ownerMonthlyRent: number | "";
  bankPayouts: BankPayout[];
  ownerBanks?: any[];
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

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between pb-3 mb-4 border-b border-gray-100 dark:border-white/[0.05]">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shadow-sm">
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

// ─── Field Wrapper ────────────────────────────────────────────────────────────
function Field({ label, children, span2 = false, required = false }: { label: string; children: React.ReactNode; span2?: boolean; required?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 font-bold">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function UpdateSitesForm() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pickers state
  const [centres, setCentres] = useState<Centre[]>([]);
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [isNewOwnerModalOpen, setIsNewOwnerModalOpen] = useState(false);
  const [expandedAssign, setExpandedAssign] = useState<boolean[]>([]);

  // Main state
  const [form, setForm] = useState(INITIAL_FORM as any);
  const [assignments, setAssignments] = useState<OwnerAssignment[]>([]);
  const [removedAssignIds, setRemovedAssignIds] = useState<string[]>([]); // To track assignment links to delete
  const [fullElectricityConsumers, setFullElectricityConsumers] = useState<any[]>([]);
  const [removedConsumerIds, setRemovedConsumerIds] = useState<string[]>([]); // To track consumer assignments to delete

  // ── Fetch Initial State ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const siteId = params.id;
      const token = localStorage.getItem("token");

      // 1. Fetch Master Repos & Site Details
      const [uRes, oRes, sRes] = await Promise.all([
        fetch(`${API}/api/users/${parseJwt(token!)?._id || parseJwt(token!)?.id}`, { headers: authHeaders() }),
        fetch(`${API}/api/rent/owners/?page=1&limit=500`, { headers: authHeaders() }),
        fetch(`${API}/api/rent/sites/${siteId}`, { headers: authHeaders() })
      ]);

      const uJson = await uRes.json();
      const oJson = await oRes.json();
      const sJson = await sRes.json();

      const user = uJson.data || uJson;
      setCentres((user.centreIds || []).map((c: any) => typeof c === "object" ? { _id: c._id, name: c.name } : { _id: c, name: c }));
      setAllOwners(oJson.data || []);

      const siteData = sJson.data || sJson;
      console.log("🚀 [Update Site] Fetched Site Response:", siteData);

      // Map Core Fields
      const newForm: any = { ...INITIAL_FORM };
      Object.keys(INITIAL_FORM).forEach(k => {
        if (siteData[k] !== undefined) {
          if (k.toLowerCase().includes("date") && siteData[k]) {
            newForm[k] = siteData[k].split("T")[0];
          } else {
            newForm[k] = siteData[k] ?? "";
          }
        }
      });
      if (siteData.centreId?._id) newForm.centreId = siteData.centreId._id;
      setForm(newForm);

      // Map Owners - Grouped by ownerId to support multiple bank payouts per owner
      if (siteData.owners) {
        const groupedMap = new Map<string, OwnerAssignment>();

        siteData.owners.forEach((o: any) => {
          const oid = o.ownerId?._id || o.ownerId;
          const profileBank = o.ownerId?.bankAccounts?.[0] || {};

          const b = Array.isArray(o.bankAccount) ? o.bankAccount[0] : o.bankAccount;
          const payout: BankPayout = {
            _id: o._id, // This is the linking ID (SiteOwner record ID)
            bankId: b?._id || "", // This is the actual bank account ID from owner profile
            accountHolder: b?.accountHolder || o.accountHolder || profileBank.accountHolder || "",
            accountNo: b?.accountNo || o.accountNo || profileBank.accountNo || "",
            bankName: b?.bankName || o.bankName || profileBank.bankName || "",
            ifsc: b?.ifsc || o.ifsc || profileBank.ifsc || "",
            branchName: b?.branchName || o.branchName || profileBank.branchName || "",
            details: b?.details || o.details || profileBank.details || "",
          };

          if (groupedMap.has(oid)) {
            groupedMap.get(oid)!.bankPayouts.push(payout);
          } else {
            groupedMap.set(oid, {
              ownerId: oid,
              ownerName: o.ownerId?.ownerName || "Unknown",
              ownerMobile: o.ownerId?.mobileNo || "",
              ownerDetails: o.ownerId?.ownerDetails || "",
              bankPayouts: [payout],
              ownerMonthlyRent: o.ownerMonthlyRent || "",
            });
          }
        });

        const mapped = Array.from(groupedMap.values());
        setAssignments(mapped);
        setExpandedAssign(mapped.map(() => false));
      }

      // Map Consumers
      if (siteData.electricityConsumers) {
        setFullElectricityConsumers(siteData.electricityConsumers.map((c: any) => ({
          _id: c._id,
          consumerNo: c.consumerNo,
          consumerName: c.consumerName,
          electricityProvider: c.electricityProvider
        })));
      }

    } catch (err) {
      toast.error("Failed to load site data");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { if (params.id) fetchData(); }, [params.id, fetchData]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, [field]: e.target.value }));
  const setSelect = (field: string) => (value: string) => setForm((p: any) => ({ ...p, [field]: value }));

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
      ownerBanks: owner?.bankAccounts || [],
    };
    setAssignments(p => [...p, newAssign]);
    setExpandedAssign(p => [...p, true]);
  };

  const removeAssignment = (idx: number) => {
    const target = assignments[idx];
    // Track all bank payout IDs for this owner for backend deletion
    target.bankPayouts.forEach(b => {
      if (b._id) setRemovedAssignIds(prev => [...prev, b._id!]);
    });
    setAssignments(p => p.filter((_, i) => i !== idx));
    setExpandedAssign(p => p.filter((_, i) => i !== idx));
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
      const target = n[assignIdx];
      if (!target) return p;

      const currentBanks = Array.isArray(target.bankPayouts) ? target.bankPayouts : [];

      n[assignIdx] = {
        ...target,
        bankPayouts: [...currentBanks, { ...EMPTY_NEW_BANK }]
      };
      return n;
    });
  };

  const removeBankPayout = (assignIdx: number, bankIdx: number) => {
    setAssignments(p => {
      const n = [...p];
      const target = n[assignIdx];
      if (!target || !Array.isArray(target.bankPayouts)) return p;

      const bank = target.bankPayouts[bankIdx];
      if (!bank) return p;

      if (bank?._id || bank?.bankId) {
        // Mark for deletion if it exists on server
        const banks = [...target.bankPayouts];
        banks[bankIdx] = { ...banks[bankIdx], isDeleted: true };
        n[assignIdx] = { ...target, bankPayouts: banks };
      } else {
        // Just remove from array if it's new
        n[assignIdx].bankPayouts = target.bankPayouts.filter((_, i) => i !== bankIdx);
      }
      return n;
    });
  };

  const handleNewOwnerSaved = async (formData?: any) => {
    setIsNewOwnerModalOpen(false);
    await fetchData(); // refresh list to see new owner

    if (formData && !formData._id) {
      toast.success("New owner created. You can now select them from the list.");
    }
  };

  // ── Sequential Submission (Matches DefaultInputs) ───────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const siteId = params.id;

      // Step 1: Sync Owners (Add New or update Profile)
      const finalizedAssignments = [];
      for (const assign of assignments) {
        let ownerId = assign.ownerId;
        const ownerPayload: any = {
          ownerName: assign.ownerName,
          mobileNo: assign.ownerMobile,
          ownerDetails: assign.ownerDetails,
          bankAccounts: assign.bankPayouts
            .map(p => ({
              _id: p.bankId, // Use the actual bank account ID
              accountHolder: p.accountHolder,
              accountNo: p.accountNo,
              bankName: p.bankName,
              ifsc: p.ifsc,
              branchName: p.branchName,
              details: p.details,
              isDeleted: p.isDeleted
            }))
            .filter(b => b._id || b.accountNo) // Filter out incomplete new bank accounts
        };

        let ownerBanks: any[] = [];
        if (ownerId) {
          const getRes = await fetch(`${API}/api/rent/owners/${ownerId}`, { headers: authHeaders() });
          if (getRes.ok) {
            const getJson = await getRes.json();
            const existingOwner = getJson.data || getJson;
            ownerBanks = existingOwner.bankAccounts || [];
          }
        }

        if (!ownerId && assign.ownerName) {
          // Create New Owner
          console.log("🚀 [Update Site] Creating New Owner Profile with multiple banks:", JSON.stringify(ownerPayload, null, 2));
          const oRes = await fetch(`${API}/api/rent/owners/`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(ownerPayload)
          });
          if (oRes.ok) {
            const oJson = await oRes.json();
            const createdOwner = oJson.data || oJson;
            ownerId = createdOwner._id;
            ownerBanks = createdOwner.bankAccounts || [];
          }
        } else if (ownerId) {
          // Update Existing Owner Profile
          console.log("🚀 [Update Site] Syncing Owner Profile:", JSON.stringify(ownerPayload, null, 2));
          await fetch(`${API}/api/rent/owners/${ownerId}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(ownerPayload)
          });

          // After update, refetch to get the latest bank IDs (if any new ones were added)
          const getRes = await fetch(`${API}/api/rent/owners/${ownerId}`, { headers: authHeaders() });
          if (getRes.ok) {
            const getJson = await getRes.json();
            ownerBanks = (getJson.data || getJson).bankAccounts || [];
          }
        }
        finalizedAssignments.push({ ...assign, ownerId, ownerBanks });
      }

      // Step 2: Sync Consumers
      const consumerIds: string[] = [];
      for (const c of fullElectricityConsumers) {
        const consumerPayload = { consumerNo: c.consumerNo, consumerName: c.consumerName, electricityProvider: c.electricityProvider };
        if (c._id && !c._id.startsWith("new")) {
          // Update Existing Profile
          await fetch(`${API}/api/rent/siteConsumer/${c._id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(consumerPayload) });
          consumerIds.push(c._id);
        } else {
          // Create New Profile
          const cRes = await fetch(`${API}/api/rent/siteConsumer`, { method: "POST", headers: authHeaders(), body: JSON.stringify(consumerPayload) });
          if (cRes.ok) {
            const cJson = await cRes.json();
            const cid = cJson.data?._id || cJson._id;
            if (cid) consumerIds.push(cid);
          }
        }
      }

      // Step 3: Update Site Core
      const sRes = await fetch(`${API}/api/rent/sites/${siteId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(form) });
      if (!sRes.ok) throw new Error("Failed to update site basics");

      // Step 4: Sync Assignments
      // A. Remove Deletions
      for (const rid of removedAssignIds) {
        await fetch(`${API}/api/rent/owners/site-owner/${rid}`, { method: "DELETE", headers: authHeaders() });
      }
      for (const rid of removedConsumerIds) {
        await fetch(`${API}/api/rent/siteConsumer/assign/${siteId}/${rid}`, { method: "DELETE", headers: authHeaders() });
      }

      // B. Create/Update Assignments (Handling multiple banks per owner)
      for (const assign of finalizedAssignments) {
        if (!assign.ownerId) continue;

        // We match assignments based on the bankAccountId linking them
        const profileBanks = assign.ownerBanks || [];
        const uiBanks = assign.bankPayouts || [];

        for (const uiBank of uiBanks) {
          if (uiBank.isDeleted) {
            if (uiBank._id) await fetch(`${API}/api/rent/owners/site-owner/${uiBank._id}`, { method: "DELETE", headers: authHeaders() });
            continue;
          }

          // Find the database bank _id for this ui record (needed if it's a new bank account)
          const matchingProfileBank = profileBanks.find(pb => pb.accountNo === uiBank.accountNo);

          const assignPayload: any = {
            siteId,
            ownerId: assign.ownerId,
            ownerMonthlyRent: Number(assign.ownerMonthlyRent) || 0,
            bankAccount: matchingProfileBank?._id || uiBank.bankId
          };

          if (uiBank._id) {
            // Update existing assignment record
            await fetch(`${API}/api/rent/owners/site-owner/${uiBank._id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(assignPayload) });
          } else {
            // Create new assignment record
            await fetch(`${API}/api/rent/owners/site-owner/assign`, { method: "POST", headers: authHeaders(), body: JSON.stringify(assignPayload) });
          }
        }
      }

      // C. Consumer Assignments (Ensure all present linked)
      for (const cid of consumerIds) {
        // The backend handled link upon creation in some flows, but to be sure:
        await fetch(`${API}/api/rent/siteConsumer/assign`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ siteId, consumerId: cid }) });
      }

      toast.success("Site configuration synchronized successfully!");
      router.push(`/sites/${siteId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <RefreshCw className="animate-spin text-indigo-600" size={32} />
      <p className="text-gray-500 font-medium">Synchronizing configurations...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── Page Hero ── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Site Configuration</h2>
            <p className="text-indigo-100 text-sm mt-1">Configure all site parameters, tenant info, and owner assignments in one place.</p>
          </div>
          <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
        </div>
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
                  onChange={(e) => setForm((p: any) => ({ ...p, centreId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none pr-8"
                >
                  <option value="" className="dark:bg-gray-950">Select a centre</option>
                  {centres.map((c) => (
                    <option key={c._id} value={c._id} className="dark:bg-gray-950">{c.name}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section: Basic Info ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Building2} title="Basic Site Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Site Code"><Input type="text" value={form.code} onChange={setField("code")} placeholder="e.g. SITE-001" /></Field>
            <Field label="Site Name *"><Input type="text" value={form.siteName} onChange={setField("siteName")} required /></Field>
            <Field label="Site Mobile No."><Input type="tel" value={form.siteMobileNo} onChange={setField("siteMobileNo")} /></Field>
            <Field label="Property Type">
              <div className="relative">
                <Select options={PROPERTY_TYPES} value={form.propertyType} onChange={setSelect("propertyType")} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
              </div>
            </Field>
            <Field label="Status">
              <div className="relative">
                <Select options={STATUS_OPTS} value={form.status} onChange={setSelect("status")} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
              </div>
            </Field>
            <Field label="Payment Day"><Input type="number" value={form.paymentDay} onChange={setField("paymentDay")} /></Field>
            <Field label="Property Location" span2><Input type="text" value={form.propertyLocation} onChange={setField("propertyLocation")} /></Field>
            <Field label="Property Address" span2><Input type="text" value={form.propertyAddress} onChange={setField("propertyAddress")} /></Field>
            <Field label="City"><Input type="text" value={form.city} onChange={setField("city")} /></Field>
            <Field label="Pincode"><Input type="text" value={form.pincode} onChange={setField("pincode")} /></Field>
            <Field label="Area Size"><Input type="number" value={form.areaSize} onChange={setField("areaSize")} /></Field>
            <Field label="Unit (sq.ft / sq.m)"><Input type="text" value={form.unit} onChange={setField("unit")} /></Field>
            <Field label="Google Maps Link" span2><Input type="url" value={form.glocationLink} onChange={setField("glocationLink")} /></Field>
            <Field label="Website Link"><Input type="url" value={form.websiteLink} onChange={setField("websiteLink")} /></Field>
            <Field label="Google Drive Link"><Input type="url" value={form.gdriveLink} onChange={setField("gdriveLink")} /></Field>
            <Field label="Managed By"><Input type="text" value={form.managedBy} onChange={setField("managedBy")} /></Field>
            <Field label="Authorised By"><Input type="text" value={form.authorisedBy} onChange={setField("authorisedBy")} /></Field>
            <Field label="Commission (Authorised Person)"><Input type="number" value={form.authorisedPersonCommission} onChange={setField("authorisedPersonCommission")} /></Field>
          </div>
        </div>

        {/* ── Section: Tenant Info ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={FileText} title="Tenant Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Tenant Name"><Input type="text" value={form.tenantName} onChange={setField("tenantName")} /></Field>
            <Field label="Tenant Mobile"><Input type="tel" value={form.tenantMobileNo} onChange={setField("tenantMobileNo")} /></Field>
            <Field label="Tenant Email"><Input type="email" value={form.tenantEmail} onChange={setField("tenantEmail")} /></Field>
            <Field label="Tenant Address" span2><Input type="text" value={form.tenantAddress} onChange={setField("tenantAddress")} /></Field>
          </div>
        </div>

        {/* ── Section: Financial & Rent Details ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Landmark} title="Financial & Rent Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Rent Type">
              <div className="relative">
                <Select options={RENT_TYPE_OPTS} value={form.rentType} onChange={setSelect("rentType")} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDownIcon /></span>
              </div>
            </Field>
            <Field label="Monthly Rent (₹)"><Input type="number" value={form.monthlyRent} onChange={setField("monthlyRent")} /></Field>
            <Field label="Increased Rent (₹)"><Input type="number" value={form.increasedRent} onChange={setField("increasedRent")} /></Field>
            <Field label="Deposit (₹)"><Input type="number" value={form.deposit} onChange={setField("deposit")} /></Field>
            <Field label="Maintenance Charges (₹)"><Input type="number" value={form.maintenanceCharges} onChange={setField("maintenanceCharges")} /></Field>
            <Field label="Municipal Tax (₹)"><Input type="number" value={form.municipalTax} onChange={setField("municipalTax")} /></Field>
            <Field label="CMA / CAM Charges (₹)"><Input type="number" value={form.cmaCharges} onChange={setField("cmaCharges")} /></Field>
            <Field label="GST Charges (₹)"><Input type="number" value={form.gstCharges} onChange={setField("gstCharges")} /></Field>
            <Field label="Water Charges (₹)"><Input type="number" value={form.waterCharges} onChange={setField("waterCharges")} /></Field>
            <Field label="MSEB Deposit (₹)"><Input type="number" value={form.msebDeposit} onChange={setField("msebDeposit")} /></Field>
            <Field label="Yearly Escalation (%)"><Input type="number" value={form.yearlyEscalationPercentage} onChange={setField("yearlyEscalationPercentage")} /></Field>
            <Field label="Escalation (%)"><Input type="number" value={form.escalationPercentage} onChange={setField("escalationPercentage")} /></Field>
            <Field label="Agent Details"><Input type="text" value={form.agentDetails} onChange={setField("agentDetails")} /></Field>
            <Field label="Agent Cost (₹)"><Input type="number" value={form.agentCost} onChange={setField("agentCost")} /></Field>
          </div>
        </div>

        {/* ── Section: Agreement Details ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={FileText} title="Agreement Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Agreement Start Date"><Input type="date" value={form.agreementDate} onChange={setField("agreementDate")} /></Field>
            <Field label="Agreement Expiry Date"><Input type="date" value={form.agreementExpiring} onChange={setField("agreementExpiring")} /></Field>
            <Field label="Agreement Years"><Input type="number" value={form.agreementYears} onChange={setField("agreementYears")} /></Field>
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
                setFullElectricityConsumers([...fullElectricityConsumers, { _id: `new-${Date.now()}`, consumerNo: "", consumerName: "", electricityProvider: "" }]);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={14} /> Add Consumer
            </button>
          } />

          <div className="mt-4 space-y-4">
            {fullElectricityConsumers.map((c, idx) => (
              <div key={idx} className="p-5 border border-gray-100 dark:border-white/[0.08] rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] space-y-4 relative group">
                <button
                  type="button"
                  onClick={() => {
                    if (c._id && !c._id.startsWith("new")) setRemovedConsumerIds(p => [...p, c._id]);
                    setFullElectricityConsumers(p => p.filter((_, i) => i !== idx));
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
                  <Field label="Consumer Number"><Input value={c.consumerNo} onChange={e => { const n = [...fullElectricityConsumers]; n[idx].consumerNo = e.target.value; setFullElectricityConsumers(n); }} /></Field>
                  <Field label="Consumer Name / Label"><Input value={c.consumerName} onChange={e => { const n = [...fullElectricityConsumers]; n[idx].consumerName = e.target.value; setFullElectricityConsumers(n); }} /></Field>
                  <Field label="Electricity Provider"><Input value={c.electricityProvider} onChange={e => { const n = [...fullElectricityConsumers]; n[idx].electricityProvider = e.target.value; setFullElectricityConsumers(n); }} /></Field>
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

          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl">
                <Users size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No owners added yet</p>
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
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">{a.ownerMobile || "No Mobile"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeAssignment(idx); }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
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
                            {/* <Plus size={12} /> Add Bank Account */}
                          </button>
                        </div>

                        {a.bankPayouts.map((bank, bIdx) => {
                          if (bank.isDeleted) return null;
                          return (
                            <div key={bIdx} className="relative p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/[0.06]">
                              <button
                                type="button"
                                onClick={() => removeBankPayout(idx, bIdx)}
                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-md"
                              >
                                {/* <Trash2 size={12} /> */}
                              </button>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Field label="Account Holder" required><Input required placeholder="Account Holder" value={bank.accountHolder} onChange={e => updateBankPayout(idx, bIdx, "accountHolder", e.target.value)} /></Field>
                                <Field label="Account Number" required><Input required placeholder="Account Number" value={bank.accountNo} onChange={e => updateBankPayout(idx, bIdx, "accountNo", e.target.value)} /></Field>
                                <Field label="Bank Name" required><Input required placeholder="Bank Name" value={bank.bankName} onChange={e => updateBankPayout(idx, bIdx, "bankName", e.target.value)} /></Field>
                                <Field label="IFSC Code" required><Input required placeholder="IFSC Code" value={bank.ifsc} onChange={e => updateBankPayout(idx, bIdx, "ifsc", e.target.value)} /></Field>
                                <Field label="Branch Name" required><Input required placeholder="Branch Name" value={bank.branchName} onChange={e => updateBankPayout(idx, bIdx, "branchName", e.target.value)} /></Field>
                                <Field label="Notes" span2><Input placeholder="Notes" value={bank.details} onChange={e => updateBankPayout(idx, bIdx, "details", e.target.value)} /></Field>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/[0.05] pt-6">
          <p />
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
            {submitting ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {submitting ? "Updating Configuration..." : "Save Changes"}
          </button>
        </div>
      </form>

      <OwnerModal isOpen={isNewOwnerModalOpen} onClose={() => setIsNewOwnerModalOpen(false)} onSave={handleNewOwnerSaved} />
    </div>
  );
}