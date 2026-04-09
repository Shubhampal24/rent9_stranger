"use client";

import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Calendar, CreditCard, DollarSign, FileText, Upload, Trash2, CheckCircle2, LayoutDashboard, Wrench 

     
 } from "lucide-react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
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
        <div className="relative group">
            {/* Animated Gradient Background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>

            <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/[0.06] shadow-2xl overflow-hidden shadow-emerald-500/5">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Wrench className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Record Maintenance</h2>
                            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">General Upkeep & Repairs</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* Billing Month */}
                        <div className="space-y-1.5">
                            <Label htmlFor="monthYear" className="text-xs font-bold uppercase tracking-wider text-gray-400">Billing Month*</Label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 z-10" />
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
                                    className="h-11 w-full pl-9 pr-3 py-2.5 text-sm font-semibold border-gray-100 dark:border-white/[0.05] bg-gray-50/50 focus:bg-white transition-all rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5">
                            <Label htmlFor="paymentAmount" className="text-xs font-bold uppercase tracking-wider text-gray-400">Amount Paid*</Label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                <Input
                                    type="number"
                                    id="paymentAmount"
                                    name="paymentAmount"
                                    value={formData.paymentAmount}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    className="h-11 pl-9 text-sm font-semibold border-gray-100 dark:border-white/[0.05] bg-gray-50/50 focus:bg-white transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label htmlFor="paidStatus" className="text-xs font-bold uppercase tracking-wider text-gray-400">Status*</Label>
                            <Select
                                options={[
                                    { value: "paid", label: "Paid" },
                                    { value: "pending", label: "Pending" },
                                    { value: "partial", label: "Partial" },
                                ]}
                                value={formData.paidStatus}
                                onChange={(val) => setFormData(p => ({ ...p, paidStatus: val }))}
                                className="h-11 text-sm font-semibold border-gray-100 dark:border-white/[0.05] rounded-xl"
                            />
                        </div>

                        {/* Payment Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="paymentDate" className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment Date*</Label>
                            <Input
                                type="date"
                                id="paymentDate"
                                name="paymentDate"
                                value={formData.paymentDate}
                                onChange={handleInputChange}
                                className="h-11 text-sm font-semibold border-gray-100 dark:border-white/[0.05] bg-gray-50/50 focus:bg-white transition-all rounded-xl"
                            />
                        </div>

                        {/* Payment Type / Description Label */}
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="maintenanceDescription" className="text-xs font-bold uppercase tracking-wider text-gray-400">Maintenance Description*</Label>
                            <div className="relative">
                                <FileText size={14} className="absolute left-3 top-3 text-emerald-500" />
                                <textarea
                                    id="maintenanceDescription"
                                    name="maintenanceDescription"
                                    value={formData.maintenanceDescription}
                                    onChange={handleInputChange}
                                    placeholder="Describe the maintenance work (e.g., Plumbing repair, Painting...)"
                                    className="w-full min-h-[44px] max-h-[120px] pl-9 pr-4 py-2.5 text-sm font-semibold border border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02] focus:bg-white transition-all rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>

                        {/* UTR Number */}
                        <div className="space-y-1.5">
                            <Label htmlFor="utrNumber" className="text-xs font-bold uppercase tracking-wider text-gray-400">UTR / Ref Number</Label>
                            <div className="relative">
                                <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                <Input
                                    type="text"
                                    id="utrNumber"
                                    name="utrNumber"
                                    value={formData.utrNumber}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className="h-11 pl-9 text-sm font-semibold border-gray-100 dark:border-white/[0.05] bg-gray-50/50 focus:bg-white transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Proof of Payment */}
                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Proof of Payment</Label>
                            <div className="relative h-11">
                                <input
                                    type="file"
                                    id="image"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="image"
                                    className="flex items-center justify-center gap-2 h-full w-full border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-xl bg-emerald-50/30 dark:bg-emerald-500/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer transition-all"
                                >
                                    <Upload size={14} className="text-emerald-600" />
                                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-tight">
                                        {imageFile ? imageFile.name : "Click to upload bill image or PDF"}
                                    </span>
                                </label>
                                {imageFile && (
                                    <button 
                                        type="button"
                                        onClick={() => setImageFile(null)}
                                        className="absolute -right-2 -top-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="pt-4 border-t border-gray-50 dark:border-white/[0.04]">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.1em] text-xs shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing Transaction...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    Post Maintenance Transaction
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
