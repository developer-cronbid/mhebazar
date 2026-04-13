// src/components/admin/VendorProductsTab.tsx
// Client component – receives ONE pre-aggregated payload from our BFF route.
// No N+1 sequential fetching. All vendor + product data arrives in one request.
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  CheckCircle2, Clock, Package, Search, Loader2, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink, XCircle,
  PackageCheck, PackageX, ShieldCheck, ShieldX,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductImage { id: number; image: string }

interface VendorProduct {
  id: number;
  name: string;
  category_name?: string;
  is_active: boolean;
  status: string;
  updated_at: string;
  images?: ProductImage[];
}

interface VendorRow {
  id: number;
  user_id: number;
  brand: string;
  company_name: string;
  username: string;
  slug: string;
  profile_photo: string | null;
  is_approved: boolean;
  products: VendorProduct[];
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  expanded: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const createSlug = (name: string) =>
  (name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// Handles spelling mistakes in 'approved' status from the database
const isApprovedStatus = (s: string | null | undefined): boolean => {
  if (!s) return false;
  const status = s.toLowerCase().trim();
  // Match 'approved' or common typos like 'appproved', 'aproved'
  return status === "approved" || (status.startsWith("ap") && status.endsWith("ed") && status.includes("ov"));
};

// URLs are already resolved to absolute by the BFF route handler.
// These helpers are kept only as safe fallbacks.
const resolveImageSrc = (path?: string | null): string => {
  if (!path) return "/default-profile.png";
  if (path.startsWith("http")) return path;
  
  const base = "https://api.mhebazar.in";
  // Standardize: ensure path doesn't have duplicate media markers
  const cleanPath = path.replace(/^\/media\//, "").replace(/^media\//, "").replace(/^\//, "");
  
  return `${base}/media/${cleanPath}`;
};

const getProductImageUrl = (img?: string): string => {
  if (!img) return "/no-product.jpg";
  if (img.startsWith("http")) return img;

  const base = "https://api.mhebazar.in";
  // Standardize: ensure path doesn't have duplicate media markers
  const cleanPath = img.replace(/^\/media\//, "").replace(/^media\//, "").replace(/^\//, "");

  return `${base}/media/${cleanPath}`;
};

const isProductApproved = (p: VendorProduct) =>
  p.is_active && isApprovedStatus(p.status);

// ─── Small static sub-components (memoised) ───────────────────────────────────

const VendorStatusBadge = React.memo(({ isApproved }: { isApproved: boolean }) =>
  isApproved ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white shadow-sm">
      <ShieldCheck className="w-3 h-3" /> Approved
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-400 text-white shadow-sm">
      <ShieldX className="w-3 h-3" /> Pending
    </span>
  )
);
VendorStatusBadge.displayName = "VendorStatusBadge";

const ProductStatusBadge = React.memo(({ product }: { product: VendorProduct }) => {
  if (isApprovedStatus(product.status))
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  if (product.status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
});
ProductStatusBadge.displayName = "ProductStatusBadge";

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="mt-3 h-1.5 bg-gray-200 rounded-full" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface Stats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function VendorProductsTab() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [globalStats, setGlobalStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState<"all" | "approved" | "pending">("all");

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectProduct, setRejectProduct] = useState<VendorProduct | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // AbortController ref so we can cancel in-flight fetches
  const abortRef = useRef<AbortController | null>(null);

  // ── Debounce search (400 ms) ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Single-request data fetch via BFF route ──────────────────────────────────
  const fetchData = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/vendor-product-stats", {
        signal: abortRef.current.signal,
        credentials: "include",   // forwards access_token cookie to the route handler
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json: { 
        vendors: Omit<VendorRow, "slug" | "expanded">[];
        globalStats?: Stats;
      } = await res.json();

      const rows: VendorRow[] = (json.vendors ?? []).map((v) => ({
        ...v,
        rejected: v.rejected ?? 0,
        slug: createSlug(v.brand),
        expanded: false,
      }));

      setVendors(rows);
      if (json.globalStats) {
        setGlobalStats(json.globalStats);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return; // cancelled
      console.error("[VendorProductsTab] fetch error:", err);
      setError("Could not load vendor data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort(); // cleanup on unmount / tab switch
  }, [fetchData]);

  // ── Toggle expand ────────────────────────────────────────────────────────────
  const toggleExpand = useCallback((vendorId: number) =>
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, expanded: !v.expanded } : v))
    ), []);

  // ── Approve product ──────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (vendorId: number, product: VendorProduct) => {
    setActionLoading(product.id);
    try {
      await api.post(`products/${product.id}/approve/`);
      toast.success(`"${product.name}" approved.`);
      setVendors((prev) =>
        prev.map((v) => {
          if (v.id !== vendorId) return v;
          const updated = v.products.map((p) =>
            p.id === product.id ? { ...p, is_active: true, status: "approved" } : p
          );
          const approvedCount = updated.filter(isProductApproved).length;
          return { ...v, products: updated, approved: approvedCount, pending: updated.length - approvedCount };
        })
      );
    } catch {
      toast.error(`Failed to approve "${product.name}".`);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // ── Reject product ───────────────────────────────────────────────────────────
  const openReject = useCallback((product: VendorProduct) => {
    setRejectProduct(product);
    setRejectReason("");
    setRejectModalOpen(true);
  }, []);

  const handleRejectSubmit = useCallback(async () => {
    if (!rejectProduct || !rejectReason.trim()) return;
    setActionLoading(rejectProduct.id);
    try {
      await api.post(`products/${rejectProduct.id}/reject/`, { reason: rejectReason });
      toast.success(`"${rejectProduct.name}" rejected.`);
      const pid = rejectProduct.id;
      setVendors((prev) =>
        prev.map((v) => {
          const updated = v.products.map((p) =>
            p.id === pid ? { ...p, is_active: false, status: "rejected" } : p
          );
          const approvedCount = updated.filter(isProductApproved).length;
          return { ...v, products: updated, approved: approvedCount, pending: updated.length - approvedCount };
        })
      );
      setRejectModalOpen(false);
      setRejectProduct(null);
      setRejectReason("");
    } catch {
      toast.error(`Failed to reject "${rejectProduct.name}".`);
    } finally {
      setActionLoading(null);
    }
  }, [rejectProduct, rejectReason]);

  // ── Filtered + memoised list ─────────────────────────────────────────────────
  const filteredVendors = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return vendors.filter((v) => {
      const matchSearch =
        !q ||
        (v.brand ?? "").toLowerCase().includes(q) ||
        (v.company_name ?? "").toLowerCase().includes(q) ||
        (v.username ?? "").toLowerCase().includes(q);

      const matchFilter =
        vendorFilter === "all" ||
        (vendorFilter === "approved" && v.is_approved) ||
        (vendorFilter === "pending" && !v.is_approved);

      return matchSearch && matchFilter;
    });
  }, [vendors, debouncedSearch, vendorFilter]);

  // ── Stats (memoised) ─────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalVendors:          vendors.length,
    approvedVendors:       vendors.filter((v) => v.is_approved).length,
    pendingVendors:        vendors.filter((v) => !v.is_approved).length,
    // Use server-provided globalStats as ground truth, fall back to sum if missing
    totalProducts:         globalStats?.total    ?? vendors.reduce((s, v) => s + v.total, 0),
    approvedProducts:      globalStats?.approved ?? vendors.reduce((s, v) => s + v.approved, 0),
    pendingProducts:       globalStats?.pending  ?? vendors.reduce((s, v) => s + v.pending, 0),
    rejectedProducts:      globalStats?.rejected ?? vendors.reduce((s, v) => s + (v.rejected ?? 0), 0),
  }), [vendors, globalStats]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── 7-col summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { label: "All Vendors",     value: stats.totalVendors,     color: "text-slate-700",   bg: "bg-slate-50   border-slate-200",  icon: Package },
          { label: "Approved",        value: stats.approvedVendors,  color: "text-emerald-700", bg: "bg-emerald-50  border-emerald-200", icon: ShieldCheck },
          { label: "Pending",         value: stats.pendingVendors,   color: "text-amber-700",   bg: "bg-amber-50   border-amber-200",   icon: ShieldX },
          { label: "Total Products",  value: stats.totalProducts,    color: "text-indigo-700",  bg: "bg-indigo-50  border-indigo-200",  icon: Package },
          { label: "✅ Approved",      value: stats.approvedProducts, color: "text-green-700",   bg: "bg-green-50   border-green-200",   icon: CheckCircle2 },
          { label: "⏳ Pending",       value: stats.pendingProducts,  color: "text-orange-700",  bg: "bg-orange-50  border-orange-200",  icon: Clock },
          { label: "❌ Rejected",      value: stats.rejectedProducts, color: "text-red-700",     bg: "bg-red-50     border-red-200",     icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`flex items-center gap-3 p-3.5 rounded-xl border ${bg}`}>
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className={`text-xl font-extrabold leading-none ${color}`}>
                {loading
                  ? <span className="inline-block w-8 h-5 bg-gray-200 animate-pulse rounded" />
                  : value}
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-[#5CA131] focus-within:ring-1 focus-within:ring-[#5CA131]">
          <Search className="w-4 h-4 text-gray-400 ml-4 shrink-0" />
          <input
            type="text"
            placeholder="Search by vendor name, brand or username…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2.5 text-sm text-gray-700 outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
          {(["all", "approved", "pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setVendorFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                vendorFilter === f
                  ? f === "approved" ? "bg-emerald-500 text-white shadow"
                  : f === "pending"  ? "bg-amber-400 text-white shadow"
                  :                    "bg-[#5CA131] text-white shadow"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f === "approved" ? "✅ Approved" : "⏳ Pending"}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchData}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
          <button onClick={fetchData} className="ml-auto text-xs font-semibold underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && filteredVendors.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No vendors match your search or filter.</p>
        </div>
      )}

      {/* ── Vendor cards ── */}
      {!loading && (
        <div className="space-y-4">
          {filteredVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              actionLoading={actionLoading}
              onToggleExpand={toggleExpand}
              onApprove={handleApprove}
              onReject={openReject}
            />
          ))}
        </div>
      )}

      {/* ── Reject modal ── */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <PackageX className="w-5 h-5" /> Reject Product
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting{" "}
              <span className="font-semibold text-gray-800">&ldquo;{rejectProduct?.name}&rdquo;</span>.
              This will be sent to the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Type rejection reason here…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectModalOpen(false); setRejectProduct(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || actionLoading !== null}
              onClick={handleRejectSubmit}
            >
              {actionLoading !== null && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── VendorCard – extracted to avoid re-render of the full list ────────────────

const VendorCard = React.memo(function VendorCard({
  vendor,
  actionLoading,
  onToggleExpand,
  onApprove,
  onReject,
}: {
  vendor: VendorRow;
  actionLoading: number | null;
  onToggleExpand: (id: number) => void;
  onApprove: (vendorId: number, product: VendorProduct) => void;
  onReject: (product: VendorProduct) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">

        {/* Logo + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 shadow-sm">
            <Image
              src={resolveImageSrc(vendor.profile_photo)}
              alt={`${vendor.brand} logo`}
              fill
              className="object-contain p-0.5"
              sizes="44px"
              onError={(e) => { (e.target as HTMLImageElement).src = "/default-profile.png"; }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{vendor.brand}</p>
              <VendorStatusBadge isApproved={vendor.is_approved} />
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {vendor.company_name || vendor.username}
            </p>
          </div>
        </div>

        {/* Product stat pills */}
        <div className="flex items-center flex-wrap gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Package className="w-3 h-3" /> {vendor.total}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" /> {vendor.approved} approved
          </span>
          {vendor.pending > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" /> {vendor.pending} pending
            </span>
          )}
          {(vendor.rejected ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              <XCircle className="w-3 h-3" /> {vendor.rejected} rejected
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/admin/accounts/registered-vendors/${vendor.slug}/?user=${vendor.user_id}`} target="_blank">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Page</span>
            </button>
          </Link>
          {vendor.total > 0 && (
            <button
              onClick={() => onToggleExpand(vendor.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                vendor.expanded ? "bg-gray-100 border-gray-300 text-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {vendor.expanded
                ? <><ChevronUp className="w-3.5 h-3.5" /><span className="hidden sm:inline">Collapse</span></>
                : <><ChevronDown className="w-3.5 h-3.5" /><span className="hidden sm:inline">Products</span></>}
            </button>
          )}
        </div>
      </div>

      {/* 3-segment progress bar: green=approved, amber=pending, red=rejected */}
      {vendor.total > 0 && (
        <div className="px-4 sm:px-5 pb-3">
          <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-100">
            <div
              className="bg-emerald-400 transition-all duration-700"
              style={{ width: `${(vendor.approved / vendor.total) * 100}%` }}
            />
            <div
              className="bg-amber-400 transition-all duration-700"
              style={{ width: `${(vendor.pending / vendor.total) * 100}%` }}
            />
            <div
              className="bg-red-400 transition-all duration-700"
              style={{ width: `${((vendor.rejected ?? 0) / vendor.total) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span className="flex gap-2">
              <span className="text-emerald-600">{vendor.approved} approved</span>
              {vendor.pending > 0 && <span className="text-amber-600">{vendor.pending} pending</span>}
              {(vendor.rejected ?? 0) > 0 && <span className="text-red-500">{vendor.rejected} rejected</span>}
            </span>
            <span>{vendor.total} total</span>
          </div>
        </div>
      )}

      {/* Expanded product list */}
      {vendor.expanded && vendor.products.length > 0 && (
        <div className="border-t border-gray-100">
          {/* Desktop table header */}
          <div className="hidden lg:grid grid-cols-[48px_2.5fr_1fr_130px_180px] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span />
            <span>Product</span>
            <span>Category</span>
            <span className="text-center">Status</span>
            <span className="text-center">Actions</span>
          </div>

          <div className="divide-y divide-gray-100/80">
            {vendor.products.map((product) => {
              const approved   = isProductApproved(product);
              const isRejected = product.status === "rejected";
              const isActioning = actionLoading === product.id;
              const thumb = product.images?.[0]?.image;
              return (
                <div
                  key={product.id}
                  className={`grid grid-cols-1 lg:grid-cols-[48px_2.5fr_1fr_130px_180px] gap-3 lg:gap-4 items-center px-4 sm:px-5 py-3 transition-colors ${
                    approved
                      ? "hover:bg-gray-50"
                      : isRejected
                      ? "bg-red-50/30 hover:bg-red-50/60"
                      : "bg-amber-50/30 hover:bg-amber-50/60"
                  }`}
                >
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                    <Image
                      src={getProductImageUrl(thumb)}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                      sizes="44px"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/no-product.jpg"; }}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(product.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {/* Mobile: category + status inline */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 lg:hidden">
                      {product.category_name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          {product.category_name}
                        </span>
                      )}
                      <ProductStatusBadge product={product} />
                    </div>
                  </div>

                  <div className="hidden lg:block">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      {product.category_name || "—"}
                    </span>
                  </div>

                  <div className="hidden lg:flex justify-center">
                    <ProductStatusBadge product={product} />
                  </div>

                  <div className="flex items-center gap-2 lg:justify-center">
                    {/* Show Approve for pending and rejected products */}
                    {!approved && (
                      <Button
                        size="sm"
                        disabled={isActioning}
                        onClick={() => onApprove(vendor.id, product)}
                        className="h-7 px-2.5 text-xs bg-[#5CA131] hover:bg-[#4a8f28] text-white"
                      >
                        {isActioning ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <PackageCheck className="w-3 h-3 mr-1" />}
                        Approve
                      </Button>
                    )}
                    {/* Show Reject only if not already rejected */}
                    {!isRejected && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActioning}
                        onClick={() => onReject(product)}
                        className="h-7 px-2.5 text-xs text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <PackageX className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {vendor.expanded && vendor.products.length === 0 && (
        <div className="border-t border-gray-100 px-5 py-8 text-center text-gray-400 bg-gray-50">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No products listed for this vendor yet.</p>
        </div>
      )}
    </div>
  );
});
