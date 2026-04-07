"use client";
import React, { useEffect, useState } from "react";
import { BoxIconLine, GroupIcon, } from "@/icons";
import { 
  Building2, 
  IndianRupee, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  Zap, 
  Wrench,
  FileText
} from "lucide-react";

export const EcommerceMetrics = () => {
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
        console.log("Dashboard Metrics Response:", data);
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    description,
    gradient,
    iconBg
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    description: string;
    gradient: string;
    iconBg: string;
  }) => (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:bg-[#121212]/50 dark:border-gray-800/70">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${gradient}`} />

      {/* Content */}
      <div className="relative">
        {/* Icon container */}
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Metrics */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <div className="flex items-baseline space-x-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? (
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
                  <div className="w-10 h-6 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
                </div>
              ) : (
                <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-20 group-hover:opacity-60 transition-opacity duration-300 ${gradient.split(' ')[1]}`} />
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Top Level Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => window.location.href = "/basic-tables"} className="cursor-pointer">
          <MetricCard
            icon={Building2}
            title="Total Sites"
            value={stats?.sites?.total ?? 0}
            description={`${stats?.sites?.active ?? 0} Active / ${stats?.sites?.inactive ?? 0} Inactive`}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            iconBg="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25 shadow-lg"
          />
        </div>

        <div onClick={() => window.location.href = "/total-paid"} className="cursor-pointer">
          <MetricCard
            icon={IndianRupee}
            title="Total Revenue"
            value={`₹${(stats?.transactions?.totalAmount ?? 0).toLocaleString()}`}
            description={`Collected: ₹${(stats?.transactions?.paidAmount ?? 0).toLocaleString()}`}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25 shadow-lg"
          />
        </div>

        <div onClick={() => window.location.href = "/pending-payment"} className="cursor-pointer">
          <MetricCard
            icon={AlertCircle}
            title="Pending Payments"
            value={stats?.transactions?.pending ?? 0}
            description={`Remaining: ₹${(stats?.transactions?.pendingAmount ?? 0).toLocaleString()}`}
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
            iconBg="bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/25 shadow-lg"
          />
        </div>

        <div className="cursor-default">
          <MetricCard
            icon={Users}
            title="Platform Users"
            value={(stats?.owners?.total ?? 0) + (stats?.consumers?.total ?? 0)}
            description={`${stats?.owners?.total ?? 0} Owners / ${stats?.consumers?.total ?? 0} Consumers`}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            iconBg="bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/25 shadow-lg"
          />
        </div>
      </div>

      {/* Category Wise Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rent Card */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 dark:bg-[#121212]/50 dark:border-gray-800/70">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <FileText size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Rent</h4>
            </div>
            <span className="px-2 py-1 text-[10px] font-bold bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
              {stats?.rent?.count ?? 0} Transactions
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Collected</span>
              <span className="font-semibold text-emerald-600">₹{(stats?.rent?.paidAmount ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Pending</span>
              <span className="font-semibold text-amber-600">₹{(stats?.rent?.pendingAmount ?? 0).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden dark:bg-gray-800">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(stats?.rent?.paidAmount / (stats?.rent?.totalAmount || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Electricity Card */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 dark:bg-[#121212]/50 dark:border-gray-800/70">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <Zap size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Electricity</h4>
            </div>
            <span className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-600 rounded-full dark:bg-amber-900/30 dark:text-amber-400">
              {stats?.electricity?.count ?? 0} Transactions
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Collected</span>
              <span className="font-semibold text-emerald-600">₹{(stats?.electricity?.paidAmount ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Pending</span>
              <span className="font-semibold text-amber-600">₹{(stats?.electricity?.pendingAmount ?? 0).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden dark:bg-gray-800">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(stats?.electricity?.paidAmount / (stats?.electricity?.totalAmount || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Maintenance Card */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 dark:bg-[#121212]/50 dark:border-gray-800/70">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <Wrench size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Maintenance</h4>
            </div>
            <span className="px-2 py-1 text-[10px] font-bold bg-purple-100 text-purple-600 rounded-full dark:bg-purple-900/30 dark:text-purple-400">
              {stats?.maintenance?.count ?? 0} Transactions
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Collected</span>
              <span className="font-semibold text-emerald-600">₹{(stats?.maintenance?.paidAmount ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Pending</span>
              <span className="font-semibold text-amber-600">₹{(stats?.maintenance?.pendingAmount ?? 0).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden dark:bg-gray-800">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(stats?.maintenance?.paidAmount / (stats?.maintenance?.totalAmount || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#121212]/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Loading metrics...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

