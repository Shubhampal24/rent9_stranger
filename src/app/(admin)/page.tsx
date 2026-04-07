// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import RecentOrders from "@/components/ecommerce/RecentOrders";


// export default function EcommerceClient() {
//   const router = useRouter();

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       router.push("/signin"); // adjust this path as needed
//     }
//   }, []);

//   return (
//     <div className="grid grid-cols-12 gap-4 md:gap-6">
//       <div className="col-span-12 space-y-6 xl:col-span-8">
//         <EcommerceMetrics />
//         {/* <MonthlySalesChart /> */}
//         {/* <RecentOrders /> */}
//       </div>

//       {/* <div className="col-span-12 xl:col-span-5">
//         <MonthlyTarget />
//       </div> */}

//       {/* <div className="col-span-12">
//         <StatisticsChart />
//       </div> */}

//       {/* <div className="col-span-12 xl:col-span-5">
//         <DemographicCard />
//       </div> */}

//       <div className="col-span-12 ">
//         <RecentOrders />
//       </div>
//     </div>
//   );
// }
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signin");
  }, [router]);

  return null;
}