import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import MaintenanceTransactionsTable from "@/components/tables/MaintenanceTransactions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance History | Rent & Electricity Management",
  description: "Comprehensive history of all maintenance upkeep and repair transactions across all sites.",
};

export default function MaintenanceTransactionsPage() {
  return (
    <div>
      <div className="space-y-6">
        <ComponentCard title="Maintenance History">
          <MaintenanceTransactionsTable />
        </ComponentCard>
      </div>
    </div>
  );
}
