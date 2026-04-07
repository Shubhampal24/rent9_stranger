import OwnerTable from "@/components/owners/OwnerTable";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Owner Management | Rental Admin",
  description: "Manage property owners and their bank accounts.",
};

export default function OwnersPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Owner Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage property owners, contact info, and linked bank accounts
          </p>
        </div>
      </div>

      <OwnerTable />
      <Toaster position="top-right" />
    </div>
  );
}
