"use client";

import UnifiedTransactionTable from "@/components/tables/UnifiedTransactionTable";

export default function PendingPaymentPage() {
  return (
    <div className="p-0">
      <UnifiedTransactionTable title="Pending Payments Master Ledger" filterStatus="pending" />
    </div>
  );
}
