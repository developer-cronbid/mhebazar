/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from 'react';
// IMPORT THE LOADER ICON
import { Check, X, Building, PackageCheck, PackageX, Package, ChevronRightIcon, Info, Loader2, Users } from 'lucide-react';
import AnalyticsDashboard from '@/components/admin/Graph';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from 'next/navigation';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// --- Type Definitions ---

// NEW: Type for the vendor stats API response
export interface VendorStats {
  total_applications: number;
  approved_vendors: number;
  pending_applications: number;
  recent_applications: number;
}

export interface StatsCardProps {
  icon: string;
  number: string;
  label: string;
  link: string;
  // Optional: Highlight color for important cards (like pending actions)
  highlight?: boolean;
}

export interface VendorApplication {
  username: string;
  is_approved: boolean;
  id: number;
  company_name: string;
  company_email: string;
  brand: string;
  user_name: string;
}

export interface Product {
  id: number;
  name: string;
  is_active: boolean;
  images: { image: string }[];
  user: number;
  user_name: string;
  user_description: string;
  user_image: string;
  category_name: string;
  average_rating: number | null;
  brochure: string | null;
  category: number;
  created_at: string;
  description: string;
  direct_sale: boolean;
  hide_price: boolean;
  manufacturer: string;
  meta_description: string;
  meta_title: string;
  model: string;
  online_payment: boolean;
  price: string;
  product_details: { [key: string]: any };
  rejection_reason: string;
  status: "pending" | "approved" | "rejected";
  stock_quantity: number;
  subcategory: number | null;
  type: string[];
  updated_at: string;
}

type GroupedProducts = {
  [key: string]: Product[];
}

interface DashboardStats {
  productQuotes: number;
  directBuys: number;
  rentals: number;
  trainingRequests: number;
  contactRequests: number;
}


// --- Helper Components ---
const StatsCard: React.FC<StatsCardProps> = ({ icon, number, label, link, highlight }) => {
  const router = useRouter();
  const handleCardClick = () => router.push(link);

  const cardClasses = highlight
    ? "group relative p-4 md:p-6 rounded-xl shadow-lg border-2 border-red-400 bg-red-50 flex flex-col justify-between cursor-pointer transition-shadow duration-300 hover:shadow-2xl hover:border-red-500 w-full min-h-[160px]"
    : "group relative bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between cursor-pointer transition-shadow duration-300 hover:shadow-2xl hover:border-gray-200 w-full min-h-[160px]";

  const numberClasses = highlight ? "text-3xl sm:text-4xl font-bold text-red-600 pr-10" : "text-3xl sm:text-4xl font-bold text-green-600 pr-10";
  const arrowClasses = highlight ? "h-6 w-6 md:h-7 md:w-7 text-red-600 transition-transform duration-300 group-hover:translate-x-1" : "h-6 w-6 md:h-7 md:w-7 text-green-600 transition-transform duration-300 group-hover:translate-x-1";

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
    >
      {/* Icon Container - Placed at the top */}
      <div className="mb-4">
        {/* Using a Lucide icon for the Pending Vendors card, otherwise use Image */}
        {highlight && label === "Pending Vendors" ? (
          <Users className="w-12 h-12 md:w-16 md:h-16 text-red-600" />
        ) : (
          <Image src={icon} alt={label} width={64} height={64} className="w-12 h-12 md:w-16 md:h-16" />
        )}
      </div>

      {/* Text content */}
      <div>
        <h2 className={numberClasses}>{number}</h2>
        <p className="text-base md:text-lg text-gray-500">{label}</p>
      </div>

      {/* Chevron icon is now absolutely positioned for perfect vertical centering. */}
      <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
        <ChevronRightIcon className={arrowClasses} />
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900 col-span-2">{value || 'N/A'}</dd>
  </div>
);


