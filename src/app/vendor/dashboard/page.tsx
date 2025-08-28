/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, FileText, AlertCircle, CheckCircle, Clock, ChevronRight, Cross, Shapes } from "lucide-react";
// import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import React from "react";
import api from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import ProductForm from "@/components/forms/uploadForm/ProductForm";
import Link from "next/link";
import categories from '@/data/categories.json';
import { IoDocuments } from "react-icons/io5";
import { RecentEnquiries } from "./topEnquiries";

const imgUrl = process.env.NEXT_PUBLIC_API_BASE_MEDIA_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// --- TYPE DEFINITIONS (Corrected based on API responses) ---
interface VendorDashboardData {
  products: any;
  vendor_details: VendorApplication;
  stats: VendorStats;
  notifications: any[]; // API returns empty, so we keep it flexible
  quick_actions: any[];
}

interface VendorApplication {
  id: number;
  user_info: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: string;
    date_joined: string;
    is_active: boolean;
  };
  company_name: string;
  company_email: string;
  company_address: string;
  company_phone: string;
  brand: string;
  pcode: string;
  gst_no: string;
  application_date: string;
  is_approved: boolean;
}

interface VendorStats {
  vendor_info: {
    company_name: string;
    brand: string;
    is_approved: boolean;
    application_date: string;
    status: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders?: any;
  account_info?: {
    days_since_joined: number;
    account_status: string;
  };
  performance?: {
    profile_completion: number;
    last_updated: string;
  };
}

// Corrected Product interface to match /products API response
interface Product {
  category: number | undefined;
  id: number;
  name: string;
  is_active: boolean; // This determines the status
  images: { image: string }[];
  category_name: string;
  type: 'new' | 'used'; // This replaces is_new
  updated_at: string;
}

interface Notification {
  id: number | string; // Can be string for generated notifications
  type: 'warning' | 'info' | 'success';
  message: string;
  created_at?: string;
}

// --- API FUNCTIONS ---
const vendorApi = {
  async getDashboardData(): Promise<VendorDashboardData> {
    try {
      const response = await api.get('/vendor/dashboard/');
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor dashboard data:', error);
      throw error;
    }
  },
};

// Updated functions to work with `is_active` boolean
function getStatusText(isActive: boolean): 'Approved' | 'Pending' {
  return isActive ? 'Approved' : 'Pending';
}

function getStatusColor(isActive: boolean) {
  return isActive ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600';
}

function getStatusIcon(isActive: boolean) {
  return isActive ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />;
}

// --- MAIN COMPONENT ---
export default function DashboardStats() {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [isSheetOpen, setIsSheetOpen] = useState(false)


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 4;

  // Calculate pagination
  const { paginatedProducts, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(products.length / productsPerPage);

    return { paginatedProducts, totalPages };
  }, [products, currentPage, productsPerPage]);

