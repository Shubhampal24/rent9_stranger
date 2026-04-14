"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RecentOrders from "@/components/ecommerce/RecentOrders";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import RevenueMixChart from "@/components/ecommerce/RevenueMixChart";

// Content Components for Expansion
import BasicTableOne from "@/components/tables/BasicTableOne";
import UnifiedTransactionTable from "@/components/tables/UnifiedTransactionTable";
import RentTransactions from "@/components/tables/RentTransactions";
import ElectricityTransactions from "@/components/tables/ElectricityTransactions";
import MaintenanceTransactions from "@/components/tables/MaintenanceTransactions";
import ComponentCard from "@/components/common/ComponentCard";
import SimpleTransactionTable from "@/components/tables/SimpleTransactionTable";

export default function EcommerceClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>("recent-paid-rent");
  const [selectedData, setSelectedData] = useState<any[] | null>(null);

  const handleMetricSelect = (tab: string | null, data?: any[]) => {
    setActiveTab(tab);
    setSelectedData(data || null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
    }
  }, []);

  const renderActiveContent = () => {
    if (!activeTab) return null;

    switch (activeTab) {
      case "total-sites":
        return <ComponentCard title="Active Sites Master List"><BasicTableOne /></ComponentCard>;
      case "total-revenue":
        return <ComponentCard title="Total Revenue Aggregate"><UnifiedTransactionTable title="Revenue Master Ledger" /></ComponentCard>;
      case "pending-payments":
        return <ComponentCard title="Pending Payments Aggregate"><UnifiedTransactionTable title="Pending Payments Master Ledger" filterStatus="pending" /></ComponentCard>;
      
      default:
        // Handle Transactional IDs dynamically
        if (activeTab.startsWith("recent-paid-") || activeTab.startsWith("upcoming-pending-")) {
          const title = activeTab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          return (
            <ComponentCard title={`${title} Details (Direct Backend Data)`}>
              <SimpleTransactionTable title={title} data={selectedData || []} />
            </ComponentCard>
          );
        }
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top section: Summary Metrics ── */}
      <EcommerceMetrics activeTab={activeTab} onSelect={handleMetricSelect} />

      {/* ── Expanded Content Area ── */}
      {activeTab && (
        <div className="animate-fadeIn">
          {renderActiveContent()}
        </div>
      )}

      {/* ── Two-column layout: Transaction Statistics (left) + Revenue Mix (right) ── */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <StatisticsChart />
        </div>

        <div className="xl:col-span-1">
          <RevenueMixChart />
        </div>
      </div> */}

      {/* ── Bottom section: Upcoming Rent's (full width) ── */}
      {/* {!activeTab && (
        <div className="min-w-0">
          <RecentOrders />
        </div>
      )} */}
    </div>
  );
}
