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
import Breadcrumb from "@/components/elements/Breadcrumb";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import VendorRegistrationDrawer from '@/components/forms/publicforms/VendorRegistrationForm';
// **CHANGED**: Import shadcn/ui pagination components
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ... (The Vendor and VendorResponse types remain the same) ...
type Vendor = {
  id: number;
  company_name: string;
  brand: string;
  product_count: number;
  user_info: {
    id: number;
    profile_photo: string | null;
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
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || "");
  const [currentPage, setCurrentPage] = useState(1); // Add currentPage state
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState(searchParams.get('ordering') || "-user__date_joined");
  const [isLoading, setIsLoading] = useState(true);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const perPage = 12;

  // ... (createQueryString, fetchVendors, and other hooks remain the same) ...
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

  const fetchVendors = async (page = 1, searchQuery = "", sort = "-user__date_joined") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: perPage.toString(),
      });

      if (searchQuery) {
        params.set("brand__icontains", searchQuery);
      }

      if (sort) {
        params.set("ordering", sort);
      }

      const response = await api.get<VendorResponse>(`/vendor/approved/?${params.toString()}`);

      setVendors(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / perPage));
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const newQueryString = createQueryString({ search: searchValue, page: '1' });
      router.push(`${pathname}?${newQueryString}`);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchValue, pathname, router, createQueryString]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('ordering') || '-user__date_joined';
    const searchQuery = searchParams.get('search') || '';

    setCurrentPage(page); // Set currentPage state
    setSortOption(sort);
    setSearchValue(searchQuery);

    fetchVendors(page, searchQuery, sort);
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const newQueryString = createQueryString({ page: page.toString() });
    router.push(`${pathname}?${newQueryString}`);
    window.scrollTo(0, 0); // Optional: scroll to top on page change
  };

  // **NEW**: Helper to generate pagination items with ellipses
  const getPaginationItems = () => {
    const items: (number | string)[] = [];
    const maxPagesToShow = 5; // Max page numbers to show
    const sidePages = 2; // Pages to show on each side of current page

    if (totalPages <= maxPagesToShow + 2) { // Show all pages if not many
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1); // Always show first page
      if (currentPage > sidePages + 1) {
        items.push('...');
      }

      let start = Math.max(2, currentPage - sidePages + 1);
      let end = Math.min(totalPages - 1, currentPage + sidePages - 1);

      if (currentPage <= sidePages) {
        end = maxPagesToShow - 1;
      }
      if (currentPage > totalPages - sidePages) {
        start = totalPages - maxPagesToShow + 2;
      }

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (currentPage < totalPages - sidePages) {
        items.push('...');
      }
      items.push(totalPages); // Always show last page
    }
    return items;
  };

  return (
    <>
      <main className="font-inter">
        {/* ... (Breadcrumb, Header, Search, and Sort controls are unchanged) ... */}
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Brand Store', href: '/vendor-listing' }]} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Vendors at MHEBazar</h1>
            <Button
              onClick={() => setVendorDrawerOpen(true)}
              className="bg-[#5CA131] hover:bg-[#4a8f28] text-white"
            >
              Become a Vendor
            </Button>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex-grow">
              <Input
                placeholder="Search by brand..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-gray-600 font-medium whitespace-nowrap">Sort by:</span>
              <Select onValueChange={(value) => {
                const newQueryString = createQueryString({ ordering: value, page: '1' });
                router.push(`${pathname}?${newQueryString}`);
              }} value={sortOption}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-user__date_joined">Newest First</SelectItem>
                  <SelectItem value="user__date_joined">Oldest First</SelectItem>
                  <SelectItem value="-product_count">Products (High to Low)</SelectItem>
                  <SelectItem value="product_count">Products (Low to High)</SelectItem>
                  <SelectItem value="brand">Brand (A-Z)</SelectItem>
                  <SelectItem value="-brand">Brand (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20"><p>Loading vendors...</p></div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-20"><p>No approved vendors found.</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vendors.map((vendor) => <VendorCard vendor={vendor} key={vendor.id} />)}
            </div>
          )}

          {/* **CHANGED**: Replaced old buttons with shadcn/ui Pagination */}
          {totalPages > 1 && !isLoading && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {getPaginationItems().map((item, index) =>
                  typeof item === 'number' ? (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => handlePageChange(item)}
                        isActive={currentPage === item}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={index}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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