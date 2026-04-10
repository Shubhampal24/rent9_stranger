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
      console.log("🚀 [Site Details] Data:", json);

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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── Page Hero ── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Building2 size={120} />
        </div>
        
        {/* Banner Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <button onClick={() => router.push(`/sites/edit/${params.id}`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg">
            <Edit size={12} /> Edit Site
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md border border-red-500/30 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg">
            <Trash2 size={12} /> Delete
          </button>
        </div>

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] uppercase font-black tracking-widest">{site.code || "No Code"}</span>
              <Badge size="sm" color={site.status === "active" ? "success" : "warning"}>{site.status || "Unknown Status"}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{site.siteName}</h1>
            <div className="flex items-center gap-4 mt-2 text-indigo-100 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {site.pincode ? `${site.city}, ${site.pincode}` : site.city || "No Location"}
              </span>
              <span className="flex items-center gap-1.5 uppercase font-bold text-[10px] px-2 py-0.5 bg-black/10 rounded">
                <Building2 size={12} /> {site.propertyType || "Other"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs uppercase font-bold tracking-widest mb-1">Total Monthly Rent</p>
            <p className="text-3xl font-black">₹{site.monthlyRent?.toLocaleString() || "0"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          {/* ── Section: Site Metadata ── */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={Building2} title="Site Metadata" subtitle="Core identifiers and location details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ViewField label="Centre" value={site.centreId?.name || "—"} />
              <ViewField label="Site Code" value={site.code} />
              <ViewField label="Site Name" value={site.siteName} />
              <ViewField label="Property Type" value={site.propertyType} />
              <ViewField label="Managed By" value={site.managedBy} />
              <ViewField label="Payment Day" value={site.paymentDay ? `Day ${site.paymentDay}` : "—"} />
              <ViewField label="City" value={site.city} />
              <ViewField label="Pincode" value={site.pincode} />
              <ViewField label="Area Size" value={site.areaSize} />
              <ViewField label="Unit" value={site.unit} />
              <ViewField label="Property Location" value={site.propertyLocation} span2 />
              <ViewField label="Property Address" value={site.propertyAddress} span2 />
            </div>

            <div className="mt-8 border-t border-gray-50 dark:border-white/[0.03] pt-6">
              <SectionHeader icon={Globe} title="Digital & Contacts" subtitle="Links and communication" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <ViewField label="Site Mobile No." value={site.siteMobileNo} />
                <ViewField label="Website Link" value={site.websiteLink} isLink />
              </div>
              <div className="flex gap-3">
                {site.glocationLink && (
                  <a href={site.glocationLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/40 active:scale-95">
                    <MapPin size={14} /> Google Maps <ExternalLink size={12} />
                  </a>
                )}
                {site.gdriveLink && (
                  <a href={site.gdriveLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/40 active:scale-95">
                    <FileText size={14} /> Google Drive Link <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── Section: Tenant Info ── */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={Users} title="Tenant Information" subtitle="Current occupancy details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ViewField label="Tenant Name" value={site.tenantName} />
              <ViewField label="Tenant Mobile" value={site.tenantMobileNo} />
              <ViewField label="Tenant Email" value={site.tenantEmail} />
              <ViewField label="Tenant Address" value={site.tenantAddress} span2 />
            </div>
          </div>

          {/* ── Section: Statutory & Financials ── */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={Landmark} title="Statutory & Additional" subtitle="Taxes, cesses and charges" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ViewField label="Maintenance Charges (₹)" value={site.maintenanceCharges ? `₹${site.maintenanceCharges.toLocaleString()}` : "₹0"} />
              <ViewField label="Municipal Tax (₹)" value={site.municipalTax ? `₹${site.municipalTax.toLocaleString()}` : "₹0"} />
              <ViewField label="CMA / CAM Charges (₹)" value={site.cmaCharges ? `₹${site.cmaCharges.toLocaleString()}` : "₹0"} />
              <ViewField label="GST Charges (₹)" value={site.gstCharges ? `₹${site.gstCharges.toLocaleString()}` : "₹0"} />
              <ViewField label="Water Charges (₹)" value={site.waterCharges ? `₹${site.waterCharges.toLocaleString()}` : "₹0"} />
              <ViewField label="MSEB Deposit (₹)" value={site.msebDeposit ? `₹${site.msebDeposit.toLocaleString()}` : "₹0"} />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* ── Section: Financial & Agreement ── */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={FileText} title="Financial & Agreement" subtitle="Rent and structural details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ViewField label="Monthly Rent (₹)" value={site.monthlyRent ? `₹${site.monthlyRent.toLocaleString()}` : "—"} />
              <ViewField label="Increased Rent (₹)" value={site.increasedRent ? `₹${site.increasedRent.toLocaleString()}` : "—"} />
              <ViewField label="Deposit (₹)" value={site.deposit ? `₹${site.deposit.toLocaleString()}` : "—"} />
              <ViewField label="Rent Type" value={site.rentType} />
              <ViewField label="Yearly Escalation (%)" value={site.yearlyEscalationPercentage ? `${site.yearlyEscalationPercentage}%` : "0%"} />
              <ViewField label="Escalation (%)" value={site.escalationPercentage ? `${site.escalationPercentage}%` : "0%"} />
              <ViewField label="Agreement Start Date" value={site.agreementDate ? site.agreementDate.split('T')[0] : "—"} />
              <ViewField label="Agreement Expiry Date" value={site.agreementExpiring ? site.agreementExpiring.split('T')[0] : "—"} />
              <ViewField label="Agreement Years" value={site.agreementYears ? `${site.agreementYears} Years` : "—"} />
              <ViewField label="Rent Start Date" value={site.rentStartDate ? site.rentStartDate.split('T')[0] : "—"} />
              <ViewField label="Fitout Date" value={site.fitoutTime ? site.fitoutTime.split('T')[0] : "—"} />
            </div>
          </div>

          {/* ── Section: Authority & Agency ── */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={Building2} title="Authority & Agency" subtitle="Approvals and facilitation" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ViewField label="Authorised By" value={site.authorisedBy} />
              <ViewField label="Commission (Authorised Person)" value={site.authorisedPersonCommission ? `₹${site.authorisedPersonCommission.toLocaleString()}` : "₹0"} />
              <ViewField label="Agent Cost (₹)" value={site.agentCost ? `₹${site.agentCost.toLocaleString()}` : "₹0"} />
              <ViewField label="Agent Details" value={site.agentDetails} span2 />
            </div>
          </div>

          {/* ── Section: Owner Assignments ── */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={Users} title="Ownership Shares" subtitle={`${owners.length} registered owners`} />
            <div className="space-y-3">
              {owners.map((o, idx) => (
                <div key={idx} className="border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden group/owner">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-white/[0.01] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                    onClick={() => setExpandedOwners(prev => { const n = [...prev]; n[idx] = !n[idx]; return n; })}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase shadow-sm group-hover/owner:rotate-6 transition-transform">
                        {o.ownerName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">{o.ownerName}</p>
                        <div className="flex items-center gap-2">
                          {o.ownerMobile && (
                            <p className="text-[10px] text-gray-400 font-medium">{o.ownerMobile}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Payout</p>
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{o.ownerMonthlyRent?.toLocaleString()}</p>
                      </div>
                      <div className={`p-1.5 rounded-lg transition-colors ${expandedOwners[idx] ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
                        {expandedOwners[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>
                  {expandedOwners[idx] && (
                    <div className="p-4 bg-white dark:bg-gray-900/50 space-y-4 animate-in slide-in-from-top-2 duration-200 border-t border-gray-50 dark:border-white/[0.02]">
                      {o.ownerDetails && (
                        <div className="px-3 py-2 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-500/10 rounded-xl">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Address / Remarks</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 italic font-medium">{o.ownerDetails}</p>
                        </div>
                      )}
                      {o.bankAccounts && o.bankAccounts.length > 0 ? (
                        <div className="space-y-4">
                          {o.bankAccounts.map((bank, bIdx) => (
                            <div key={bIdx} className="relative p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/[0.06]">
                              {o.bankAccounts.length > 1 && (
                                <div className="absolute -top-2.5 -left-2 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                  #{bIdx + 1}
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                                <ViewField label="Bank Name" value={bank.bankName} />
                                <ViewField label="Account Holder" value={bank.accountHolder} />
                                <ViewField label="Account No" value={bank.accountNo} />
                                <ViewField label="IFSC Code" value={bank.ifsc} />
                                <ViewField label="Branch Name" value={bank.branchName} />
                                <ViewField label="Notes" value={bank.details} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl">
                           <p className="text-xs text-gray-400 font-medium">No bank accounts assigned.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Section: Electricity ── */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={Landmark} title="Electricity Consumers" subtitle={`${consumers.length} registered consumer(s)`} />
            {consumers.length === 0 ? (
              <div className="py-4 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl">
                 <p className="text-xs text-gray-400 font-medium">No electricity consumers found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {consumers.map((c, i) => (
                  <div key={i} className="border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden group/consumer">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-white/[0.01] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                      onClick={() => setExpandedConsumers(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-sm group-hover/consumer:rotate-6 transition-transform">
                          <Zap size={18} fill="currentColor" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">{c.consumerNo}</p>
                          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{c.electricityProvider || "General Meter"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`p-1.5 rounded-lg transition-colors ${expandedConsumers[i] ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
                          {expandedConsumers[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>
                    {expandedConsumers[i] && (
                      <div className="p-4 bg-white dark:bg-gray-900/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200 border-t border-gray-50 dark:border-white/[0.02]">
                        <ViewField label="Consumer Name" value={c.consumerName} />
                        <ViewField label="Consumer Number" value={c.consumerNo} />
                        <ViewField label="Electricity Provider" value={c.electricityProvider || "N/A"} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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