// --- Main Dashboard Component ---
const CompleteDashboard = () => {
  const [vendorApps, setVendorApps] = useState<VendorApplication[]>([]);
  const [pendingProducts, setPendingProducts] = useState<GroupedProducts>({});

  // NEW: State to hold general statistics
  const [stats, setStats] = useState<DashboardStats>({
    productQuotes: 0, directBuys: 0, rentals: 0, trainingRequests: 0,
    contactRequests: 0,
  });

  // NEW: State to hold Vendor specific statistics
  const [vendorStats, setVendorStats] = useState<VendorStats>({
    total_applications: 0, approved_vendors: 0, pending_applications: 0, recent_applications: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  // MODAL STATES (kept the same)
  const [selectedVendor, setSelectedVendor] = useState<VendorApplication | null>(null);
  const [isVendorRejectModalOpen, setIsVendorRejectModalOpen] = useState(false);
  const [vendorRejectionReason, setVendorRejectionReason] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);
  const [isProductRejectModalOpen, setIsProductRejectModalOpen] = useState(false);
  const [productRejectionReason, setProductRejectionReason] = useState("");

  // NEW LOADING STATES (kept the same)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingVendorId, setLoadingVendorId] = useState<number | null>(null);


  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        vendorResponse, productResponse, vendorStatsResponse, quoteResponse,
        rentalResponse, orderResponse, trainingResponse, contactResponse
      ] = await Promise.all([
       api.get('/vendor/'),
  api.get('/products/'),
  api.get('/vendor/stats/'),
  api.get('/quotes/'), // Fetch standard list
  api.get('/rentals/'),
  api.get('/orders/'),
  api.get('/training-registrations/'),
  api.get('/contact-forms/'),
      ]);

      const pendingVendors = vendorResponse.data.results.filter((app: any) => !app.is_approved);
      setVendorApps(pendingVendors);

      const pendingProductsList = productResponse.data.results.filter((product: Product) => !product.is_active);

      const grouped = pendingProductsList.reduce((acc: GroupedProducts, product: Product) => {
        const vendorName = product.user_name || 'Unknown Vendor';
        if (!acc[vendorName]) acc[vendorName] = [];
        acc[vendorName].push(product);
        return acc;
      }, {});
      setPendingProducts(grouped);

      // Set general counts
     setStats({
      // Use .length because quoteResponse.data is a direct array from the database
      productQuotes: Array.isArray(quoteResponse.data) 
        ? quoteResponse.data.length 
        : (quoteResponse.data.count || 0),

      // Use .length because rentalResponse.data is a direct array from the database
      rentals: Array.isArray(rentalResponse.data) 
        ? rentalResponse.data.length 
        : (rentalResponse.data.count || 0),

      directBuys: orderResponse.data.count || 0,
      trainingRequests: trainingResponse.data.count || 0,
      contactRequests: contactResponse.data.count || 0,
    });

    setVendorStats(vendorStatsResponse.data);

      // Set vendor stats separately
      // setVendorStats(vendorStatsResponse.data);

   } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    toast.error("Error", { description: "Could not fetch dashboard data." });
  } finally {
    setIsLoading(false);
  }
}, []);

  useEffect(() => {
    const checkUserAndFetch = async () => {
      try {
        const userResponse = await api.get('/users/me/');
        if (userResponse.data?.role?.name.toLowerCase() !== 'admin') {
          window.location.href = "/"; return;
        }
        fetchData();
      } catch (err: any) {
        console.error("Auth check failed:", err);
        if ([401, 403].includes(err?.response?.status)) {
          Cookies.remove("access_token");
          window.location.href = "/login";
        }
      }
    };
    checkUserAndFetch();
  }, [fetchData]);

  // --- Handler Functions (Unchanged) ---

  // Vendor Handlers
  const handleVendorApprove = async (vendorId: number) => {
    setLoadingVendorId(vendorId); // Set loading for specific vendor
    try {
      await api.post(`/vendor/${vendorId}/approve/`, { action: 'approve' });
      toast.success("Vendor Approved");
      fetchData();
    } catch (error)
    // eslint-disable-next-line no-empty
    {
      toast.error("Approval Failed");
    } finally {
      setLoadingVendorId(null); // Clear loading state
    }
  };

  const handleOpenVendorRejectModal = (vendor: VendorApplication) => {
    setSelectedVendor(vendor);
    setIsVendorRejectModalOpen(true);
  };

  const handleVendorRejectSubmit = async () => {
    if (!selectedVendor || !vendorRejectionReason.trim()) {
      return toast.error("Rejection reason is required.");
    }
    setIsSubmitting(true); // Set general modal submitting state
    try {
      await api.post(`/vendor/${selectedVendor.id}/approve/`, { action: 'reject', reason: vendorRejectionReason });
      toast.success("Vendor Rejected");
      setIsVendorRejectModalOpen(false);
      setVendorRejectionReason("");
      fetchData();
    } catch (error: any) {
      toast.error("Rejection Failed", { description: error.response?.data?.error });
    } finally {
      setIsSubmitting(false); // Clear submitting state
    }
  };

  // Product Handlers
  const handleOpenProductDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailModalOpen(true);
  };

  const handleProductApprove = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await api.post(`/products/${selectedProduct.id}/approve/`);
      toast.success("Product Approved", { description: `${selectedProduct.name} is now live.` });
      setIsProductDetailModalOpen(false);
      fetchData();
    } catch (error)
    // eslint-disable-next-line no-empty
    {
      toast.error("Approval Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenProductRejectModal = () => {
    if (!selectedProduct) return;
    setIsProductDetailModalOpen(false);
    setIsProductRejectModalOpen(true);
  };

  const handleProductRejectSubmit = async () => {
    if (!selectedProduct || !productRejectionReason.trim()) {
      return toast.error("Rejection reason is required.");
    }
    setIsSubmitting(true);
    try {
      await api.post(`/products/${selectedProduct.id}/reject/`, { reason: productRejectionReason });
      toast.success("Product Rejected");
      setIsProductRejectModalOpen(false);
      setProductRejectionReason("");
      fetchData();
    } catch (error: any) {
      toast.error("Rejection Failed", { description: error.response?.data?.error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPendingProducts = Object.values(pendingProducts).reduce((sum, prods) => sum + prods.length, 0);

  // Data for the AnalyticsDashboard (Graph)
  const graphData = {
    totalApplications: vendorStats.total_applications,
    approvedVendors: vendorStats.approved_vendors,
    pendingApplications: vendorStats.pending_applications,
  };


  return (
    <>
      {/* Main layout and stats cards remain the same */}
      <div className="overflow-auto bg-gray-50 p-6 sm:p-8 lg:p-10 min-h-screen">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main content area */}
          <div className="flex-1 space-y-8">
            {/* Stats Cards - Adjusted grid for better flow on all screens */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 mb-6">

              <StatsCard icon='/prodQuote.png' number={String(stats.productQuotes)} label="Product Quotes" link="https://www.mhebazar.in/admin/adminforms/quotes" />
              <StatsCard icon='/rentBuy.png' number={String(stats.directBuys)} label="Direct Buys (Orders)" link="https://www.mhebazar.in/admin/adminforms/direct-buy" />
              <StatsCard icon='/Rental.png' number={String(stats.rentals)} label="Rentals" link="https://www.mhebazar.in/admin/adminforms/rentals" />
              <StatsCard icon='/getCAt.png' number={String(stats.trainingRequests)} label="Training Requests" link="https://www.mhebazar.in/admin/adminforms/training-registrations" />
              <StatsCard icon='/specs.png' number={String(stats.contactRequests)} label="Contact Requests" link="https://www.mhebazar.in/admin/admincontact/contact-form" />
              {/* NEW: Pending Vendors Card with Redirection */}
              <StatsCard
                icon='' // Using Lucide icon inside the component based on highlight prop
                number={String(vendorStats.pending_applications)}
                label="Pending Vendors"
                link="https://www.mhebazar.in/admin/adminaccounts/registered-vendors"
                highlight={vendorStats.pending_applications > 0} // Highlight if there are pending apps
              />
            </div>

            {/* Analytics Dashboard (Graph) - Pass the fetched vendorStats data */}
            <AnalyticsDashboard />

          </div>

          {/* Pending Actions Sidebar (Unchanged) */}
          <div className="w-full lg:w-1/3 space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pending Actions</h3>
              {isLoading ? <div className='text-center py-10'><Loader2 className='mx-auto h-8 w-8 text-green-600 animate-spin' /> <p className='text-sm text-gray-500 mt-2'>Loading...</p></div> : (vendorApps.length === 0 && totalPendingProducts === 0) ? (
                <div className="text-center py-10 bg-white rounded-lg border shadow-sm">
                  <Check className="mx-auto h-12 w-12 text-green-500" />
                  <h4 className="mt-3 text-lg font-medium">All Caught Up!</h4>
                  <p className="mt-1 text-sm text-gray-500">No pending items.</p>
                </div>
              ) : null}
            </div>

            {/* Vendor Applications with Loading Buttons */}
            {vendorApps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700"><Building className='w-5 h-5' /> Vendor Applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendorApps.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                      <div>
                        <p className="font-semibold">{app.company_name}</p>
                        <p className="text-sm text-gray-500">{app.user_name || app.username}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenVendorRejectModal(app)} disabled={loadingVendorId === app.id}>
                          <X className="w-4 h-4 mr-1" />Reject
                        </Button>
                        <Button size="sm" className="bg-[#5CA131] hover:bg-green-700 text-white" onClick={() => handleVendorApprove(app.id)} disabled={loadingVendorId === app.id}>
                          {loadingVendorId === app.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <><Check className="w-4 h-4 mr-1" />Approve</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Product Approvals section */}
            {totalPendingProducts > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700"><Package className='w-5 h-5' /> Product Approvals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(pendingProducts).map(([vendorName, products]) => (
                    <div key={vendorName}>
                      <h4 className="font-semibold text-gray-700 mb-3 border-b pb-1">From: {vendorName}</h4>
                      <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
                        {products.map(product => (
                          <div key={product.id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <Image src={product.images?.[0]?.image || '/no-product.png'} alt={product.name} width={48} height={48} className="rounded object-cover border w-12 h-12 flex-shrink-0" />
                              <div className='min-w-0'>
                                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.category_name}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleOpenProductDetailModal(product)} className='flex-shrink-0'>
                              <Info className="w-4 h-4 mr-2" /> Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS (Unchanged) --- */}

      {/* Vendor Rejection Modal */}
      <Dialog open={isVendorRejectModalOpen} onOpenChange={setIsVendorRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor: {selectedVendor?.company_name}</DialogTitle>
            <DialogDescription>This reason will be sent to the user.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Type reason here..." value={vendorRejectionReason} onChange={(e) => setVendorRejectionReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVendorRejectModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleVendorRejectSubmit} disabled={isSubmitting || !vendorRejectionReason.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail and Approval Modal */}
      <Dialog open={isProductDetailModalOpen} onOpenChange={setIsProductDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  Review the product details below. Submitted by <span className="font-semibold">{selectedProduct.user_name}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg border-b pb-2 mb-2">Product Information</h4>
                  <dl>
                    <DetailRow label="Category" value={selectedProduct.category_name} />
                    <DetailRow label="Manufacturer" value={selectedProduct.manufacturer} />
                    <DetailRow label="Model" value={selectedProduct.model} />
                    <DetailRow label="Price" value={`₹ ${Number(selectedProduct.price).toLocaleString('en-IN')}`} />
                    <DetailRow label="Stock" value={selectedProduct.stock_quantity} />
                    <DetailRow label="Type" value={selectedProduct.type.map(t => <Badge key={t} variant="secondary" className="mr-1 capitalize">{t}</Badge>)} />
                    <DetailRow label="Description" value={<p className="whitespace-pre-wrap">{selectedProduct.description}</p>} />
                  </dl>
                  {selectedProduct.product_details?.spare_specs && (
                    <>
                      <h4 className="font-semibold text-lg border-b pb-2 mb-2 pt-4">Spare Specs</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedProduct.product_details.spare_specs}</p>
                    </>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2 mb-2">Images</h4>
                  {selectedProduct.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.images.map((img, index) => (
                        <Image key={index} src={img.image} alt={`${selectedProduct.name} image ${index + 1}`} width={150} height={150} className="rounded-md object-cover border" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No images provided.</p>
                  )}
                  <h4 className="font-semibold text-lg border-b pb-2 mb-2 pt-4">Meta Information</h4>
                  <dl>
                    <DetailRow label="Meta Title" value={selectedProduct.meta_title} />
                    <DetailRow label="Meta Description" value={selectedProduct.meta_description} />
                  </dl>
                  <h4 className="font-semibold text-lg border-b pb-2 mb-2 pt-4">Admin Details</h4>
                  <dl>
                    <DetailRow label="Status" value={<Badge className="capitalize">{selectedProduct.status}</Badge>} />
                    <DetailRow label="Created On" value={new Date(selectedProduct.created_at).toLocaleString()} />
                    <DetailRow label="Last Updated" value={new Date(selectedProduct.updated_at).toLocaleString()} />
                  </dl>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setIsProductDetailModalOpen(false)} disabled={isSubmitting}>Close</Button>
                <div className='flex items-center space-x-2'>
                  <Button variant="destructive" onClick={handleOpenProductRejectModal} disabled={isSubmitting}>
                    <PackageX className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button className="bg-[#5CA131] hover:bg-green-700 text-white" onClick={handleProductApprove} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PackageCheck className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Rejection Reason Modal */}
      <Dialog open={isProductRejectModalOpen} onOpenChange={setIsProductRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>This reason will be sent to the vendor.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Type reason here..." value={productRejectionReason} onChange={(e) => setProductRejectionReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductRejectModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleProductRejectSubmit} disabled={isSubmitting || !productRejectionReason.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompleteDashboard;