"use client";
import { useState } from "react";

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ChartTabProps {
  onTabChange?: (timeFrame: TimeFrame) => void;
}

export default function ChartTab({ onTabChange }: ChartTabProps) {
  const [activeTab, setActiveTab] = useState<TimeFrame>("monthly");

  const handleTabChange = (tab: TimeFrame) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1 text-sm dark:bg-white/[0.03] sm:text-base">
      <button
        onClick={() => handleTabChange("daily")}
        className={`rounded-lg p-1 font-medium text-xs text-gray-500 transition-colors duration-200 sm:px-4 dark:text-gray-400 ${
          activeTab === "daily"
            ? "bg-white text-gray-800 shadow-sm dark:bg-white/5 dark:text-white"
            : ""
        }`}
      >
        Daily
      </button>
      <button
        onClick={() => handleTabChange("weekly")}
        className={`rounded-lg p-1 font-medium text-xs text-gray-500 transition-colors duration-200 sm:px-4 dark:text-gray-400 ${
          activeTab === "weekly"
            ? "bg-white text-gray-800 shadow-sm dark:bg-white/5 dark:text-white"
            : ""
        }`}
      >
        Weekly
      </button>
      <button
        onClick={() => handleTabChange("monthly")}
        className={`rounded-lg p-1 font-medium text-xs text-gray-500 transition-colors duration-200 sm:px-4 dark:text-gray-400 ${
          activeTab === "monthly"
            ? "bg-white text-gray-800 shadow-sm dark:bg-white/5 dark:text-white"
            : ""
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => handleTabChange("yearly")}
        className={`rounded-lg p-1 font-medium text-xs text-gray-500 transition-colors duration-200 sm:px-4 dark:text-gray-400 ${
          activeTab === "yearly"
            ? "bg-white text-gray-800 shadow-sm dark:bg-white/5 dark:text-white"
            : ""
        }`}
      >
        Yearly
      </button>
    </div>
  );
}