"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function RevenueMixChart() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/dashboard/stats`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch revenue mix stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const series = [
    stats?.rent?.totalAmount ?? 0,
    stats?.electricity?.totalAmount ?? 0,
    stats?.maintenance?.totalAmount ?? 0,
  ];

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    labels: ["Rent", "Electricity", "Maintenance"],
    colors: ["#465FFF", "#F59E0B", "#8B5CF6"],
    legend: {
      position: "bottom",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Amount",
              formatter: () => `₹${(stats?.transactions?.totalAmount ?? 0).toLocaleString()}`,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val) => `₹${val.toLocaleString()}`,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] h-full">
      <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-6">
        Revenue Mix
      </h3>
      <div className="flex justify-center items-center h-[300px]">
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Loading chart...</span>
          </div>
        ) : (
          <ReactApexChart options={options} series={series} type="donut" width="100%" height={300} />
        )}
      </div>
    </div>
  );
}
