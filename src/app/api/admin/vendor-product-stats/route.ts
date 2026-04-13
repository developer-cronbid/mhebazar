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
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
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
    if (pageCount > 50) break;

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
    const [vendors, allProducts] = await Promise.all([
      fetchAllPages<ApiVendor>("vendor/", token),
      fetchAllPages<VendorProduct>("products/?page_size=100&ordering=-updated_at", token),
    ]);

    const productsByUserId: Record<number, VendorProduct[]> = {};
    
    allProducts.forEach((p) => {
      const uid = p.user;
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

    const enrichedVendors = vendors.map((v) => {
      const uid = v.user_id ?? v.user_info?.id ?? 0;
      const vendorProducts = productsByUserId[uid] ?? [];
      const approved = vendorProducts.filter(p => isApprovedStatus(p.status) && p.is_active).length;
      const rejected = vendorProducts.filter(p => p.status === "rejected").length;
      const total    = vendorProducts.length;
      const pending  = total - approved - rejected;

      return {
        id: v.id,
        user_id: uid,
        brand: v.brand || v.company_name || v.username || "Unknown",
        company_name: v.company_name ?? "",
        username: v.username ?? "",
        profile_photo: resolveMediaUrl(v.user_info?.profile_photo),
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
        vendor_count: vendors.length,
        product_count: allProducts.length
      }
    }, {
      status: 200,
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    });
  } catch (err: any) {
    console.error("[vendor-product-stats] BFF error:", err?.message || err);
    return NextResponse.json({ 
      error: "Internal server error during data fetching", 
      details: err?.message,
      diagnostics: { api_base: DJANGO_API }
    }, { status: 500 });
  }
}
