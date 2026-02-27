// src/app/admin/vendor-tracking/page.tsx

import React from "react";
import VendorTrackingTable from "@/components/admin/VendorTrackingTable";
import { MousePointerClick } from "lucide-react";

// This is a Server Component by default
export default function VendorTrackingPage() {
  return (
    <div className="overflow-auto bg-gray-50 p-6 sm:p-8 lg:p-10 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MousePointerClick className="w-8 h-8 text-[#5CA131]" />
          </div>
          User Tracking Logs
        </h2>
        <p className="text-gray-500 mt-2 ml-1">
          Monitor which users are viewing vendor contact details in real-time.
        </p>
      </div>

      {/* The Component takes up the full page width */}
      <div className="w-full">
        <VendorTrackingTable />
      </div>
    </div>
  );
}