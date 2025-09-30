// page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
// VendorCard is assumed to be present at this path
import VendorCard from "@/components/vendor-listing/VendorCard"; 
// AllVendor type is imported from the other component
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
var allApprovedVendors: Vendor[] = [];
var allApplications: Vendor[] = [];

// Role IDs
const ROLE_VENDOR = 2;

export default function VendorsPage() {
  const PAGE_SIZE = 10; // This is the page size for client-side display/pagination
  
  const [activeTab, setActiveTab] = useState<"approved" | "all">("approved");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-Side Filtering/Pagination State
  const [displayedVendors, setDisplayedVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0); 


  // --- Client-Side Filter/Pagination Logic ---
  
  // Renamed to clientFilterLogic to clearly separate it from state setting
  const clientFilterLogic = useCallback((
    search: string, 
    pageToUse: number, 
    activeTabToUse: "approved" | "all", 
    approvedVendors: Vendor[], 
    allVendors: Vendor[]
  ) => {
    
    const sourceList = activeTabToUse === "approved" ? approvedVendors : allVendors;
    
    // 1. Filtering
    const lowerCaseSearch = search.toLowerCase().trim();
    const filtered = lowerCaseSearch
      ? sourceList.filter(vendor => 
          vendor.brand?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.company_name?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.email?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.full_name?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.username?.toLowerCase().includes(lowerCaseSearch)
        )
      : sourceList;

    // 2. Pagination
    const startIndex = (pageToUse - 1) * PAGE_SIZE;
    const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    return { paginated, filteredCount: filtered.length };

  }, []);

  // Function that runs the filtering logic and updates state
  const runClientFiltering = useCallback((resetPage: boolean = false) => {
    const pageToUse = resetPage ? 1 : currentPage;
    
    const { paginated, filteredCount } = clientFilterLogic(
        searchTerm, 
        pageToUse, 
        activeTab, 
        allApprovedVendors, 
        allApplications
    );
    
    // Only reset currentPage if explicitly asked (e.g., after search or tab switch)
    if (resetPage) {
        setCurrentPage(1);
    }

    setDisplayedVendors(paginated);
    setTotalFilteredCount(filteredCount);

  }, [searchTerm, currentPage, activeTab, clientFilterLogic]);
  
  
  // FIX: Separate hook for search input handling to prevent cursor glitch
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchTerm = e.target.value;
      // 1. Update search term state immediately (keeps cursor stable)
      setSearchTerm(newSearchTerm);

      // 2. Reset page to 1 if the search term changes significantly
      // We check if the search term is now empty OR if we are switching from empty to non-empty
      if (newSearchTerm.length === 0 || searchTerm.length === 0) {
          setCurrentPage(1);
      }
      
      // 3. The runClientFiltering will be handled by the effect below.
  };

  
  // 🔴 FIX 1: Run filtering logic ONLY when pagination/tab/search is finalized
  useEffect(() => {
    // This effect runs whenever searchTerm, currentPage, or activeTab changes, 
    // ensuring the displayed data is always correct.
    runClientFiltering();
  }, [searchTerm, currentPage, activeTab, runClientFiltering]);
  
  
  // --- Data Fetching (Fetch ALL pages for client-side search) ---

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cleanUrl = (url: string | null): string | null => {
        if (!url) return null;
        let cleaned = url;
        
        if (process.env.NODE_ENV === "production" && cleaned.startsWith('http://')) {
            cleaned = cleaned.replace('http://', 'https://');
        }

        const apiIndex = cleaned.indexOf('/api/');
        if (apiIndex !== -1) {
             cleaned = cleaned.substring(cleaned.indexOf('/api/') + 5);
        }
        return cleaned;
    };
    
    try {
      let approvedNextUrl: string | null = "vendor/approved/";
      let allNextUrl: string | null = "vendor/"; 
      
      let accumulatedApproved: Vendor[] = [];
      let accumulatedAll: Vendor[] = [];

      // Fetch ALL approved vendors
      while (approvedNextUrl) {
          const response = await api.get<VendorListResponse>(approvedNextUrl);
          accumulatedApproved = accumulatedApproved.concat(response.data.results as Vendor[] || []);
          approvedNextUrl = cleanUrl(response.data.next); 
      }
      
      // Fetch ALL applications (for admin tab)
      while (allNextUrl) {
          const response = await api.get<VendorListResponse>(allNextUrl);
          accumulatedAll = accumulatedAll.concat(response.data.results as Vendor[] || []);
          allNextUrl = cleanUrl(response.data.next); 
      }
      
      // Store accumulated data globally
      allApprovedVendors = accumulatedApproved;
      allApplications = accumulatedAll;
      
      // Manually trigger client filtering after data fetch (resets page to 1)
      const { paginated, filteredCount } = clientFilterLogic("", 1, activeTab, accumulatedApproved, accumulatedAll);
      setDisplayedVendors(paginated);
      setTotalFilteredCount(filteredCount);
      setCurrentPage(1); // Set page state after data loads

    } catch (err) {
      console.error("Failed to fetch vendors:", err);
      const errorMessage =
        (err as any).response?.status === 403
          ? "Access Denied: You must be an administrator to view all vendor applications."
          : "Failed to load vendors. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [activeTab, clientFilterLogic]); 

  useEffect(() => {
    // Initial fetch
    fetchData(); 
  }, [fetchData]);


  // Handle Tab Switch
  useEffect(() => {
    // This effect runs when activeTab changes. It resets search/page, and runClientFiltering handles the update.
    setSearchTerm('');
    // currentPage reset is handled by the synchronous setting in handleSearchChange
  }, [activeTab]);


  // --- Handler for Admin Toggle ---
  
  // New function to force UI update after global state change
  const forceUpdate = () => {
      // Trigger a change in currentPage to force the main useEffect to run the filter logic
      setCurrentPage(p => p); 
  }

  // Helper function to update lists locally after API action
  const updateVendorInList = (list: Vendor[], vendorId: number, isApproved: boolean) => {
    return list.map(v => 
      v.id === vendorId ? { 
          ...v, 
          is_approved: isApproved,
      } : v
    );
  }

  // Handler for Vendor Approval/Rejection (Toggles is_approved)
  const handleToggleApproval = useCallback(
    async (vendorId: number, isCurrentlyApproved: boolean): Promise<void> => {
      const action = isCurrentlyApproved ? "reject" : "approve";
      const reason = action === "reject" ? "Unapproved by Admin via dashboard." : "Approved via dashboard."; 
      
      try {
        await api.post(`vendor/${vendorId}/approve/`, { action, reason }); 

        const newIsApproved = !isCurrentlyApproved;
        
        // Update the global lists locally for instant feedback
        allApplications = updateVendorInList(allApplications, vendorId, newIsApproved);
        allApprovedVendors = updateVendorInList(allApprovedVendors, vendorId, newIsApproved).filter(v => 
            v.is_approved === true
        ); 

        // Trigger re-render
        forceUpdate();
        
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
                onChange={handleSearchChange} // FIX: Using the dedicated handler
                className="w-full p-3 outline-none text-gray-700"
                disabled={loading}
            />
        </div>


        {/* Content Area */}
        <div className="min-h-[400px]">
          {loading && displayedVendors.length === 0 && ( 
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
                  // @ts-ignore: VendorCard doesn't need this prop in this tab
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