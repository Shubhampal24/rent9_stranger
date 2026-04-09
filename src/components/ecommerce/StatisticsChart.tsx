/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import dynamic from "next/dynamic";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// Define interfaces for API response data
interface ChartDataPoint {
  label: string;
  count: number;
  totalAmount: number;
  paidAmount: number;
}

export default function StatisticsChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please login.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/rent/dashboard/chart?period=${timeFrame}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError("Unauthorized. Please login again.");
          } else {
            setError("Failed to load data. Please try again later.");
          }
          return;
        }

        const data = await response.json();
        if (data.success) {
          setChartData(data.data || []);
        }
      } catch (err) {
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  // Prepare chart data based on the fetched data
  const getChartData = () => {
    const categories = chartData.map(item => item.label);
    const countData = chartData.map(item => item.count);
    const amountData = chartData.map(item => item.paidAmount);
    return { categories, countData, amountData };
  };

  const { categories, countData, amountData } = getChartData();

  // Chart options
  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "bar",
      toolbar: {
        show: false,
      },
      stacked: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
      },
    },
    colors: ["#465FFF", "#9CB9FF"],
    dataLabels: {
      enabled: false,
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: function (val, opts) {
          if (opts.seriesIndex === 1) {
            return `₹${val}`;
          }
          return val.toString();
        }
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: [
      {
        seriesName: 'Transaction Count',
        title: {
          text: "Count",
          style: {
            fontSize: '12px',
            fontWeight: 400,
          }
        },
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
        },
      },
      {
        seriesName: 'Total Paid Amount',
        opposite: true,
        title: {
          text: "Paid Amount (₹)", // <-- full amount, no k
          style: {
            fontSize: '12px',
            fontWeight: 400,
          }
        },
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
          formatter: function (val) {
            return `₹${val}`; // <-- full amount, no k
          }
        },
      },
    ],
  };

  const series = [
    {
      name: "Transaction Count",
      data: countData,
      type: "column",
    },
    {
      name: "Total Paid Amount (₹)",
      data: amountData,
      type: "column",
    },
  ];

  const handleTimeFrameChange = (newTimeFrame: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setTimeFrame(newTimeFrame);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-white/[0.03] ">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Transaction Statistics
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {chartData.length > 0 && `Showing data for ${chartData.length} ${timeFrame} intervals`}
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab onTabChange={handleTimeFrameChange} />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          {loading ? (
            <div className="flex justify-center items-center h-[310px]">
              <p>Loading transaction data...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-[310px]">
              <p className="text-red-500">{error}</p>
            </div>
          ) : chartData.length > 0 ? (
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height={310}
            />
          ) : (
            <div className="flex justify-center items-center h-[310px]">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}