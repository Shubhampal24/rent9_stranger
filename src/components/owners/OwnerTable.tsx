"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Search, Plus, ChevronLeft, ChevronRight, Landmark, Phone, RefreshCw, Building2 } from "lucide-react";
import OwnerModal from "./OwnerModal";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BankAccount {
  _id: string;
  accountHolder: string;
  accountNo: string;
  bankName: string;
  ifsc: string;
  branchName?: string;
  details?: string;
}

interface Owner {
  _id: string;
  ownerName: string;
  mobileNo: string;
  ownerDetails?: string;
  bankAccounts: BankAccount[];
  createdAt?: string;
}

// ─── Small helpers ────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

// ─── Bank chip ────────────────────────────────────────────────────────────────
function BankChip({ bank }: { bank: BankAccount }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 px-2 py-1 rounded-lg text-xs">
      <Landmark size={10} className="text-indigo-500 flex-shrink-0" />
      <span className="font-semibold text-indigo-700 dark:text-indigo-300 truncate max-w-[80px]">{bank.bankName}</span>
      <span className="text-indigo-400">·</span>
      <span className="text-indigo-500 dark:text-indigo-400 font-mono truncate max-w-[80px]">
        {"••" + bank.accountNo.slice(-4)}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OwnerTable() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOwner, setCurrentOwner] = useState<Owner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const LIMIT = 10;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOwners = useCallback(async (pg = 1) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API}/api/rent/owners/?page=${pg}&limit=${LIMIT}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      const rows: Owner[] = json.data ?? json ?? [];
      setOwners(rows);
      setTotal(json.total ?? rows.length);
      setTotalPages(json.totalPages ?? 1);
      setPage(pg);
    } catch {
      toast.error("Failed to load owners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOwners(1); }, [fetchOwners]);

  // ── Save (Create / Update) ─────────────────────────────────────────────────
  const handleSave = async (formData: any) => {
    try {
      const isUpdate = !!currentOwner;
      const ownerId = currentOwner?._id;
      
      const url = isUpdate
        ? `${API}/api/rent/owners/${ownerId}`
        : `${API}/api/rent/owners/`;
      const method = isUpdate ? "PUT" : "POST";

      // 1. Save / Update Owner Profile (Basic info)
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ownerName: formData.ownerName,
          mobileNo: formData.mobileNo,
          ownerDetails: formData.ownerDetails,
          // For creation, backend supports first bank info in same payload
          ...(isUpdate ? {} : (formData.bankAccounts?.[0] || {}))
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to save owner info");
      }

      const savedResponse = await res.json();
      const finalOwnerId = ownerId || savedResponse.data?._id;

      // 2. Handle Bank Accounts Synchronization (If it's an update or multiple banks added)
      if (finalOwnerId && formData.bankAccounts) {
        const currentBanks = formData.bankAccounts;
        const initialBanks = currentOwner?.bankAccounts || [];

        // a. Find banks to DELETE (Initially present but now missing)
        const banksToRemove = initialBanks.filter(
          (ib: any) => !currentBanks.some((cb: any) => cb._id === ib._id)
        );
        for (const bank of banksToRemove) {
          await fetch(`${API}/api/rent/owners/${finalOwnerId}/bank-accounts/${bank._id}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
        }

        // b. Find banks to UPDATE or ADD
        for (const [idx, bank] of currentBanks.entries()) {
          // If it's a NEW owner, the 1st bank was already handled in Step 1
          if (!isUpdate && idx === 0) continue; 

          const bankPayload = {
            accountHolder: bank.accountHolder,
            accountNo: bank.accountNo,
            bankName: bank.bankName,
            ifsc: bank.ifsc,
            branchName: bank.branchName,
            details: bank.details,
          };

          if (bank._id) {
            // Existing -> Update
            await fetch(`${API}/api/rent/owners/${finalOwnerId}/bank-accounts/${bank._id}`, {
              method: "PUT",
              headers: authHeaders(),
              body: JSON.stringify(bankPayload),
            });
          } else {
            // New -> Create
            await fetch(`${API}/api/rent/owners/${finalOwnerId}/bank-accounts`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify(bankPayload),
            });
          }
        }
      }

      toast.success(isUpdate ? "Owner and bank accounts updated!" : "Owner added successfully!");
      fetchOwners(page);
    } catch (e: any) {
      console.error("Save error:", e);
      toast.error(e.message ?? "An error occurred while saving");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/rent/owners/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success("Owner deleted");
      setDeleteConfirm(null);
      fetchOwners(page);
    } catch {
      toast.error("Failed to delete owner");
    }
  };

  // ── Filter (client-side on top of paginated data) ─────────────────────────
  const filtered = owners.filter(
    (o) =>
      o.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.mobileNo?.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => fetchOwners(page)}
            className="p-2 border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors bg-white dark:bg-transparent"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => { setCurrentOwner(null); setIsModalOpen(true); }}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus size={15} /> Add Owner
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500">
        {loading ? "Loading…" : `${total} owner${total !== 1 ? "s" : ""} total • Showing page ${page} of ${totalPages}`}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Owner</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Bank Accounts</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Remarks</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 dark:bg-white/[0.05] rounded animate-pulse" style={{ width: j === 0 ? 24 : j === 5 ? 60 : '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Building2 size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                    <p className="text-gray-400 font-medium">No owners found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((owner, idx) => (
                  <tr key={owner._id} className="hover:bg-indigo-50/40 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * LIMIT + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs flex-shrink-0">
                          {owner.ownerName?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{owner.ownerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <Phone size={12} className="text-gray-400" />
                        {owner.mobileNo || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {owner.bankAccounts?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {owner.bankAccounts.map((b) => (
                            <BankChip key={b._id} bank={b} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">No bank linked</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                      {owner.ownerDetails || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setCurrentOwner(owner); setIsModalOpen(true); }}
                          title="Edit"
                          className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        {deleteConfirm === owner._id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button onClick={() => handleDelete(owner._id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(owner._id)} title="Delete" className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchOwners(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => fetchOwners(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <OwnerModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCurrentOwner(null); }}
        onSave={handleSave}
        initialData={currentOwner}
      />
    </div>
  );
}
