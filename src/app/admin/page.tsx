/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Check, X, Building, PackageCheck, PackageX, Package, ChevronRightIcon, Info, Loader2, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from 'next/navigation';

const AnalyticsDashboard = dynamic(() => import('@/components/admin/Graph'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-xl" />
});

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
const StatsCard = React.memo(({ icon, number, label, link, highlight, isLoading }: any) => {
  const router = useRouter();
  const handleCardClick = () => router.push(link);
  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100 min-h-[160px] animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
        <div className="space-y-3">
          <div className="h-8 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }
  const cardClasses = highlight
    ? "group relative p-4 md:p-6 rounded-xl shadow-lg border-2 border-red-400 bg-red-50 flex flex-col justify-between cursor-pointer transition-shadow duration-300 hover:shadow-2xl hover:border-red-500 w-full min-h-[160px]"
    : "group relative bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between cursor-pointer transition-shadow duration-300 hover:shadow-2xl hover:border-gray-200 w-full min-h-[160px]";

  const numberClasses = highlight ? "text-3xl sm:text-4xl font-bold text-red-600 pr-10" : "text-3xl sm:text-4xl font-bold text-green-600 pr-10";
  const arrowClasses = highlight ? "h-6 w-6 md:h-7 md:w-7 text-red-600 transition-transform duration-300 group-hover:translate-x-1" : "h-6 w-6 md:h-7 md:w-7 text-green-600 transition-transform duration-300 group-hover:translate-x-1";

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      <div className="mb-4">
        {highlight && label === "Pending Vendors" ? (
          <Users className="w-12 h-12 md:w-16 md:h-16 text-red-600" />
        ) : (
          <Image src={icon} alt={label} width={64} height={64} className="w-12 h-12 md:w-16 md:h-16" />
        )}
      </div>
      <div>
        <h2 className={numberClasses}>{number}</h2>
        <p className="text-base md:text-lg text-gray-500">{label}</p>
      </div>
      <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
        <ChevronRightIcon className={arrowClasses} />
      </div>
    </div>
  );
});

