/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import VendorCard from "@/components/vendor-listing/VendorCard";
import { Metadata } from "next";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// export const metadata: Metadata = {
//   title: "Vendors at MHEBazar",
// };

export default function VendorsPageWrapper() {
  return <ClientSideVendorsPage />;
}

function sortPreferred(vendors: Vendor[]) {
  return vendors.sort((a, b) => {
    const aPreferred = /mhebazar|greentech/i.test(a.brand || a.company_name || a.full_name);
    const bPreferred = /mhebazar|greentech/i.test(b.brand || b.company_name || b.full_name);
    return bPreferred ? 1 : aPreferred ? -1 : 0;
  });
}

type Vendor = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  company_name: string;
  company_email: string;
  brand: string;
  is_approved: boolean;
  application_date: string;
};

type VendorResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vendor[];
};

function ClientSideVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filtered, setFiltered] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 12;

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await api.get<VendorResponse>("/vendor/approved/");
        const sorted = sortPreferred(response.data.results || []);
        setVendors(sorted);
        setFiltered(sorted);
        setTotalCount(response.data.count || 0);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filteredList = vendors.filter((v) =>
      (v.brand || v.company_name || v.full_name)
        .toLowerCase()
        .includes(lowerSearch)
    );
    setFiltered(filteredList);
    setCurrentPage(1);
  }, [search, vendors]);

  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Registered Vendors</h1>
        <div className="flex gap-2 w-full md:w-1/2">
          <Input
            placeholder="Search by name, brand, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No approved vendors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginated.map((vendor) => (
            <div className=" w-80 h-72 sm:w-72 sm:h-64 mx-auto" key={vendor.id}>
                 <VendorCard vendor={vendor} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 gap-2 flex-wrap">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? "default" : "outline"}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </main>
  );
}