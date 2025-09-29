// src/components/vendor-listing/AllVendorsTable.tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Mail, Calendar, Eye, User, Briefcase, MoreVertical } from "lucide-react";
import Link from "next/link";
// Assuming Dropdown components are mocked or imported correctly

// --- Dropdown Menu Components (Mocked or Imported) ---
// Note: Keeping the mock components as per your original file structure.
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block text-left w-full">{children}</div>;
// FIX: Add onClick handler to DropdownMenuTrigger to control state
const DropdownMenuTrigger = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => <div className="cursor-pointer" onClick={onClick}>{children}</div>;
const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => <div className="absolute right-0 z-20 w-56 mt-2 origin-top-right bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none p-1">{children}</div>;
const DropdownMenuItem = ({ children, onClick, className, disabled }: { children: React.ReactNode, onClick: () => void, className?: string, disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors ${className} ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}`}>
        {children}
    </button>
);
const DropdownMenuSeparator = () => <hr className="my-1 border-gray-100" />;

// --- Helper Functions and Types ---

const createSlug = (name: string): string => {
  if (!name) return "";
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

export type AllVendor = {
  id: number; // Vendor ID
  user_id: number; // User ID
  username: string;
  email: string;
  full_name: string;
  company_name: string;
  company_email: string;
  brand: string;
  is_approved: boolean; 
  application_date: string;
};

type AllVendorsTableProps = {
  vendors: AllVendor[];
  onToggleApproval: (vendorId: number, isCurrentlyApproved: boolean) => Promise<void>;
  isLoading: boolean;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// --- Row Component with Dropdown Menu ---

const VendorRow = ({ vendor, onToggleApproval }: { 
    vendor: AllVendor; 
    onToggleApproval: AllVendorsTableProps['onToggleApproval'];
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTogglingApproval, setIsTogglingApproval] = useState(false); // Local loading state
  
  // Destructure only the fields available in your simplified model/serializer
  const { id, user_id, company_name, brand, email, full_name, is_approved, application_date, username } = vendor;

  // --- APPROVAL TOGGLE (Role Change via /vendor/{id}/approve/) ---
  const handleToggleApproval = async () => {
    if (isTogglingApproval) return;
    setIsTogglingApproval(true);
    // Don't close the menu until the action is finished, so the loader is visible
    // setIsMenuOpen(false); // Removed for better UX with loader
    
    try {
      // The promise resolves successfully, which triggers forceUpdate in page.tsx
      await onToggleApproval(id, is_approved);
      
      // If successful, close the menu (the row will be re-rendered anyway)
      setIsMenuOpen(false);
      
    } catch (error) {
      console.error("Toggle approval failed:", error);
      // Show error message (Optional: you might want to display a toast here)
    } finally {
      setIsTogglingApproval(false);
    }
  };
  
  // Admin link for View Products 
  const vendorSlug = createSlug(brand);
  const adminHref = `/admin/accounts/registered-vendors/${vendorSlug}/?user=${user_id}`;


  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      
      {/* Brand / Company */}
      <td className="p-4 text-sm font-medium text-gray-900">
        <div className="flex items-center space-x-3">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            <div>
                <span className="text-base text-gray-900 font-semibold">{brand || 'N/A'}</span>
                <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{company_name}</div>
            </div>
        </div>
      </td>

      {/* Applicant / Email */}
      <td className="p-4 text-sm text-gray-700 hidden sm:table-cell">
        <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{full_name || username || 'N/A'}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
             <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate max-w-[150px]">{email}</span>
        </div>
      </td>

      {/* Application Date */}
      <td className="p-4 text-sm text-gray-700 hidden lg:table-cell">
        <div className="flex items-center space-x-2 justify-center">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{formatDate(application_date)}</span>
        </div>
      </td>

      {/* Status */}
      <td className="p-4 text-center">
        {/* Approval Status */}
        <span 
          className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap shadow-sm mb-1 inline-block ${
            is_approved ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
          }`}
        >
          {is_approved ? "Approved" : "Pending"}
        </span>
      </td>

      {/* Actions Dropdown */}
      <td className="p-4 text-right w-[100px]">
        <DropdownMenu>
            <DropdownMenuTrigger onClick={() => setIsMenuOpen(p => !p)}>
                <button 
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-gray-300"
                    disabled={isTogglingApproval} // Button disabled when toggling
                >
                    {/* Show loader on the button if status is being toggled */}
                    {isTogglingApproval ? <Loader2 size={20} className="animate-spin text-indigo-500" /> : <MoreVertical size={20} />}
                </button>
            </DropdownMenuTrigger>
            {isMenuOpen && (
                <DropdownMenuContent>
                    {/* View Product Link */}
                    <Link href={adminHref} passHref>
                        <DropdownMenuItem onClick={() => setIsMenuOpen(false)} className='text-indigo-600'>
                            <Eye size={16} className="mr-2" />
                            View Products
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />

                    {/* Approval/Role Toggle */}
                    {is_approved ? (
                        <DropdownMenuItem onClick={handleToggleApproval} className='text-red-600 font-medium' disabled={isTogglingApproval}>
                            {/* Show loader inside the menu item */}
                            {isTogglingApproval ? <Loader2 size={16} className="mr-2 animate-spin" /> : <XCircle size={16} className="mr-2" />}
                            Unapprove
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={handleToggleApproval} className='text-[#5CA131] font-medium' disabled={isTogglingApproval}>
                            {/* Show loader inside the menu item */}
                            {isTogglingApproval ? <Loader2 size={16} className="mr-2 animate-spin" /> : <CheckCircle size={16} className="mr-2" />}
                            Approve
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            )}
        </DropdownMenu>
      </td>
    </tr>
  );
};


export default function AllVendorsTable({ vendors, onToggleApproval, isLoading }: AllVendorsTableProps) {
  if (isLoading) {
    return null; 
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-2xl">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                        <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">
                            Brand / Company
                        </th>
                        <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell w-1/4">
                            Applicant / Email
                        </th>
                        <th className="p-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-[120px]">
                            Applied On
                        </th>
                        <th className="p-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-[180px]">
                            Approval Status
                        </th>
                        <th className="p-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-[100px]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {vendors.map((vendor) => (
                        <VendorRow key={vendor.id} vendor={vendor} onToggleApproval={onToggleApproval} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}