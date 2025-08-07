/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Check, X, Building, LucideIcon, PackageCheck, PackageX, UserCheck, UserX, Package } from 'lucide-react';
import AnalyticsDashboard from '@/components/admin/Graph';
import api from '@/lib/api'; // Use the configured axios instance
import Cookies from 'js-cookie';
import { toast } from "sonner";
import Image from "next/image";

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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
// import { Separator } from '@/components/ui/separator';


// --- Type Definitions ---
export interface StatsCardProps {
  icon: LucideIcon;
  number: string;
  label: string;
  color?: string;
}

export interface VendorApplication {
  username: string;
  is_approved: boolean;
  id: number;
  company_name: string;
  company_email: string;
  brand: string;
  user_name: string; // From the list view serializer
}

export interface Product {
  id: number;
  name: string;
  is_active: boolean;
  images: { image: string }[];
  user: number;
  user_name: string;
  category_name: string;
}

// Grouped products structure
type GroupedProducts = {
  [key: string]: Product[];
}

// --- Helper Components ---
const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, number, label, color = "green" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer`}>
    <div className="flex justify-between items-start">
      <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
    <div className="mt-4">
      <h2 className={`text-3xl font-bold text-gray-800`}>{number}</h2>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  </div>
);

// --- Main Dashboard Component ---
const CompleteDashboard = () => {
  const [vendorApps, setVendorApps] = useState<VendorApplication[]>([]);
  const [pendingProducts, setPendingProducts] = useState<GroupedProducts>({});
  const [stats, setStats] = useState({ total_applications: 0, pending_applications: 0, approved_vendors: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<VendorApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // New state declarations for product rejection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductRejectModalOpen, setIsProductRejectModalOpen] = useState(false);
  const [productRejectionReason, setProductRejectionReason] = useState("");

  // --- Auth Check and Data Fetching ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vendorResponse, productResponse, statsResponse] = await Promise.all([
        api.get('/vendor/'),
        api.get('/products/'),
        api.get('/vendor/stats/') // Fetching stats
      ]);

      // Process Vendor Applications
      const pendingVendors = vendorResponse.data.results.filter(
        (app: any) => !app.is_approved
      );
      setVendorApps(pendingVendors);

      // Process and Group Pending Products
      const activeProducts = productResponse.data.results.filter(
        (product: Product) => !product.is_active
      );
      const grouped = activeProducts.reduce((acc: GroupedProducts, product: Product) => {
        const vendorName = product.user_name || 'Unknown Vendor';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {});
      setPendingProducts(grouped);
      setStats(statsResponse.data);

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
          window.location.href = "/";
          return;
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

  // --- Handler Functions for Approve/Reject ---
  const handleVendorApprove = async (vendorId: number) => {
    try {
      await api.post(`/vendor/${vendorId}/approve/`, { action: 'approve' });
      toast.success("Vendor Approved", { description: "The vendor application has been approved." });
      fetchData();
    } catch (error) {
      console.error("Failed to approve vendor:", error);
      toast.error("Approval Failed", { description: "An error occurred." });
    }
  };

  const handleOpenRejectModal = (vendor: VendorApplication) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleVendorRejectSubmit = async () => {
    if (!selectedVendor || !rejectionReason.trim()) {
      return toast.error("Validation Error", { description: "Rejection reason is required." });
    }
    try {
      await api.post(`/vendor/${selectedVendor.id}/approve/`, {
        action: 'reject',
        reason: rejectionReason,
      });
      toast.success("Vendor Rejected", { description: "The application has been rejected and removed." });
      setIsModalOpen(false);
      setRejectionReason("");
      fetchData();
    } catch (error: any) {
      console.error("Failed to reject vendor:", error);
      toast.error("Rejection Failed", { description: error.response?.data?.error || "An error occurred." });
    }
  };

  // Modify the handleProductAction function
  const handleProductAction = async (productId: number, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const product = Object.values(pendingProducts)
        .flat()
        .find(p => p.id === productId);
      setSelectedProduct(product || null);
      setIsProductRejectModalOpen(true);
      return;
    }

    try {
      await api.post(`/products/${productId}/${action}/`);
      toast.success(`Product ${action === 'approve' ? 'Approved' : 'Rejected'}`, {
        description: `The product has been successfully ${action === 'approve' ? 'approved' : 'rejected'}.`
      });
      fetchData();
    } catch (error) {
      console.error(`Failed to ${action} product:`, error);
      toast.error("Action Failed", { description: `Could not ${action} the product.` });
    }
  };

  // Add this new function to handle product rejection submission
  const handleProductRejectSubmit = async () => {
    if (!selectedProduct || !productRejectionReason.trim()) {
      return toast.error("Validation Error", { description: "Rejection reason is required." });
    }
    try {
      await api.post(`/products/${selectedProduct.id}/reject/`, {
        reason: productRejectionReason,
      });
      toast.success("Product Rejected", { description: "The product has been rejected." });
      setIsProductRejectModalOpen(false);
      setProductRejectionReason("");
      setSelectedProduct(null);
      fetchData();
    } catch (error: any) {
      console.error("Failed to reject product:", error);
      toast.error("Rejection Failed", { description: error.response?.data?.error || "An error occurred." });
    }
  };

  const totalPendingProducts = Object.values(pendingProducts).reduce((sum, prods) => sum + prods.length, 0);

  return (
    <>
      <div className="overflow-auto bg-gray-50 p-6 sm:p-8 lg:p-10 min-h-screen">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Section */}
          <div className="flex-1 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard icon={Building} number={String(stats.total_applications)} label="Total Vendors" color="blue" />
              <StatsCard icon={UserCheck} number={String(stats.approved_vendors)} label="Approved Vendors" color="green" />
              <StatsCard icon={UserX} number={String(stats.pending_applications)} label="Pending Applications" color="yellow" />
              <StatsCard icon={Package} number={String(totalPendingProducts)} label="Pending Products" color="orange" />
            </div>

            <AnalyticsDashboard />
          </div>

          {/* Right Section - Notifications */}
          <div className="w-full lg:w-1/3 space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pending Actions</h3>
              {isLoading ? (
                <p className="text-gray-500">Loading pending actions...</p>
              ) : (vendorApps.length === 0 && totalPendingProducts === 0) ? (
                <div className="text-center py-10 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Check className="mx-auto h-12 w-12 text-green-500" />
                  <h4 className="mt-3 text-lg font-medium text-gray-900">All Caught Up!</h4>
                  <p className="mt-1 text-sm text-gray-500">There are no pending applications or products to review.</p>
                </div>
              ) : null}
            </div>

            {/* Vendor Applications */}
            {vendorApps.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-700"><Building /> Vendor Applications</CardTitle>
                  <CardDescription>Review and process new vendor sign-ups.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {vendorApps.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4 flex items-center justify-between bg-white shadow-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{app.company_name}</p>
                        <p className="text-sm text-gray-500">Applied by: {app.user_name || app.username}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-500 hover:bg-red-50" onClick={() => handleOpenRejectModal(app)}>
                          <X className="w-4 h-4 mr-1" />Reject
                        </Button>
                        <Button size="sm" className="bg-[#5CA131] hover:bg-green-700 text-white" onClick={() => handleVendorApprove(app.id)}>
                          <Check className="w-4 h-4 mr-1" />Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Product Approvals */}
            {totalPendingProducts > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-orange-700"><Package /> Product Approvals</CardTitle>
                  <CardDescription>Review new products submitted by vendors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  {Object.entries(pendingProducts).map(([vendorName, products]) => (
                    <div key={vendorName}>
                      <h4 className="font-semibold text-gray-700 mb-3">From: {vendorName}</h4>
                      <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
                        {products.map(product => (
                          <div key={product.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Image src={product.images?.[0]?.image || '/no-product.png'} alt={product.name} width={48} height={48} className="rounded bg-gray-100 object-contain" />
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.category_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" className="text-red-600 border-red-500 hover:bg-red-50" onClick={() => handleProductAction(product.id, 'reject')}>
                                <PackageX className="w-4 h-4 mr-1" />Reject
                              </Button>
                              <Button size="sm" className="bg-[#5CA131] hover:bg-green-700 text-white" onClick={() => handleProductAction(product.id, 'approve')}>
                                <PackageCheck className="w-4 h-4 mr-1" />Approve
                              </Button>
                            </div>
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

      {/* Rejection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting the application for <span className="font-semibold">{selectedVendor?.company_name}</span>. This reason will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Type your reason here..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleVendorRejectSubmit}>Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Rejection Modal */}
      <Dialog open={isProductRejectModalOpen} onOpenChange={setIsProductRejectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting the product <span className="font-semibold">{selectedProduct?.name}</span>. This reason will be sent to the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Type your reason here..."
              value={productRejectionReason}
              onChange={(e) => setProductRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleProductRejectSubmit}>Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompleteDashboard;