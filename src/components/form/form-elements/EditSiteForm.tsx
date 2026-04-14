/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Users, FileText, Landmark, ChevronDown, ChevronUp, ArrowLeft, Edit, Trash2, Globe, MapPin, ExternalLink, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import Label from "../Label";
import { ChevronDownIcon } from "../../../icons";
import Badge from "@/components/ui/badge/Badge";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Centre { _id: string; name: string; shortCode?: string; }
interface BankAccount { _id: string; accountHolder: string; accountNo: string; bankName: string; ifsc: string; branchName?: string; details?: string; }
interface Owner { _id: string; ownerName: string; mobileNo: string; ownerDetails?: string; bankAccounts: BankAccount[]; }

interface ElectricityConsumer {
  consumerNo: string;
  consumerName: string;
  electricityProvider: string;
}

interface OwnerAssignment {
  ownerId: string;
  ownerName: string;
  ownershipPercentage: number;
  ownerMonthlyRent: number;
  ownerDetails?: string;
  ownerMobile?: string;
  bankAccounts: BankAccount[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" });

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

// ─── View Field wrapper ───────────────────────────────────────────────────────
function ViewField({ label, value, span2 = false, isLink = false }: { label: string; value: string | number | undefined | null; span2?: boolean; isLink?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="px-3 py-2 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-xl min-h-[38px] flex items-center">
        {isLink && value ? (
          <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
            {String(value).length > 40 ? String(value).substring(0, 40) + "..." : value}
            <ExternalLink size={12} />
          </a>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-200">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component: Site Details View ────────────────────────────────────────
export default function EditSiteForm() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<any>(null);
  const [owners, setOwners] = useState<OwnerAssignment[]>([]);
  const [consumers, setConsumers] = useState<ElectricityConsumer[]>([]);
  const [expandedOwners, setExpandedOwners] = useState<boolean[]>([]);
  const [expandedConsumers, setExpandedConsumers] = useState<boolean[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch Site Details ──────────────────────────────────────────────────────
  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const siteId = params.id;
      const res = await fetch(`${API}/api/rent/sites/${siteId}`, { headers: authHeaders() });
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to fetch site details");

      const siteData = json.data || json;
      setSite(siteData);

      // Map owners
      if (siteData.owners) {
        setOwners(siteData.owners.map((o: any) => {
          // Handle bankAccount as an array or object
          const b = o.bankAccount;
          const assignedBanks = Array.isArray(b) ? b : (b ? [b] : []);
          
          return {
            ownerName: o.ownerId?.ownerName || o.ownerName || "Unknown Owner",
            ownershipPercentage: o.ownershipPercentage || 0,
            ownerMonthlyRent: o.ownerMonthlyRent || 0,
            ownerMobile: o.ownerId?.mobileNo || o.ownerMobileNo || "",
            ownerDetails: o.ownerId?.ownerDetails || o.ownerDetails || "",
            bankAccounts: assignedBanks.length > 0 ? assignedBanks : (o.ownerId?.bankAccounts || []),
          };
        }));
        setExpandedOwners(siteData.owners.map(() => false));
      }

      // Map consumers
      if (siteData.electricityConsumers) {
        setConsumers(siteData.electricityConsumers);
        setExpandedConsumers(siteData.electricityConsumers.map(() => false));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { if (params.id) fetchDetails(); }, [params.id, fetchDetails]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/rent/sites/${params.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (res.ok) {
        toast.success("Site deleted successfully");
        router.push("/basic-tables");
      } else {
        const json = await res.json();
        throw new Error(json.message || "Failed to delete site");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm font-medium">Loading site details...</p>
    </div>
  );

  if (!site) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Site not found.</p>
      <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 px-4 sm:px-6">
      {/* ── Page Hero ── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Site Details</h2>
            <p className="text-indigo-100 text-sm mt-1">Comprehensive view of site configurations and assignments.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/sites/edit/${params.id}`)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg">
              <Edit size={12} /> Edit
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md border border-red-500/30 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg">
              <Trash2 size={12} /> Delete
            </button>
            <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
        
        {/* ── Section: Centre Assignment ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Building2} title="Centre Assignment" subtitle="Select the centre this site belongs to" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ViewField label="Centre" value={site.centreId?.name || "—"} />
          </div>
        </div>

        {/* ── Section: Basic Info ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Building2} title="Basic Site Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ViewField label="Site Code" value={site.code} />
            <ViewField label="Site Name" value={site.siteName} />
            <ViewField label="Site Mobile No." value={site.siteMobileNo} />
            <ViewField label="Property Type" value={site.propertyType} />
            <ViewField label="Status" value={site.status} />
            <ViewField label="Payment Day" value={site.paymentDay} />
            <ViewField label="Property Location" value={site.propertyLocation} />
            <ViewField label="Property Address" value={site.propertyAddress} />
            <ViewField label="City" value={site.city} />
            <ViewField label="Pincode" value={site.pincode} />
            <ViewField label="Area Size" value={site.areaSize} />
            <ViewField label="Unit (sq.ft / sq.m)" value={site.unit} />
            <ViewField label="Google Maps Link" value={site.glocationLink} isLink />
            <ViewField label="Website Link" value={site.websiteLink} isLink />
            <ViewField label="Google Drive Link" value={site.gdriveLink} isLink />
            <ViewField label="Managed By" value={site.managedBy} />
            <ViewField label="Authorised By" value={site.authorisedBy} />
            <ViewField label="Commission (Authorised Person)" value={site.authorisedPersonCommission ? `₹${site.authorisedPersonCommission}` : "—"} />
          </div>
        </div>

        {/* ── Section: Tenant Info ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={FileText} title="Tenant Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ViewField label="Tenant Name" value={site.tenantName} />
            <ViewField label="Tenant Mobile" value={site.tenantMobileNo} />
            <ViewField label="Tenant Email" value={site.tenantEmail} />
            <ViewField label="Tenant Address" value={site.tenantAddress} />
          </div>
        </div>

        {/* ── Section: Financial & Rent Details ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Landmark} title="Financial & Rent Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ViewField label="Rent Type" value={site.rentType} />
            <ViewField label="Monthly Rent (₹)" value={site.monthlyRent ? `₹${site.monthlyRent}` : "—"} />
            <ViewField label="Increased Rent (₹)" value={site.increasedRent ? `₹${site.increasedRent}` : "—"} />
            <ViewField label="Deposit (₹)" value={site.deposit ? `₹${site.deposit}` : "—"} />
            <ViewField label="Maintenance Charges (₹)" value={site.maintenanceCharges ? `₹${site.maintenanceCharges}` : "—"} />
            <ViewField label="Municipal Tax (₹)" value={site.municipalTax ? `₹${site.municipalTax}` : "—"} />
            <ViewField label="CMA / CAM Charges (₹)" value={site.cmaCharges ? `₹${site.cmaCharges}` : "—"} />
            <ViewField label="GST Charges (₹)" value={site.gstCharges ? `₹${site.gstCharges}` : "—"} />
            <ViewField label="Water Charges (₹)" value={site.waterCharges ? `₹${site.waterCharges}` : "—"} />
            <ViewField label="MSEB Deposit (₹)" value={site.msebDeposit ? `₹${site.msebDeposit}` : "—"} />
            <ViewField label="Yearly Escalation (%)" value={site.yearlyEscalationPercentage ? `${site.yearlyEscalationPercentage}%` : "—"} />
            <ViewField label="Escalation (%)" value={site.escalationPercentage ? `${site.escalationPercentage}%` : "—"} />
            <ViewField label="Agent Details" value={site.agentDetails} />
            <ViewField label="Agent Cost (₹)" value={site.agentCost ? `₹${site.agentCost}` : "—"} />
          </div>
        </div>

        {/* ── Section: Agreement Details ── */}
        </div>
        <div className="space-y-6">
        {/* ── Section: Agreement Details ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={FileText} title="Agreement Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ViewField label="Agreement Start Date" value={site.agreementDate ? site.agreementDate.split('T')[0] : "—"} />
            <ViewField label="Agreement Expiry Date" value={site.agreementExpiring ? site.agreementExpiring.split('T')[0] : "—"} />
            <ViewField label="Agreement Years" value={site.agreementYears ? `${site.agreementYears} Years` : "—"} />
            <ViewField label="Rent Start Date" value={site.rentStartDate ? site.rentStartDate.split('T')[0] : "—"} />
            <ViewField label="Fitout Date" value={site.fitoutTime ? site.fitoutTime.split('T')[0] : "—"} />
          </div>
        </div>

        {/* ── Section: Electricity Consumers ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Zap} title="Electricity Consumers" />
          {consumers.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl">
               <p className="text-sm text-gray-400 font-medium">No electricity consumers found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {consumers.map((c, idx) => (
                <div key={idx} className="p-5 border border-gray-100 dark:border-white/[0.08] rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">{c.consumerNo || "—"}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.electricityProvider || "Provider TBD"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ViewField label="Consumer Number" value={c.consumerNo} />
                    <ViewField label="Consumer Name / Label" value={c.consumerName} />
                    <ViewField label="Electricity Provider" value={c.electricityProvider} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section: Owner Assignments ── */}
        <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Users} title="Owner Assignments" />
          <div className="space-y-4">
            {owners.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl">
                <Users size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No owners assigned</p>
              </div>
            ) : (
              owners.map((o, idx) => (
                <div key={idx} className="border border-gray-100 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900/50">
                  <div
                    className="flex items-center justify-between px-5 py-4 bg-gray-50/50 dark:bg-white/[0.02] cursor-pointer group/header"
                    onClick={() => setExpandedOwners(prev => { const n = [...prev]; n[idx] = !n[idx]; return n; })}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shadow-inner group-hover/header:scale-110 transition-transform">
                        {o.ownerName ? o.ownerName.charAt(0).toUpperCase() : <Users size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">{o.ownerName || "—"}</p>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">{o.ownerMobile || "No Mobile"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Monthly Rent</p>
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{o.ownerMonthlyRent?.toLocaleString()}</p>
                      </div>
                      <div className={`p-1.5 rounded-lg transition-colors ${expandedOwners[idx] ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
                        {expandedOwners[idx] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {expandedOwners[idx] && (
                    <div className="p-5 space-y-6 border-t border-gray-50 dark:border-white/[0.02]">
                      <div>
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-white/[0.04] pb-2">
                          <Users size={14} className="text-indigo-500" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Identity</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ViewField label="Owner Name" value={o.ownerName} />
                          <ViewField label="Mobile No." value={o.ownerMobile} />
                          <ViewField label="Monthly Rent (₹)" value={o.ownerMonthlyRent} />
                          <ViewField label="Address / Remarks" value={o.ownerDetails} />
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 group/bank">
                            <Landmark size={14} className="text-indigo-500 transition-transform" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bank Payout Configuration</span>
                          </div>
                        </div>

                        {o.bankAccounts && o.bankAccounts.length > 0 ? (
                          o.bankAccounts.map((bank, bIdx) => (
                            <div key={bIdx} className="relative p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/[0.06]">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <ViewField label="Account Holder" value={bank.accountHolder} />
                                <ViewField label="Account Number" value={bank.accountNo} />
                                <ViewField label="Bank Name" value={bank.bankName} />
                                <ViewField label="IFSC Code" value={bank.ifsc} />
                                <ViewField label="Branch Name" value={bank.branchName} />
                                <ViewField label="Notes" value={bank.details} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl bg-gray-50/50 dark:bg-white/[0.01]">
                            <p className="text-xs text-gray-400 font-medium">No bank accounts assigned.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-white/[0.06]">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Delete Site?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-white">"{site.siteName}"</span>? This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.1] transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}