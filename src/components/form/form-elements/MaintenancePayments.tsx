"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Calendar, CreditCard, DollarSign, FileText, Upload, Trash2, CheckCircle2, LayoutDashboard, Wrench 

     
 } from "lucide-react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import CustomDatePicker from "@/components/form/date-picker";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface MaintenancePaymentFormProps {
    siteId: string;
    owners?: any[];
    currentMonthlyRent?: number;
    centreId?: string;
}

export default function MaintenancePaymentForm({ siteId, owners = [], currentMonthlyRent = 0, centreId }: MaintenancePaymentFormProps) {
    const [formData, setFormData] = useState({
        siteId: siteId,
        monthYear: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentAmount: "",
        paidStatus: "paid",
        paymentType: "Online",
        utrNumber: "",
        maintenanceDescription: "",
        centreId: typeof centreId === 'object' ? (centreId as any)._id : (centreId || ""),
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const API = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        setFormData(prev => ({ ...prev, siteId }));
    }, [siteId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const validateForm = () => {
        const required = ["monthYear", "paymentAmount", "paidStatus"];
        const missing = required.filter(f => !formData[f as keyof typeof formData]);
        if (missing.length > 0) {
            toast.error(`Please provide: ${missing.join(", ")}`);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
        });

        if (imageFile) {
            data.append("image", imageFile);
        }

        // Debug payload
        console.log("🚀 [Maintenance Transaction] Sending Payload:");
        for (let [key, value] of (data as any).entries()) {
            console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/api/rent/siteTransaction/maintenance-transaction`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: data,
            });

            const result = await res.json();
            console.log("📥 [Maintenance Transaction] Server Response:", result);

            if (res.ok) {
                toast.success("Maintenance transaction recorded successfully!");
                // Clear some fields but keep siteId and monthYear for convenience
                setFormData(prev => ({
                    ...prev,
                    paymentAmount: "",
                    utrNumber: "",
                    maintenanceDescription: "",
                }));
                setImageFile(null);
            } else {
                throw new Error(result.message || "Failed to record transaction");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
                    <Wrench className="text-white" size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">Record Maintenance</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Payment details will be recorded in the general ledger</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Billing Month */}
                    <div className="space-y-1.5">
                        <Label htmlFor="monthYear" className="text-xs font-bold uppercase tracking-wider text-gray-400">Billing Month*</Label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 z-10" />
                            <ReactDatePicker
                                selected={formData.monthYear ? new Date(formData.monthYear + "-01") : null}
                                onChange={(date) => {
                                    if (date) {
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        setFormData(prev => ({ ...prev, monthYear: `${year}-${month}` }));
                                    }
                                }}
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                placeholderText="Select Month"
                                className="h-10 w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <Label htmlFor="paymentAmount" className="text-xs font-bold uppercase tracking-wider text-gray-400">Amount Paid*</Label>
                        <Input
                            type="number"
                            id="paymentAmount"
                            name="paymentAmount"
                            value={formData.paymentAmount}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            required
                            className="h-10 text-sm"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <Label htmlFor="paidStatus" className="text-xs font-bold uppercase tracking-wider text-gray-400">Status*</Label>
                        <Select
                            options={[
                                { value: "paid", label: "Paid" },
                                { value: "pending", label: "Pending" },
                                { value: "partial", label: "Partially Paid" },
                            ]}
                            value={formData.paidStatus}
                            onChange={(val) => setFormData(p => ({ ...p, paidStatus: val }))}
                            className="h-10 text-sm"
                        />
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-1.5">
                        <Label htmlFor="paymentDate" className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment Date*</Label>
                        <CustomDatePicker
                            id="paymentDate"
                            value={formData.paymentDate ? new Date(formData.paymentDate) : new Date()}
                            onChange={(date: Date[]) => {
                                if (date && date[0]) {
                                    const d = date[0];
                                    const formatted = [
                                        d.getFullYear(),
                                        String(d.getMonth() + 1).padStart(2, '0'),
                                        String(d.getDate()).padStart(2, '0')
                                    ].join('-');
                                    setFormData(prev => ({ ...prev, paymentDate: formatted }));
                                }
                            }}
                        />
                    </div>

                    {/* UTR Number */}
                    <div className="space-y-1.5">
                        <Label htmlFor="utrNumber" className="text-xs font-bold uppercase tracking-wider text-gray-400">UTR / Ref Number</Label>
                        <Input
                            type="text"
                            id="utrNumber"
                            name="utrNumber"
                            value={formData.utrNumber}
                            onChange={handleInputChange}
                            placeholder="Optional"
                            className="h-10 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5 lg:col-span-1">
                        <Label htmlFor="maintenanceDescription" className="text-xs font-bold uppercase tracking-wider text-gray-400">Maintenance Description*</Label>
                        <textarea
                            id="maintenanceDescription"
                            name="maintenanceDescription"
                            value={formData.maintenanceDescription}
                            onChange={handleInputChange}
                            placeholder="Brief description..."
                            className="w-full h-10 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white resize-none"
                        />
                    </div>

                    {/* Proof of Payment */}
                    <div className="col-span-1 lg:col-span-3 space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Proof of Payment</Label>
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor="image"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/[0.03] border border-dashed border-gray-200 dark:border-white/[0.1] rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer group"
                            >
                                <Upload size={14} className="text-gray-400 group-hover:text-orange-500" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-orange-600 transition-colors">
                                    {imageFile ? imageFile.name : "Click to upload image or PDF"}
                                </span>
                                <input
                                    type="file"
                                    id="image"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            {imageFile && (
                                <button 
                                    type="button"
                                    onClick={() => setImageFile(null)}
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Processing...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                <span>Post Transaction</span>
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
