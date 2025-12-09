import api from "@/lib/api";
import VendorCard from "@/components/vendor-listing/VendorCard";
import Breadcrumb from "@/components/elements/Breadcrumb";
import ClientSideControls from "@/components/vendor-listing/ClientSideControls"; // The new Client Component
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Metadata } from 'next';

// Vendor types remain the same as they are shared with the backend.
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

// Add static metadata for the page
export const metadata: Metadata = {
  title: 'Vendors listing',
  description: 'Discover trusted MHE vendors offering competitive prices and premium quality products at MHEBazar. Elevate your operations today!',
  openGraph: {
    title: 'Vendors listing',
    description: 'Discover trusted MHE vendors offering competitive prices and premium quality products at MHEBazar. Elevate your operations today!',
    url: 'https://www.mhebazar.in/vendor-listing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vendors listing',
    description: 'Discover trusted MHE vendors offering competitive prices and premium quality products at MHEBazar. Elevate your operations today!',
  },
  // ✅ Custom meta tags for SEO
  other: {
    'title': 'Vendors listing',
    'description': 'Discover trusted MHE vendors offering competitive prices and premium quality products at MHEBazar. Elevate your operations today!',
  },
};

// This is a Server Component, hence no `'use client'` directive
export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const perPage = 20;

  // FIX: Force the runtime check to pass by using await on the access logic.
  // Although searchParams is technically an object, this satisfies the Turbopack error.
  const { search: searchParam, ordering: orderingParam, page: pageParam } = await searchParams; 
  
  // Read URL parameters directly from the destructured variables
  const searchQuery = typeof searchParam === 'string' ? searchParam : "";
  const sortOption = typeof orderingParam === 'string' ? orderingParam : "-user__date_joined";
  const currentPage = typeof pageParam === 'string' ? parseInt(pageParam) : 1;
  // End of FIX

  const getVendors = async (page = 1, search = "", sort = "") => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: perPage.toString(),
      });

      if (search) {
        params.set("brand__icontains", search);
      }

      if (sort) {
        params.set("ordering", sort);
      }

      // Make a direct API call to your Django backend from the server
      const response = await api.get<VendorResponse>(`/vendor/approved/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      return { count: 0, next: null, previous: null, results: [] };
    }
  };

  const { results: vendors, count: totalCount } = await getVendors(currentPage, searchQuery, sortOption);
  const totalPages = Math.ceil(totalCount / perPage);

  // Helper function for pagination items (can be moved to a helper file)
  const getPaginationItems = () => {
    const items: (number | string)[] = [];
    const maxPagesToShow = 5;
    const sidePages = 2;

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
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
      items.push(totalPages);
    }
    return items;
  };

  const generatePageLink = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `/vendor-listing?${params.toString()}`;
  };

  return (
    <main className="font-inter">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Brand Store', href: '/vendor-listing' }]} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Render the Client Component for interactive elements */}
        <ClientSideControls initialSearch={searchQuery} initialSort={sortOption} />

        {vendors.length === 0 ? (
          <div className="text-center py-20"><p>No approved vendors found.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vendors.map((vendor) => <VendorCard vendor={vendor} key={vendor.id} />)}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-10">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={generatePageLink(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {getPaginationItems().map((item, index) =>
                typeof item === 'number' ? (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href={generatePageLink(item)}
                      isActive={currentPage === item}
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
                  href={generatePageLink(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </main>
  );
}