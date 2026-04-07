"use client";

import UnifiedTransactionTable from "@/components/tables/UnifiedTransactionTable";

export default function TotalPaidPage() {
  return (
    <div className="p-0">
      <UnifiedTransactionTable title="Total Paid MASTER LEDGER" filterStatus="paid" />
    </div>
  );
}
