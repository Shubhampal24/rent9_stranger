/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

"use client";

import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Download, Eye, X, Edit, Trash2, Upload,Calendar, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";

const SiteOwnerCell = ({ siteId }: { siteId?: string }) => {
    const [ownerName, setOwnerName] = useState<string>("...");

    useEffect(() => {
        if (!siteId) { setOwnerName("-"); return; }
        const fetchOwner = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/sites/${siteId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error();
                const json = await res.json();
                console.log(`Fetched site ${siteId} for owner name:`, json);
                const siteData = json.data || json;
                if (siteData.owners && siteData.owners.length > 0) {
                    const names = siteData.owners.map((o: any) =>
                        o.ownerId?.ownerName || o.ownerName || (typeof o.ownerId === 'string' ? o.ownerId : "Unknown")
                    ).join(", ");
                    setOwnerName(names);
                } else {
                    setOwnerName("-");
                }
            } catch (err) {
                console.error(`Error fetching owner for site ${siteId}:`, err);
                setOwnerName("-");
            }
        };
        fetchOwner();
    }, [siteId]);

    return <span>{ownerName}</span>;
};

interface MaintenanceTransaction {
    _id: string;
    id: string;
    transactionId?: string;
    siteId: {
        _id: string;
        siteName: string;
        code: string;
    } | null;
    centreId?: any | null;
    monthYear: string;
    paymentDate: string;
    paymentAmount: string;
    paidStatus: string;
    utrNumber: string;
    maintenanceDescription: string;
    image?: string;
    paymentType?: string;
    ownerName?: string;
}

interface FilterParams {
    site_id?: string;
    paidStatus?: string;
    start_date?: string;
    end_date?: string;
    utr_number?: string;
    monthYear?: string;
}

