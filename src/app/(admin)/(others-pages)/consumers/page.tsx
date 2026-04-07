import ConsumerTable from "@/components/consumers/ConsumerTable";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Consumer Management | Rental Admin",
  description: "Manage electricity meters and consumers across properties.",
};

export default function ConsumersPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Consumer Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage electricity meter numbers and supply provider details
          </p>
        </div>
      </div>

      {/* Main Table Interface */}
      <div className="bg-white dark:bg-transparent rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/[0.05]">
        <ConsumerTable />
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
