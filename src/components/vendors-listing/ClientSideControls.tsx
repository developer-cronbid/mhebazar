'use client';

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import VendorRegistrationDrawer from '@/components/forms/publicforms/VendorRegistrationForm';

interface ClientSideControlsProps {
  initialSearch: string;
  initialSort: string;
}

export default function ClientSideControls({ initialSearch, initialSort }: ClientSideControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(initialSearch);
  const [sortOption, setSortOption] = useState(initialSort);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const user = useUser();

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

  useEffect(() => {
    // Check if the current URL has any search or ordering parameters set.
    const hasSearchParam = searchParams.has('search');
    const hasOrderingParam = searchParams.has('ordering');

    // Only run the timeout if there's an active search value or the URL already has params
    // from a previous navigation.
    if (searchValue !== "" || hasSearchParam || hasOrderingParam) {
      const handler = setTimeout(() => {
        // We set page to '1' here to reset pagination on a new search.
        const newQueryString = createQueryString({ search: searchValue, page: '1' });
        router.push(`${pathname}?${newQueryString}`);
      }, 500);

      return () => clearTimeout(handler);
    }

    // If there's no search value and the URL is clean, do nothing.
  }, [searchValue, pathname, router, createQueryString, searchParams]);


  const handleSortChange = (value: string) => {
    setSortOption(value);
    const newQueryString = createQueryString({ ordering: value, page: '1' });
    router.push(`${pathname}?${newQueryString}`);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Vendors at MHEBazar</h1>
        {user.user?.role.id !== 2 && user.user?.role.id !== 1 && (
          <Button
            onClick={() => setVendorDrawerOpen(true)}
            className="bg-[#5CA131] hover:bg-[#4a8f28] text-white"
          >
            Become a Vendor
          </Button>
        )}
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
          <Select onValueChange={handleSortChange} value={sortOption}>
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
      <VendorRegistrationDrawer
        open={vendorDrawerOpen}
        onClose={() => setVendorDrawerOpen(false)}
      />
    </>
  );
}