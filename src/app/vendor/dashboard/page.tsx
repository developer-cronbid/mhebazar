/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Download, FileText, Bell, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_MEDIA_URL || 'http://localhost:8000';

function getImageSrc(images?: { image: string }[] | string) {
  if (typeof images === 'string' && images) return `${API_BASE_URL}${images}`;
  if (Array.isArray(images) && images.length > 0 && images[0].image) {
    return `${API_BASE_URL}${images[0].image}`;
  }
  return "/no-product.png";
}

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // Calculate pagination
  const { paginatedProducts, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(products.length / productsPerPage);

    return { paginatedProducts, totalPages };
  }, [products, currentPage, productsPerPage]);

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
          console.log(productsData)
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

  const approved_products = products.filter(p => p.is_active).length;
  const pending_products = products.filter(p => !p.is_active).length;

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
      <div className="space-y-8 px-2 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* Vendor Status Alert */}
        {application && stats?.vendor_info.status !== 'Approved' && (
          <Alert className="border-l-4 border-yellow-400 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your vendor application status is: {stats?.vendor_info.status}. You can add products once approved.
            </AlertDescription>
          </Alert>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card className="p-4 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  Notifications ({notifications.length})
                </h3>
              </div>
              <Button
                variant="link"
                onClick={() => setShowAllNotifications(!showAllNotifications)}
                className="text-blue-600 px-0"
              >
                {showAllNotifications ? 'Show Less' : 'View All'}
              </Button>
            </div>
            <div className="space-y-2">
              {(showAllNotifications ? notifications : notifications.slice(0, 3)).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border bg-white border-blue-200`}
                >
                  <p className="text-sm text-gray-800">{notification.message}</p>
                  {notification.created_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-0 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{products.length}</h2>
                <p className="text-gray-500 mt-1">Total Products</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {approved_products} Approved
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {pending_products} Pending
                  </Badge>
                </div>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-0 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{stats?.orders?.total_orders || 0}</h2>
                <p className="text-gray-500 mt-1">Total Orders</p>
                {stats?.orders && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {stats.orders.pending_orders} Pending
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {stats.orders.completed_orders} Completed
                    </Badge>
                  </div>
                )}
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <Download className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-0 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{stats?.orders?.recent_orders || 0}</h2>
                <p className="text-gray-500 mt-1">Recent Inquiries</p>
                {stats?.account_info && (
                  <p className="text-xs text-gray-500 mt-2">
                    Member for {stats.account_info.days_since_joined} days
                  </p>
                )}
              </div>
              <div className="bg-yellow-100 p-4 rounded-full">
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Product List */}
        <div className="grid grid-cols-1" id="products-section">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Your Products ({products.length})
                {products.length > productsPerPage && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Showing {Math.min((currentPage - 1) * productsPerPage + 1, products.length)}-{Math.min(currentPage * productsPerPage, products.length)} of {products.length}
                  </span>
                )}
              </h2>
              {application?.is_approved && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="default"
                      className="bg-[#5CA131] hover:bg-green-700 text-white font-semibold px-4 py-2 rounded flex items-center gap-2"
                    >
                      + Add Product
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <ProductForm />
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
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="h-20 w-20 relative flex-shrink-0">
                        <Image
                          src={getImageSrc(product.images)}
                          alt={product.name}
                          fill
                          className="object-contain rounded"
                          sizes="80px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/no-product.png";
                          }}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${getStatusColor(product.is_active)}`}>
                            {getStatusIcon(product.is_active)}
                            {getStatusText(product.is_active)}
                          </span>
                          <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded font-medium">
                            {product.category_name}
                          </span>
                          {product.type === 'new' && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">
                              New
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="link" className="text-blue-600 px-0 py-0 h-auto text-sm">
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
      </div>
    </>
  );
}