"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronDown, ChevronUp, Landmark, User, Phone, Plus, Trash2 } from "lucide-react";

interface BankAccount {
  _id?: string;
  accountHolder: string;
  accountNo: string;
  bankName: string;
  ifsc: string;
  branchName: string;
  details: string;
  isDeleted?: boolean; // Added for soft deletion tracking
}

interface OwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (owner: any) => void;
  initialData?: any;
}

const EMPTY_BANK_ACCOUNT: BankAccount = {
  accountHolder: "",
  accountNo: "",
  bankName: "",
  ifsc: "",
  branchName: "",
  details: "",
};

export default function OwnerModal({ isOpen, onClose, onSave, initialData }: OwnerModalProps) {
  const [form, setForm] = useState({
    ownerName: "",
    mobileNo: "",
    ownerDetails: "",
    bankAccounts: [] as BankAccount[],
  });
  const [showBank, setShowBank] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData?._id) {
      // Fetch complete owner details including all bank accounts
      const fetchOwnerDetails = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/owners/${initialData._id}`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setForm({
              ownerName: d.ownerName ?? "",
              mobileNo: d.mobileNo ?? "",
              ownerDetails: d.ownerDetails ?? "",
              bankAccounts: d.bankAccounts?.length 
                ? d.bankAccounts.map((b: any) => ({
                    _id: b._id,
                    accountHolder: b.accountHolder ?? "",
                    accountNo: b.accountNo ?? "",
                    bankName: b.bankName ?? "",
                    ifsc: b.ifsc ?? "",
                    branchName: b.branchName ?? "",
                    details: b.details ?? "",
                  }))
                : [],
            });
            setShowBank(!!d.bankAccounts?.length);
          }
        } catch (error) {
          console.error("Failed to fetch owner details:", error);
        }
      };
      fetchOwnerDetails();
    } else if (isOpen) {
      setForm({
        ownerName: "",
        mobileNo: "",
        ownerDetails: "",
        bankAccounts: [],
      });
      setShowBank(false);
    }
  }, [initialData, isOpen]);

  const setField = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const setBankField = (index: number, field: keyof BankAccount, value: string) => {
    const newBanks = [...form.bankAccounts];
    newBanks[index] = { ...newBanks[index], [field]: value };
    setForm((p) => ({ ...p, bankAccounts: newBanks }));
  };

  const addBankAccount = () => {
    setForm((p) => ({
      ...p,
      bankAccounts: [...p.bankAccounts, { ...EMPTY_BANK_ACCOUNT }],
    }));
    setShowBank(true);
  };

  const removeBankAccount = (index: number) => {
    const bank = form.bankAccounts[index];
    if (bank._id) {
      // If it has an _id, mark it as isDeleted: true instead of removing from array
      const newBanks = [...form.bankAccounts];
      newBanks[index] = { ...newBanks[index], isDeleted: true };
      setForm((p) => ({ ...p, bankAccounts: newBanks }));
    } else {
      // If it's a new account (no _id), just remove it from array
      const newBanks = form.bankAccounts.filter((_, i) => i !== index);
      setForm((p) => ({ ...p, bankAccounts: newBanks }));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const payload = {
      ownerName: form.ownerName.trim(),
      mobileNo: form.mobileNo.trim(),
      ownerDetails: form.ownerDetails.trim() || undefined,
      bankAccounts: form.bankAccounts.map(b => ({
        ...b,
        accountHolder: b.accountHolder.trim(),
        accountNo: b.accountNo.trim(),
        bankName: b.bankName.trim(),
        ifsc: b.ifsc.trim(),
        branchName: b.branchName.trim(),
        details: b.details.trim(),
      })).filter(b => b._id || b.accountNo), // Keep if it has _id (for updates/deletes) or if it's new and has accountNo
    };

    console.log("🚀 [OwnerModal] Submitting Payload:", JSON.stringify(payload, null, 2));
    onSave(payload);
    // Note: onSave in OwnerTable will handle the API call and logging the response
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? "Edit Owner" : "Add New Owner"}
          </h2>
          <p className="text-indigo-200 text-xs mt-0.5">
            Manage personal and multiple bank account details
          </p>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900 scrollbar-thin" onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as any)}>
          {/* Section 1: Personal Details */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-white/[0.05] pb-2">
              <User size={16} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Personal Information</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  type="text" id="ownerName" value={form.ownerName}
                  onChange={(e) => setField("ownerName", e.target.value)} required
                  placeholder="Full name of owner"
                />
              </div>
              <div>
                <Label htmlFor="mobileNo">Mobile Number *</Label>
                <Input
                  type="tel" id="mobileNo" value={form.mobileNo}
                  onChange={(e) => setField("mobileNo", e.target.value)} required
                  placeholder="Contact number"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ownerDetails">Remarks / Address / Notes</Label>
                <Input
                  type="text" id="ownerDetails" value={form.ownerDetails}
                  onChange={(e) => setField("ownerDetails", e.target.value)}
                  placeholder="Additional information about the owner"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bank Accounts List */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-white/[0.05] pb-2">
              <div className="flex items-center gap-2">
                <Landmark size={16} className="text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Bank Accounts</span>
              </div>
              <button
                type="button"
                onClick={addBankAccount}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800/30"
              >
                <Plus size={12} /> Add Bank
              </button>
            </div>

            {form.bankAccounts.filter(b => !b.isDeleted).length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-xl">
                <Landmark size={24} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-400">No bank accounts added yet</p>
                <button type="button" onClick={addBankAccount} className="text-xs text-indigo-500 font-medium hover:underline mt-1">Click to add one</button>
              </div>
            ) : (
              <div className="space-y-4">
                {form.bankAccounts.map((bank, idx) => {
                  if (bank.isDeleted) return null;
                  return (
                    <div key={idx} className="relative group p-4 border border-gray-100 dark:border-white/[0.08] rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                      <div className="absolute -top-2.5 -left-2 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        #{idx + 1}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeBankAccount(idx)}
                        className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove this bank"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
                        <div>
                          <Label>Account Holder *</Label>
                          <Input type="text" value={bank.accountHolder} onChange={(e) => setBankField(idx, "accountHolder", e.target.value)} placeholder="Name on account" />
                        </div>
                        <div>
                          <Label>Account Number *</Label>
                          <Input type="text" value={bank.accountNo} onChange={(e) => setBankField(idx, "accountNo", e.target.value)} placeholder="Account #" />
                        </div>
                        <div>
                          <Label>Bank Name *</Label>
                          <Input type="text" value={bank.bankName} onChange={(e) => setBankField(idx, "bankName", e.target.value)} placeholder="SBI, HDFC, etc." />
                        </div>
                        <div>
                          <Label>IFSC Code *</Label>
                          <Input type="text" value={bank.ifsc} onChange={(e) => setBankField(idx, "ifsc", e.target.value)} placeholder="e.g. SBIN..." />
                        </div>
                        <div>
                          <Label>Branch</Label>
                          <Input type="text" value={bank.branchName} onChange={(e) => setBankField(idx, "branchName", e.target.value)} placeholder="Branch name" />
                        </div>
                        <div>
                          <Label>Details / Notes</Label>
                          <Input type="text" value={bank.details} onChange={(e) => setBankField(idx, "details", e.target.value)} placeholder="Extra notes" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.05] flex-shrink-0">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Processing..." : initialData ? "Save All Changes" : "Create Owner Profile"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
