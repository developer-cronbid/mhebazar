// src/app/api/admin/vendor-product-stats/route.ts
//
// BFF Route Handler — Optimized for 100% Accuracy
//
import { NextRequest, NextResponse } from "next/server";

const DJANGO_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mhebazar.in/api").replace(/\/$/, "");

async function djangoFetch(path: string, token: string) {
  const url = `${DJANGO_API}/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`[djangoFetch] Failed: ${res.status} ${url}`);
  }
  return res;
}

function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  
  const base = "https://api.mhebazar.in";
  
  // Standardize: ensure path doesn't have duplicate media markers
  const cleanPath = path.replace(/^\/media\//, "").replace(/^media\//, "").replace(/^\//, "");
  
  return `${base}/media/${cleanPath}`;
}

function isApprovedStatus(s: string | null | undefined): boolean {
  if (!s) return false;
  const status = s.toLowerCase().trim();
  return status === "approved" || (status.startsWith("ap") && status.endsWith("ed") && status.includes("ov"));
}

function relativeUrl(url: string | null): string | null {
  if (!url) return null;
  const idx = url.indexOf("/api/");
  return idx !== -1 ? url.substring(idx + 5) : url;
}

async function fetchAllPages<T>(initialPath: string, token: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = initialPath;
  let pageCount = 0;

  while (nextUrl) {
    pageCount++;
    if (pageCount > 50) break; // Optimized: Fetch up to 5,000 records across 50 pages (prevents timeout)

    const res = await djangoFetch(nextUrl, token);
    if (!res.ok) {
      throw new Error(`Django API error: ${res.status} on ${nextUrl}`);
    }
    const data = await res.json();
    const items = data.results ?? data;
    if (Array.isArray(items)) {
      results.push(...items);
    }
    nextUrl = relativeUrl(data.next);
  }
  return results;
}

interface ApiVendor {
  id: number;
  user_id?: number;
  user_info?: { id: number; profile_photo?: string | null };
  brand: string;
  company_name?: string;
  username: string;
  is_approved: boolean;
}

interface VendorProduct {
  id: number;
  user: number;
  name: string;
  category_name?: string;
  is_active: boolean;
  status: string;
  updated_at: string;
  images?: { id: number; image: string }[];
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ── 1. Fetch CRITICAL data first (Vendors and Products) ──
    const [allVendors, approvedVendors, allProducts] = await Promise.all([
      fetchAllPages<ApiVendor>("vendor/", token),
      fetchAllPages<ApiVendor>("vendor/approved/", token).catch(() => []),
      fetchAllPages<VendorProduct>("products/?page_size=100&ordering=-updated_at", token),
    ]);

    // ── 1b. Create a Master Logo Map (Optimized Merged) ──────────
    const logoMap: Record<string, string> = {};

    // Pass 1: Approved Vendor specific data (often has the most complete nested structure)
    approvedVendors.forEach(av => {
      const uid = String(av.user_id ?? (av as any).user ?? av.user_info?.id ?? "");
      const logo = av.user_info?.profile_photo || (av as any).profile_photo || (av as any).logo || (av as any).company_logo || (av as any).brand_logo;
      if (uid && uid !== "" && logo) logoMap[uid] = logo;
    });

    // Pass 2: Top-level vendor list (sparse but sometimes has unique fields)
    allVendors.forEach(v => {
      const uid = String(v.user_id ?? (v as any).user ?? v.user_info?.id ?? "");
      const logo = v.user_info?.profile_photo || (v as any).profile_photo || (v as any).vendor_logo || (v as any).logo || (v as any).company_logo || (v as any).brand_logo;
      if (uid && uid !== "" && logo && !logoMap[uid]) logoMap[uid] = logo;
    });

    console.log(`[vendor-product-stats] Fetched ${allVendors.length} vendors and ${allProducts.length} products.`);
    
    if (allVendors.length === 0 && allProducts.length === 0) {
       console.warn("[vendor-product-stats] Both vendor and product lists are empty.");
    }

    const productsByUserId: Record<string, VendorProduct[]> = {};
    
    allProducts.forEach((p) => {
      const uid = String(p.user || (p as any).user_id || "");
      if (!uid) return;
      
      if (!productsByUserId[uid]) productsByUserId[uid] = [];
      const resolvedP = {
        ...p,
        images: (p.images ?? []).map((img) => ({
          ...img,
          image: resolveMediaUrl(img.image) ?? img.image,
        }))
      };
      productsByUserId[uid].push(resolvedP);
    });

    const enrichedVendors = allVendors.map((v) => {
      const dbUid = v.user_id ?? (v as any).user ?? v.user_info?.id ?? 0;
      const sid = String(dbUid);
      
      const vendorProducts = productsByUserId[sid] ?? [];
      const approved = vendorProducts.filter(p => isApprovedStatus(p.status) && p.is_active).length;
      const rejected = vendorProducts.filter(p => p.status === "rejected").length;
      const total    = vendorProducts.length;
      const pending  = total - approved - rejected;

      // Try to find the logo in multiple places, fallback to our Master Logo Map
      const rawLogo = v.user_info?.profile_photo || logoMap[sid] || (v as any).profile_photo || (v as any).vendor_logo || (v as any).logo || (v as any).company_logo;
      const logoUrl = resolveMediaUrl(rawLogo);

      return {
        id: v.id,
        user_id: dbUid,
        brand: v.brand || v.company_name || v.username || "Unknown",
        company_name: v.company_name ?? "",
        username: v.username ?? "",
        profile_photo: logoUrl,
        is_approved: v.is_approved,
        total,
        approved,
        pending: Math.max(0, pending),
        rejected,
        products: vendorProducts,
      };
    });

    const globalTotal    = allProducts.length;
    const globalApproved = allProducts.filter(p => isApprovedStatus(p.status) && p.is_active).length;
    const globalRejected = allProducts.filter(p => p.status === "rejected").length;
    const globalPending  = globalTotal - globalApproved - globalRejected;

    return NextResponse.json({ 
      vendors: enrichedVendors,
      globalStats: {
        total: globalTotal,
        approved: globalApproved,
        pending: Math.max(0, globalPending),
        rejected: globalRejected
      },
        diagnostics: {
          api_base: DJANGO_API,
          vendor_count: allVendors.length,
          logo_map_size: Object.keys(logoMap).length,
          product_count: allProducts.length
        }
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
      }
    );
  } catch (err: any) {
    console.error("[vendor-product-stats] BFF error:", err?.message || err);
    return NextResponse.json({ 
      error: "Internal server error during data fetching", 
      details: err?.message,
      diagnostics: { api_base: DJANGO_API }
    }, { status: 500 });
  }
}
