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
import { Download, Eye, X, Edit, Trash2, Upload, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "react-hot-toast";

const SiteOwnerCell = ({ siteId }: { siteId?: string }) => {
    const [ownerName, setOwnerName] = React.useState<string>("...");

    React.useEffect(() => {
        if (!siteId) { setOwnerName("-"); return; }
        const fetchOwner = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/sites/${siteId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error();
                const json = await res.json();
                const siteData = json.data || json;
                if (siteData.owners && siteData.owners.length > 0) {
                    const names = siteData.owners.map((o: any) => o.ownerId?.ownerName || "Unknown").join(", ");
                    setOwnerName(names);
                } else {
                    setOwnerName("-");
                }
            } catch (err) {
                console.error(`Error fetching owner for site ${siteId} (Elec):`, err);
                setOwnerName("-");
            }
        };
        fetchOwner();
    }, [siteId]);

    return <span>{ownerName}</span>;
};

interface ElectricityTransaction {
    image: any;
    transactionId: string;
    id: string;
    _id: string;
    siteId: any | null;
    ownerId?: any | null;
    monthYear: string;
    paymentDate: string;
    paymentAmount: string;
    paidStatus: string;
    paymentType: string;
    utrNumber: string;
    units: string;
    electricityCharges: string;
    electricityConsumerNo: string;
    electricityConsumerId?: any;
    monthly_amount?: number;
    ownerName?: string;
}


interface FilterParams {
    site_id?: string;
    owner_name?: string;
    paid_status?: string;
    start_date?: string;
    end_date?: string;
    payment_type?: string;
    payment_amount?: string;
    utr_number?: string;
}

