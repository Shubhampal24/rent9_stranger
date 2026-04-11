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
import { Search, Loader2, Calendar, Zap, Wrench, FileText, Layers } from "lucide-react";

interface PaymentSite {
  code: string | number;
  id: string;
  siteName: string;
  ownerName: string;
  centreName: string;
  location: string;
  period: string;
  monthlyRent?: number;
  pendingAmount: number;
  expectedAmount: number;
  paymentDay: string;
  status: "pending" | "paid" | "partial" | string;
  category: "Rent" | "Electricity" | "Maintenance";
}

export default function UpcomingRentSitesTable() {
  const [data, setData] = useState<PaymentSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Rent");
  const [allowedMonths, setAllowedMonths] = useState<string[]>([]);

  // Month calculation
  const getCurrentMonthYear = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());

  const [categoriesSummary, setCategoriesSummary] = useState({
    total: 0,
    rent: { count: 0, amount: 0 },
    electricity: { count: 0, amount: 0 },
    maintenance: { count: 0, amount: 0 }
  });

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/dashboard/pending-bills`;

        // API call with specific category
        const response = await fetch(`${baseUrl}?category=${activeCategory.toLowerCase()}&monthYear=${selectedMonth}`, { headers });

        // Detailed log for debugging the 404 issue as requested
        console.log(`[Pending Bills API] Category: ${activeCategory}, Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Treat 404 as "No records found" instead of an error
            console.warn(`[Pending Bills API] 404 Not Found for ${activeCategory} - Showing empty state.`);
            setData([]);
            setCategoriesSummary({ total: 0, rent: { count: 0, amount: 0 }, electricity: { count: 0, amount: 0 }, maintenance: { count: 0, amount: 0 } });
            setLoading(false);
            return;
          }
          throw new Error(`Fetch failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log("result", result);

        // Populate allowed months from API
        if (result.allowedMonths && Array.isArray(result.allowedMonths)) {
          setAllowedMonths(result.allowedMonths);
        }

        if (!result.success || !Array.isArray(result.data)) {
          setData([]);
          return;
        }

        const mappedData = (result.data || []).map((item: any) => ({
          id: item.transactionId || item._id || item.id,
          code: item.siteCode || item.code || "N/A",
          siteName: item.siteName || "Unnamed Site",
          ownerName: item.ownerName || "N/A",
          centreName: item.centre?.name || item.centreName || "N/A",
          location: item.location || "N/A",
          period: item.monthYear || "N/A",
          monthlyRent: Number(item.monthlyRent || 0),
          pendingAmount: Number(item.paymentAmount || item.pendingAmount || 0),
          expectedAmount: Number(item.paymentAmount || item.expectedAmount || 0),
          paymentDay: item.paymentDay || "N/A",
          status: item.paidStatus || item.status || "pending",
          category: activeCategory as any,
        }));

        setData(mappedData);

        // Update category-specific summary from API result
        const summary = result.summary || {};
        const catKey = activeCategory.toLowerCase() as 'rent' | 'electricity' | 'maintenance';

        setCategoriesSummary(prev => ({
          ...prev,
          total: mappedData.length, // Total for current view
          [catKey]: {
            count: summary.total || mappedData.length,
            amount: summary.totalPendingAmount || mappedData.reduce((acc: number, i: any) => acc + (i.pendingAmount || 0), 0)
          }
        }));

      } catch (err: any) {
        setError(err.message || "Something went wrong while fetching dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [selectedMonth, activeCategory]);

  // Fetch summaries for all 3 categories in parallel so cards update instantly when month changes
  useEffect(() => {
    const fetchAllSummaries = async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/dashboard/pending-bills`;
      const categories = ["rent", "electricity", "maintenance"] as const;

      try {
        const results = await Promise.all(
          categories.map(cat =>
            fetch(`${baseUrl}?category=${cat}&monthYear=${selectedMonth}`, { headers })
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );

        const [rentRes, elecRes, maintRes] = results;

        setCategoriesSummary(prev => ({
          ...prev,
          rent: {
            count: rentRes?.summary?.total ?? rentRes?.data?.length ?? prev.rent.count,
            amount: rentRes?.summary?.totalPendingAmount ?? rentRes?.data?.reduce((a: number, i: any) => a + Number(i.paymentAmount || 0), 0) ?? prev.rent.amount,
          },
          electricity: {
            count: elecRes?.summary?.total ?? elecRes?.data?.length ?? prev.electricity.count,
            amount: elecRes?.summary?.totalPendingAmount ?? elecRes?.data?.reduce((a: number, i: any) => a + Number(i.paymentAmount || 0), 0) ?? prev.electricity.amount,
          },
          maintenance: {
            count: maintRes?.summary?.total ?? maintRes?.data?.length ?? prev.maintenance.count,
            amount: maintRes?.summary?.totalPendingAmount ?? maintRes?.data?.reduce((a: number, i: any) => a + Number(i.paymentAmount || 0), 0) ?? prev.maintenance.amount,
          },
        }));

        // Update allowed months from any successful response
        const firstValid = [rentRes, elecRes, maintRes].find(r => r?.allowedMonths?.length);
        if (firstValid?.allowedMonths) {
          setAllowedMonths(firstValid.allowedMonths);
        }
      } catch (_) {
        // Silent fail for summary fetch — main data fetch handles errors
      }
    };

    fetchAllSummaries();
  }, [selectedMonth]);


  const filteredData = useMemo(() => {
    let result = data;

    // Category Filter
    if (activeCategory !== "All") {
      result = result.filter(item => item.category === activeCategory);
    }

    // Search Filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter((site) =>
        site.siteName.toLowerCase().includes(search) ||
        site.code.toString().includes(search) ||
        site.location.toLowerCase().includes(search) ||
        site.paymentDay.toString().toLowerCase().includes(search) ||
        site.status.toLowerCase().includes(search) ||
        site.category.toLowerCase().includes(search)
      );
    }

    return result;
  }, [data, searchTerm, activeCategory]);

  const formatMonth = (monthStr: string) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Rent": return <FileText size={14} className="text-blue-500" />;
      case "Electricity": return <Zap size={14} className="text-amber-500" />;
      case "Maintenance": return <Wrench size={14} className="text-purple-500" />;
      default: return <Layers size={14} className="text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Rent": return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "Electricity": return "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "Maintenance": return "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="w-full rounded-2xl border shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] overflow-hidden">
      {/* Category Summary Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${activeCategory === "Rent" ? "bg-white dark:bg-gray-800 border-blue-200 shadow-sm ring-1 ring-blue-500/10" : "bg-transparent border-transparent hover:bg-white/40"}`} onClick={() => setActiveCategory("Rent")}>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Rent</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{categoriesSummary.rent.count}</span>
              <span className="text-xs font-semibold text-blue-600/70">₹{categoriesSummary.rent.amount.toLocaleString()}</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${activeCategory === "Electricity" ? "bg-white dark:bg-gray-800 border-amber-200 shadow-sm ring-1 ring-amber-500/10" : "bg-transparent border-transparent hover:bg-white/40"}`} onClick={() => setActiveCategory("Electricity")}>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Electricity</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{categoriesSummary.electricity.count}</span>
              <span className="text-xs font-semibold text-amber-600/70">₹{categoriesSummary.electricity.amount.toLocaleString()}</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${activeCategory === "Maintenance" ? "bg-white dark:bg-gray-800 border-purple-200 shadow-sm ring-1 ring-purple-500/10" : "bg-transparent border-transparent hover:bg-white/40"}`} onClick={() => setActiveCategory("Maintenance")}>
            <div className="flex items-center gap-2 mb-1">
              <Wrench size={14} className="text-purple-500" />
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Maintenance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{categoriesSummary.maintenance.count}</span>
              <span className="text-xs font-semibold text-purple-600/70">₹{categoriesSummary.maintenance.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search all pending payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full sm:w-[300px] rounded-lg border border-gray-100 bg-gray-50/50 dark:bg-white/[0.03] dark:border-gray-800 pl-10 pr-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            {allowedMonths.length > 0 ? (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 w-full sm:w-[180px] rounded-lg border border-gray-100 bg-gray-50/50 dark:bg-white/[0.03] dark:border-gray-800 pl-10 pr-4 text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
              >
                {allowedMonths.map((m) => (
                  <option key={m} value={m} className="dark:bg-gray-900">
                    {formatMonth(m)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-100 bg-gray-50/50 dark:bg-white/[0.03] dark:border-gray-800 pl-10 pr-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {["Rent", "Electricity", "Maintenance"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${activeCategory === cat
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <Table className="min-w-full text-xs text-gray-600 dark:text-gray-300">
          <TableHeader className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-transparent tracking-widest sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
            <TableRow className="h-12">
              <TableCell isHeader className="w-10 px-3 py-2">{null}</TableCell>
              <TableCell isHeader className="w-28 px-4 py-2 text-left">Code</TableCell>
              <TableCell isHeader className="w-40 px-4 py-2 text-left">Site Name</TableCell>
              <TableCell isHeader className="w-36 px-4 py-2 text-left">Owner</TableCell>
              <TableCell isHeader className="w-28 px-4 py-2 text-center">Period</TableCell>
              <TableCell isHeader className="w-28 px-4 py-2 text-right">Amount</TableCell>
              <TableCell isHeader className="w-24 px-4 py-2 text-center">Status</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-400">Loading payment data...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-red-500">{error}</TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                  {searchTerm
                    ? `No records found matching "${searchTerm}" in ${activeCategory}.`
                    : `No pending ${activeCategory.toLowerCase()} payments found.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((site) => (
                <TableRow key={`${site.category}-${site.id}-${site.code}`} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="w-10 px-3 py-3">{null}</TableCell>
                  <TableCell className="w-28 px-4 py-3 font-bold text-gray-900 dark:text-white text-left">{site.code}</TableCell>
                  <TableCell className="w-40 px-4 py-3 text-left">
                    <span className="font-semibold text-gray-800 dark:text-white/90">{site.siteName}</span>
                  </TableCell>
                  <TableCell className="w-36 px-4 py-3 text-left">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{site.ownerName}</span>
                  </TableCell>
                  <TableCell className="w-28 px-4 py-3 text-center">
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">{site.period}</span>
                  </TableCell>
                  <TableCell className="w-28 px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                    ₹{site.pendingAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="w-24 px-4 py-3 text-center">
                    <Badge
                      size="sm"
                      color={
                        site.status === "paid"
                          ? "success"
                          : site.status === "pending"
                            ? "error"
                            : "warning"
                      }
                    >
                      {site.status || "N/A"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
