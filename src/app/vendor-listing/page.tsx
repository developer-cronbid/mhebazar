'use client';

import VendorCard from "@/components/vendor-listing/VendorCard";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import Link from "next/link";
import Breadcrumb from "@/components/elements/Breadcrumb";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import VendorRegistrationDrawer from '@/components/forms/publicforms/VendorRegistrationForm';


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
  product_count?: number;
  user_info?: {
    id: number;
    profile_photo: string;
  };
};

type VendorResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vendor[];
};

function ClientSideVendorsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [vendors, setVendors] = useState<Vendor[]>([]);

  // State for the controlled input, for debouncing
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || "");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || "-application_date");
  const [isLoading, setIsLoading] = useState(true);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const perPage = 12;

  const createQueryString = useCallback(
    (paramsToUpdate: { [key: string]: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value) {
          params.set(name, value);
        } else {
          params.delete(name);
        }
      }
      return params.toString();
    },
    [searchParams]
  );

  // This function remains the same, it's for fetching supplemental data.
  const fetchProductCounts = async (vendorIds: number[]) => {
    try {
      const counts = await Promise.all(
        vendorIds.map(async (userId) => {
          try {
            const url = `/products/?user=${userId}`;
            const response = await api.get(url);
            return { userId, count: response.data.count || 0 };
          } catch (error) {
            return { userId, count: 0 };
          }
        })
      );
      return counts;
    } catch (error) {
      return [];
    }
  };

  // **CHANGED**: fetchVendors now correctly uses the sort parameter in the API call.
  const fetchVendors = async (page = 1, searchQuery = "", sort = "-application_date") => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.append("page", page.toString());
      query.append("page_size", perPage.toString());

      if (searchQuery) {
        query.append("search", searchQuery);
      }

      // **FIXED**: Added the sort parameter to the API call.
      // Common parameter name is 'ordering', change if your backend uses something else (e.g., 'sort').
      // Sorting by product_count now requires the backend to support it.
      if (sort && !sort.includes('product_count')) {
        query.append("ordering", sort);
      }

      const response = await api.get<VendorResponse>(`/vendor/approved/?${query.toString()}`);
      const vendorData = response.data.results || [];
      const totalCount = response.data.count || 0;

      const validVendors = vendorData.filter(vendor => vendor.user_info?.id !== undefined && vendor.user_info?.id !== null);
      const userIds = validVendors.map(vendor => vendor.user_info.id);

      const productCounts = await fetchProductCounts(userIds);

      const vendorsWithCounts = vendorData.map(vendor => {
        const countObj = productCounts.find(pc => pc.userId === vendor.user_info?.id);
        return {
          ...vendor,
          product_count: countObj ? countObj.count : 0
        };
      });

      // **IMPROVEMENT**: If sorting by product count, sort the results from the current page.
      // This is a hybrid approach. Ideally, the backend would sort by product count directly.
      if (sort === '-product_count') {
        vendorsWithCounts.sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0));
      } else if (sort === 'product_count') {
        vendorsWithCounts.sort((a, b) => (a.product_count ?? 0) - (b.product_count ?? 0));
      }

      // **REMOVED**: The incorrect client-side sorting block is no longer needed.
      // The backend now handles sorting for date and brand.
      setVendors(vendorsWithCounts);
      setTotalPages(Math.ceil(totalCount / perPage));
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // **IMPROVEMENT**: Added useEffect for debouncing search input
  useEffect(() => {
    const handler = setTimeout(() => {
      // When the user stops typing, update the URL.
      // Also reset to page 1 for a new search.
      const newQueryString = createQueryString({ search: searchValue, page: searchValue ? '1' : null });
      router.push(`${pathname}?${newQueryString}`);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue, pathname, router]);


  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || '-application_date';
    const searchQuery = searchParams.get('search') || '';

    setCurrentPage(page);
    setSortOption(sort);
    setSearchValue(searchQuery); // Syncs input field with URL on initial load/navigation

    fetchVendors(page, searchQuery, sort);
  }, [searchParams]); // This effect now correctly re-triggers fetching

  const handleSortChange = (value: string) => {
    // When sorting, go back to page 1 to see results from the beginning
    const newQueryString = createQueryString({ sort: value, page: '1' });
    router.push(`${pathname}?${newQueryString}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update the local state. The debouncing useEffect will handle the API call.
    setSearchValue(e.target.value);
  };

  const handlePageChange = (page: number) => {
    const newQueryString = createQueryString({ page: page.toString() });
    router.push(`${pathname}?${newQueryString}`);
  };

  return (
    <>
      <main className="font-inter">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Brand Store', href: '/vendor-listing' }
        ]} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-800 mt-2">Vendors at MHEBazar</h1>
            </div>

            <Button
              onClick={() => setVendorDrawerOpen(true)}
              className="bg-[#5CA131] hover:bg-[#4a8f28] text-white font-medium px-6 py-2 rounded-lg transition-colors duration-150"
            >
              Become a Vendor
            </Button>

          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex gap-2 w-full md:w-1/2">
              <Input
                placeholder="Search by name, brand, or company..."
                value={searchValue} // **CHANGED** to use debounced value
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 items-center w-full md:w-auto">
              <span className="text-gray-600 font-medium whitespace-nowrap">Sort by:</span>
              <Select onValueChange={handleSortChange} value={sortOption}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-application_date">Newest First</SelectItem>
                  <SelectItem value="application_date">Oldest First</SelectItem>
                  <SelectItem value="-product_count">Product Count (High to Low)</SelectItem>
                  <SelectItem value="product_count">Product Count (Low to High)</SelectItem>
                  <SelectItem value="brand">Brand (A-Z)</SelectItem>
                  <SelectItem value="-brand">Brand (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Loading vendors...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No approved vendors found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vendors.map((vendor) => (
                <VendorCard vendor={vendor} key={vendor.id} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-10 gap-2 flex-wrap">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
      <VendorRegistrationDrawer
        open={vendorDrawerOpen}
        onClose={() => setVendorDrawerOpen(false)}
      />
    </>
  );
}

export default ClientSideVendorsPage;