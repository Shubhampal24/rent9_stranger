/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

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

interface RentTransaction {
  id: string;
  _id?: string;
  siteOwnerId?: string;
  siteId: any | null;
  ownerId?: any;
  ownerName?: string;
  siteCode: string;
  siteName: string;
  category: string;
  monthYear: string;
  paymentDate: string;
  paymentAmount: string;
  paidStatus: string;
  paymentType: string;
  utrNumber: string;
  image: string | null;
  monthlyRent: string;
  electricityConsumerId: string | null;
  units: number | null;
  electricityCharges: number | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  site?: {
    property_location: string;
    property_address: string;
    location: any;
    id: string;
    site_name: string;
    code: string;
    tenant_name: string;
  };
}

interface FilterParams {
  site_id?: string;
  owner_name?: string;
  paidStatus?: string;
  startDate?: string;
  endDate?: string;
  paymentType?: string;
  paymentAmount?: string;
  utr_number?: string;
}

export default function RentTransactionsTable() {
  const [transactions, setTransactions] = useState<RentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterParams>({});
  const [totalCount, setTotalCount] = useState(0);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RentTransaction | null>(null);
  const [updateFormData, setUpdateFormData] = useState({
    monthlyRent: "",
    paymentType: "",
    paidStatus: "",
    paymentDate: "",
    paymentAmount: "",
    utrNumber: "",
    monthYear: "",
    ownerName: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewProofTransaction, setViewProofTransaction] = useState<RentTransaction | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchRentTransactions();
  }, [filters]);

  const fetchRentTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const queryParams = new URLSearchParams();
      const hasFullDateRange = !!(filters.startDate && filters.endDate);
      let baseUrl = "rentTransactions/site/all";

      if (filters.paidStatus && !hasFullDateRange) {
        // Status filter uses renttransactions/status/:status path - ONLY if no full date range is selected
        baseUrl = `renttransactions/status/${filters.paidStatus.toLowerCase()}`;
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          // If we're on the status-specific endpoint, the paidStatus is already in the path
          if (key === "paidStatus" && baseUrl.includes("status/")) return;

          // Ensure startDate and endDate are only added if both are present to avoid 400 error
          if (key === "startDate" && !filters.endDate) return;
          if (key === "endDate" && !filters.startDate) return;

          queryParams.append(key, value as string);
        }
      });

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/${baseUrl}${queryParams.toString() ? `?${queryParams.toString()}&` : '?'}t=${Date.now()}`;
      console.log("Fetching transactions from:", endpoint);
      const response = await fetch(
        endpoint,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transactionsList = data.data || data.rentPayments || [];
      const normalizedTransactions = transactionsList.map((t: any) => ({
        ...t,
        id: t._id || t.id,
        siteCode: t.siteId?.code || t.siteCode,
        siteName: t.siteId?.siteName || t.siteName,
        site: t.siteId ? {
          ...t.siteId,
          site_name: t.siteId.siteName || t.siteName,
          code: t.siteId.code || t.siteCode,
        } : t.site,
        ownerId: t.ownerId?._id || t.ownerId,
        ownerName: t.ownerId?.ownerName || t.ownerName,
      }));

      setTransactions(normalizedTransactions);
      setTotalCount(data.total || data.count || normalizedTransactions.length);
      setError(null);
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
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Parse "April-2026" or "2024-06" style monthYear strings for sorting
  const getTransactionMonthYear = (item: RentTransaction): string => {
    if (!item.monthYear) return "";

    // Format: "April 2026"
    const namedMonthMatch = item.monthYear.match(/^([A-Za-z]+)\s(\d{4})$/);
    if (namedMonthMatch) {
      const months: Record<string, string> = {
        January: "01", February: "02", March: "03", April: "04",
        May: "05", June: "06", July: "07", August: "08",
        September: "09", October: "10", November: "11", December: "12",
      };
      const monthNum = months[namedMonthMatch[1]] || "01";
      return `${namedMonthMatch[2]}-${monthNum}`;
    }

    // Format: "2024-06-01" or "2024-06"
    if (item.monthYear.length >= 7) {
      return item.monthYear.slice(0, 7);
    }

    return "";
  };

  const currentMonthYear = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  const filteredTransactions = transactions
    .filter((item) => {
      // Local Date Filter - removed as it's now handled server-side to avoid discrepancies

      const searchString = searchTerm.toLowerCase();
      return (
        (item.site?.site_name?.toLowerCase() || "").includes(searchString) ||
        (item.site?.property_location?.toLowerCase() || "").includes(searchString) ||
        (item.site?.code?.toLowerCase() || "").includes(searchString) ||
        (item.ownerName?.toLowerCase() || "").includes(searchString) ||
        (item.paymentType?.toLowerCase() || "").includes(searchString) ||
        (item.paidStatus?.toLowerCase() || "").includes(searchString) ||
        (item.utrNumber?.toLowerCase() || "").includes(searchString) ||
        (item.monthYear?.toLowerCase() || "").includes(searchString)
      );
    })
    .sort((a, b) => {
      const aMonth = getTransactionMonthYear(a);
      const bMonth = getTransactionMonthYear(b);

      if (aMonth === currentMonthYear && bMonth !== currentMonthYear) return -1;
      if (bMonth === currentMonthYear && aMonth !== currentMonthYear) return 1;

      const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
      const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
      return dateB - dateA;
    });

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
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

  const handleUpdateClick = (transaction: RentTransaction) => {
    setSelectedTransaction(transaction);
    setUpdateFormData({
      monthlyRent: transaction.monthlyRent?.toString() || "",
      paymentType: transaction.paymentType || "",
      paidStatus: transaction.paidStatus || "",
      paymentDate: formatDateForInput(transaction.paymentDate),
      paymentAmount: transaction.paymentAmount?.toString() || "",
      utrNumber: transaction.utrNumber || "",
      monthYear: normalizeMonthYear(transaction.monthYear || ""),
      ownerName: transaction.ownerName || "",
    });
    setNewImageFile(null);
    setRemoveImageFlag(false);
    setPreviewUrl(transaction.image || null);

    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (transaction: RentTransaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUpdateFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!updateFormData.monthlyRent) {
      errors.monthlyRent = "Monthly rent is required";
    } else if (isNaN(Number(updateFormData.monthlyRent))) {
      errors.monthlyRent = "Monthly rent must be a number";
    }
    if (!updateFormData.paidStatus) {
      errors.paidStatus = "Payment status is required";
    }
    if (!updateFormData.paymentType) {
      errors.paymentType = "Payment type is required";
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

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteTransaction/${selectedTransaction.id}`;

      const formData = new FormData();

      formData.append("monthlyRent", String(Number(updateFormData.monthlyRent) || 0));
      formData.append("paidStatus", updateFormData.paidStatus);
      formData.append("paymentType", updateFormData.paymentType);
      formData.append("utrNumber", updateFormData.utrNumber);
      formData.append("paymentDate", updateFormData.paymentDate);
      formData.append("monthlyRent", String(Number(updateFormData.monthlyRent) || 0));
      formData.append("ownerName", updateFormData.ownerName);
      formData.append("monthYear", normalizeMonthYear(updateFormData.monthYear));

      // ✅ send image if selected
      if (newImageFile) {
        formData.append("image", newImageFile);
      }

      // ✅ remove image flag
      if (removeImageFlag) {
        formData.append("removeImage", "true");
      }

      console.log("🚀 [Rent Transaction] Submitting Update Payload:");
      for (const [key, value] of (formData as any).entries()) {
          console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      await fetchRentTransactions();
      setNewImageFile(null);
      setRemoveImageFlag(false);
      setSelectedTransaction(null);
      setIsUpdateModalOpen(false);
      alert("Transaction updated successfully");
    } catch (error) {
      console.error("Error updating rent transaction:", error);
      alert(error instanceof Error ? error.message : "Failed to update transaction");
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteTransaction/${selectedTransaction.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      await fetchRentTransactions();
      setIsDeleteModalOpen(false);
      setSelectedTransaction(null);
      alert("Rent payment deleted successfully");
    } catch (error) {
      console.error("Error deleting rent payment:", error);
      alert(error instanceof Error ? error.message : "Failed to delete rent payment");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === "startDate" && !filters.endDate) return;
          if (key === "endDate" && !filters.startDate) return;
          queryParams.append(key, value as string);
        }
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rent/renttransactions/export/ledger?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error(`Failed to download Excel file: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RentLedger_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert(error instanceof Error ? error.message : "Failed to download Excel");
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-2 px-3 sticky top-0 z-20 py-2 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
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
            <option value="" className="dark:bg-gray-950">All Status</option>
            <option value="paid" className="dark:bg-gray-950">Paid</option>
            <option value="pending" className="dark:bg-gray-950">Pending</option>
            <option value="Partial" className="dark:bg-gray-950">Partial</option>
          </select>

          <DatePicker
            selected={filters.startDate ? new Date(filters.startDate) : null}
            onChange={(date: Date | null) =>
              handleFilterChange("startDate", date ? date.toLocaleDateString("en-CA") : "")
            }
            dateFormat="yyyy-MM-dd"
            placeholderText="Start Date"
            className="w-32 px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
          />

          <DatePicker
            selected={filters.endDate ? new Date(filters.endDate) : null}
            onChange={(date: Date | null) =>
              handleFilterChange("endDate", date ? date.toLocaleDateString("en-CA") : "")
            }
            dateFormat="yyyy-MM-dd"
            placeholderText="End Date"
            className="w-32 px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
          />

          <button
            onClick={() => setFilters({})}
            className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleDownloadExcel}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            📥 Download Excel
          </button>

        </div>
      </div>

      {/* ── Table ── */}
      <div className="relative rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <TableHeader className="sticky top-0 z-10 bg-white dark:bg-[#13141a] border-b border-gray-200 dark:border-gray-700">
                    <TableRow>
                      {[
                        // { width: "w-10",  label: "ID" },
                        { width: "w-16", label: "Site Code" },
                        { width: "w-24", label: "Site Name" },
                        { width: "w-20", label: "Owner Name" },
                        { width: "w-20", label: "Category" },
                        { width: "w-32", label: "Rent Amount" },
                        { width: "w-32", label: "Payment Date" },
                        { width: "w-32", label: "Rent Period" },
                        { width: "w-12", label: "Payment Type" },
                        { width: "w-10", label: "Status" },
                        { width: "w-24", label: "UTR Number" },
                        { width: "w-24", label: "Image" },
                        { width: "w-28", label: "Actions" },
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
                        {/* ID */}
                        {/* <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100 text-xs break-all">
                          {item.id}
                        </TableCell> */}

                        {/* Site Code */}
                        <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">
                          {item.siteCode || item.site?.code || "-"}
                        </TableCell>

                        {/* Site Name */}
                        <TableCell className="w-24 px-6 py-4 text-gray-900 dark:text-gray-100">
                          {item.site
                            ? (item.site.site_name || "-")
                            : (item.siteName || "-")}
                        </TableCell>

                        {/* Owner Name */}
                        <TableCell className="w-20 px-6 py-4 text-gray-900 dark:text-gray-100 truncate max-w-48">
                          {item.ownerName || "-"}
                        </TableCell>

                        {/* Category */}
                        <TableCell className="w-20 px-6 py-4 text-gray-900 dark:text-gray-100 capitalize">
                          {item.category || "-"}
                        </TableCell>

                        {/* Payment Amount */}
                        <TableCell className="w-32 px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                          {formatCurrency(Number(item.paymentAmount))}
                        </TableCell>

                        {/* Payment Date */}
                        <TableCell className="w-32 px-6 py-4 text-gray-900 dark:text-gray-100">
                          {formatDate(item.paymentDate)}
                        </TableCell>

                        {/* Rent Period */}
                        <TableCell className="w-32 px-6 py-4 text-gray-900 dark:text-gray-100">
                          {item.monthYear || "-"}
                        </TableCell>

                        {/* Payment Type */}
                        <TableCell className="w-12 px-6 py-4 text-center text-gray-900 dark:text-gray-100">
                          {item.paymentType || "-"}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="w-10 px-6 py-4 text-gray-900 dark:text-gray-100">
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
                            {item.paidStatus || "Unknown"}
                          </Badge>
                        </TableCell>

                        {/* UTR Number */}
                        <TableCell className="w-32 px-6 py-4 text-gray-900 dark:text-gray-100">
                          {item.utrNumber || "-"}
                        </TableCell>

                        {/* Image / Proof */}
                        <TableCell className="w-24 px-6 py-4 text-gray-900 dark:text-gray-100">
                          {item.image ? (
                            <>
                              <button
                                type="button"
                                className="underline text-blue-600 hover:text-blue-800 text-xs"
                                onClick={() => setViewProofTransaction(item)}
                                title="View File"
                              >
                                View Proof
                              </button>

                              {viewProofTransaction?.id === item.id && viewProofTransaction.image && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                                  <div className="bg-white dark:bg-[#13141a] rounded-lg p-4 shadow-lg relative max-w-xs w-full">
                                    <button
                                      className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-gray-800 dark:hover:text-red-500"
                                      onClick={() => setViewProofTransaction(null)}
                                      aria-label="Close"
                                    >
                                      &times;
                                    </button>
                                    {viewProofTransaction.image.endsWith(".pdf") ? (
                                      <iframe
                                        src={viewProofTransaction.image}
                                        title="PDF Proof"
                                        width="300"
                                        height="400"
                                        className="mx-auto border rounded"
                                      >
                                        <a href={viewProofTransaction.image} target="_blank" rel="noopener noreferrer">
                                          View PDF
                                        </a>
                                      </iframe>
                                    ) : (
                                      <img
                                        src={viewProofTransaction.image}
                                        alt="Rent Proof"
                                        className="max-h-80 w-auto mx-auto rounded"
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        {/* Actions */}
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
            {searchTerm ? `No results found for "${searchTerm}"` : "No rent transactions found"}
          </div>
        )}
      </div>

      {/* ── Update Modal ── */}
      {isUpdateModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Update Rent Payment
            </h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="space-y-4">
                {/* Row 1: Monthly Rent & Payment Type */}
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Rent
                    </label>
                    <input
                      type="text"
                      name="monthlyRent"
                      value={updateFormData.monthlyRent}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${formErrors.monthlyRent ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
                    />
                    {formErrors.monthlyRent && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.monthlyRent}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Type
                    </label>
                    <select
                      name="paymentType"
                      value={updateFormData.paymentType}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${formErrors.paymentType ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white`}
                    >
                      <option value="" className="dark:bg-gray-950 text-gray-500">Select Payment Type</option>
                      <option value="online" className="dark:bg-gray-950">Online</option>
                      <option value="cash" className="dark:bg-gray-950">Cash</option>
                      <option value="cheque" className="dark:bg-gray-950">Cheque</option>
                    </select>
                    {formErrors.paymentType && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.paymentType}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Payment Status & Payment Date */}
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Status
                    </label>
                    <select
                      name="paidStatus"
                      value={updateFormData.paidStatus}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${formErrors.paidStatus ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white`}
                    >
                      <option value="" className="dark:bg-gray-950 text-gray-500">Select Status</option>
                      <option value="paid" className="dark:bg-gray-950">Paid</option>
                      <option value="pending" className="dark:bg-gray-950">Pending</option>
                      <option value="Partial" className="dark:bg-gray-950">Partial</option>
                    </select>
                    {formErrors.paidStatus && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.paidStatus}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Date
                    </label>
                    <DatePicker
                      selected={updateFormData.paymentDate ? new Date(updateFormData.paymentDate) : null}
                      onChange={(date: Date | null) => {
                        setUpdateFormData((prev) => ({
                          ...prev,
                          paymentDate: date
                            ? [
                              date.getFullYear(),
                              String(date.getMonth() + 1).padStart(2, "0"),
                              String(date.getDate()).padStart(2, "0"),
                            ].join("-")
                            : "",
                        }));
                      }}
                      dateFormat="yyyy-MM-dd"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholderText="Select date"
                      isClearable
                    />
                  </div>
                </div>

                {/* Row 3: Payment Amount & UTR Number */}
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Amount
                    </label>
                    <input
                      type="text"
                      name="paymentAmount"
                      value={updateFormData.paymentAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      UTR Number
                    </label>
                    <input
                      type="text"
                      name="utrNumber"
                      value={updateFormData.utrNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Row 4: Rent Period & Update Proof */}
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Update Proof
                    </label>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setNewImageFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                          setRemoveImageFlag(false);
                        }
                      }}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white mt-1"
                    />
                    {previewUrl && (
                      <div className="mt-3 relative">
                        {previewUrl.endsWith(".pdf") ? (
                          <iframe
                            src={previewUrl}
                            title="Preview"
                            className="w-full h-40 border rounded"
                          />
                        ) : (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-32 rounded border object-contain"
                          />
                        )}

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(null);
                            setNewImageFile(null);
                            setRemoveImageFlag(true); // 🔥 important for backend
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
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

      {/* ── Delete Modal ── */}
      {isDeleteModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirm Delete</h2>
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