export default function MaintenanceTransactionsTable() {
    const [transactions, setTransactions] = useState<MaintenanceTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<FilterParams>({});
    const [totalCount, setTotalCount] = useState(0);

    // UI States
    const [selectedTransaction, setSelectedTransaction] = useState<MaintenanceTransaction | null>(null);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [updateFormData, setUpdateFormData] = useState({
        paymentAmount: "",
        paidStatus: "",
        paymentDate: "",
        utrNumber: "",
        maintenanceDescription: "",
        monthYear: "",
        paymentType: ""
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [viewProofTransaction, setViewProofTransaction] = useState<MaintenanceTransaction | null>(null);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [removeImageFlag, setRemoveImageFlag] = useState(false);

    useEffect(() => {
        fetchMaintenanceTransactions();
    }, [filters]);

    // Effect to resolve owner names batch-wise for searchability
    useEffect(() => {
        const resolveOwners = async () => {
            // Find transactions needing owner resolution
            const needingResolution = transactions.filter(t =>
                t.siteId?._id && (!t.ownerName || t.ownerName === "-" || t.ownerName === "...")
            );

            if (needingResolution.length === 0) return;

            const uniqueSiteIds = Array.from(new Set(needingResolution.map(t => t.siteId?._id)));
            const token = localStorage.getItem("token");
            const ownerMap: Record<string, string> = {};
            const skippedSites = new Set<string>(); // Minor cache for the effect

            await Promise.all(uniqueSiteIds.map(async (sid) => {
                if (!sid) return;
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/sites/${sid}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.status === 404) {
                        skippedSites.add(sid);
                        return;
                    }
                    if (res.ok) {
                        const json = await res.json();
                        const siteData = json.data || json;
                        if (siteData.owners && siteData.owners.length > 0) {
                            const names = siteData.owners.map((o: any) =>
                                o.ownerId?.ownerName || o.ownerName || (typeof o.ownerId === 'string' ? o.ownerId : "Unknown")
                            ).join(", ");
                            ownerMap[sid] = names;
                        } else {
                            ownerMap[sid] = "-";
                        }
                    }
                } catch (e) {
                    console.error(`Error resolving owners for site ${sid}:`, e);
                }
            }));

            if (Object.keys(ownerMap).length > 0) {
                setTransactions(prev => prev.map(t => {
                    const sid = t.siteId?._id;
                    if (sid && ownerMap[sid]) {
                        return { ...t, ownerName: ownerMap[sid] };
                    }
                    return t;
                }));
            }
        };

        if (!loading && transactions.length > 0) {
            resolveOwners();
        }
    }, [transactions.length, loading]);

    const fetchMaintenanceTransactions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication session expired.");

            const queryParams = new URLSearchParams();
            if (filters.start_date && filters.end_date) {
                queryParams.append("startDate", filters.start_date);
                queryParams.append("endDate", filters.end_date);
            }
            if (filters.site_id) queryParams.append("siteId", filters.site_id);
            if (filters.paidStatus) queryParams.append("paidStatus", filters.paidStatus);

            // Correct path with pluralization and capital T
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/maintenanceTransactions/site/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch records (Status: ${response.status})`);
            }

            const json = await response.json();
            const dataArray = json.data || (Array.isArray(json) ? json : []);

            const normalized = dataArray.map((t: any) => ({
                ...t,
                id: t._id || t.id,
                ownerName: t.siteId?.ownerName || t.ownerName || "-",
            }));

            setTransactions(normalized);
            setTotalCount(json.total || normalized.length);
            setError(null);
        } catch (error: any) {
            console.error("❌ Maintenance Fetch Error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof FilterParams, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredTransactions = transactions
        .filter((item) => {
            const searchString = searchTerm.toLowerCase();
            return (
                (item.siteId?.siteName?.toLowerCase() || "").includes(searchString) ||
                (item.siteId?.code?.toLowerCase() || "").includes(searchString) ||
                (item.ownerName?.toLowerCase() || "").includes(searchString) ||
                (item.maintenanceDescription?.toLowerCase() || "").includes(searchString) ||
                (item.utrNumber?.toLowerCase() || "").includes(searchString)
            );
        })
        .filter((item) => {
            if (filters.paidStatus && item.paidStatus?.toLowerCase() !== filters.paidStatus.toLowerCase()) return false;

            // Client-side date range filter (robust)
            if (filters.start_date) {
                const start = new Date(filters.start_date);
                start.setHours(0, 0, 0, 0);
                const current = new Date(item.paymentDate);
                if (current < start) return false;
            }
            if (filters.end_date) {
                const end = new Date(filters.end_date);
                end.setHours(23, 59, 59, 999);
                const current = new Date(item.paymentDate);
                if (current > end) return false;
            }

            return true;
        })
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const formatCurrency = (val: any) => {
        const num = Number(val) || 0;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleDownloadExcel = async () => {
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams();

            if (filters.start_date && filters.end_date) {
                queryParams.append("startDate", filters.start_date);
                queryParams.append("endDate", filters.end_date);
            }
            if (filters.site_id) queryParams.append("siteId", filters.site_id);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/rent/maintenanceTransactions/export/ledger?${queryParams.toString()}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error(`Failed to download Excel file: ${response.status}`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `MaintenanceLedger_${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading Excel:", error);
            toast.error(error instanceof Error ? error.message : "Failed to download Excel");
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams(filters as any).toString();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/rent/ledger.pdf?category=maintenance&${queryParams}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error("Failed to download PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `MaintenanceLedger_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF download failed:", error);
            toast.error("PDF download failed");
        }
    };

    const handleDownload = () => {
        handleDownloadExcel();
    };

    const normalizeMonthYear = (val: string) => {
        if (!val) return "";
        if (/^\d{4}-\d{2}$/.test(val)) return val;

        const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        const parts = val.trim().toLowerCase().split(/\s+/);
        if (parts.length === 2) {
            let mIdx = months.indexOf(parts[0]);
            if (mIdx === -1) mIdx = months.findIndex(m => m.startsWith(parts[0].substring(0, 3)));
            const year = parseInt(parts[1]);
            if (mIdx !== -1 && !isNaN(year)) return `${year}-${String(mIdx + 1).padStart(2, '0')}`;
        }
        return val;
    };

    const handleUpdateClick = (t: MaintenanceTransaction) => {
        setSelectedTransaction(t);
        setUpdateFormData({
            paymentAmount: t.paymentAmount,
            paidStatus: t.paidStatus,
            paymentDate: t.paymentDate ? new Date(t.paymentDate).toISOString().split('T')[0] : "",
            utrNumber: t.utrNumber || "",
            maintenanceDescription: t.maintenanceDescription || "",
            monthYear: normalizeMonthYear(t.monthYear || ""),
            paymentType: t.paymentType || "Online"
        });
        setNewImageFile(null);
        setRemoveImageFlag(false);
        setIsUpdateModalOpen(true);
    };

    const handleDeleteClick = (t: MaintenanceTransaction) => {
        setSelectedTransaction(t);
        setIsDeleteModalOpen(true);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTransaction) return;

        try {
            setUpdateLoading(true);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication session expired.");

            const formData = new FormData();
            Object.entries(updateFormData).forEach(([key, value]) => {
                if (value) {
                    const finalVal = key === "monthYear" ? normalizeMonthYear(value as string) : value;
                    formData.append(key, finalVal);
                }
            });

            if (newImageFile) {
                formData.append("image", newImageFile);
            } else if (removeImageFlag) {
                formData.append("removeImage", "true");
                formData.append("image", ""); // Ensure image field is explicitly empty for backend
            }

            // ✅ DEBUG LOG PAYLOAD
            console.log("🚀 [Maintenance Transaction] Submitting Update Payload:");
            for (let [key, value] of (formData as any).entries()) {
                console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteTransaction/${selectedTransaction.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Update failed (Status: ${res.status})`);
            }

            toast.success("Transaction updated successfully");
            setIsUpdateModalOpen(false);
            fetchMaintenanceTransactions();
        } catch (error: any) {
            console.error("Update Error:", error);
            toast.error(error.message);
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!selectedTransaction) return;

        try {
            setDeleteLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteTransaction/${selectedTransaction.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Delete failed");

            toast.success("Transaction deleted");
            setIsDeleteModalOpen(false);
            fetchMaintenanceTransactions();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-center text-red-500 font-medium whitespace-pre-wrap">⚠️ Error: {error}</div>;

    return (
        <div className="space-y-4">
            {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-2 px-3 sticky top-0 z-20 py-2 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Showing {filteredTransactions.length} of {totalCount} transactions
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-40 px-2 py-1.5 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
          />

          <select
            value={filters.paidStatus || ""}
            onChange={(e) => handleFilterChange("paidStatus", e.target.value)}
            className="w-32 px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-white/[0.1] dark:text-white"
          >
            <option value="" className="dark:bg-gray-900">All Status</option>
            <option value="paid" className="dark:bg-gray-900">Paid</option>
            <option value="pending" className="dark:bg-gray-900">Pending</option>
            <option value="partial" className="dark:bg-gray-900">Partial</option>
          </select>

          <div className="relative">
            <DatePicker
              selected={filters.start_date ? new Date(filters.start_date) : null}
              onChange={(date: Date | null) =>
                handleFilterChange("start_date", date ? date.toLocaleDateString("en-CA") : "")
              }
              dateFormat="yyyy-MM-dd"
              placeholderText="Start Date"
              className="w-32 px-2 py-1.5 pl-8 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
            />
            <CalendarIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <DatePicker
              selected={filters.end_date ? new Date(filters.end_date) : null}
              onChange={(date: Date | null) =>
                handleFilterChange("end_date", date ? date.toLocaleDateString("en-CA") : "")
              }
              dateFormat="yyyy-MM-dd"
              placeholderText="End Date"
              className="w-32 px-2 py-1.5 pl-8 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
            />
            <CalendarIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {(searchTerm !== "" || Object.values(filters).some(v => !!v)) && (
            <button
              onClick={() => { setFilters({}); setSearchTerm(""); }}
              className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={handleDownload}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            📥 Download Excel
          </button>
        </div>
            </div>

            {/* ── Table Container ── */}
            <div className="relative rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                                <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <TableHeader className="sticky top-0 z-10 bg-white dark:bg-[#13141a] border-b border-gray-200 dark:border-gray-700">
                                        <TableRow>
                                            {[
                                                { width: "w-16", label: "Site Code" },
                                                { width: "w-24", label: "Site Name" },
                                                // { width: "w-20", label: "Owner Name" },
                                                { width: "w-40", label: "Description" },
                                                { width: "w-32", label: "Bill Period" },
                                                { width: "w-32", label: "Payment Date" },
                                                { width: "w-32", label: "Bill Amount" },
                                                { width: "w-32", label: "Payment Type" },
                                                { width: "w-24", label: "UTR Number" },
                                                { width: "w-10", label: "Status" },
                                                { width: "w-24", label: "Image" },
                                                { width: "w-28", label: "Actions" }
                                            ].map(({ width, label }) => (
                                                <TableCell
                                                    key={label}
                                                    className={`${width} px-3 py-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white whitespace-nowrap bg-gray-50 dark:bg-brand-500`}
                                                >
                                                    {label}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredTransactions.map((item) => (
                                            <TableRow
                                                key={item.transactionId || item.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <TableCell className="w-16 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">{item.siteId?.code || '-'}</TableCell>
                                                <TableCell className="w-24 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">{item.siteId?.siteName || '-'}</TableCell>
                                                {/* <TableCell className="w-32 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 font-medium">
                                                    {item.ownerName || "..."}
                                                </TableCell> */}
                                                <TableCell className="w-40 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">{item.maintenanceDescription || "-"}</TableCell>
                                                <TableCell className="w-32 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                                                    {item.monthYear || '-'}
                                                </TableCell>
                                                <TableCell className="w-32 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                                                    {formatDate(item.paymentDate)}
                                                </TableCell>
                                                <TableCell className="w-32 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 font-medium">
                                                    {formatCurrency(item.paymentAmount)}
                                                </TableCell>
                                                <TableCell className="w-32 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">{item.paymentType || '-'}</TableCell>
                                                <TableCell className="w-24 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 font-mono text-xs">
                                                    {item.utrNumber || '-'}
                                                </TableCell>
                                                <TableCell className="w-24 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                                                    <Badge
                                                        size="sm"
                                                        color={
                                                            item.paidStatus?.toLowerCase() === "paid"
                                                                ? "success"
                                                                : item.paidStatus?.toLowerCase() === "pending"
                                                                    ? "warning"
                                                                    : "error"
                                                        }
                                                    >
                                                        {item.paidStatus || 'Unknown'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="w-10 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                                                    {item.image ? (
                                                        <button
                                                            type="button"
                                                            className="underline text-blue-600 hover:text-blue-800 text-xs"
                                                            onClick={() => setViewProofTransaction(item)}
                                                            title="View Proof"
                                                        >
                                                            View Proof
                                                        </button>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell className="w-28 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleUpdateClick(item)}
                                                            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(item)}
                                                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        {searchTerm ? `No results found for "${searchTerm}"` : "No maintenance transactions found"}
                    </div>
                )}
            </div>

            {/* ── Proof Viewer Modal ── */}
            {viewProofTransaction && viewProofTransaction.image && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#13141a] rounded-lg p-4 shadow-lg relative max-w-lg w-full">
                        <button
                            className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-red-500 z-10"
                            onClick={() => setViewProofTransaction(null)}
                        >
                            &times;
                        </button>
                        {viewProofTransaction.image.endsWith(".pdf") ? (
                            <iframe src={viewProofTransaction.image} title="PDF Proof" width="100%" height="500" className="mx-auto border rounded">
                                <a href={viewProofTransaction.image} target="_blank" rel="noopener noreferrer">View PDF</a>
                            </iframe>
                        ) : (
                            <img src={viewProofTransaction.image} alt="Maintenance Proof" className="max-h-[70vh] w-auto mx-auto rounded shadow-xl" />
                        )}
                    </div>
                </div>
            )}

            {/* ── Update Modal ── */}
            {isUpdateModalOpen && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Update Maintenance Record</h2>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                    <input type="text" value={updateFormData.paymentAmount} onChange={(e) => setUpdateFormData({ ...updateFormData, paymentAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select value={updateFormData.paidStatus} onChange={(e) => setUpdateFormData({ ...updateFormData, paidStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white">
                                        <option value="paid" className="dark:bg-gray-900">Paid</option>
                                        <option value="pending" className="dark:bg-gray-900">Pending</option>
                                        <option value="partial" className="dark:bg-gray-900">Partial</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={updateFormData.paymentDate}
                                            onChange={(e) => setUpdateFormData({ ...updateFormData, paymentDate: e.target.value })}
                                            className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                        />
                                        <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea className="w-full p-3 text-sm bg-gray-50 dark:bg-white/[0.02] border border-gray-300 dark:border-white/[0.1] rounded-xl outline-none min-h-[80px] dark:text-white" value={updateFormData.maintenanceDescription} onChange={(e) => setUpdateFormData({ ...updateFormData, maintenanceDescription: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Type</label>
                                    <select
                                        value={updateFormData.paymentType}
                                        onChange={(e) => setUpdateFormData({ ...updateFormData, paymentType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm"
                                    >
                                        <option value="Online" className="dark:bg-gray-900">Online</option>
                                        <option value="Cash" className="dark:bg-gray-900">Cash</option>
                                        <option value="Cheque" className="dark:bg-gray-900">Cheque</option>
                                        <option value="Other" className="dark:bg-gray-900">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UTR Number</label>
                                    <input type="text" value={updateFormData.utrNumber} onChange={(e) => setUpdateFormData({ ...updateFormData, utrNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proof of Payment</label>

                                {/* Image Preview / Current Image Area */}
                                {(selectedTransaction.image || newImageFile) && !removeImageFlag ? (
                                    <div className="relative mb-3 w-full h-40 bg-gray-100 dark:bg-white/[0.03] rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.1] flex items-center justify-center">
                                        {newImageFile ? (
                                            <img src={URL.createObjectURL(newImageFile)} alt="Preview" className="h-full w-auto object-contain" />
                                        ) : (
                                            <img src={selectedTransaction.image} alt="Current Proof" className="h-full w-auto object-contain" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewImageFile(null);
                                                setRemoveImageFlag(true);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                                            title="Remove Image"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm py-1 px-3">
                                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">
                                                {newImageFile ? "New Upload Ready" : "Current Proof"}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-3 p-4 border-2 border-dashed border-gray-200 dark:border-white/[0.1] rounded-xl text-center bg-gray-50/50 dark:bg-white/[0.02]">
                                        <p className="text-xs text-gray-500 italic">No image attached or image scheduled for removal</p>
                                        {removeImageFlag && <button type="button" onClick={() => setRemoveImageFlag(false)} className="mt-2 text-xs text-blue-600 underline font-bold uppercase tracking-wider">Undo Removal</button>}
                                    </div>
                                )}

                                <div className="relative group">
                                    <input
                                        type="file"
                                        id="update-file-input"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setNewImageFile(e.target.files[0]);
                                                setRemoveImageFlag(false);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="update-file-input"
                                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all active:scale-[0.98]"
                                    >
                                        <Upload size={14} className="text-blue-600" />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider">
                                            {newImageFile ? "Change Selection" : selectedTransaction.image && !removeImageFlag ? "Replace Image" : "Upload Image"}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                                <button type="submit" disabled={updateLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20">{updateLoading ? "Saving..." : "Update"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Modal ── */}
            {isDeleteModalOpen && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-sm w-full p-6 text-center border border-gray-200 dark:border-white/[0.08] shadow-2xl">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="text-red-600" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Record?</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to permanently delete this maintenance record for {selectedTransaction.siteId?.siteName}?</p>
                        <div className="flex space-x-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                            <button onClick={handleDeleteSubmit} disabled={deleteLoading} className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20">{deleteLoading ? "Deleting..." : "Yes, Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
