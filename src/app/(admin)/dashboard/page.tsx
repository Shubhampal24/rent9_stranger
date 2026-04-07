"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import RevenueMixChart from "@/components/ecommerce/RevenueMixChart";

export default function EcommerceClient() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top section: Summary Metrics ── */}
      <EcommerceMetrics />

      {/* ── Two-column layout: Transaction Statistics (left) + Revenue Mix (right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Transaction Status chart */}
        <div className="xl:col-span-2">
          <StatisticsChart />
        </div>

        {/* Right: Revenue Mix pie chart */}
        <div className="xl:col-span-1">
          <RevenueMixChart />
        </div>
      </div>

      {/* ── Bottom section: Upcoming Rent's (full width) ── */}
      <div className="min-w-0">
        <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white/90 px-1">
          Upcoming Rent&apos;s Detail
        </h2>
        <RecentOrders />
      </div>
    </div>
  );
}