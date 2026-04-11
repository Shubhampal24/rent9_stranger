"use client";
import React, { useState } from 'react';
import ComponentCard from '../../common/ComponentCard';
import Label from '../Label';
import Input from '../input/InputField';
import Select from '../Select';
import CustomDatePicker from '@/components/form/date-picker';
import { toast } from 'react-hot-toast';
import { CreditCard, Calendar as CalendarIcon } from 'lucide-react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Payment type options
const paymentTypeOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Cheque", label: "Cheque" },
    { value: "Online", label: "Online" },
    { value: "Other", label: "Other" },
];

// Paid status options
const paidStatusOptions = [
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "partial", label: "Partially Paid" },
];

// Add proper typing for form data
interface RentPaymentFormData {
    siteId: string;
    ownerId: string;
    centreId: string;
    monthYear: string;
    paymentDate: string;
    paymentAmount: string;
    paidStatus: string;
    paymentType: string;
    utrNumber: string;
    monthlyRent: string;
    ownerName: string;
}

interface RentPaymentFormProps {
    siteId: string;
    owners: Array<{
        id: string;
        owner_name: string;
        owner_monthly_rent: number;
    }>;
    currentMonthlyRent: number;
    centreId?: string; // Optional centreId
}

export default function RentPaymentForm({ siteId, owners, currentMonthlyRent, centreId }: RentPaymentFormProps) {
    const [formData, setFormData] = useState<RentPaymentFormData>({
        siteId: siteId,
        ownerId: '',
        centreId: typeof centreId === 'object' ? (centreId as any)._id : (centreId || ''),
        monthYear: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentAmount: '',
        paidStatus: 'paid',
        paymentType: 'Online',
        utrNumber: '',
        monthlyRent: String(currentMonthlyRent),
        ownerName: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({
            ...formData,
            [name]: value
        });
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
            setFormData(prev => ({
                ...prev,
                [name]: formattedDate
            }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate required fields
            if (
                !formData.siteId ||
                !formData.monthYear ||
                !formData.paymentAmount ||
                !formData.ownerId
            ) {
                throw new Error('Please fill in all required fields (Month, Owner, Amount)');
            }

            // Use FormData for file upload
            const form = new FormData();
            form.append('siteId', formData.siteId);
            form.append('ownerId', formData.ownerId);
            form.append('centreId', formData.centreId);
            form.append('monthYear', formData.monthYear);
            form.append('paymentDate', formData.paymentDate);
            form.append('paymentAmount', formData.paymentAmount);
            form.append('paidStatus', formData.paidStatus);
            form.append('paymentType', formData.paymentType);
            form.append('utrNumber', formData.utrNumber);
            form.append('monthlyRent', formData.monthlyRent);
            form.append('ownerName', formData.ownerName);

            if (imageFile) {
                form.append('image', imageFile);
            }

            // Log the payload for debugging
            console.log("Submitting Rent Transaction Payload:");
            for (const [key, value] of form.entries()) {
                console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
            }

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteTransaction/rent-transaction`;
            console.log("Submitting to URL:", url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                    // Do NOT set Content-Type for FormData, browser will set it
                },
                body: form
            });

            console.log("API Status:", response.status);
            const data = await response.json();
            console.log("API Response Data:", data);

            if (!response.ok) {
                switch (response.status) {
                    case 409:
                        const errorMessage = `A payment record already exists for ${formData.ownerName} for ${formData.monthYear}`;
                        throw new Error(errorMessage);
                    case 404:
                        throw new Error('Owner not found or not associated with this site');
                    case 400:
                        throw new Error(data.message || 'Invalid payment details');
                    default:
                        throw new Error(data.message || 'Something went wrong');
                }
            }

            // Enhanced success toast with more details
            toast.success(
                `Payment Success! ₹${formData.paymentAmount} recorded for ${formData.ownerName} (${formData.monthYear})`,
                {
                    duration: 4000,
                    position: 'top-center',
                    style: {
                        background: '#10B981',
                        color: 'white',
                        fontWeight: '500',
                    },
                    iconTheme: {
                        primary: '#ffffff',
                        secondary: '#10B981',
                    },
                }
            );

            // Reset form while keeping siteId and monthlyRent
            setFormData(prev => ({
                ...prev,
                ownerId: '',
                ownerName: '',
                paymentAmount: '',
                paidStatus: 'paid',
                paymentType: 'Online',
                monthYear: '',
                paymentDate: new Date().toISOString().split('T')[0],
                utrNumber: ''
            }));
            setImageFile(null);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to record payment', {
                duration: 4000,
                position: 'top-center',
                style: {
                    background: '#EF4444',
                    color: 'white',
                    fontWeight: '500',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                    <CreditCard className="text-white" size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">Record Rent Payment</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Payment details will be recorded in the general ledger</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="monthYear" className="text-xs font-bold uppercase tracking-wider text-gray-400">Rent Month*</Label>
                        <div className="relative">
                            <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 z-10" />
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
                                className="h-10 w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ownerId" className="text-xs font-bold uppercase tracking-wider text-gray-400">Select Owner*</Label>
                        <Select
                            options={owners.map(owner => ({
                                value: owner.id,
                                label: `${owner.owner_name}  `
                            }))}
                            value={formData.ownerId}
                            onChange={(value) => {
                                const selectedOwner = owners.find(o => o.id === value);
                                setFormData(prev => ({
                                    ...prev,
                                    ownerId: value,
                                    ownerName: selectedOwner?.owner_name || '',
                                    paymentAmount: selectedOwner?.owner_monthly_rent?.toString() || '',
                                    monthlyRent: selectedOwner?.owner_monthly_rent?.toString() || ''
                                }));
                            }}
                            className="h-10 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="paymentAmount" className="text-xs font-bold uppercase tracking-wider text-gray-400">Amount*</Label>
                        <Input
                            type="number"
                            id="paymentAmount"
                            name="paymentAmount"
                            value={formData.paymentAmount}
                            onChange={handleInputChange}
                            required
                            className="h-10 text-sm"
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

                    <div className="space-y-1.5">
                        <Label htmlFor="paymentType" className="text-xs font-bold uppercase tracking-wider text-gray-400">Method*</Label>
                        <Select
                            options={paymentTypeOptions}
                            value={formData.paymentType}
                            onChange={(value) => handleSelectChange('paymentType', value)}
                            required
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
                        <Label htmlFor="paymentDate" className="text-xs font-bold uppercase tracking-wider text-gray-400">Date*</Label>
                        <CustomDatePicker
                            id="paymentDate"
                            value={new Date(formData.paymentDate)}
                            onChange={(date: Date[]) => handleDateChange('paymentDate', date)}
                        />
                    </div>

                    <div className="col-span-1 lg:col-span-2 space-y-1.5">
                        <Label htmlFor="image" className="text-xs font-bold uppercase tracking-wider text-gray-400">Proof of Payment</Label>
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor="image"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/[0.03] border border-dashed border-gray-200 dark:border-white/[0.1] rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer group"
                            >
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors">
                                    {imageFile ? imageFile.name : "Click to upload image or PDF"}
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
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Recording...</span>
                            </div>
                        ) : 'Record Payment'}
                    </button>
                </div>
            </form>
        </div>
    );
}