export default function ElectricityTransactionsTable() {
    const [transactions, setTransactions] = useState<ElectricityTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<FilterParams>({});
    const [totalCount, setTotalCount] = useState(0);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<ElectricityTransaction | null>(null);
    const [viewProofTransaction, setViewProofTransaction] = useState<ElectricityTransaction | null>(null);

    const [updateFormData, setUpdateFormData] = useState({
        paymentAmount: "",
        paidStatus: "",
        paymentDate: "",
        utrNumber: "",
        units: "",
        electricityCharges: "",
        monthYear: "",
        paymentType: "",
        electricityConsumerId: ""
    });

    const [consumers, setConsumers] = useState<any[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [removeImageFlag, setRemoveImageFlag] = useState(false);

    useEffect(() => {
        fetchElectricityTransactions();
    }, [filters]);

    // Effect to resolve owner names batch-wise for searchability
    useEffect(() => {
        const resolveOwners = async () => {
            // Find transactions needing owner resolution
            const needingResolution = transactions.filter(t =>
                t.siteId?._id && (!t.ownerName || t.ownerName === "-" || t.ownerName === "...")
            );

            if (needingResolution.length === 0) return;

            const uniqueSiteIds = Array.from(new Set(needingResolution.map(t => {
                // siteId can be object or string
                return typeof t.siteId === 'object' ? t.siteId?._id : t.siteId;
            }).filter(Boolean)));

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
                    const sid = typeof t.siteId === 'object' ? t.siteId?._id : t.siteId;
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

    const fetchElectricityTransactions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found");

            const queryParams = new URLSearchParams();
            if (filters.start_date && filters.end_date) {
                queryParams.append("startDate", filters.start_date);
                queryParams.append("endDate", filters.end_date);
            }
            if (filters.site_id) queryParams.append("siteId", filters.site_id);
            if (filters.paid_status) queryParams.append("paidStatus", filters.paid_status);

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/electricityTransactions/site/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });


            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();

            // Support both { data: [...] } and plain array responses
            const dataArray = json.data || (Array.isArray(json) ? json : (json?.data || []));
            const normalizedTransactions = dataArray.map((t: any) => ({
                ...t,
                id: t._id || t.id,
                ownerName: t.siteId?.ownerName || t.ownerName || "-",
                electricityConsumerNo: t.electricityConsumerId?.consumerNo || t.electricityConsumerNo || '-',
            }));

            setTransactions(normalizedTransactions);
            setTotalCount(json.total || normalizedTransactions.length);
            setError(null);
        } catch (error) {
            console.error("Error fetching electricity transactions:", error);
            setError(
                error instanceof Error ? error.message : "Failed to fetch electricity transactions"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterKey: keyof FilterParams, value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
    };

    const filteredTransactions = transactions
        .filter((item) => {
            const searchString = searchTerm.toLowerCase();
            return (
                (item.siteId?.siteName?.toLowerCase() || "").includes(searchString) ||
                (item.siteId?.code?.toLowerCase() || "").includes(searchString) ||
                (item.ownerName?.toLowerCase() || "").includes(searchString) ||
                (item.paymentType?.toLowerCase() || "").includes(searchString) ||
                (item.paidStatus?.toLowerCase() || "").includes(searchString) ||
                (item.utrNumber?.toLowerCase() || "").includes(searchString) ||
                (item.electricityConsumerNo?.toLowerCase() || "").includes(searchString)
            );
        })
        .filter((item) => {
            if (filters.paid_status && item.paidStatus?.toLowerCase() !== filters.paid_status.toLowerCase()) return false;

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
        .sort((a, b) => {
            const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
            const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
            return dateB - dateA;
        });

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
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

    const handleUpdateClick = async (transaction: ElectricityTransaction) => {
        setSelectedTransaction(transaction);
        const siteId = typeof transaction.siteId === 'object' ? transaction.siteId?._id : transaction.siteId;

        // Determine the consumer ID robustly
        const currentConsumerId = transaction.electricityConsumerId?._id ||
            (typeof transaction.electricityConsumerId === 'string' ? transaction.electricityConsumerId : "");

        setUpdateFormData({
            paymentAmount: transaction.paymentAmount?.toString() || "",
            paidStatus: transaction.paidStatus || "pending",
            paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split('T')[0] : "",
            utrNumber: transaction.utrNumber || "",
            units: transaction.units?.toString() || "",
            electricityCharges: transaction.electricityCharges?.toString() || "",
            monthYear: normalizeMonthYear(transaction.monthYear || ""),
            paymentType: transaction.paymentType || "Online",
            electricityConsumerId: currentConsumerId
        });

        setNewImageFile(null);
        setRemoveImageFlag(false);

        // Populate consumers list with the current one first to ensure it's selectable immediately
        if (transaction.electricityConsumerId && typeof transaction.electricityConsumerId === 'object') {
            setConsumers([{
                _id: transaction.electricityConsumerId._id,
                consumerNo: transaction.electricityConsumerId.consumerNo,
                name: transaction.electricityConsumerId.consumerName || transaction.electricityConsumerId.name || ""
            }]);
        } else {
            setConsumers([]);
        }

        // Fetch all consumers for this site to allow switching
        if (siteId) {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteElectricityConsumers/site/${siteId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    const fetchedConsumers = json.data || (Array.isArray(json) ? json : []);

                    // Merge current consumer if missing (to avoid UI desync)
                    setConsumers(prev => {
                        const existingIds = new Set(fetchedConsumers.map((c: any) => c._id));
                        const missing = prev.filter(c => !existingIds.has(c._id));
                        return [...missing, ...fetchedConsumers];
                    });

                }
            } catch (err) {
                console.error("Error fetching consumers:", err);
            }
        }

        setIsUpdateModalOpen(true);
    };

    const handleDeleteClick = (transaction: ElectricityTransaction) => {
        setSelectedTransaction(transaction);
        setIsDeleteModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUpdateFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!updateFormData.paymentAmount) {
            errors.paymentAmount = "Payment amount is required";
        }
        if (!updateFormData.paidStatus) {
            errors.paidStatus = "Status is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (!selectedTransaction) return;

        try {
            setUpdateLoading(true);
            const token = localStorage.getItem("token");
            const formData = new FormData();

            Object.entries(updateFormData).forEach(([key, value]) => {
                // Diagnostic: Skip electricityConsumerId to test if other fields update without error
                if (key === "electricityConsumerId") return;

                // For other fields, send if they are not undefined/null (allow empty strings to clear fields)
                if (value !== undefined && value !== null) {
                    const finalVal = key === "monthYear" ? normalizeMonthYear(value as string) : value;
                    formData.append(key, finalVal as string);
                }
            });

            if (newImageFile) {
                formData.append("image", newImageFile);
            } else if (removeImageFlag) {
                formData.append("removeImage", "true");
            }


            const id = selectedTransaction._id || selectedTransaction.id;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteTransaction/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Update failed");
            }

            alert("Electricity record updated successfully");
            setIsUpdateModalOpen(false);
            fetchElectricityTransactions();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!selectedTransaction) return;

        try {
            setDeleteLoading(true);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found");

            const id = selectedTransaction._id || selectedTransaction.id;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteTransaction/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Delete failed");

            alert("Electricity record deleted successfully");
            setIsDeleteModalOpen(false);
            fetchElectricityTransactions();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found");

            const queryParams = new URLSearchParams();

            if (filters.start_date && filters.end_date) {
                queryParams.append("startDate", filters.start_date);
                queryParams.append("endDate", filters.end_date);
            }
            if (filters.site_id) queryParams.append("siteId", filters.site_id);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/rent/electricityTransactions/export/ledger?${queryParams.toString()}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error(`Failed to download Excel file: ${response.status}`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ElectricityLedger_${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading Excel:", error);
            alert(error instanceof Error ? error.message : "Failed to download Excel");
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams(filters as any).toString();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/rent/ledger.pdf?category=electricity&${queryParams}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error("Failed to download PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `ElectricityLedger_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF download failed:", error);
            alert("PDF download failed");
        }
    };

    const handleDownload = async () => {
        await handleDownloadExcel();
    };

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 px-3 sticky top-0 z-20 py-2 border-b border-gray-200 dark:border-gray-700">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
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
            value={filters.paid_status || ""}
            onChange={(e) => handleFilterChange("paid_status", e.target.value)}
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
              className="px-2 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
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
                                                { width: "w-20", label: "Owner Name" },
                                                { width: "w-40", label: "Unit" },
                                                { width: "w-32", label: "Bill Amount" },
                                                { width: "w-32", label: "Payment Date" },
                                                { width: "w-32", label: "Bill Period" },
                                                { width: "w-32", label: "Electricity Charges" },
                                                { width: "w-10", label: "Status" },
                                                { width: "w-32", label: "Consumer Number" },
                                                { width: "w-24", label: "UTR Number" },
                                                { width: "w-24", label: "Image" },
                                                { width: "w-28", label: "Actions" }
                                            ].map(({ width, label }) => (
                                                <TableCell
                                                    key={label}
                                                    className={`${width} px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-900 dark:text-white whitespace-nowrap bg-gray-50 dark:bg-brand-500`}
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
                                                <TableCell className="w-16 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">{item.siteId?.code || '-'}</TableCell>
                                                <TableCell className="w-24 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">{item.siteId?.siteName || '-'}</TableCell>
                                                <TableCell className="w-32 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100 font-medium">
                                                    {item.ownerName || "..."}
                                                </TableCell>
                                                <TableCell className="w-40 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">{item.units || '-'}</TableCell>
                                                <TableCell className="w-20 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100 font-medium">
                                                    {formatCurrency(Number(item.paymentAmount) || 0)}
                                                </TableCell>
                                                <TableCell className="w-32 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">
                                                    {formatDate(item.paymentDate)}
                                                </TableCell>
                                                <TableCell className="w-32 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">
                                                    {item.monthYear || '-'}
                                                </TableCell>
                                                <TableCell className="w-32 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">
                                                    {item.electricityCharges || '-'}
                                                </TableCell>
                                                <TableCell className="w-10 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">
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
                                                <TableCell className="w-32 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">{item.electricityConsumerNo || '-'}</TableCell>
                                                <TableCell className="w-24 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100 font-mono text-xs">
                                                    {item.utrNumber || (item as any).utr_number || '-'}
                                                </TableCell>
                                                <TableCell className="w-24 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">
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
                                                <TableCell className="w-28 px-3 py-2 text-[10px] text-gray-900 dark:text-gray-100">
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

                {/* Proof Viewer */}
                {viewProofTransaction && viewProofTransaction.image && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-[#13141a] rounded-lg p-4 shadow-lg relative max-w-lg w-full">
                            <button
                                className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-red-500 z-10"
                                onClick={() => setViewProofTransaction(null)}
                            >
                                &times;
                            </button>
                            <img src={viewProofTransaction.image} alt="Electricity Proof" className="max-h-[70vh] w-auto mx-auto rounded shadow-xl" />
                        </div>
                    </div>
                )}
            </div>

            {/* Update Modal */}
            {isUpdateModalOpen && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Update Electricity Record</h2>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Amount</label>
                                    <input type="text" value={updateFormData.paymentAmount} onChange={(e) => setUpdateFormData({ ...updateFormData, paymentAmount: e.target.value })} className={`w-full px-3 py-2 border ${formErrors.paymentAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md dark:bg-gray-700 dark:text-white`} />
                                    {formErrors.paymentAmount && <p className="text-red-500 text-xs mt-1">{formErrors.paymentAmount}</p>}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select value={updateFormData.paidStatus} onChange={(e) => setUpdateFormData({ ...updateFormData, paidStatus: e.target.value })} className={`w-full px-3 py-2 border ${formErrors.paidStatus ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-800 dark:text-white`}>
                                        <option value="paid" className="dark:bg-gray-950">Paid</option>
                                        <option value="pending" className="dark:bg-gray-950">Pending</option>
                                        <option value="partial" className="dark:bg-gray-950">Partial</option>
                                    </select>
                                    {formErrors.paidStatus && <p className="text-red-500 text-xs mt-1">{formErrors.paidStatus}</p>}
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Units</label>
                                    <input type="text" value={updateFormData.units} onChange={(e) => setUpdateFormData({ ...updateFormData, units: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Charges</label>
                                    <input type="text" value={updateFormData.electricityCharges} onChange={(e) => setUpdateFormData({ ...updateFormData, electricityCharges: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Type</label>
                                    <select
                                        value={updateFormData.paymentType}
                                        onChange={(e) => setUpdateFormData({ ...updateFormData, paymentType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm"
                                    >
                                        <option value="Online" className="dark:bg-gray-950">Online</option>
                                        <option value="Cash" className="dark:bg-gray-950">Cash</option>
                                        <option value="Cheque" className="dark:bg-gray-950">Cheque</option>
                                        <option value="Other" className="dark:bg-gray-950">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UTR Number</label>
                                    <input type="text" value={updateFormData.utrNumber} onChange={(e) => setUpdateFormData({ ...updateFormData, utrNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
                                </div>
                            </div>

                            {/* Diagnostic: Temporarily removed Consumer Number field to isolate 400 error origins */}
                            {/* 
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consumer Number</label>
                                <select 
                                    value={updateFormData.electricityConsumerId} 
                                    onChange={(e) => setUpdateFormData({...updateFormData, electricityConsumerId: e.target.value})} 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select Consumer</option>
                                    {consumers.map(c => (
                                        <option key={c._id} value={c._id}>{c.consumerNo} ({c.name || 'No Name'})</option>
                                    ))}
                                </select>
                            </div>
                            */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proof of Payment</label>

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
                                        <p className="text-xs text-gray-500 italic text-center">No image attached or image scheduled for removal</p>
                                        {removeImageFlag && <button type="button" onClick={() => setRemoveImageFlag(false)} className="mt-2 text-xs text-blue-600 underline font-bold uppercase tracking-wider">Undo Removal</button>}
                                    </div>
                                )}

                                <div className="relative group">
                                    <input
                                        type="file"
                                        id="update-file-input-elec"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setNewImageFile(e.target.files[0]);
                                                setRemoveImageFlag(false);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="update-file-input-elec"
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

            {/* Delete Modal */}
            {isDeleteModalOpen && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-sm w-full p-6 text-center border border-gray-200 dark:border-white/[0.08] shadow-2xl">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="text-red-600" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Record?</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to permanently delete this electricity record for {selectedTransaction.siteId?.siteName}?</p>
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