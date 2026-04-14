/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import React, { useState, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Zap, Calendar as CalendarIcon, CreditCard, Camera, Send, FileText, Trash2 } from 'lucide-react';
import CustomDatePicker from '@/components/form/date-picker';
import Label from '../Label';
import Input from '../input/InputField';
import Select from '../Select';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Paid status options
const paidStatusOptions = [
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "partial", label: "Partially Paid" },
];

interface ElectricityPaymentFormProps {
    siteId: string | number;
    owners?: Array<{
        id?: string | number;
        owner_name: string;
        owner_monthly_rent: number;
    }>;
    currentMonthlyRent?: number;
    consumers?: Array<{ _id?: string; consumerNo: string; consumerName?: string }>;
    centreId?: string;
}

export default function ElectricityPaymentForm({ siteId, owners = [], currentMonthlyRent = 0, consumers = [], centreId }: ElectricityPaymentFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [proofImage, setProofImage] = useState<File | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        siteId: siteId,
        monthYear: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentAmount: '',
        paidStatus: 'paid' as 'paid' | 'pending' | 'partial',
        units: '',
        electricityCharges: '',
        electricityConsumerNo: consumers[0]?.consumerNo || '',
        electricityConsumerId: consumers[0]?._id || '',
        paymentType: 'Online',
        utrNumber: '',
        centreId: typeof centreId === 'object' ? (centreId as any)._id : (centreId || '')
    });

    // Auto-select consumer if available and not set
    React.useEffect(() => {
        if (consumers.length > 0 && !formData.electricityConsumerId) {
            setFormData(prev => ({
                ...prev,
                electricityConsumerNo: consumers[0].consumerNo,
                electricityConsumerId: consumers[0]._id || ''
            }));
        }
    }, [consumers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name: string, dateObj: Date[] | null) => {
        if (dateObj && dateObj[0]) {
            // Ensure it's a local date in YYYY-MM-DD format
            const d = dateObj[0];
            const formattedDate = [
                d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, '0'),
                String(d.getDate()).padStart(2, '0')
            ].join('-');
            setFormData(prev => ({ ...prev, [name]: formattedDate }));
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        const requiredFields = [
            { field: 'monthYear', label: 'Billing Month' },
            { field: 'paymentAmount', label: 'Amount Paid' },
            { field: 'electricityConsumerId', label: 'Consumer selection' },
            { field: 'units', label: 'Units Consumed' }
        ];

        const missing = requiredFields.filter(f => !formData[f.field as keyof typeof formData]);

        if (missing.length > 0) {
            toast.error(`Please provide: ${missing.map(m => m.label).join(', ')}`, {
                style: { background: '#EF4444', color: 'white' }
            });
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication session expired. Please login again.");

            const submitData = new FormData();

            // Standardizing to camelCase consistent with Rent Payments
            submitData.append('siteId', String(formData.siteId));
            submitData.append('monthYear', formData.monthYear);
            submitData.append('paymentDate', formData.paymentDate);
            submitData.append('paymentAmount', formData.paymentAmount);
            submitData.append('paidStatus', formData.paidStatus);
            submitData.append('units', formData.units);
            submitData.append('electricityCharges', formData.electricityCharges || formData.paymentAmount);
            submitData.append('electricityConsumerId', formData.electricityConsumerId);
            submitData.append('electricityConsumerNo', formData.electricityConsumerNo);
            submitData.append('centreId', formData.centreId);
            submitData.append('paymentType', formData.paymentType);
            submitData.append('utrNumber', formData.utrNumber);

            if (proofImage) {
                submitData.append('image', proofImage);
            }



            // Updated endpoint to match working siteTransaction pattern
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteTransaction/electricity-transaction`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: submitData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed on server');
            }

            toast.success(
                `Payment Success! ₹${formData.paymentAmount} recorded for ${formData.monthYear}`,
                {
                    duration: 4000,
                    style: { background: '#10B981', color: 'white', fontWeight: '500' }
                }
            );

            // Reset form
            setFormData(prev => ({
                ...prev,
                paymentAmount: '',
                units: '',
                electricityCharges: '',
                monthYear: '',
                paymentDate: new Date().toISOString().split('T')[0],
                utrNumber: ''
            }));
            setProofImage(null);

        } catch (error: any) {
            console.error("❌ Submission Error:", error);
            toast.error(error.message || "Failed to record payment", {
                style: { background: '#EF4444', color: 'white' }
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500 rounded-xl shadow-lg shadow-yellow-500/20 text-white">
                    <Zap size={20} fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">Record Electricity Payment</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Electricity payout will be recorded in the general ledger</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="monthYear" className="text-xs font-bold uppercase tracking-wider text-gray-400">Billing Month*</Label>
                        <div className="relative">
                            <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 z-10" />
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
                                className="h-10 w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="electricityConsumerNo" className="text-xs font-bold uppercase tracking-wider text-gray-400">Consumer No*</Label>
                        {consumers.length > 0 ? (
                            <Select
                                options={consumers.map(c => ({
                                    value: c._id || '',
                                    label: c.consumerName ? `${c.consumerNo} (${c.consumerName})` : c.consumerNo
                                }))}
                                value={formData.electricityConsumerId}
                                placeholder="Choose Consumer"
                                onChange={(val) => {
                                    const selected = consumers.find(c => c._id === val);
                                    setFormData(prev => ({
                                        ...prev,
                                        electricityConsumerId: val,
                                        electricityConsumerNo: selected?.consumerNo || ''
                                    }));
                                }}
                                className="h-10 text-sm"
                            />
                        ) : (
                            <div className="h-10 px-3 flex items-center bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg text-[10px] text-red-500 font-bold uppercase tracking-tighter">
                                Wait! No Consumers Linked to this Site.
                            </div>
                        )}
                    </div>

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

                    <div className="space-y-1.5">
                        <Label htmlFor="units" className="text-xs font-bold uppercase tracking-wider text-gray-400">Units Consumed*</Label>
                        <Input
                            type="number"
                            id="units"
                            name="units"
                            value={formData.units}
                            onChange={handleInputChange}
                            placeholder="e.g. 450"
                            required
                            className="h-10 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="electricityCharges" className="text-xs font-bold uppercase tracking-wider text-gray-400">Base Charges</Label>
                        <Input
                            type="number"
                            id="electricityCharges"
                            name="electricityCharges"
                            value={formData.electricityCharges}
                            onChange={handleInputChange}
                            placeholder="Optional"
                            className="h-10 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="paidStatus" className="text-xs font-bold uppercase tracking-wider text-gray-400">Status*</Label>
                        <Select
                            options={paidStatusOptions}
                            value={formData.paidStatus}
                            onChange={(value) => handleSelectChange('paidStatus', value)}
                            className="h-10 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="paymentDate" className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment Date*</Label>
                        <CustomDatePicker
                            id="paymentDate"
                            value={new Date(formData.paymentDate)}
                            onChange={(date: Date[]) => handleDateChange('paymentDate', date)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="utrNumber" className="text-xs font-bold uppercase tracking-wider text-gray-400">UTR Number*</Label>
                        <Input
                            type="text"
                            id="utrNumber"
                            name="utrNumber"
                            value={formData.utrNumber}
                            onChange={handleInputChange}
                            placeholder="Transaction ID"
                            required
                            className="h-10 text-sm"
                        />
                    </div>

                    <div className="col-span-1 lg:col-span-3 space-y-1.5">
                        <Label htmlFor="image" className="text-xs font-bold uppercase tracking-wider text-gray-400">Proof of Payment</Label>
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor="image"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/[0.03] border border-dashed border-gray-200 dark:border-white/[0.1] rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer group"
                            >
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-yellow-500 transition-colors">
                                    {proofImage ? proofImage.name : "Click to upload bill image or PDF"}
                                </span>
                                <input
                                    type="file"
                                    id="image"
                                    name="image"
                                    accept="image/*,.pdf"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                            {proofImage && (
                                <button type="button" onClick={() => setProofImage(null)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-2.5 bg-yellow-500 text-white text-sm font-bold rounded-xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Recording...</span>
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                <span>Record Payment</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
