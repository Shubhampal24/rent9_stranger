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


      {/* Main Table Interface */}
      <div className="bg-white dark:bg-transparent rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/[0.05]">
        <ConsumerTable />
      </div>

    </div>
  );
}
