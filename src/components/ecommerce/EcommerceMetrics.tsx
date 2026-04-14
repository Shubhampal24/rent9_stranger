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
  FileText,
  Clock,
} from "lucide-react";

export const EcommerceMetrics = ({ 
  activeTab, 
  onSelect 
}: { 
  activeTab?: string | null; 
  onSelect?: (tab: string|null, data?: any[]) => void 
}) => {
  const [stats, setStats] = useState<any>(null);
  const [recentPaid, setRecentPaid] = useState<any>(null);
  const [upcomingPending, setUpcomingPending] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };
        const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/dashboard`;

        const [statsRes, paidRes, pendingRes] = await Promise.all([
          fetch(`${baseUrl}/stats`, { headers }),
          fetch(`${baseUrl}/recent-paid-transactions`, { headers }),
          fetch(`${baseUrl}/upcoming-pending-transactions`, { headers })
        ]);

        const statsData = await statsRes.json();
        const paidData = await paidRes.json();
        const pendingData = await pendingRes.json();

        console.log("Dashboard Stats Response:", statsData);
        console.log("Recent Paid Transactions Response:", paidData);
        console.log("Upcoming Pending Transactions Response:", pendingData);

        if (statsData.success) setStats(statsData.data);
        if (paidData.success) setRecentPaid(paidData);
        if (pendingData.success) setUpcomingPending(pendingData);

        // Auto-select initial data if activeTab is set by default
        if (activeTab) {
          let dataToPass: any[] | undefined = undefined;
          switch (activeTab) {
            case "recent-paid-rent": dataToPass = paidData?.data?.rent; break;
            case "recent-paid-elec": dataToPass = paidData?.data?.electricity; break;
            case "recent-paid-maint": dataToPass = paidData?.data?.maintenance; break;
            case "upcoming-pending-rent": dataToPass = pendingData?.data?.rent; break;
            case "upcoming-pending-elec": dataToPass = pendingData?.data?.electricity; break;
            case "upcoming-pending-maint": dataToPass = pendingData?.data?.maintenance; break;
            default: dataToPass = undefined;
          }
          if (dataToPass) onSelect?.(activeTab, dataToPass);
        }

      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleCardClick = (id: string) => {
    if (activeTab === id) {
      onSelect?.(null);
      return;
    }

    let dataToPass: any[] | undefined = undefined;
    
    // Map IDs to specific arrays from the responses
    switch (id) {
      case "recent-paid-rent": dataToPass = recentPaid?.data?.rent; break;
      case "recent-paid-elec": dataToPass = recentPaid?.data?.electricity; break;
      case "recent-paid-maint": dataToPass = recentPaid?.data?.maintenance; break;
      case "upcoming-pending-rent": dataToPass = upcomingPending?.data?.rent; break;
      case "upcoming-pending-elec": dataToPass = upcomingPending?.data?.electricity; break;
      case "upcoming-pending-maint": dataToPass = upcomingPending?.data?.maintenance; break;
      default: dataToPass = undefined;
    }

    onSelect?.(id, dataToPass);
  };

  const MetricCard = ({
    id,
    icon: Icon,
    title,
    value,
    description,
    colorClass,
    iconColor
  }: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    description: string;
    colorClass: string;
    iconColor: string;
  }) => {
    const isSelected = activeTab === id;

    return (
      <div 
        onClick={() => handleCardClick(id)}
        className={`group relative overflow-hidden rounded-xl p-5 transition-all duration-300 cursor-pointer border ${

          isSelected 
            ? `bg-white/[0.05] border-${iconColor}-500/50 ring-1 ring-${iconColor}-500/20 shadow-lg shadow-${iconColor}-500/10` 
            : "bg-[#0B0C10] border-white/[0.03] hover:border-white/[0.08] hover:bg-[#121418]"
        }`}
      >
        <div className="relative z-10">
          {/* Icon Box */}
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 transition-transform duration-300 group-hover:scale-110 bg-white/[0.03] border border-white/[0.05]`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">
              {title}
            </p>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {loading ? (
                <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
              ) : (
                typeof value === 'number' ? value.toLocaleString() : value
              )}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {description}
              </p>
              {isSelected && (
                 <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover Gradient Effect */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-white/10 to-transparent`} />
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Row: Overall Totals (Sites & Revenue) */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <MetricCard
          id="total-sites"
          icon={Building2}
          title="Total Sites"
          value={stats?.sites?.total ?? 0}
          description={`${stats?.sites?.active ?? 0} Active / ${stats?.sites?.inactive ?? 0} Inactive`}
          colorClass="text-blue-500"
          iconColor="blue"
        />

        <MetricCard
          id="total-revenue"
          icon={IndianRupee}
          title="Total Revenue"
          value={`₹${(stats?.transactions?.totalAmount ?? 0).toLocaleString()}`}
          description={`₹${(stats?.transactions?.paidAmount ?? 0).toLocaleString()} Collected`}
          colorClass="text-emerald-500"
          iconColor="emerald"
        />
      </div> */}

      {/* Dynamic Grid: Transactions Breakdown (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Rent Group */}
        <MetricCard
          id="recent-paid-rent"
          icon={TrendingUp}
          title="Recent Paid Rent"
          value={`₹${(recentPaid?.summary?.totalPaidRent ?? 0).toLocaleString()}`}
          description={`${recentPaid?.summary?.rentCount ?? 0} Transactions Paid`}
          colorClass="text-emerald-400"
          iconColor="emerald"
        />

        <MetricCard
          id="upcoming-pending-rent"
          icon={Clock}
          title="Upcoming Pending Rent"
          value={`₹${(upcomingPending?.summary?.totalPendingRentAmount ?? 0).toLocaleString()}`}
          description={`${upcomingPending?.summary?.rentCount ?? 0} Expected Sites`}
          colorClass="text-amber-400"
          iconColor="amber"
        />

        {/* Electricity Group */}
        <MetricCard
          id="recent-paid-elec"
          icon={Zap}
          title="Recent Paid Elec"
          value={`₹${(recentPaid?.summary?.totalPaidElectricity ?? 0).toLocaleString()}`}
          description={`${recentPaid?.summary?.electricityCount ?? 0} Transactions Paid`}
          colorClass="text-emerald-400"
          iconColor="emerald"
        />

        <MetricCard
          id="upcoming-pending-elec"
          icon={AlertCircle}
          title="Upcoming Pending Elec"
          value={`₹${(upcomingPending?.summary?.totalPendingElectricityAmount ?? 0).toLocaleString()}`}
          description={`${upcomingPending?.summary?.electricityCount ?? 0} Expected Sites`}
          colorClass="text-amber-400"
          iconColor="amber"
        />

        {/* Maintenance Group */}
        <MetricCard
          id="recent-paid-maint"
          icon={Wrench}
          title="Recent Paid Maint"
          value={`₹${(recentPaid?.summary?.totalPaidMaintenance ?? 0).toLocaleString()}`}
          description={`${recentPaid?.summary?.maintenanceCount ?? 0} Transactions Paid`}
          colorClass="text-emerald-400"
          iconColor="emerald"
        />

        <MetricCard
          id="upcoming-pending-maint"
          icon={Clock}
          title="Upcoming Pending Maint"
          value={`₹${(upcomingPending?.summary?.totalPendingMaintenanceAmount ?? 0).toLocaleString()}`}
          description={`${upcomingPending?.summary?.maintenanceCount ?? 0} Expected Sites`}
          colorClass="text-amber-400"
          iconColor="amber"
        />
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#121212]/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Syncing Dashboard...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

