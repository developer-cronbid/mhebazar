// src/components/vendor-listing/AllVendorsTable.tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Mail, Calendar, Eye, User, Briefcase, MoreVertical, Zap, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api"; // Needed for status mock

// --- Dropdown Menu Components (Mocked for brevity) ---
// In a real app, these would be imported from a UI library like shadcn/ui
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block text-left w-full">{children}</div>;
const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => <div className="cursor-pointer">{children}</div>;
const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => <div className="absolute right-0 z-20 w-56 mt-2 origin-top-right bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none p-1">{children}</div>;
const DropdownMenuItem = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
    <button onClick={onClick} className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors ${className}`}>
        {children}
    </button>
);
const DropdownMenuSeparator = () => <hr className="my-1 border-gray-100" />;

// --- Helper Functions and Types (as before) ---

const createSlug = (name: string): string => {
  if (!name) return "";
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
};
const Button = ({ children, className = '', ...props }: ButtonProps) => (
  <button
    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 flex items-center justify-center ${className}`}
    {...props}
  >
    {children}
  </button>
);

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
    onToggleApproval: AllVendorsTableProps['onToggleApproval'] 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTogglingApproval, setIsTogglingApproval] = useState(false);
  const [currentIsActive, setCurrentIsActive] = useState<0 | 1 | 2>(1); // Mock status: 1=Active, 0=Inactive, 2=Not Visible
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  
  const { id, user_id, company_name, brand, email, full_name, is_approved, application_date, username } = vendor;

  // --- APPROVAL TOGGLE (Role Change) ---
  const handleToggleApproval = async () => {
    if (isTogglingApproval) return;
    setIsTogglingApproval(true);
    setIsMenuOpen(false);
    try {
      await onToggleApproval(id, is_approved);
      // NOTE: UI is updated by parent component's state change
    } catch (error) {
      console.error("Toggle approval failed:", error);
    } finally {
      setIsTogglingApproval(false);
    }
  };
  
  // --- IS_ACTIVE TOGGLE (Custom 3-state MOCK) ---
  const handleStatusChange = async (nextStatus: 0 | 1 | 2) => {
    if (isTogglingStatus) return;
    setIsTogglingStatus(true);
    setIsMenuOpen(false);
    
    // This assumes you have a separate endpoint to patch user status.
    try {
        // MOCK: Replace with real API call to /api/users/{user_id}/admin_status/
        // await api.patch(`/users/${user_id}/admin_status/`, { status: nextStatus }); 
        
        // Simulating success
        console.log(`User ${user_id} status changed to ${nextStatus}.`);
        setCurrentIsActive(nextStatus);
    } catch (error) {
        console.error("User status update failed:", error);
    } finally {
        setIsTogglingStatus(false);
    }
  };
  
  const getStatusDisplay = (status: 0 | 1 | 2) => {
      switch (status) {
          case 1: return { label: 'Active', color: 'bg-green-100 text-green-700' };
          case 2: return { label: 'Not Visible', color: 'bg-yellow-100 text-yellow-700' };
          case 0: return { label: 'Inactive', color: 'bg-red-100 text-red-700' };
      }
  };
  
  const statusInfo = getStatusDisplay(currentIsActive);

  // Admin link for View Products (View Admin)
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
          {is_approved ? "Approved (Role: Vendor)" : "Pending (Role: User)"}
        </span>
        
        {/* is_active Status */}
        <div className="mt-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
            </span>
        </div>
      </td>

      {/* Actions Dropdown */}
      <td className="p-4 text-right w-[100px]">
        <DropdownMenu>
            <DropdownMenuTrigger>
                <button 
                    onClick={() => setIsMenuOpen(p => !p)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={isTogglingApproval || isTogglingStatus}
                >
                    <MoreVertical size={20} />
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
                        <DropdownMenuItem onClick={handleToggleApproval} className='text-red-600 font-medium'>
                            {isTogglingApproval ? <Loader2 size={16} className="mr-2 animate-spin" /> : <XCircle size={16} className="mr-2" />}
                            Unapprove Vendor (Set Role: User)
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={handleToggleApproval} className='text-[#5CA131] font-medium'>
                            {isTogglingApproval ? <Loader2 size={16} className="mr-2 animate-spin" /> : <CheckCircle size={16} className="mr-2" />}
                            Approve Vendor (Set Role: Vendor)
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    
                    {/* 3-State Status Toggles */}
                    <DropdownMenuItem 
                        onClick={() => handleStatusChange(1)} 
                        className={`text-green-600 ${currentIsActive === 1 ? 'bg-green-50/50 font-bold' : ''}`}
                    >
                        {isTogglingStatus && currentIsActive !== 1 ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserCheck size={16} className="mr-2" />}
                        Set Status: Active (1)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => handleStatusChange(2)} 
                        className={`text-yellow-600 ${currentIsActive === 2 ? 'bg-yellow-50/50 font-bold' : ''}`}
                    >
                        {isTogglingStatus && currentIsActive !== 2 ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
                        Set Status: Not Visible (2)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => handleStatusChange(0)} 
                        className={`text-red-600 ${currentIsActive === 0 ? 'bg-red-50/50 font-bold' : ''}`}
                    >
                        {isTogglingStatus && currentIsActive !== 0 ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserX size={16} className="mr-2" />}
                        Set Status: Inactive (0)
                    </DropdownMenuItem>

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
                            Approval & Status
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
            </table >
        </div>
    </div>
  );
}