StatsCard.displayName = "StatsCard";

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
  const [stats, setStats] = useState<DashboardStats>({
    productQuotes: 0, directBuys: 0, rentals: 0, trainingRequests: 0, contactRequests: 0,
  });
  const [vendorStats, setVendorStats] = useState<VendorStats>({
    total_applications: 0, approved_vendors: 0, pending_applications: 0, recent_applications: 0
  });

  // Graph States
  const [count, setCount] = useState<number | null>(null);
  const [rawDailyData, setRawDailyData] = useState<Record<string, number>>({});
  
  // Date Range States
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetch('https://api.mhebazar.in/api/track-whatsapp/?format=json')
      .then((res) => res.json())
      .then((data) => {
        setCount(data.count);
        // 🚀 THE FIX: Removed the fallback math completely. 
        // Now it perfectly matches your API response!
        setRawDailyData(data.daily_counts || {});
      });
  }, []);

  const chartData = useMemo(() => {
    if (!rawDailyData || Object.keys(rawDailyData).length === 0) return [];

    const aggregated: Record<string, number> = {};
    let sortedDates = Object.keys(rawDailyData).sort();

    // Apply Date Range Filters safely
    if (startDate) {
      sortedDates = sortedDates.filter(date => date >= startDate);
    }
    if (endDate) {
      sortedDates = sortedDates.filter(date => date <= endDate);
    }

    sortedDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      // Formats the day exactly like screenshot: "20 Apr"
      const displayKey = `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
      
      aggregated[displayKey] = (aggregated[displayKey] || 0) + rawDailyData[dateStr];
    });

    return Object.entries(aggregated).map(([date, clicks]) => ({ date, clicks }));
  }, [rawDailyData, startDate, endDate]);

  const filteredClicksTotal = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.clicks, 0);
  }, [chartData]);


  // Modal States
  const [selectedVendor, setSelectedVendor] = useState<VendorApplication | null>(null);
  const [isVendorRejectModalOpen, setIsVendorRejectModalOpen] = useState(false);
  const [vendorRejectionReason, setVendorRejectionReason] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);
  const [isProductRejectModalOpen, setIsProductRejectModalOpen] = useState(false);
  const [productRejectionReason, setProductRejectionReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingVendorId, setLoadingVendorId] = useState<number | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isListsLoading, setIsListsLoading] = useState(true);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setIsStatsLoading(true);
    setIsListsLoading(true);

    try {
      const res = await api.get('/admin/summary/');
      const { stats, vendorStats, vendorApps, pendingProducts } = res.data;

      setStats(stats);
      setVendorStats(vendorStats);
      setVendorApps(vendorApps);

      const onlyPending = pendingProducts.filter((p: Product) => !p.is_active);
      const grouped = onlyPending.reduce((acc: GroupedProducts, p: Product) => {
        const vName = p.user_name || 'Unknown Vendor';
        if (!acc[vName]) acc[vName] = [];
        acc[vName].push(p);
        return acc;
      }, {});
      setPendingProducts(grouped);

    } catch (error: any) {
      console.error("Sync Error:", error);
      toast.error(`Sync Failed: ${error.response?.status || error.message}`);
    } finally {
      setIsStatsLoading(false);
      setIsListsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---
  const handleVendorApprove = async (vendorId: number) => {
    setLoadingVendorId(vendorId);
    try {
      await api.post(`/vendor/${vendorId}/approve/`, { action: 'approve' });
      toast.success("Vendor Approved");
      fetchData();
    } catch (error) {
      toast.error("Approval Failed");
    } finally {
      setLoadingVendorId(null);
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
    setIsSubmitting(true);
    try {
      await api.post(`/vendor/${selectedVendor.id}/approve/`, { action: 'reject', reason: vendorRejectionReason });
      toast.success("Vendor Rejected");
      setIsVendorRejectModalOpen(false);
      setVendorRejectionReason("");
      fetchData();
    } catch (error: any) {
      toast.error("Rejection Failed", { description: error.response?.data?.error });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    } catch (error) {
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

  return (
    <>
      <div className="overflow-auto bg-gray-50 p-6 sm:p-8 lg:p-10 min-h-screen">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main content area */}
          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
              <StatsCard icon='/prodQuote.png' number={String(stats.productQuotes)} label="Product Quotes" isLoading={isStatsLoading} link=" https://www.mhebazar.in/admin/forms/quotes" />
              <StatsCard icon='/rentBuy.png' number={String(stats.directBuys)} label="Direct Buys (Orders)" isLoading={isStatsLoading} link=" https://www.mhebazar.in/admin/forms/direct-buy" />
              <StatsCard icon='/Rental.png' number={String(stats.rentals)} label="Rentals" isLoading={isStatsLoading} link=" https://www.mhebazar.in/admin/forms/rentals" />
              <StatsCard icon='/getCAt.png' number={String(stats.trainingRequests)} label="Training Requests" isLoading={isStatsLoading} link=" https://www.mhebazar.in/admin/forms/training-registrations" />
              <StatsCard icon='/specs.png' number={String(stats.contactRequests)} label="Contact Requests" isLoading={isStatsLoading} link=" https://www.mhebazar.in/admin/contact/contact-form" />
              <StatsCard
                isLoading={isStatsLoading}
                icon='' 
                number={String(vendorStats.pending_applications)}
                label="Pending Vendors"
                link=" https://www.mhebazar.in/admin/accounts/registered-vendors"
                highlight={vendorStats.pending_applications > 0} 
              />
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6 w-full mb-6">
              
              {/* Left Side: Total Count Card */}
              <div className="bg-white border border-gray-100 shadow-xl shadow-green-900/5 rounded-3xl p-8 w-full lg:w-1/3 text-center flex flex-col justify-center min-h-[250px]">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Live Analytics
                  </span>
                </div>
                
                <h3 className="text-gray-500 text-sm font-medium mb-1">
                  {startDate || endDate ? 'Clicks in Selected Range' : 'Total WhatsApp Inquiries'}
                </h3>
                
                {/* 🚀 UI FIX: Re-structured this div so the text NEVER overlaps! */}
                <div className="text-6xl font-black text-gray-900 tracking-tighter mb-1 mt-2 flex justify-center">
                  {count !== null ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">
                      {(startDate || endDate) ? filteredClicksTotal.toLocaleString() : count.toLocaleString()}
                    </span>
                  ) : (
                    <div className="h-12 w-24 bg-gray-100 animate-pulse rounded-lg mx-auto"></div>
                  )}
                </div>
                
                {/* Placed OUTSIDE the big text div to prevent squishing */}
                {(startDate || endDate) && count !== null && (
                  <div className="mt-3 text-xs text-gray-500 font-medium bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200 mx-auto w-max shadow-sm">
                    All-time total: {count}
                  </div>
                )}
              </div>

              {/* Right Side: Dynamic Trend Graph */}
              <div className="bg-white border border-gray-100 shadow-xl shadow-green-900/5 rounded-3xl p-6 w-full lg:w-2/3">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="text-gray-700 text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                    <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    WhatsApp
                  </h3>
                  
                  <div className="flex items-center bg-white border border-gray-200 shadow-sm rounded-lg px-2 py-1.5 w-full sm:w-auto">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || undefined} 
                      className="bg-transparent text-xs text-gray-600 outline-none cursor-pointer w-full"
                    />
                    <span className="text-gray-300 text-xs font-medium px-2">-</span>
                    <input 
                      type="date" 
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-xs text-gray-600 outline-none cursor-pointer w-full"
                    />
                    {(startDate || endDate) && (
                      <button 
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="ml-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 p-1 rounded transition-colors"
                        title="Clear Dates"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-48 w-full mt-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12, fill: '#6B7280' }} 
                          tickLine={false} 
                          axisLine={{ stroke: '#E5E7EB', strokeDasharray: '3 3' }} 
                          tickMargin={8}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6B7280' }} 
                          tickLine={false} 
                          axisLine={false} 
                          allowDecimals={false} 
                          tickMargin={8}
                        />
                        <Tooltip 
                          cursor={{ fill: '#F3F4F6', opacity: 0.4 }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar 
                          dataKey="clicks" 
                          fill="#3b82f6" 
                          barSize={6} 
                          radius={[4, 4, 0, 0]} 
                          name="Clicks" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-sm text-gray-400">
                      <p>No clicks tracked in this date range.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <AnalyticsDashboard />
          </div>

          {/* Pending Actions Sidebar */}
          <div className="w-full lg:w-1/3 space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pending Actions</h3>
              {isListsLoading ? <div className='text-center py-10'><Loader2 className='mx-auto h-8 w-8 text-green-600 animate-spin' /> <p className='text-sm text-gray-500 mt-2'>Loading...</p></div> : (vendorApps.length === 0 && totalPendingProducts === 0) ? (
                <div className="text-center py-10 bg-white rounded-lg border shadow-sm">
                  <Check className="mx-auto h-12 w-12 text-green-500" />
                  <h4 className="mt-3 text-lg font-medium">All Caught Up!</h4>
                  <p className="mt-1 text-sm text-gray-500">No pending items.</p>
                </div>
              ) : null}
            </div>

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
                              <Image src={product.images?.[0]?.image || '/no-product.png'} alt={product.name}  width={48} height={48} className="rounded object-cover border w-12 h-12 flex-shrink-0" />
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

      {/* --- MODALS --- */}
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
                        <Image key={index} src={img.image} alt={`${selectedProduct.name}  image ${index + 1}`} width={150} height={150} priority={index < 3} className="rounded-md object-cover border" />
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