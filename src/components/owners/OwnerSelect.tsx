"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { Plus, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import OwnerModal from "./OwnerModal";

interface Owner {
  id: string | number;
  owner_name: string;
  ownerName?: string; // fallback
}

interface OwnerSelectProps {
  selectedOwnerIds: (string | number)[];
  onChange: (ids: (string | number)[]) => void;
  label?: string;
}

export default function OwnerSelect({ selectedOwnerIds, onChange, label = "Assign Owners" }: OwnerSelectProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/owners/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOwners(data.data || data || []);
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOwner = (id: string | number) => {
    if (selectedOwnerIds.includes(id)) {
      onChange(selectedOwnerIds.filter((oid) => oid !== id));
    } else {
      onChange([...selectedOwnerIds, id]);
    }
  };

  const handleNewOwnerSave = (newOwner: any) => {
    // Ideally, the Modal should have saved the owner to the DB and returned the ID
    // For now, we refresh the list and maybe auto-select if we had the ID.
    fetchOwners();
  };

  const getOwnerName = (id: string | number) => {
    const owner = owners.find(o => o.id === id);
    return owner ? (owner.owner_name || owner.ownerName) : `Owner ${id}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          <Plus size={14} className="mr-1" /> New Owner
        </button>
      </div>

      <div className="relative">
        <select
          className="w-full p-2 border rounded-lg dark:bg-white/[0.03] dark:border-white/[0.1] dark:text-white"
          onChange={(e) => e.target.value && toggleOwner(e.target.value)}
          value=""
        >
          <option value="">Select an owner to assign...</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id} disabled={selectedOwnerIds.includes(owner.id)}>
              {owner.owner_name || owner.ownerName}
            </option>
          ))}
        </select>
      </div>

      {selectedOwnerIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedOwnerIds.map((id) => (
            <div
              key={id}
              className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm dark:bg-blue-900/30 dark:text-blue-300"
            >
              <span>{getOwnerName(id)}</span>
              <button
                type="button"
                onClick={() => toggleOwner(id)}
                className="ml-2 hover:text-blue-900 dark:hover:text-blue-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <OwnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleNewOwnerSave}
      />
    </div>
  );
}
