// src/components/admin/VendorProductStatusPanel.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import {
  Loader2,
  PackageCheck,
  PackageX,
  CheckCircle2,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductImage {
  id: number;
  image: string;
}

interface VendorProduct {
  id: number;
  name: string;
  category_name?: string;
  is_active: boolean;
  status: string;
  updated_at: string;
  images?: ProductImage[];
  type?: string | string[];
}

interface ProductsApiResponse {
  count: number;
  not_approved_count: number;
  next: string | null;
  previous: string | null;
  results: VendorProduct[];
}

interface VendorProductStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  vendorUserId: number | string | null;
  vendorName: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return "/no-product.jpg";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
    return imageUrl;
  return `${process.env.NEXT_PUBLIC_API_URL || ""}${imageUrl}`;
};

const isApproved = (product: VendorProduct) =>
  product.is_active && product.status === "approved";

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  label,
  value,
  colorClass,
  bgClass,
  borderClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}) => (
  <div
    className={`flex-1 min-w-0 flex items-center gap-3 px-4 py-3 rounded-xl border ${bgClass} ${borderClass}`}
  >
    <div className={`p-2 rounded-lg ${bgClass}`}>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <div>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

const StatusBadge = ({ product }: { product: VendorProduct }) => {
  const approved = isApproved(product);
  const isPending = !product.is_active && product.status === "pending";

  if (approved) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3 h-3" />
        Approved
      </span>
    );
  }
  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
      <XCircle className="w-3 h-3" />
      Rejected
    </span>
  );
};

// ─── Main Panel Component ─────────────────────────────────────────────────────

