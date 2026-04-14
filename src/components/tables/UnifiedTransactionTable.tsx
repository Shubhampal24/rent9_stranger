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
import { Search, FileSpreadsheet, Building2, User, Calendar, Clock, IndianRupee, CheckCircle2, Hash, Layers } from "lucide-react";
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
  filterCategory?: "Rent" | "Electricity" | "Maintenance";
  siteId?: string;
}

export default function UnifiedTransactionTable({ title, filterStatus, filterCategory, siteId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    console.log("UnifiedTransactionTable: Fetching data for siteId:", siteId);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const fetchCategory = async (path: string, categoryName: string) => {
        try {
          let finalPath = path;
          if (siteId) {
            const paramName = categoryName === "Rent" ? "site_id" : "siteId";
            finalPath += path.includes("?") ? `&${paramName}=${siteId}` : `?${paramName}=${siteId}`;
          }
          console.log(`UnifiedTransactionTable: Category ${categoryName} URL:`, finalPath);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${finalPath}`, { headers });
          if (!res.ok) {
             console.error(`UnifiedTransactionTable: ${categoryName} fetch failed:`, res.status);
             return [];
          }
          const text = await res.text();
          if (!text) return [];
          const json = JSON.parse(text);
          const results = json.data || json.rentPayments || json.transactions || (Array.isArray(json) ? json : []);
          console.log(`UnifiedTransactionTable: ${categoryName} count:`, results.length);
          return results;
        } catch (error) {
          console.error(`UnifiedTransactionTable: ${categoryName} error:`, error);
          return [];
        }
      };

      const [rentRaw, elecRaw, maintRaw] = await Promise.all([
        fetchCategory("/api/rent/rentTransactions", "Rent"),
        fetchCategory("/api/rent/electricityTransactions/site/all", "Electricity"),
        fetchCategory("/api/rent/maintenanceTransactions/site/all", "Maintenance"),
      ]);

      const mapData = (raw: any[], category: "Rent" | "Electricity" | "Maintenance") => raw.map((t: any) => ({
        id: t._id || t.id,
        category,
        siteIdInternal: t.siteId?._id || (typeof t.siteId === "string" ? t.siteId : null) || t.site_id || t.site,
        siteCode: t.siteId?.code || t.siteCode || t.site_code || "-",
        siteName: t.siteId?.siteName || t.siteName || t.site_name || "-",
        ownerName: t.ownerId?.ownerName || t.ownerName || t.siteId?.ownerName || t.siteId?.owner_name || "-",
        monthYear: t.monthYear || "-",
        paymentDate: t.paymentDate || "",
        amount: Number(t.paymentAmount) || Number(t.monthly_amount) || 0,
        status: t.paidStatus || "Pending",
        reference: t.utrNumber || t.utr_number || t.transactionId || t.reference || "-",
      }));

      let combined = [...mapData(rentRaw, "Rent"), ...mapData(elecRaw, "Electricity"), ...mapData(maintRaw, "Maintenance")];

      // fallback client-side filter if siteId is present
      if (siteId) {
        combined = combined.filter(t => 
           !t.siteIdInternal || t.siteIdInternal === siteId
        );
      }

      console.log("UnifiedTransactionTable: Combined total:", combined.length);

      if (filterStatus) {
        combined = combined.filter(t => t.status.toLowerCase() === filterStatus.toLowerCase());
      }
      if (filterCategory) {
        combined = combined.filter(t => t.category === filterCategory);
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
  }, [filterStatus, siteId]);

  const filteredData = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return data.filter(t =>
      t.siteName.toLowerCase().includes(search) ||
      t.siteCode.toLowerCase().includes(search) ||
      t.ownerName.toLowerCase().includes(search) ||
      t.reference.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search)
    );
  }, [data, searchTerm]);

  const handleExport = () => {
    const headers = ["Category", "Site", "Owner", "Period", "Date", "Amount", "Status", "Reference"];
    const csvContent = [headers.join(","), ...filteredData.map(t => [t.category, `"${t.siteName}"`, `"${t.ownerName}"`, t.monthYear, t.paymentDate, t.amount, t.status, t.reference].join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}.csv`);
    link.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search all transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-600 border border-emerald-600/20 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 transition-all">
          <FileSpreadsheet size={16} />
          <span>EXPORT</span>
        </button>
      </div>

      <div className="border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-transparent overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell className="text-[10px] font-bold uppercase text-gray-400 px-4 py-3">Category</TableCell>
              {!siteId && <TableCell className="text-[10px] font-bold uppercase text-gray-400 px-4 py-3">Site</TableCell>}
              <TableCell className="text-[10px] font-bold uppercase text-gray-400 px-4 py-3">Owner</TableCell>
              <TableCell className="text-[10px] font-bold uppercase text-gray-400 px-4 py-3 text-center">Period</TableCell>
              <TableCell className="text-[10px] font-bold uppercase text-gray-400 px-4 py-3 text-center">Date</TableCell>
              <TableCell className="text-[10px] font-bold uppercase text-gray-400 px-4 py-3 text-right">Amount</TableCell>
              <TableCell className="text-[10px] font-bold uppercase text-gray-400 px-4 py-3 text-center">Status</TableCell>
              <TableCell className="text-[10px] font-bold uppercase text-gray-400 px-4 py-3">Reference</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-20 text-gray-400">Loading...</TableCell></TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-20 text-gray-400">No transactions found.</TableCell></TableRow>
            ) : (
              filteredData.map((t) => (
                <TableRow key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
                  <TableCell className="px-4 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{t.category}</TableCell>
                  {!siteId && (
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t.siteName}</span>
                        <span className="text-[10px] text-gray-400 uppercase">{t.siteCode}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-300">{t.ownerName}</TableCell>
                  <TableCell className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400">{t.monthYear}</TableCell>
                  <TableCell className="px-4 py-3 text-center text-xs text-gray-500">
                    {t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">₹{t.amount.toLocaleString()}</TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Badge color={t.status.toLowerCase() === 'paid' ? 'success' : 'warning'} size="sm">{t.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[10px] font-mono text-gray-400 truncate max-w-[150px]">{t.reference}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg border border-gray-200 dark:border-white/10">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Records: {filteredData.length}</span>
        <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">₹{filteredData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
      </div>
    </div>
  );
}
