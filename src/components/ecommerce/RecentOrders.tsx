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
import { Search, Zap, Wrench, FileText, Layers } from "lucide-react";

interface PaymentSite {
  code: string | number;
  id: string;
  siteName: string;
  location: string;
  monthlyRent?: number;
  paymentDay: string;
  status: "pending" | "paid" | "partial" | string;
  category: "Rent" | "Electricity" | "Maintenance";
}

export default function UpcomingRentSitesTable() {
  const [data, setData] = useState<PaymentSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

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
        const token = localStorage.getItem("token");
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/dashboard`;

        const [rentRes, elecRes, maintRes] = await Promise.all([
          fetch(`${baseUrl}/upcoming-rents`, { headers }),
          fetch(`${baseUrl}/pending-electricity`, { headers }),
          fetch(`${baseUrl}/pending-maintenance`, { headers })
        ]);

        const rawRent = await rentRes.json();
        const rawElec = await elecRes.json();
        const rawMaint = await maintRes.json();

        // LOG EACH RESPONSE AS REQUESTED
        console.log("Upcoming Rents Response:", rawRent);
        console.log("Pending Electricity Response:", rawElec);
        console.log("Pending Maintenance Response:", rawMaint);

        const rentItems = (rawRent.success ? rawRent.data : []).map((item: any) => ({
          ...item,
          category: "Rent" as const,
          id: item.siteId || item.id
        }));

        const elecItems = (rawElec.success ? rawElec.data : []).map((item: any) => ({
          ...item,
          category: "Electricity" as const,
          id: item.siteId || item.id
        }));

        const maintItems = (rawMaint.success ? rawMaint.data : []).map((item: any) => ({
          ...item,
          category: "Maintenance" as const,
          id: item.siteId || item.id
        }));

        const combinedData = [...rentItems, ...elecItems, ...maintItems];
        setData(combinedData);

        // Calculate summary categories
        setCategoriesSummary({
          total: combinedData.length,
          rent: {
            count: rentItems.length,
            amount: rentItems.reduce((acc: number, item: any) => acc + (item.pendingAmount || 0), 0)
          },
          electricity: {
            count: elecItems.length,
            amount: elecItems.reduce((acc: number, item: any) => acc + (item.pendingAmount || 0), 0)
          },
          maintenance: {
            count: maintItems.length,
            amount: maintItems.reduce((acc: number, item: any) => acc + (item.pendingAmount || 0), 0)
          }
        });

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${activeCategory === "All" ? "bg-white dark:bg-gray-800 border-indigo-200 shadow-sm ring-1 ring-indigo-500/10" : "bg-transparent border-transparent hover:bg-white/40"}`} onClick={() => setActiveCategory("All")}>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Pending</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{categoriesSummary.total}</span>
              <span className="text-xs font-medium text-gray-400 capitalize">Sites</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${activeCategory === "Rent" ? "bg-white dark:bg-gray-800 border-blue-200 shadow-sm ring-1 ring-blue-500/10" : "bg-transparent border-transparent hover:bg-white/40"}`} onClick={() => setActiveCategory("Rent")}>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Rent Category</span>
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
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search all pending payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full sm:w-[400px] rounded-lg border border-gray-100 bg-gray-50/50 dark:bg-white/[0.03] dark:border-gray-800 pl-10 pr-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {["All", "Rent", "Electricity", "Maintenance"].map((cat) => (
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
              <TableCell isHeader className="px-6 py-2 text-center">Site Code</TableCell>
              <TableCell isHeader className="px-6 py-2">Site Name</TableCell>
              <TableCell isHeader className="px-6 py-2">Category</TableCell>
              <TableCell isHeader className="px-6 py-2">Location</TableCell>
              <TableCell isHeader className="px-6 py-2 text-center">Payment Day</TableCell>
              <TableCell isHeader className="px-6 py-2 text-center">Status</TableCell>
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
                <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                  {searchTerm
                    ? `No records found matching "${searchTerm}" in ${activeCategory}.`
                    : `No pending ${activeCategory === "All" ? "payments" : activeCategory.toLowerCase() + " payments"} found.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((site) => (
                <TableRow key={`${site.category}-${site.id}-${site.code}`} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="py-3 px-6 text-center font-bold text-gray-900 dark:text-white">{site.code}</TableCell>
                  <TableCell className="py-3 px-6">
                    <span className="font-semibold text-gray-800 dark:text-white/90">{site.siteName}</span>
                  </TableCell>
                  <TableCell className="py-3 px-6">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getCategoryColor(site.category)}`}>
                      {getCategoryIcon(site.category)}
                      {site.category}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-6 font-medium">{site.location}</TableCell>
                  <TableCell className="py-3 px-6 text-center text-gray-500 dark:text-gray-400">{site.paymentDay}</TableCell>
                  <TableCell className="py-3 px-6 text-center">
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
