"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UnifiedTransactionTable from "@/components/tables/UnifiedTransactionTable";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

interface Site {
  id: string;
  _id?: string;
  siteName: string;
  code: string;
  propertyLocation: string;
}

export default function SiteTransactionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/sites/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch site details");
        const json = await res.json();
        setSite(json.data || json);
      } catch (error) {
        console.error(error);
        toast.error("Could not load site details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSite();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400 font-bold">LOADING...</div>;
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-3 px-2">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
          {site?.siteName} <span className="text-gray-400 font-mono text-sm ml-2">({site?.code})</span>
        </h1>
      </div>

      <div className="bg-white dark:bg-black/10 border border-gray-200 dark:border-white/5 rounded-lg p-2">
        <UnifiedTransactionTable 
          title="TRANSACTION HISTORY" 
          siteId={id as string} 
        />
      </div>
    </div>
  );
}
