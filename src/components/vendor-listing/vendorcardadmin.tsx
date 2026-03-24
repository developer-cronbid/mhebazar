// src/components/VendorCard.tsx
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// --- Types ---
type Vendor = {
  id: number;
  user_id?: number; // Made optional just in case it's missing from API
  username: string;
  email: string;
  full_name: string;
  company_name: string;
  company_email: string;
  company_phone?: string;
  brand: string;
  is_approved: boolean;
  application_date: string;
  product_count?: number;
  user_info?: {
    id: number;
    profile_photo: string;
  };
};

type DetailedVendor = Vendor & {
  company_address?: string;
  pcode?: string;
  gst_no?: string;
};

// New type for the fetched associated user details
type VendorUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_joined: string;
  is_active: boolean;
  description?: string;
  profile_photo?: string | null;
  user_banner?: { id: number; image: string }[];
};

type UserProfile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

type Props = {
  vendor: Vendor;
};

const createSlug = (name: string): string => {
  if (!name) return "";
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

export default function VendorCard({ vendor }: Props) {
  const [isAdminPath, setIsAdminPath] = useState(false);
  const router = useRouter();

  // --- Modal States ---
  const [modalStep, setModalStep] = useState<"loading" | "login_required" | "form" | "contact_info" | "details">("loading");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // States for View Details (Admin)
  const [vendorDetails, setVendorDetails] = useState<DetailedVendor | null>(null); 
  const [vendorUserDetails, setVendorUserDetails] = useState<VendorUser | null>(null);
  const [modalProductCount, setModalProductCount] = useState<number>(0);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setIsAdminPath(window.location.pathname.startsWith("/admin/"));
  }, []);

  // Resolve media URL (handles full urls, absolute paths and relative paths)
  const resolveProfileSrc = (path?: string | null) => {
    if (!path) return "/default-profile.png";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return `https://api.mhebazar.in${path}`;
    return `https://api.mhebazar.in/${path}`;
  };

  const vendorSlug = createSlug(vendor.brand);
  const href = isAdminPath
    ? `/admin/accounts/registered-vendors/${vendorSlug}/?user=${vendor?.user_info?.id}`
    : `/vendor-listing/${vendorSlug}`;
    
  const trackVendorClick = async () => {
    try {
      await api.post("/track-vendor-click/", {
        vendor_id: vendor.id,
      });
    } catch (error) {
      console.error("Tracking failed:", error);
    }
  };

  // --- View Details (Admin) ---
  const handleViewDetailsClick = async () => {
    setIsModalOpen(true);
    setModalStep("loading");
    setError("");
    setModalProductCount(0);

    // Track click in background
    api.post("/track-vendor-click/", { vendor_id: vendor.id, admin_view: true }).catch(() => {});

    try {
      const targetUserId = vendor.user_id || vendor.user_info?.id;

      if (!targetUserId) {
        throw new Error("User ID is missing from the vendor object.");
      }

      const [vendorRes, userRes] = await Promise.all([
        api.get(`/vendor/${vendor.id}/`),
        api.get(`/users/${targetUserId}/`) 
      ]);

      setVendorDetails(vendorRes.data);
      setVendorUserDetails(userRes.data);

      // Fetch real product count
      try {
        const prodResp = await api.get(`/products/?user=${targetUserId}&page=1`);
        setModalProductCount(prodResp.data?.count ?? 0);
      } catch {
        setModalProductCount(vendor.product_count ?? 0);
      }

      setModalStep("details");
    } catch (err: any) {
      console.error("Failed to fetch details:", err);
      setError(err.message === "User ID is missing from the vendor object." 
        ? err.message 
        : "Unable to load complete vendor and user details. Please try again.");
    }
  };

  // --- 1. HANDLE CONTACT CLICK ---
  const handleContactClick = async () => {
    setIsModalOpen(true);
    setModalStep("loading");
    setError("");

    try {
      const res = await api.get("/users/me/");
      const userData: UserProfile = res.data;

      setCurrentUser(userData);

      const isMissingInfo = !userData.first_name || !userData.phone || !userData.email;

      if (isMissingInfo) {
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          phone: userData.phone || "",
        });
        setModalStep("form");
      } else {
        setModalStep("contact_info");
        trackVendorClick();
      }

    } catch (error: any) {
      if (error.response?.status === 401) {
        setModalStep("login_required");
        return;
      }
      console.error("Profile fetch error:", error);
      setError(error.response?.data?.detail || "Unable to load profile. Please try again.");
    }
  };

  // --- 2. HANDLE FORM SUBMIT ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const res = await api.patch(`/users/${currentUser.id}/`, formData);

      if (res.status >= 200 && res.status < 300) {
        setModalStep("contact_info");
        trackVendorClick();
      }

    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        setModalStep("login_required");
        return;
      }
      const errData = error.response?.data;
      if (errData) {
        setError(JSON.stringify(errData.detail || errData));
      } else {
        setError("Failed to update profile. Please try again.");
      }
    }
  };

  const getModalTitle = () => {
    switch (modalStep) {
      case "contact_info": return "Vendor Contact Details";
      case "details": return "Vendor Profile & User Info";
      case "login_required": return "Login Required";
      case "form": return "Complete Your Profile";
      default: return "Please Wait";
    }
  };

  return (
    <>
      <div className="relative border border-gray-200 rounded-2xl p-4 flex flex-col items-center shadow-sm hover:shadow-lg transition-all duration-200 bg-white w-full h-full font-inter">
        {vendor.product_count !== undefined && (
          <span className="absolute top-4 right-4 bg-green-500/20 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {vendor.product_count} items
          </span>
        )}

        <div className="relative w-28 h-28 my-4 rounded-xl flex items-center justify-center overflow-hidden">
          <Image
            src={resolveProfileSrc(vendor.user_info?.profile_photo ?? null)}
            alt={`${vendor.brand} Logo`}
            width={112}
            height={112}
            className="object-contain"
          />
        </div>

        <h3 className="text-lg font-semibold text-center text-gray-900 mb-1">
          {vendor.brand}
        </h3>

        <p className="text-sm text-gray-500 text-center mb-4 line-clamp-1">
          {vendor.company_name}
        </p>

        <div className="flex flex-col sm:flex-row gap-2 w-full mt-auto">
          <Link href={href} className="flex-1">
            <Button className="w-full text-sm font-medium py-2 rounded-lg bg-[#5CA131] hover:bg-[#4a8f28] text-white transition-colors duration-150 cursor-pointer">
              View Product
            </Button>
          </Link>

          <Button onClick={handleViewDetailsClick} variant="outline" className="flex-1 text-sm font-medium py-2 rounded-lg border border-[#5CA131] text-[#5CA131] hover:bg-[#f2fbf2] transition-colors duration-150">
            View Details
          </Button>
        </div>
      </div>

      {/* --- POPUP MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">

            <div className="bg-[#5CA131] p-4 flex justify-between items-center shrink-0">
              <h3 className="text-white font-semibold text-lg">
                {getModalTitle()}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Cover banner: use user_banner from fetched user profile (same source as vendor page) */}
            <div className="w-full h-40 sm:h-48 bg-gray-100 relative">
              {(() => {
                const banners = vendorUserDetails?.user_banner ?? [];
                const coverSrc = banners.length > 0
                  ? resolveProfileSrc(banners[0].image)
                  : null;
                return coverSrc ? (
                  <Image src={coverSrc} alt={`${vendorDetails?.brand || vendor.brand} Cover`} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#5CA131]/20 to-[#5CA131]/5">
                    <span className="text-[#5CA131]/40 text-sm">No cover image</span>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 overflow-y-auto">
              {modalStep === "loading" && !error && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5CA131]"></div>
                </div>
              )}

              {error && (
                <div className="text-center py-4">
                  <p className="text-red-500 mb-4 text-sm">{error}</p>
                  <Button onClick={() => setIsModalOpen(false)} variant="outline">
                    Close
                  </Button>
                </div>
              )}

              {/* View Details Flow (Table Format) */}
              {modalStep === "details" && vendorDetails && vendorUserDetails && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-lg overflow-hidden mb-2">
                      <Image src={resolveProfileSrc(vendor.user_info?.profile_photo ?? null)} alt={`${vendorDetails.brand} Logo`} width={80} height={80} className="object-contain" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">{vendorDetails.brand}</h4>
                    <span className={`mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${vendorDetails.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {vendorDetails.is_approved ? 'Approved Vendor' : 'Pending Approval'}
                    </span>
                  </div>

                  {/* USER DETAILS TABLE */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1">User Information</h5>
                    <table className="w-full text-sm text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Name</th>
                          <td className="py-2 text-gray-800">{vendorUserDetails.first_name} {vendorUserDetails.last_name}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Username</th>
                          <td className="py-2 text-gray-800">{vendorUserDetails.username}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Email</th>
                          <td className="py-2 text-gray-800 break-all">{vendorUserDetails.email}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Phone</th>
                          <td className="py-2 text-gray-800">{vendorUserDetails.phone || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Status</th>
                          <td className="py-2 text-gray-800">{vendorUserDetails.is_active ? 'Active' : 'Inactive'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* USER DESCRIPTION */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1"> Description</h5>
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-100 text-sm text-gray-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {vendorUserDetails.description ? (
                        <p className="leading-relaxed">{vendorUserDetails.description}</p>
                      ) : (
                        <p className="text-gray-400">No description provided.</p>
                      )}
                    </div>
                  </div>

                  {/* VENDOR DETAILS TABLE */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1">Vendor Information</h5>
                    <table className="w-full text-sm text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Company</th>
                          <td className="py-2 text-gray-800">{vendorDetails.company_name}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Comp. Email</th>
                          <td className="py-2 text-gray-800 break-all">{vendorDetails.company_email}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Comp. Phone</th>
                          <td className="py-2 text-gray-800">
                            {vendorDetails.company_phone ? (
                              <a href={`tel:${vendorDetails.company_phone}`} className="text-[#5CA131] hover:underline">{vendorDetails.company_phone}</a>
                            ) : 'N/A'}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">GST No.</th>
                          <td className="py-2 text-gray-800">{vendorDetails.gst_no || 'N/A'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Products</th>
                          <td className="py-2 text-gray-800">{modalProductCount} items listed</td>
                        </tr>
                        <tr>
                          <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Address</th>
                          <td className="py-2 text-gray-800">
                            {vendorDetails.company_address || 'N/A'} 
                            {vendorDetails.pcode && ` (Pin: ${vendorDetails.pcode})`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Close</Button>
                    <Link href={href} className="flex-1">
                      <Button className="w-full bg-[#5CA131] hover:bg-[#4a8f28] text-white">Open Page</Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Login Required Flow */}
              {modalStep === "login_required" && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">You must be logged in to view vendor contact details.</p>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                    <Button className="flex-1 bg-[#5CA131] hover:bg-[#4a8f28] text-white" onClick={() => router.push("/login")}>Log In</Button>
                  </div>
                </div>
              )}

              {/* Profile Completion Form Flow */}
              {modalStep === "form" && (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">To view the vendor's phone number, please complete your contact information.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">First Name</label>
                      <input required type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5CA131]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Last Name</label>
                      <input type="text" placeholder="optional" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5CA131]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Email</label>
                    <input required type="email" value={formData.email} readOnly className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Phone Number</label>
                    <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter your phone number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5CA131]" />
                  </div>
                  <Button type="submit" className="w-full bg-[#5CA131] hover:bg-[#4a8f28] text-white mt-2">Save & View Contact</Button>
                </form>
              )}

              {/* Vendor Contact Flow */}
              {modalStep === "contact_info" && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-[#5CA131]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">You are contacting</p>
                    <h4 className="text-xl font-bold text-gray-900">{vendor.company_name}</h4>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                    {vendor.company_phone ? (
                      <a href={`tel:${vendor.company_phone}`} className="text-2xl font-bold text-[#5CA131] tracking-wider hover:text-[#4a8f28] hover:underline transition-colors cursor-pointer block">
                        {vendor.company_phone}
                      </a>
                    ) : (
                      <p className="text-2xl font-bold text-gray-400 tracking-wider">No number available</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">We have shared your contact details with the vendor.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}