"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Search, Plus, ChevronLeft, ChevronRight, Zap, RefreshCw, Building2, RotateCcw, Landmark } from "lucide-react";
import ConsumerModal from "./ConsumerModal";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Site {
  _id: string;
  siteName: string;
  code: string;
}

interface Consumer {
  _id: string;
  consumerNo: string;
  consumerName: string;
  electricityProvider: string;
  isActive: boolean;
  siteId?: Site | string | any;
}

const API = process.env.NEXT_PUBLIC_API_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

// ─── Site Chip ───────────────────────────────────────────────────────────────
function SiteChip({ site }: { site: any }) {
  if (!site) return <span className="text-xs text-gray-300 dark:text-gray-600 italic">Not Assigned</span>;
  const name = typeof site === "object" ? site.siteName : "Assigned";
  const code = typeof site === "object" ? site.code : "";

  return (
    <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 px-2 py-1 rounded-lg text-xs">
      <Building2 size={10} className="text-indigo-500 flex-shrink-0" />
      <span className="font-semibold text-indigo-700 dark:text-indigo-300 truncate max-w-[120px]">{name}</span>
      {code && <span className="text-indigo-400 font-mono text-[10px]">({code})</span>}
    </div>
  );
}

export default function ConsumerTable() {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConsumer, setCurrentConsumer] = useState<Consumer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const LIMIT = 10;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchConsumers = useCallback(async (pg = 1) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API}/api/rent/siteConsumer/all?page=${pg}&limit=${LIMIT}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      const rows: Consumer[] = json.data ?? json ?? [];
      setConsumers(rows);
      setTotal(json.total ?? rows.length);
      setTotalPages(json.totalPages ?? 1);
      setPage(pg);
    } catch {
      toast.error("Failed to load consumers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConsumers(1); }, [fetchConsumers]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (payload: any) => {
    try {
      const isUpdate = !!currentConsumer;
      const url = isUpdate 
        ? `${API}/api/rent/siteConsumer/${currentConsumer._id}`
        : `${API}/api/rent/siteConsumer`;
      
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save consumer");
      }

      toast.success(isUpdate ? "Consumer updated!" : "Consumer added!");
      fetchConsumers(page);
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ── Delete / Restore ───────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/rent/siteConsumer/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success("Consumer deactivated");
      setDeleteConfirm(null);
      fetchConsumers(page);
    } catch {
      toast.error("Failed to deactivate consumer");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/rent/siteConsumer/${id}/restore`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success("Consumer restored");
      fetchConsumers(page);
    } catch {
      toast.error("Failed to restore consumer");
    }
  };

  const filtered = consumers.filter(c => 
    c.consumerNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.consumerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.electricityProvider?.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search consumers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => fetchConsumers(page)}
            className="p-2 border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors bg-white dark:bg-transparent shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => { setCurrentConsumer(null); setIsModalOpen(true); }}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus size={15} /> Add Consumer
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500">
        {loading ? "Loading…" : `${total} consumer${total !== 1 ? "s" : ""} total • Showing page ${page} of ${totalPages}`}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Consumer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Meter No / CID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Provider</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Assigned Site</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 dark:bg-white/[0.05] rounded shadow-sm" style={{ width: j === 0 ? 24 : '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Building2 size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                    <p className="text-gray-400 font-medium">No consumers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={c._id} className="hover:bg-indigo-50/40 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * LIMIT + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs flex-shrink-0">
                          {c.consumerName?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{c.consumerName || "Unnamed Consumer"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <Zap size={12} className="text-indigo-500/70" />
                        <span className="font-mono tracking-tight">{c.consumerNo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                       <div className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.03] px-2 py-1 rounded-lg text-xs">
                          <Landmark size={10} className="text-gray-400" />
                          <span className="font-bold text-gray-500 uppercase tracking-tight">{c.electricityProvider || "MSEB"}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3">
                      <SiteChip site={c.siteId} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setCurrentConsumer(c); setIsModalOpen(true); }}
                          title="Edit"
                          className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        
                        {c.isActive ? (
                           <>
                             {deleteConfirm === c._id ? (
                                <div className="flex items-center gap-1 ml-1">
                                  <button onClick={() => handleDelete(c._id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Yes</button>
                                  <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">No</button>
                                </div>
                             ) : (
                                <button onClick={() => setDeleteConfirm(c._id)} title="Deactivate" className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                             )}
                           </>
                        ) : (
                           <button onClick={() => handleRestore(c._id)} title="Restore" className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                             <RotateCcw size={14} />
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
            <span className="text-xs text-gray-400 text-[10px] uppercase font-bold tracking-widest leading-none">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchConsumers(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors shadow-sm"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => fetchConsumers(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors shadow-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConsumerModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCurrentConsumer(null); }}
        onSave={handleSave}
        initialData={currentConsumer}
      />
    </div>
  );
}
