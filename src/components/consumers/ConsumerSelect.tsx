"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { Plus, X, Zap } from "lucide-react";
import ConsumerModal from "./ConsumerModal";
import { toast } from "react-hot-toast";

interface Consumer {
  _id: string;
  consumerNo: string;
  consumerName: string;
}

interface ConsumerSelectProps {
  selectedConsumerIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}

export default function ConsumerSelect({ selectedConsumerIds, onChange, label = "Assign Consumers" }: ConsumerSelectProps) {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchConsumers();
  }, []);

  const fetchConsumers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteConsumer/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConsumers(data.data || data || []);
      }
    } catch (error) {
      console.error("Error fetching consumers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleConsumer = (id: string) => {
    if (selectedConsumerIds.includes(id)) {
      onChange(selectedConsumerIds.filter((cid) => cid !== id));
    } else {
      onChange([...selectedConsumerIds, id]);
    }
  };

  const handleNewConsumerSave = async (payload: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/siteConsumer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        const newConsumer = saved.data || saved;
        toast.success("Consumer created!");
        await fetchConsumers();
        // Auto-select the new one
        if (newConsumer._id) {
          toggleConsumer(newConsumer._id);
        }
        setIsModalOpen(false);
      } else {
        throw new Error("Failed to create consumer");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getConsumerLabel = (id: string) => {
    const c = consumers.find(item => item._id === id);
    return c ? `${c.consumerNo} (${c.consumerName || "No Label"})` : `Meter ${id}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-sm text-indigo-600 hover:underline flex items-center font-semibold"
        >
          <Plus size={14} className="mr-1" /> New Consumer
        </button>
      </div>

      <div className="relative">
        <select
          className="w-full p-2.5 text-sm border border-gray-200 dark:border-white/[0.1] rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          onChange={(e) => e.target.value && toggleConsumer(e.target.value)}
          value=""
        >
          <option value="" className="dark:bg-gray-950 dark:text-gray-400">Search or select consumer...</option>
          {consumers.map((c) => (
            <option key={c._id} value={c._id} disabled={selectedConsumerIds.includes(c._id)}>
              {c.consumerNo} {c.consumerName ? `(${c.consumerName})` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedConsumerIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedConsumerIds.map((id) => (
            <div
              key={id}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-medium dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/30"
            >
              <Zap size={12} fill="currentColor" className="text-indigo-500" />
              <span>{getConsumerLabel(id)}</span>
              <button
                type="button"
                onClick={() => toggleConsumer(id)}
                className="ml-1 p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConsumerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleNewConsumerSave}
      />
    </div>
  );
}