export default function VendorProductStatusPanel({
  isOpen,
  onClose,
  vendorUserId,
  vendorName,
}: VendorProductStatusPanelProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [notApprovedCount, setNotApprovedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectProduct, setRejectProduct] = useState<VendorProduct | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const approvedCount = totalCount - notApprovedCount;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Reset on panel open/close ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setProducts([]);
      setTotalCount(0);
      setNotApprovedCount(0);
      setCurrentPage(1);
      setStatusFilter("all");
      setSearchQuery("");
      setDebouncedSearch("");
      setError(null);
    }
  }, [isOpen]);

  // ── Fetch products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!vendorUserId || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        user: vendorUserId.toString(),
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
        ordering: "-updated_at",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await api.get<ProductsApiResponse>(
        `products/?${params.toString()}`
      );

      const data = res.data;
      setProducts(data.results ?? []);
      setTotalCount(data.count ?? 0);
      setNotApprovedCount(data.not_approved_count ?? 0);
    } catch (err) {
      console.error("Failed to fetch vendor products:", err);
      setError("Could not load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [vendorUserId, isOpen, currentPage, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleApprove = async (product: VendorProduct) => {
    setActionLoading(product.id);
    try {
      await api.post(`products/${product.id}/approve/`);
      toast.success(`"${product.name}" approved successfully.`);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: true, status: "approved" } : p
        )
      );
      setNotApprovedCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error(`Failed to approve "${product.name}".`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReject = (product: VendorProduct) => {
    setRejectProduct(product);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectProduct || !rejectReason.trim()) return;
    setActionLoading(rejectProduct.id);
    try {
      await api.post(`products/${rejectProduct.id}/reject/`, {
        reason: rejectReason,
      });
      toast.success(`"${rejectProduct.name}" rejected.`);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === rejectProduct.id
            ? { ...p, is_active: false, status: "rejected" }
            : p
        )
      );
      setNotApprovedCount((prev) => prev + 1);
      setRejectModalOpen(false);
      setRejectProduct(null);
      setRejectReason("");
    } catch {
      toast.error(`Failed to reject "${rejectProduct.name}".`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filtered view list ─────────────────────────────────────────────────────
  // Note: status filter is client-side on the current page results
  const displayedProducts =
    statusFilter === "all"
      ? products
      : statusFilter === "approved"
      ? products.filter(isApproved)
      : products.filter((p) => !isApproved(p));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Main Slide-over Sheet ── */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl xl:max-w-3xl p-0 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 bg-gradient-to-r from-[#5CA131] to-[#4a8f28] text-white shrink-0">
            <SheetTitle className="text-white text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5" />
              {vendorName}&apos;s Products
            </SheetTitle>
            <SheetDescription className="text-white/80 text-xs">
              Manage and review product approval status for this vendor.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* ── Stats Banner ── */}
            <div className="px-6 pt-5 pb-4">
              {loading && products.length === 0 ? (
                <div className="flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-16 bg-gray-100 animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <StatCard
                    icon={Package}
                    label="Total Products"
                    value={totalCount}
                    colorClass="text-slate-700"
                    bgClass="bg-slate-50"
                    borderClass="border-slate-200"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Approved"
                    value={approvedCount}
                    colorClass="text-green-700"
                    bgClass="bg-green-50"
                    borderClass="border-green-200"
                  />
                  <StatCard
                    icon={Clock}
                    label="Pending / Rejected"
                    value={notApprovedCount}
                    colorClass="text-amber-700"
                    bgClass="bg-amber-50"
                    borderClass="border-amber-200"
                  />
                </div>
              )}
            </div>

            {/* ── Filters ── */}
            <div className="px-6 pb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Status filter tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1 shrink-0">
                {(["all", "approved", "pending"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 capitalize ${
                      statusFilter === f
                        ? f === "approved"
                          ? "bg-green-600 text-white shadow"
                          : f === "pending"
                          ? "bg-amber-500 text-white shadow"
                          : "bg-[#5CA131] text-white shadow"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f === "all" ? "All" : f === "approved" ? "✅ Approved" : "⏳ Pending"}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#5CA131] focus-within:ring-1 focus-within:ring-[#5CA131] bg-white">
                <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            {/* ── Product List ── */}
            <div className="px-6 pb-6">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-[#5CA131]" />
                  <span className="ml-2 text-sm text-gray-500">Loading products…</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Package className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No products found</p>
                  <p className="text-xs mt-1">
                    {statusFilter !== "all"
                      ? `No ${statusFilter} products on this page.`
                      : "This vendor has no products yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedProducts.map((product) => {
                    const approved = isApproved(product);
                    const isActioning = actionLoading === product.id;
                    const thumb = product.images?.[0]?.image;
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${
                          approved
                            ? "bg-white border-gray-200 hover:border-green-300 hover:shadow-sm"
                            : "bg-amber-50/50 border-amber-200 hover:border-amber-300 hover:shadow-sm"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-white">
                          <Image
                            src={getImageUrl(thumb)}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                            sizes="56px"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/no-product.jpg";
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center flex-wrap gap-1.5 mt-1">
                            {product.category_name && (
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                {product.category_name}
                              </span>
                            )}
                            <StatusBadge product={product} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Updated {new Date(product.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {!approved && (
                            <Button
                              size="sm"
                              disabled={isActioning}
                              onClick={() => handleApprove(product)}
                              className="h-7 px-2 text-xs bg-[#5CA131] hover:bg-green-700 text-white"
                            >
                              {isActioning ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <PackageCheck className="w-3 h-3 mr-1" />
                              )}
                              Approve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActioning}
                            onClick={() => handleOpenReject(product)}
                            className="h-7 px-2 text-xs text-red-600 border-red-400 hover:bg-red-50"
                          >
                            {isActioning && !rejectModalOpen ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <PackageX className="w-3 h-3 mr-1" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Pagination ── */}
              {!loading && !error && totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages} &middot; {totalCount} products
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-700 font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Rejection Reason Modal ── */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <PackageX className="w-5 h-5" />
              Reject Product
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting{" "}
              <span className="font-semibold text-gray-800">
                &ldquo;{rejectProduct?.name}&rdquo;
              </span>
              . This will be sent to the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Type rejection reason here..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] resize-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectProduct(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || actionLoading !== null}
              onClick={handleRejectSubmit}
            >
              {actionLoading !== null ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
