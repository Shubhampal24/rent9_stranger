"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Download, Search, FileSpreadsheet, Loader2, ChevronDown, ChevronRight, Building2, User, Calendar, Clock, IndianRupee, CheckCircle2, Hash } from "lucide-react";
import { toast } from "react-hot-toast";

interface Transaction {
  id: string;
  category: "Rent" | "Electricity" | "Maintenance";
  siteCode: string;
  siteName: string;
  ownerName: string;
  monthYear: string;
  paymentDate: string;
  amount: number;
  status: string;
  reference: string;
}

interface Props {
  title: string;
  filterStatus?: string;
}

export default function UnifiedTransactionTable({ title, filterStatus }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  // All sections open by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Rent: true,
    Electricity: true,
    Maintenance: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const fetchCategory = async (path: string, categoryName: string) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { headers });
          if (!res.ok) return [];
          const text = await res.text();
          if (!text) return [];
          const json = JSON.parse(text);
          return json.data || json.rentPayments || json.transactions || (Array.isArray(json) ? json : []);
        } catch (error) {
          return [];
        }
      };

      const [rentRaw, elecRaw, maintRaw] = await Promise.all([
        fetchCategory("/api/rent/rentTransactions/site/all", "Rent"),
        fetchCategory("/api/rent/electricityTransactions/site/all", "Electricity"),
        fetchCategory("/api/rent/maintenanceTransactions/site/all", "Maintenance"),
      ]);

      const rentData = rentRaw.map((t: any) => ({
        id: t._id || t.id,
        category: "Rent" as const,
        siteCode: t.siteId?.code || t.siteCode || "-",
        siteName: t.siteId?.siteName || t.siteName || "-",
        ownerName: t.ownerId?.ownerName || t.ownerName || t.siteId?.ownerName || t.siteId?.owner_name || "-",
        monthYear: t.monthYear || "-",
        paymentDate: t.paymentDate || "",
        amount: Number(t.paymentAmount) || 0,
        status: t.paidStatus || "Pending",
        reference: t.utrNumber || t.utr_number || t.transactionId || t.reference || "-",
      }));

      const elecData = elecRaw.map((t: any) => ({
        id: t._id || t.id,
        category: "Electricity" as const,
        siteCode: t.siteId?.code || t.siteCode || t.site_code || "-",
        siteName: t.siteId?.siteName || t.siteName || t.site_name || "-",
        ownerName: t.ownerId?.ownerName || t.ownerName || t.siteId?.ownerName || t.siteId?.owner_name || "-",
        monthYear: t.monthYear || "-",
        paymentDate: t.paymentDate || "",
        amount: Number(t.paymentAmount) || Number(t.monthly_amount) || 0,
        status: t.paidStatus || "Pending",
        reference: t.utrNumber || t.utr_number || t.transactionId || t.reference || "-",
      }));

      const maintData = maintRaw.map((t: any) => ({
        id: t._id || t.id,
        category: "Maintenance" as const,
        siteCode: t.siteId?.code || t.siteCode || t.site_code || "-",
        siteName: t.siteId?.siteName || t.siteName || t.site_name || "-",
        ownerName: t.ownerId?.ownerName || t.ownerName || t.siteId?.ownerName || t.siteId?.owner_name || "-",
        monthYear: t.monthYear || "-",
        paymentDate: t.paymentDate || "",
        amount: Number(t.paymentAmount) || 0,
        status: t.paidStatus || "Pending",
        reference: t.utrNumber || t.utr_number || t.transactionId || t.reference || "-",
      }));

      let combined = [...rentData, ...elecData, ...maintData];

      // --- DATA PATCHING LOGIC (Owner Name & Site Name) ---
      // Build a map of Site Code -> { siteName, ownerName } from entries that have data
      const siteInfoMap: Record<string, { siteName: string; ownerName: string }> = {};
      combined.forEach(t => {
        if (t.siteCode !== "-") {
          if (!siteInfoMap[t.siteCode]) {
            siteInfoMap[t.siteCode] = { siteName: t.siteName, ownerName: t.ownerName };
          } else {
            // Update if we find a version with more data
            if (siteInfoMap[t.siteCode].ownerName === "-" && t.ownerName !== "-") {
              siteInfoMap[t.siteCode].ownerName = t.ownerName;
            }
            if (siteInfoMap[t.siteCode].siteName === "-" && t.siteName !== "-") {
              siteInfoMap[t.siteCode].siteName = t.siteName;
            }
          }
        }
      });

      // Apply the map back to entries missing data
      combined = combined.map(t => {
        if (t.siteCode !== "-" && siteInfoMap[t.siteCode]) {
          return {
            ...t,
            siteName: t.siteName === "-" ? siteInfoMap[t.siteCode].siteName : t.siteName,
            ownerName: t.ownerName === "-" ? siteInfoMap[t.siteCode].ownerName : t.ownerName
          };
        }
        return t;
      });
      if (filterStatus) {
        combined = combined.filter(t => t.status.toLowerCase() === filterStatus.toLowerCase());
      }

      setData(combined.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const groupedData = useMemo(() => {
    const search = searchTerm.toLowerCase();
    const filtered = data.filter(t =>
      t.siteName.toLowerCase().includes(search) ||
      t.siteCode.toLowerCase().includes(search) ||
      t.ownerName.toLowerCase().includes(search) ||
      t.reference.toLowerCase().includes(search) ||
      t.monthYear.toLowerCase().includes(search)
    );

    return {
      Rent: filtered.filter(t => t.category === "Rent"),
      Electricity: filtered.filter(t => t.category === "Electricity"),
      Maintenance: filtered.filter(t => t.category === "Maintenance")
    };
  }, [data, searchTerm]);

  const toggleCategory = (cat: string) => {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleExport = () => {
    const flat = [...groupedData.Rent, ...groupedData.Electricity, ...groupedData.Maintenance];
    const headers = ["Category", "Site", "Owner", "Period", "Date", "Amount", "Status", "Reference"];
    const csvContent = [
      headers.join(","),
      ...flat.map(t => [
        t.category,
        `"${t.siteName} (${t.siteCode})"`,
        `"${t.ownerName}"`,
        t.monthYear,
        t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : "-",
        t.amount,
        t.status,
        t.reference
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}.csv`);
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-4 bg-white dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05] gap-4">
        <div>
          <h2 className="text-base font-bold uppercase tracking-tight text-gray-800 dark:text-white/90">{title}</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Filter master ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button onClick={handleExport} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 w-full sm:w-auto" title="Export CSV">
            <FileSpreadsheet size={18} />
            <span>EXCEL EXPORT</span>
          </button>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/20 overflow-hidden shadow-sm">
        <Table className="w-full border-collapse">
          <TableHeader className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
            <TableRow className="h-10">
              <TableCell className="w-10 py-0 px-3 text-[10px] font-bold uppercase text-gray-400 text-center">{" "}</TableCell>
              <TableCell className="py-0 px-3 text-[10px] font-bold uppercase text-gray-400">
                <div className="flex items-center gap-1.5"><Building2 size={12} strokeWidth={2.5} /> Site Info</div>
              </TableCell>
              <TableCell className="py-0 px-3 text-[10px] font-bold uppercase text-gray-400">
                <div className="flex items-center gap-1.5"><User size={12} strokeWidth={2.5} /> Owner Name</div>
              </TableCell>
              <TableCell className="py-0 px-3 text-[10px] font-bold uppercase text-gray-400 text-center">
                <div className="flex items-center justify-center gap-1.5"><Calendar size={12} strokeWidth={2.5} /> Period</div>
              </TableCell>
              <TableCell className="py-0 px-3 text-[10px] font-bold uppercase text-gray-400 text-center">
                <div className="flex items-center justify-center gap-1.5"><Clock size={12} strokeWidth={2.5} /> Date</div>
              </TableCell>
              <TableCell className="py-0 px-3 text-[10px] font-bold uppercase text-gray-400 text-right">
                <div className="flex items-center justify-end gap-1.5"><IndianRupee size={12} strokeWidth={2.5} /> Amount</div>
              </TableCell>
              <TableCell className="py-0 px-3 text-[10px] font-bold uppercase text-gray-400 text-center">
                 <div className="flex items-center justify-center gap-1.5"><CheckCircle2 size={12} strokeWidth={2.5} /> Status</div>
              </TableCell>
              <TableCell className="py-0 px-3 text-[10px] font-bold uppercase text-gray-400">
                <div className="flex items-center gap-1.5"><Hash size={12} strokeWidth={2.5} /> Reference</div>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-20 text-base font-bold text-gray-400 tracking-wider">AGGREGATING MASTER LEDGER RECORDS...</TableCell></TableRow>
            ) : (Object.entries(groupedData).map(([cat, items]) => (
              <React.Fragment key={cat}>
                {/* Category Group Header */}
                <TableRow 
                  className="bg-gray-100/50 dark:bg-white/[0.03] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 border-y border-gray-200 dark:border-white/5 h-10"
                  onClick={() => toggleCategory(cat)}
                >
                  <TableCell className="py-0 px-3 text-center">
                    <div className="flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                      {expanded[cat] ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
                    </div>
                  </TableCell>
                  <TableCell colSpan={7} className="py-0 px-3">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{cat}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold text-gray-400 bg-gray-200/50 dark:bg-white/5 rounded-full">{items.length} TOTAL</span>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Responsive Records */}
                {expanded[cat] && items.length > 0 ? (
                  items.map(t => (
                    <TableRow key={`${t.category}-${t.id}`} className="hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 transition-colors">
                      <TableCell className="py-1.5 px-3 text-center">{" "}</TableCell>
                      <TableCell className="py-1.5 px-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{t.siteName}</span>
                          <span className="text-[11px] text-gray-400 font-mono uppercase tracking-tight mt-0.5">{t.siteCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                         <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{t.ownerName}</span>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{t.monthYear}</TableCell>
                      <TableCell className="py-1.5 px-3 text-center text-xs text-gray-500 dark:text-gray-400">
                        {t.paymentDate ? new Date(t.paymentDate).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">₹{t.amount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${t.status.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                          {t.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 truncate max-w-[180px] text-[10px] font-mono text-gray-400 group hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title={t.reference}>
                        {t.reference}
                      </TableCell>
                    </TableRow>
                  ))
                ) : expanded[cat] && (
                  <TableRow className="h-14">
                    <TableCell colSpan={8} className="py-0 px-12 text-sm italic text-gray-400">No records found for this category.</TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )))}
          </TableBody>
        </Table>
      </div>

      {/* Simplified Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm gap-4">
        <div className="flex gap-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Count: {Object.values(groupedData).flat().length}</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Aggregate Sum:</span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">₹{Object.values(groupedData).flat().reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}


