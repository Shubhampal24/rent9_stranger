
"use client";
import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import { useParams } from 'next/navigation';
import Badge from "../ui/badge/Badge";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
interface RentTransaction {
    id: string | number;
    monthYear: string;
    month_year?: string;
    monthlyRent: string | number;
    monthly_rent?: string | number;
    ownerId: string;
    ownerName: string;
    owner_name?: string;
    paidStatus: string;
    paid_status?: string;
    paymentAmount: string | number;
    payment_amount?: string | number;
    paymentDate: string;
    payment_date?: string;
    paymentType: string;
    payment_type?: string;
    utrNumber: string;
    utr_number?: string;
    siteCode: string;
    siteName: string;
    propertyLocation: string;
    image?: string;
    site?: {
        id: string;
        site_name: string;
        code: string;
        Code?: string;
        property_location: string;
        tenant_name: string;
    };
    tenant_id?: string;
    rent_month?: string;
    rent_year?: string;
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
interface SiteRentTransactionsTableProps {
    siteId?: string;
    site?: any;
}
export default function SiteRentTransactionsTable({ siteId: propSiteId, site }: SiteRentTransactionsTableProps) {
    const routeParams = useParams();
    const siteId = propSiteId ?? (routeParams?.siteId as string);
    const [transactions, setTransactions] = useState<RentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<FilterParams>({});
    const [totalCount, setTotalCount] = useState(0);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<RentTransaction | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf'>('excel');
    const [updateFormData, setUpdateFormData] = useState({
        monthly_rent: "",
        payment_type: "",
        paid_status: "",
        payment_date: "",
        payment_amount: "",
        utr_number: "",
        month_year: ""
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    // const { siteId } = useParams();
    const [siteData, setSiteData] = useState(null);
    useEffect(() => {
        fetchRentTransactions();
    }, [filters]);
    const fetchRentTransactions = async () => {
        if (!siteId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found");

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/rentTransactions?site_id=${siteId}`;
            console.log("Fetching rent transactions from:", url);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log("Rent Transactions API Response Status:", response.status);

            if (!response.ok) {
                console.error("Rent Transactions Error Response:", response);
                // Safely parse error — server may return HTML on 404
                const text = await response.text();
                let message = `HTTP error! status: ${response.status}`;
                try { message = JSON.parse(text)?.message || message; } catch { }
                throw new Error(message);
            }

            const data = await response.json();
            // Support both { rentPayments: [...] } and a direct array
            const payments = Array.isArray(data) ? data : (data.rentPayments ?? data.data ?? []);
            setTransactions(payments);
            setTotalCount(data.count ?? payments.length);
            setError(null);
            console.log("Fetched rent transactions:", payments);
        } catch (error) {
            console.error("Error fetching rent transactions:", error);
            setError(
                error instanceof Error ? error.message : "Failed to fetch rent transactions"
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
    const getTransactionMonthYear = (item: RentTransaction) => {
        // Try to use month_year if it's a string like "2024-06-01"
        if (typeof item.month_year === "string" && item.month_year.length >= 7) {
            return item.month_year.slice(0, 7); // "YYYY-MM"
        }
        // Fallback to rent_year and rent_month
        if (item.rent_year && item.rent_month) {
            const months = {
                "January": "01", "February": "02", "March": "03", "April": "04",
                "May": "05", "June": "06", "July": "07", "August": "08",
                "September": "09", "October": "10", "November": "11", "December": "12"
            };
            const monthNum = months[item.rent_month as keyof typeof months] || "01";
            return `${item.rent_year}-${monthNum}`;
        }
        return "";
    };
    // Get current month in "YYYY-MM" format
    const currentMonthYear = (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    })();
    const filteredTransactions = transactions
        .filter((item) => {
            const searchString = searchTerm.toLowerCase();
            const matchesSearch =
                (item.site?.site_name?.toLowerCase() || item.siteName?.toLowerCase() || "").includes(searchString) ||
                (item.site?.property_location?.toLowerCase() || item.propertyLocation?.toLowerCase() || "").includes(searchString) ||
                (item.site?.code?.toLowerCase() || item.site?.Code?.toLowerCase() || item.siteCode?.toLowerCase() || "").includes(searchString) ||
                (item.ownerName?.toLowerCase() || item.owner_name?.toLowerCase() || "").includes(searchString) ||
                (item.paymentType?.toLowerCase() || item.payment_type?.toLowerCase() || "").includes(searchString) ||
                (item.paidStatus?.toLowerCase() || item.paid_status?.toLowerCase() || "").includes(searchString) ||
                (item.utrNumber?.toLowerCase() || item.utr_number?.toLowerCase() || "").includes(searchString);

            const status = item.paidStatus || item.paid_status;
            const type = item.paymentType || item.payment_type;
            const matchesPaidStatus = !filters.paid_status || status?.toLowerCase() === filters.paid_status.toLowerCase();
            const matchesPaymentType = !filters.payment_type || type?.toLowerCase() === filters.payment_type.toLowerCase();

            const pDate = item.paymentDate || item.payment_date;
            const paymentDate = pDate ? new Date(pDate) : null;
            const matchesStartDate = !filters.start_date || (paymentDate && paymentDate >= new Date(filters.start_date));
            const matchesEndDate = !filters.end_date || (paymentDate && paymentDate <= new Date(filters.end_date));

            return (
                matchesSearch &&
                matchesPaidStatus &&
                matchesPaymentType &&
                matchesStartDate &&
                matchesEndDate
            );
        })
        .sort((a, b) => {
            const aMonth = a.monthYear || a.month_year || "";
            const bMonth = b.monthYear || b.month_year || "";
            if (aMonth === currentMonthYear && bMonth !== currentMonthYear) return -1;
            if (bMonth === currentMonthYear && aMonth !== currentMonthYear) return 1;
            const pDateA = a.paymentDate || a.payment_date;
            const pDateB = b.paymentDate || b.payment_date;
            const dateA = pDateA ? new Date(pDateA).getTime() : 0;
            const dateB = pDateB ? new Date(pDateB).getTime() : 0;
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
    const handleUpdateClick = (transaction: RentTransaction) => {
        setSelectedTransaction(transaction);
        // Format date to YYYY-MM-DD for input type="date"
        const formatDateForInput = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        };
        // Set month_year based on rent_month/rent_year or just use monthYear
        const mYear = transaction.monthYear || transaction.month_year || (transaction.rent_month && transaction.rent_year
            ? `${transaction.rent_year}-${getMonthNumber(transaction.rent_month)}-01`
            : '');
        setUpdateFormData({
            monthly_rent: (transaction.monthlyRent || transaction.monthly_rent || "0").toString(),
            payment_type: transaction.paymentType || transaction.payment_type || "",
            paid_status: transaction.paidStatus || transaction.paid_status || "",
            payment_date: formatDateForInput(transaction.paymentDate || transaction.payment_date || ""),
            payment_amount: (transaction.paymentAmount || transaction.payment_amount || "0").toString(),
            utr_number: transaction.utrNumber || transaction.utr_number || "",
            month_year: mYear
        });
        setIsUpdateModalOpen(true);
    };
    const getMonthNumber = (monthName: string) => {
        const months = {
            "January": "01", "February": "02", "March": "03", "April": "04",
            "May": "05", "June": "06", "July": "07", "August": "08",
            "September": "09", "October": "10", "November": "11", "December": "12"
        };
        return months[monthName as keyof typeof months] || "01";
    };
    const handleDeleteClick = (transaction: RentTransaction) => {
        setSelectedTransaction(transaction);
        setIsDeleteModalOpen(true);
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUpdateFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear the error for this field
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
        if (!updateFormData.monthly_rent) {
            errors.monthly_rent = "Monthly rent is required";
        } else if (isNaN(Number(updateFormData.monthly_rent))) {
            errors.monthly_rent = "Monthly rent must be a number";
        }
        if (!updateFormData.paid_status) {
            errors.paid_status = "Payment status is required";
        }
        if (!updateFormData.payment_type) {
            errors.payment_type = "Payment type is required";
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
            if (!token) throw new Error("Authentication token not found");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/rent/${selectedTransaction.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        monthlyRent: updateFormData.monthly_rent,
                        paymentType: updateFormData.payment_type,
                        paidStatus: updateFormData.paid_status,
                        paymentDate: updateFormData.payment_date,
                        paymentAmount: updateFormData.payment_amount,
                        utrNumber: updateFormData.utr_number,
                        monthYear: updateFormData.month_year
                    }),
                }
            );
            if (!response.ok) {
                const text = await response.text();
                let message = `HTTP error! status: ${response.status}`;
                try { message = JSON.parse(text)?.message || message; } catch { }
                throw new Error(message);
            }
            // Refresh the data
            await fetchRentTransactions();
            // Close the modal
            setIsUpdateModalOpen(false);
            setSelectedTransaction(null);
            // Show success toast or notification here (if you have a toast system)
            alert("Rent payment updated successfully");
        } catch (error) {
            console.error("Error updating rent payment:", error);
            alert(error instanceof Error ? error.message : "Failed to update rent payment");
        } finally {
            setUpdateLoading(false);
        }
    };
    // Function to handle Excel download
    const handleDownloadExcel = async (siteId: number | string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/download-site-ledger-excel/${siteId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to download Excel');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SiteRentLedger_${siteId}_${Date.now()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Excel download failed:', err);
            alert('Excel download failed');
        }
    };
    const handleDownloadPDF = async (siteId: number | string) => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/download-site-ledger-pdf/${siteId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SiteRentLedger_${siteId}_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF download failed:', error);
            alert('PDF download failed');
        }
    };
    const handleDownload = () => {
        if (selectedFormat === 'excel') {
            handleDownloadExcel(site.id);
        } else {
            handleDownloadPDF(site.id);
        }
    };
    const handleDeleteSubmit = async () => {
        if (!selectedTransaction) return;
        try {
            setDeleteLoading(true);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/rent/${selectedTransaction.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!response.ok) {
                const text = await response.text();
                let message = `HTTP error! status: ${response.status}`;
                try { message = JSON.parse(text)?.message || message; } catch { }
                throw new Error(message);
            }
            // Refresh the data
            await fetchRentTransactions();
            // Close the modal
            setIsDeleteModalOpen(false);
            setSelectedTransaction(null);
            // Show success toast or notification here (if you have a toast system)
            alert("Rent payment deleted successfully");
        } catch (error) {
            console.error("Error deleting rent payment:", error);
            alert(error instanceof Error ? error.message : "Failed to delete rent payment");
        } finally {
            setDeleteLoading(false);
        }
    };
    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }
    if (error) {
        return <div className="p-4 text-center text-red-500">Error: {error}</div>;
    }
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 px-3 sticky top-0 z-20 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13141a]">
                {/* Row 1: count + download */}
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Showing {filteredTransactions.length} of {totalCount} transactions
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative inline-block text-left">
                            <button
                                onClick={handleDownload}
                                className="px-3 py-2 min-h-[44px] text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                            >
                                📥 Ledger ({selectedFormat.toUpperCase()})
                            </button>
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value as 'excel' | 'pdf')}
                                className="absolute top-0 right-0 h-full opacity-0 cursor-pointer"
                            >
                                <option value="excel">excel</option>
                                <option value="pdf">pdf</option>
                            </select>
                        </div>
                    </div>
                </div>
                {/* Row 2: filter inputs - wraps on mobile */}
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 min-w-[8rem] max-w-full px-2 py-2 min-h-[40px] text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
                    />
                    <select
                        value={filters.paid_status || ""}
                        onChange={(e) => handleFilterChange("paid_status", e.target.value)}
                        className="flex-1 min-w-[8rem] px-2 py-2 min-h-[40px] text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-white/[0.1] dark:text-white">
                        <option value="" className="dark:bg-gray-950">All Status</option>
                        <option value="Paid" className="dark:bg-gray-950">Paid</option>
                        <option value="Pending" className="dark:bg-gray-950">Pending</option>
                        <option value="Partial" className="dark:bg-gray-950">Partial</option>
                    </select>
                    <select
                        value={filters.payment_type || ""}
                        onChange={(e) => handleFilterChange("payment_type", e.target.value)}
                        className="flex-1 min-w-[8rem] px-2 py-2 min-h-[40px] text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-white/[0.1] dark:text-white">
                        <option value="" className="dark:bg-gray-950">All Types</option>
                        <option value="Rent" className="dark:bg-gray-950">Rent</option>
                        <option value="Electricity" className="dark:bg-gray-950">Electricity</option>
                    </select>
                    <DatePicker
                        selected={filters.start_date ? new Date(filters.start_date) : null}
                        onChange={(date: Date | null) =>
                            handleFilterChange(
                                "start_date",
                                date ? date.toLocaleDateString("en-CA") : ""
                            )
                        }
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Start Date"
                        className="flex-1 min-w-[8rem] px-2 py-2 min-h-[40px] text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
                    />
                    <DatePicker
                        selected={filters.end_date ? new Date(filters.end_date) : null}
                        onChange={(date: Date | null) =>
                            handleFilterChange(
                                "end_date",
                                date ? date.toLocaleDateString("en-CA") : ""
                            )
                        }
                        dateFormat="yyyy-MM-dd"
                        placeholderText="End Date"
                        className="flex-1 min-w-[8rem] px-2 py-2 min-h-[40px] text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
                    />
                    <button
                        onClick={() => setFilters({})}
                        className="px-3 py-2 min-h-[40px] text-sm bg-gray-200 hover:bg-gray-300 rounded dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                    >
                        Clear
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
                                                { width: "w-10", label: "ID" },
                                                { width: "w-16", label: "Site Code" },
                                                { width: "w-24", label: "Site Name" },
                                                { width: "w-20", label: "Owner Name" },
                                                { width: "w-32", label: "Rent Amount" },
                                                { width: "w-32", label: "Payment Date" },
                                                { width: "w-32", label: "Rent Period" },
                                                { width: "w-12", label: "Payment Type" },
                                                { width: "w-10", label: "Status" },
                                                { width: "w-24", label: "UTR Number" },
                                                { width: "w-24", label: "Image" },
                                                { width: "w-28", label: "Actions" }
                                            ].map(({ width, label }) => (
                                                <TableCell
                                                    key={label}
                                                    className={`${width} px-6 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap bg-gray-50 dark:bg-brand-500`}
                                                >
                                                    {label}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredTransactions.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <TableCell className="w-16 px-6 py-4 text-gray-900  dark:text-gray-100 truncate max-w-24" title={item.id.toString()}>{item.id}</TableCell>
                                                <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">{item.site?.Code || item.site?.code || item.siteCode || '-'}</TableCell>
                                                <TableCell className="w-24 px-6 py-4 text-gray-900 dark:text-gray-100">
                                                    {item.site
                                                        ? `${item.site.site_name} (${item.site.property_location || 'No location'})`
                                                        : (item.siteName ? `${item.siteName} (${item.propertyLocation || 'No location'})` : '-')}
                                                </TableCell>
                                                <TableCell className="w-20 px-6 py-4 text-gray-900 truncate max-w-48 dark:text-gray-100">{item.ownerName || item.owner_name || '-'}</TableCell>
                                                <TableCell className="w-32 px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                                                    {formatCurrency(parseFloat((item.paymentAmount || item.payment_amount || item.monthlyRent || item.monthly_rent || '0').toString()) || 0)}
                                                </TableCell>
                                                <TableCell className="w-32 px-6 py-4 text-gray-900 dark:text-gray-100">
                                                    {formatDate(item.paymentDate || item.payment_date || '')}
                                                </TableCell>
                                                <TableCell className="w-32 px-6 py-4 text-gray-900 dark:text-gray-100">
                                                    {`${item.monthYear || item.month_year || '-'}`}
                                                </TableCell>
                                                <TableCell className="w-12 px-6 py-4 text-center text-gray-900 dark:text-gray-100">
                                                    {item.paymentType || item.payment_type || '-'}
                                                </TableCell>
                                                <TableCell className="w-10 px-6 py-4 text-gray-900 dark:text-gray-100">
                                                    <Badge
                                                        size="sm"
                                                        color={
                                                            (item.paidStatus || item.paid_status)?.toLowerCase() === "paid"
                                                                ? "success"
                                                                : (item.paidStatus || item.paid_status)?.toLowerCase() === "pending"
                                                                    ? "warning"
                                                                    : "error"
                                                        }
                                                    >
                                                        {item.paidStatus || item.paid_status || 'Unknown'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="w-32 px-6 py-4 text-gray-900 dark:text-gray-100">{item.utrNumber || item.utr_number || '-'}</TableCell>
                                                <TableCell className="w-24 px-6 py-4 text-gray-900 dark:text-gray-100">
                                                    {item.image ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="underline text-blue-600 hover:text-blue-800 text-xs"
                                                                onClick={() => setSelectedTransaction(item)}
                                                                title="View Image"
                                                            >
                                                                View Image
                                                            </button>
                                                            {/* Image Popup */}
                                                            {selectedTransaction?.id === item.id && selectedTransaction.image && (
                                                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                                                                    <div className="bg-white dark:bg-[#13141a] rounded-lg p-4 shadow-lg relative max-w-xs w-full">
                                                                        <button
                                                                            className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-gray-800 dark:hover:text-red-500"
                                                                            onClick={() => setSelectedTransaction(null)}
                                                                            aria-label="Close"
                                                                        >
                                                                            &times;
                                                                        </button>
                                                                        <img
                                                                            src={selectedTransaction.image}
                                                                            alt="Rent"
                                                                            className="max-h-80 w-auto mx-auto rounded"
                                                                            onError={e => (e.currentTarget.style.display = 'none')}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell className="w-28 px-6 py-4 text-gray-900 dark:text-gray-100">
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
                        {searchTerm
                            ? `No results found for "${searchTerm}"`
                            : "No rent transactions found"
                        }
                    </div>
                )}
            </div>
            {isUpdateModalOpen && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-[#1f1f1f] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                            Update Rent Payment
                        </h2>
                        <form onSubmit={handleUpdateSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Monthly Rent
                                    </label>
                                    <input
                                        type="text"
                                        name="monthly_rent"
                                        value={updateFormData.monthly_rent}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border ${formErrors.monthly_rent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
                                    />
                                    {formErrors.monthly_rent && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.monthly_rent}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Payment Type
                                    </label>
                                    <select
                                        name="payment_type"
                                        value={updateFormData.payment_type}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border ${formErrors.payment_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white`}
                                    >
                                        <option value="" className="dark:bg-gray-950">Select Payment Type</option>
                                        <option value="Rent" className="dark:bg-gray-950">Rent</option>
                                        <option value="Electricity" className="dark:bg-gray-950">Electricity</option>
                                    </select>
                                    {formErrors.payment_type && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.payment_type}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Payment Status
                                    </label>
                                    <select
                                        name="paid_status"
                                        value={updateFormData.paid_status}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border ${formErrors.paid_status ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white`}
                                    >
                                        <option value="" className="dark:bg-gray-950">Select Status</option>
                                        <option value="paid" className="dark:bg-gray-950">Paid</option>
                                        <option value="pending" className="dark:bg-gray-950">Pending</option>
                                        <option value="failed" className="dark:bg-gray-950">Partial</option>
                                    </select>
                                    {formErrors.paid_status && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.paid_status}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        name="payment_date"
                                        value={updateFormData.payment_date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Payment Amount
                                    </label>
                                    <input
                                        type="text"
                                        name="payment_amount"
                                        value={updateFormData.payment_amount}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        UTR Number
                                    </label>
                                    <input
                                        type="text"
                                        name="utr_number"
                                        value={updateFormData.utr_number}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Rent Period (Month/Year)
                                    </label>
                                    <input
                                        type="text"
                                        name="month_year"
                                        value={updateFormData.month_year}
                                        onChange={handleInputChange}
                                        placeholder="e.g. January 2024"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUpdateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updateLoading ? "Updating..." : "Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isDeleteModalOpen && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-white/[0.03] rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                            Confirm Delete
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete this rent payment? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSubmit}
                                disabled={deleteLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}