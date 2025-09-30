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

// --- Helper Functions ---
const sortVendors = (vendors: Vendor[], field: string, direction: 'asc' | 'desc'): Vendor[] => {
    return [...vendors].sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (field) {
            case 'brand':
                valA = a.brand || '';
                valB = b.brand || '';
                break;
            case 'full_name':
                // Sort by Applicant Name (or username as fallback)
                valA = a.full_name || a.username || '';
                valB = b.full_name || b.username || '';
                break;
            case 'application_date':
                // Sort by Date (milliseconds)
                valA = new Date(a.application_date).getTime();
                valB = new Date(b.application_date).getTime();
                break;
            default:
                return 0;
        }

        if (typeof valA === 'string') {
            const comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
            return direction === 'asc' ? comparison : -comparison;
        } else {
            const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
            return direction === 'asc' ? comparison : -comparison;
        }
    });
};


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

  // --- Sorting State ---
  // Default sort by Applied On (application_date) descending (newest first)
  const [sortField, setSortField] = useState<string>('application_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');


  // --- Client-Side Filter/Pagination Logic ---
  
  const clientFilterLogic = useCallback(() => {
    
    // 1. Select Source List
    const sourceList = activeTab === "approved" ? allApprovedVendors : allApplications;
    
    // 2. Filtering
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = lowerCaseSearch
      ? sourceList.filter(vendor => 
          vendor.brand?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.company_name?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.email?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.full_name?.toLowerCase().includes(lowerCaseSearch) ||
          vendor.username?.toLowerCase().includes(lowerCaseSearch)
        )
      : sourceList;
      
    // 3. Sorting (NEW FEATURE)
    filtered = sortVendors(filtered, sortField, sortDirection);

    // 4. Pagination
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    setDisplayedVendors(paginated);
    setTotalFilteredCount(filtered.length);

  }, [activeTab, searchTerm, currentPage, sortField, sortDirection]);

  
  useEffect(() => {
    // This effect runs whenever sorting, pagination, or global data changes
    clientFilterLogic();
  }, [clientFilterLogic, allApprovedVendors.length, allApplications.length]); 

  // --- Handlers ---
  
  // FIX: Dedicated handler for search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchTerm = e.target.value;
      // 1. Update search term state immediately (Keeps cursor stable)
      setSearchTerm(newSearchTerm);

      // 2. Reset page to 1 if the search term changes significantly
      if (newSearchTerm.length === 0 || searchTerm.length === 0) {
          setCurrentPage(1);
      }
      
      // The main useEffect handles the filtering
  };

  // NEW: Handler for column sorting
  const handleSortChange = (field: string) => {
    if (field === sortField) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
        setSortField(field);
        setSortDirection('desc'); // Default to descending (newest/highest first)
    }
    setCurrentPage(1); // Reset pagination on sort change
  };


  // --- Data Fetching ---

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
      
      // Fetch ALL applications
      while (allNextUrl) {
          const response = await api.get<VendorListResponse>(allNextUrl);
          accumulatedAll = accumulatedAll.concat(response.data.results as Vendor[] || []);
          allNextUrl = cleanUrl(response.data.next); 
      }
      
      // Store accumulated data globally
      allApprovedVendors = accumulatedApproved;
      allApplications = accumulatedAll;
      
      // Initialize filtering and sorting
      clientFilterLogic();
      setCurrentPage(1);

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
  }, [clientFilterLogic]); 

  useEffect(() => {
    // Initial fetch
    fetchData(); 
  }, [fetchData]);


  // Handle Tab Switch
  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
    setSortField('application_date'); // Reset sorting on tab switch
    setSortDirection('desc');
  }, [activeTab]);


  // --- Toggle Approval Logic ---
  
  // New function to force UI update after global state change
  const forceUpdate = () => {
      // Triggering a change in currentPage to force the main useEffect to run the filter logic
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
                onChange={handleSearchChange} 
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
              sortField={sortField}
              sortDirection={sortDirection}
              handleSortChange={handleSortChange}
            />
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalFilteredCount > 0 && !error && <PaginationControls />}
      </main>
    </div>
  );
}