  // Create a lookup map for category images for fast access
  const categoryImageMap = useMemo(() => {
    const map: { [key: number]: string } = {};

    const processCategory = (category: any) => {
      if (category.id && category.image_url) {
        map[category.id] = category.image_url;
      }
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(processCategory);
      }
    };

    categories.forEach(processCategory);
    return map;
  }, [categories]);


  // CHANGE 2: Look up the image URL from the map using the category_id.
  // const categoryFallbackImage = category_id ? categoryImageMap[category_id] : null;

  function getImageSrc(images?: { image: string }[] | string,): string {
    if (typeof images === 'string' && images) return `${imgUrl}${images}`;
    if (Array.isArray(images) && images.length > 0 && images[0].image) {
      return `${imgUrl}${images[0].image}`;
    }
    // if (category_id) {
    //   console.log(category_id)
    //   return categoryImageMap[category_id] || "/no-product.png";
    // }
    return "/no-product.png";
  }

  // Reset to first page when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dashboardData = await vendorApi.getDashboardData();
        setApplication(dashboardData.vendor_details);
        setStats(dashboardData.stats);

        let allNotifications: Notification[] = [...(dashboardData.notifications || [])];

        if (dashboardData.vendor_details?.is_approved) {
          const productsData = await vendorApi.getDashboardData();
          // console.log(productsData)
          setProducts(productsData?.products);

          // ** Generate notifications for pending products **
          const productNotifications: Notification[] = productsData.products
            .filter((product: { is_active: any; }) => !product.is_active) // Find pending products
            .map((product: { id: any; name: any; }) => ({
              id: `prod-${product.id}`,
              type: 'warning',
              message: `Your product "${product.name}" is pending review by the admin.`,
            }));

          allNotifications = [...allNotifications, ...productNotifications];
        }

        setNotifications(allNotifications);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load your dashboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // const approved_products = products.filter(p => p.is_active).length;
  // const pending_products = products.filter(p => !p.is_active).length;

  // Handle edit click
  const handleEditClick = async (productId: number) => {
    try {
      const response = await api.get(`/products/${productId}/`);
      // console.log(response.data);
      setSelectedProduct(response.data);
      setIsSheetOpen(true)
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of products section when page changes
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 px-2 sm:px-10 py-6 mx-auto">
        {/* Vendor Status Alert */}
        {application && stats?.vendor_info.status !== 'Approved' && (
          <Alert className="border-l-4 border-yellow-400 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your vendor application status is: {stats?.vendor_info.status}. You can add products once approved.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Products Card */}
          {/*
    - p-6 sm:p-8: Reduced padding on small screens.
    - flex-wrap: Allows items to wrap if needed on very small screens.
  */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-white to-[#DDF2D0] rounded-xl shadow-sm flex items-center justify-between flex-wrap">
            <div>
              {/*
        - text-2xl sm:text-3xl: Smaller number font size on small screens.
        - text-xl sm:text-2xl: Smaller paragraph font size.
        - w-auto: Removed fixed width to allow natural text wrapping.
      */}
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-600">{products.length}</h2>
              <p className="text-xl sm:text-2xl text-gray-500 mt-1">Total Products Added</p>
            </div>
            {/*
      - w-24 h-24 sm:w-28 sm:h-28: Smaller icon circle on small screens.
      - h-10 w-10 sm:h-12 sm:w-12: Smaller icon size.
    */}
            <div className="p-3 rounded-full border-4 border-[#5CA131]/30 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 text-[#5CA131]" />
            </div>
          </div>

          {/* Offers Card */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-white to-[#D8EBF8] rounded-xl shadow-sm flex items-center justify-between flex-wrap">
            <div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-600">{stats?.enquiry_stats?.total_quotes || 0}</h2>
              <p className="text-xl sm:text-2xl text-gray-500 mt-1">Total Quotes</p>
            </div>
            <div className="p-3 rounded-full border-4 border-[#018CFC]/30 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <IoDocuments className="h-10 w-10 sm:h-12 sm:w-12 text-[#018CFC]" />
            </div>
          </div>

          {/* Queries Card */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-white to-[#FAE5A4] rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-600">{stats?.enquiry_stats?.total_enquiries || 0}</h2>
              <p className="text-xl sm:text-2xl text-gray-500 mt-1 text-wrap">Total Enquiries</p>
            </div>
            <div className="p-3 rounded-full border-4 border-[#F1BF25]/30 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-[#F1BF25]" />
            </div>
          </div>
        </div>

        {/* Bottom Action Cards */}
        <div className="grid gap-4 md:grid-cols-3 mt-5">
          {/* Sell New Products */}
          <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#FECEBC] to-[#FF3434] p-6 rounded-lg cursor-pointer hover:shadow-md transition" onClick={() => setIsSheetOpen(true)}>
            <img src="/v1.png" alt="Sell New Products" className="h-20 w-20 object-contain" />
            {/* <Cross className="h-14 w-14 text-white" /> */}
            <div>
              <h3 className="text-white text-2xl font-semibold">Sell New Products</h3>
              <p className="text-white text-sm">List your products and start selling in minutes.</p>
            </div>
            <ChevronRight className="text-white" />
          </div>

          {/* Sell Old Products */}
          <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#FECEBC] to-[#E55117] p-6 rounded-lg cursor-pointer hover:shadow-md transition" onClick={() => setIsSheetOpen(true)}>
            <img src="/v2.png" alt="Sell Old Products" className="h-20 w-20 object-contain" />
            {/* <Cross className="h-14 w-14 text-white" /> */}
            <div>
              <h3 className="text-white text-2xl font-semibold">Sell Old Products</h3>
              <p className="text-white text-sm">List your products and start selling in minutes.</p>
            </div>
            <ChevronRight className="text-white" />
          </div>

          {/* Rent Products */}
          <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#E4FBD6] to-[#93C276] p-6 rounded-lg cursor-pointer hover:shadow-md transition" onClick={() => setIsSheetOpen(true)}>
            <img src="/v3.png" alt="Rent Products" className="h-20 w-20 object-contain" />
            {/* <Shapes className="h-14 w-14 text-white" /> */}
            <div>
              <h3 className="text-white text-2xl font-semibold">Rent Products</h3>
              <p className="text-white text-sm">List your products and start selling in minutes.</p>
            </div>
            <ChevronRight className="text-white" />
          </div>
        </div>

        {/* Product List */}
        <div className="flex flex-col sm:flex-row gap-6 mb-4">
          <div className="grid grid-cols-1 w-full md:w-1/2" id="products-section"> {/* add w-1/2 when adding the searched section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-2xl font-bold text-gray-900">
                  Your Products ({products.length})
                  {products.length > productsPerPage && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      Showing {Math.min((currentPage - 1) * productsPerPage + 1, products.length)}-{Math.min(currentPage * productsPerPage, products.length)} of {products.length}
                    </span>
                  )}
                </h2>
                {application?.is_approved && (
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="default"
                        className="bg-[#5CA131] hover:bg-green-700 text-white font-semibold px-4 py-2 rounded flex items-center gap-2"
                      >
                        + Add Product
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <ProductForm product={selectedProduct} />
                    </SheetContent>
                  </Sheet>
                )}
              </div>

              {!application?.is_approved ? (
                <Card className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Vendor Approval Required</h3>
                  <p className="text-gray-600">
                    Your vendor application is {stats?.vendor_info?.status?.toLowerCase()}.
                    You can add products once your application is approved.
                  </p>
                </Card>
              ) : products.length === 0 ? (
                <Card className="p-6 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No Products Yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding your first product to begin selling.</p>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button className="bg-[#5CA131] hover:bg-green-700">
                        Add Your First Product
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <ProductForm />
                    </SheetContent>
                  </Sheet>
                </Card>
              ) : (
                <div className="space-y-4">
                  {paginatedProducts.map((product) => (
                    // console.log(product),
                    <div
                      key={product.id}
                      className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition"
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className="h-20 w-20 relative flex-shrink-0">
                          <img
                            src={getImageSrc(product.images)}
                            alt={product.name}
                            // fill
                            className="object-contain rounded"
                            sizes="80px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `${imgUrl}${categoryImageMap[product.category]}`;
                            }}
                          />
                        </div>
                        {/* 👇 Add min-w-0 here */}
                        <div className="space-y-1 w-full min-w-0">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${getStatusColor(product.is_active)}`}>
                                {getStatusIcon(product.is_active)}
                                {getStatusText(product.is_active)}
                              </span>
                              <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded font-medium">
                                {product.category_name}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">
                              {product.type}
                            </div>
                          </div>
                          <h3
                            // 👇 Removed `overflow-hidden` (redundant with truncate) and `break-all`
                            className="font-medium text-gray-900 truncate max-w-xs"
                            title={product.name}
                          >
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Button variant="link" className="text-blue-600 px-0 py-0 h-auto text-sm" onClick={() => handleEditClick(product.id)}>
                              Edit
                            </Button>
                            <span className="text-xs text-gray-400">
                              Updated {new Date(product.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) {
                                  handlePageChange(currentPage - 1);
                                }
                              }}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>

                          {/* Page Numbers */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current page
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePageChange(page);
                                    }}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }

                            // Show ellipsis
                            if (
                              (page === currentPage - 2 && currentPage > 3) ||
                              (page === currentPage + 2 && currentPage < totalPages - 2)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }

                            return null;
                          })}

                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) {
                                  handlePageChange(currentPage + 1);
                                }
                              }}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}

                  <Link href="/vendor/product-list">
                    <Button variant="outline" className="w-full font-semibold text-base text-green-600 border-green-600 hover:bg-green-50 hover:text-green-600 py-6">
                      View All Products
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <RecentEnquiries />

        </div>

      </div>
    </>
  );
}