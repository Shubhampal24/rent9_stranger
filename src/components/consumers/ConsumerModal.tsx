"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Landmark, User, Zap, Plus, Trash2 } from "lucide-react";

interface ConsumerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consumer: any) => void;
  initialData?: any;
}

export default function ConsumerModal({ isOpen, onClose, onSave, initialData }: ConsumerModalProps) {
  const [form, setForm] = useState({
    consumerNo: "",
    consumerName: "",
    electricityProvider: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        consumerNo: initialData.consumerNo ?? "",
        consumerName: initialData.consumerName ?? "",
        electricityProvider: initialData.electricityProvider ?? "",
      });
    } else {
      setForm({
        consumerNo: "",
        consumerName: "",
        electricityProvider: "",
      });
    }
  }, [initialData, isOpen]);

  const setField = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const payload = {
      consumerNo: form.consumerNo.trim(),
      consumerName: form.consumerName.trim(),
      electricityProvider: form.electricityProvider.trim(),
    };

    onSave(payload);
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? "Edit Consumer" : "Add New Consumer"}
          </h2>
          <p className="text-indigo-200 text-xs mt-0.5">
            Manage electricity consumer details and supply provider information
          </p>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900 scrollbar-thin" onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as any)}>
          {/* Section 1: Consumer Details */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-white/[0.05] pb-2">
              <Zap size={16} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Consumer Information</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="consumerNo">Consumer Number *</Label>
                <Input
                  type="text" id="consumerNo" value={form.consumerNo}
                  onChange={(e) => setField("consumerNo", e.target.value)}
                  placeholder="Unique ID from utility bill"
                />
              </div>
              <div>
                <Label htmlFor="consumerName">Label / Name</Label>
                <Input
                  type="text" id="consumerName" value={form.consumerName}
                  onChange={(e) => setField("consumerName", e.target.value)}
                  placeholder="e.g. Main Meter, 1st Floor"
                />
              </div>
              <div>
                <Label htmlFor="electricityProvider">Electricity Provider</Label>
                <Input
                  type="text" id="electricityProvider" value={form.electricityProvider}
                  onChange={(e) => setField("electricityProvider", e.target.value)}
                  placeholder="e.g. TATA, Adani, MSEB"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.05] flex-shrink-0">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Processing..." : initialData ? "Save All Changes" : "Create Consumer Profile"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
