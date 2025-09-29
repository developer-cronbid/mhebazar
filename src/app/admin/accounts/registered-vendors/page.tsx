// page.tsx (Final version with Network Error fix)
"use client";

import { useState, useEffect, useCallback } from "react";
import VendorCard from "@/components/vendor-listing/VendorCard";
import AllVendorsTable, { AllVendor } from "@/components/vendor-listing/AllVendorsTable";
import api from "@/lib/api";
import { Loader2, AlertTriangle, Search, ChevronLeft, ChevronRight } from "lucide-react";

// Define the Vendor type to be compatible with both API structures.
type Vendor = AllVendor & {
  product_count?: number;
  user_info?: {
    id: number;
    profile_photo: string;
  };
};

// Interface for API response structure
interface VendorListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vendor[];
}

// Global lists to store all fetched vendors for client-side operations
let allApprovedVendors: Vendor[] = [];
let allApplications: Vendor[] = [];

export default function VendorsPage() {
  const PAGE_SIZE = 10;
  
  const [activeTab, setActiveTab] = useState<"approved" | "all">("approved");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-Side Filtering/Pagination State
  const [displayedVendors, setDisplayedVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0); 


  // --- Client-Side Filter/Pagination Logic ---
  
  const calculateClientFiltering = useCallback(() => {
    // FIX: Ensure we select the list that corresponds to the active tab
    const sourceList = activeTab === "approved" ? allApprovedVendors : allApplications;
    
    // 1. Filtering
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    const filtered = lowerCaseSearch
      ? sourceList.filter(vendor => 
          vendor.brand?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.company_name?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.email?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.full_name?.toLowerCase().includes(lowerCaseSearch)
        )
      : sourceList;

    // 2. Pagination
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    return { paginated, filteredCount: filtered.length };

  }, [activeTab, searchTerm, currentPage]);

  
  useEffect(() => {
    const { paginated, filteredCount } = calculateClientFiltering();
    setDisplayedVendors(paginated);
    setTotalFilteredCount(filteredCount);
  }, [calculateClientFiltering]);

  // --- Data Fetching (Fetch ALL pages for client-side search) ---

  const fetchData = useCallback(async (tab: "approved" | "all") => {
    setLoading(true);
    setError(null);
    const isApprovedTab = tab === "approved";
    let accumulatedVendors: Vendor[] = [];

    // Skip API call if data is already fetched
    if (isApprovedTab && allApprovedVendors.length > 0) {
      setLoading(false);
      return; 
    } else if (!isApprovedTab && allApplications.length > 0) {
      setLoading(false);
      return;
    }

    try {
      // Start with the initial URL.
      let nextUrl: string | null = isApprovedTab ? "/vendor/approved/?page_size=20" : "/vendor/?page_size=20"; 
      
      while (nextUrl) {
          
          let fetchPath: string;
          
          // FIX: If URL is absolute (from API's 'next' field), extract only the path and query.
          // This avoids the CORS/Network Error by preventing Axios from sending a cross-protocol request.
          if (nextUrl.startsWith('http')) {
             const urlObject = new URL(nextUrl);
             fetchPath = urlObject.pathname + urlObject.search; // e.g., /api/vendor/?page=2&page_size=20
          } else {
             fetchPath = nextUrl;
          }
          
          const response = await api.get<VendorListResponse>(fetchPath); // Axios prepends local baseURL to fetchPath

          accumulatedVendors = accumulatedVendors.concat(response.data.results || []);
          nextUrl = response.data.next; // Update nextUrl for the next loop iteration
      }
      
      // Store accumulated data globally
      if (isApprovedTab) {
        allApprovedVendors = accumulatedVendors;
      } else {
        allApplications = accumulatedVendors;
      }

    } catch (err) {
      console.error("Failed to fetch vendors:", err);
      // Removed the unnecessary URL parsing logic from the error message construction as well
      const errorMessage =
        !isApprovedTab && (err as any).response?.status === 403
          ? "Access Denied: You must be an administrator to view all vendor applications."
          : "Failed to load vendors. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reset page and refetch data when tab changes
    setSearchTerm('');
    setCurrentPage(1);
    fetchData(activeTab);
  }, [activeTab, fetchData]);


  // Reset page after search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);


  // --- Handler for Admin Toggle (unchanged) ---

  const handleToggleApproval = useCallback(
    async (vendorId: number, isCurrentlyApproved: boolean): Promise<void> => {
      const action = isCurrentlyApproved ? "reject" : "approve";
      const reason = action === "reject" ? "Unapproved by Admin via dashboard." : "Approved via dashboard."; 
      
      try {
        await api.post(`/vendor/${vendorId}/approve/`, { action, reason });

        // Update the global list
        const updateList = (list: Vendor[]) => list.map(v => 
          v.id === vendorId ? { ...v, is_approved: !isCurrentlyApproved } : v
        );
        allApplications = updateList(allApplications);
        allApprovedVendors = allApprovedVendors.filter(v => v.id !== vendorId); // Simple removal if unapproved

        // Trigger re-render by updating the list that drives the filtering logic (by setting searchTerm to itself)
        setSearchTerm(s => s + ' '); 
        setSearchTerm(s => s.trim()); 
        
      } catch (err) {
        console.error(`Error toggling vendor status for ID ${vendorId}:`, err);
        throw new Error(`Failed to perform ${action} action.`);
      }
    },
    []
  );


  // --- Component Renders (unchanged) ---

  const TabButton = ({ tabName, label }: { tabName: "approved" | "all", label: string }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 border-b-2 ${
        activeTab === tabName
          ? "border-[#5CA131] text-[#5CA131] bg-white shadow-md"
          : "border-transparent text-gray-500 hover:text-[#5CA131] hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );

  const PaginationControls = () => {
    const totalPages = Math.ceil(totalFilteredCount / PAGE_SIZE);

    if (totalPages <= 1 || loading) return null;

    return (
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Showing page {currentPage} of {totalPages} ({totalFilteredCount} vendors)
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
            className={`p-2 rounded-full border transition-colors ${
              currentPage === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-[#5CA131] hover:bg-gray-100 border-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
            className={`p-2 rounded-full border transition-colors ${
              currentPage === totalPages ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-[#5CA131] hover:bg-gray-100 border-gray-300'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="font-inter min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Vendor Management</h1>

        {/* Tab Toggle */}
        <div className="flex space-x-4 border-b border-gray-200 mb-8">
          <TabButton tabName="approved" label="Approved Vendors" />
          <TabButton tabName="all" label="All Vendors (Admin View)" />
        </div>

        {/* Search Input */}
        <div className="mb-6 flex items-center border border-gray-300 rounded-xl overflow-hidden shadow-sm focus-within:border-[#5CA131] focus-within:ring-1 focus-within:ring-[#5CA131]">
            <Search className="w-5 h-5 text-gray-400 ml-4" />
            <input
                type="text"
                placeholder={`Search ${activeTab === "approved" ? "approved" : "all"} vendors by name, brand, or email...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 outline-none text-gray-700"
                disabled={loading}
            />
        </div>


        {/* Content Area */}
        <div className="min-h-[400px]">
          {loading && (
            <div className="flex justify-center items-center h-full pt-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#5CA131]" />
              <span className="ml-3 text-lg text-gray-600">Loading initial data...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && displayedVendors.length === 0 && (
            <div className="text-center py-10 text-gray-500 border border-gray-200 rounded-lg">
              No vendors found matching your criteria.
            </div>
          )}

          {/* Render approved vendors as cards */}
          {!loading && !error && displayedVendors.length > 0 && activeTab === "approved" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
              {displayedVendors.map(vendor => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onToggleApproval={undefined} 
                />
              ))}
            </div>
          )}
          
          {/* Render all vendors as a table (Admin View) */}
          {!loading && !error && activeTab === "all" && (
            <AllVendorsTable
              vendors={displayedVendors as AllVendor[]} 
              onToggleApproval={handleToggleApproval}
              isLoading={loading}
            />
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalFilteredCount > 0 && !error && <PaginationControls />}
      </main>
    </div>
  );
}