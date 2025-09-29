// src/components/vendor-listing/AllVendorsTable.tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Mail, Calendar, Eye, User, Briefcase, Zap } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api"; // Need api for direct status update (mock)

// Helper function to create a URL-safe slug
const createSlug = (name: string): string => {
  if (!name) return "";
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

// Placeholder Button component (assuming standard Tailwind utilities)
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


// Type definition for the data returned by /api/vendor/
export type AllVendor = {
  id: number; // Vendor ID
  user_id: number; // User ID - Key for User table
  username: string;
  email: string;
  full_name: string;
  company_name: string;
  company_email: string;
  brand: string;
  is_approved: boolean; // Corresponds to user role ID (2=true, 3=false)
  application_date: string;
  // NOTE: is_active is NOT provided by /api/vendor/, so we must assume/fetch it separately or mock it.
  // For now, we will assume a default value or mock a server endpoint.
};

type AllVendorsTableProps = {
  vendors: AllVendor[];
  onToggleApproval: (vendorId: number, isCurrentlyApproved: boolean) => Promise<void>;
  isLoading: boolean;
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const VendorRow = ({ vendor, onToggleApproval }: { 
    vendor: AllVendor; 
    onToggleApproval: AllVendorsTableProps['onToggleApproval'] 
}) => {
  const [isTogglingApproval, setIsTogglingApproval] = useState(false);
  const [currentIsActive, setCurrentIsActive] = useState<0 | 1 | 2>(1); // Mock status: 1=Active, 0=Inactive, 2=Not Visible
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  
  // Destructure fields
  const { id, user_id, company_name, brand, email, full_name, is_approved, application_date, username } = vendor;

  // --- APPROVAL TOGGLE (Role Change) ---
  const handleToggleApproval = async () => {
    if (isTogglingApproval) return;
    setIsTogglingApproval(true);
    try {
      await onToggleApproval(id, is_approved);
    } catch (error) {
      console.error("Toggle approval failed:", error);
    } finally {
      setIsTogglingApproval(false);
    }
  };
  
  // --- IS_ACTIVE TOGGLE (Custom 3-state) ---
  const handleStatusChange = async () => {
    if (isTogglingStatus) return;
    setIsTogglingStatus(true);
    
    // Determine the next state in the cycle (1 -> 2 -> 0 -> 1)
    let nextStatus: 0 | 1 | 2 = currentIsActive === 1 ? 2 : currentIsActive === 2 ? 0 : 1;
    
    // This action requires the backend to accept a User ID and set is_active/is_visible/etc.
    // Assuming a MOCK ADMIN endpoint exists for simplicity and demonstration.
    try {
        // You would replace this with a real PATCH call to /api/users/{user_id}/admin_status/
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
          case 2: return { label: 'Not Visible (Can Login)', color: 'bg-yellow-100 text-yellow-700' };
          case 0: return { label: 'Inactive (Blocked)', color: 'bg-red-100 text-red-700' };
      }
  };
  
  const statusInfo = getStatusDisplay(currentIsActive);

  // Admin link for View Products (View Admin)
  const vendorSlug = createSlug(brand);
  const adminHref = `/admin/accounts/registered-vendors/${vendorSlug}/?user=${user_id}`;


  return (
    <tr className="border-b border-gray-100 hover:bg-indigo-50/20 transition-colors">
      
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
          {is_approved ? "Approved (Role: Vendor)" : "Pending (Role: User/Other)"}
        </span>
        
        {/* is_active Status */}
        <div className="mt-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
            </span>
        </div>
      </td>

      {/* Action Toggle & View Products */}
      <td className="p-4 text-right space-y-2 w-[220px]">
        {/* View Products Button */}
        <Link href={adminHref} passHref>
            <Button 
                className={`text-xs font-medium w-full shadow-md ${
                    is_approved 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
                disabled={!is_approved}
            >
                <Eye className="w-4 h-4 mr-1" /> View Products
            </Button>
        </Link>
        
        {/* Approve / Unapprove Toggle (Role Change) */}
        <Button
          onClick={handleToggleApproval}
          disabled={isTogglingApproval}
          className={`text-xs font-medium w-full shadow-md transition-shadow ${
            isTogglingApproval 
                ? "bg-gray-400 text-white" 
                : is_approved 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-[#5CA131] hover:bg-[#4a8f28] text-white"
          }`}
        >
          {isTogglingApproval ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : is_approved ? (
            <div className="flex items-center"><XCircle className="w-4 h-4 mr-1" /> Unapprove Vendor</div>
          ) : (
            <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Approve Vendor</div>
          )}
        </Button>
        
        {/* Is_Active Toggle (3-State Status Change) */}
        <Button
          onClick={handleStatusChange}
          disabled={isTogglingStatus}
          className={`text-xs font-medium w-full shadow-md transition-shadow ${
            isTogglingStatus 
                ? "bg-gray-400 text-white" 
                : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
        >
          {isTogglingStatus ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div className="flex items-center"><Zap className="w-4 h-4 mr-1" /> Change User Status ({getStatusDisplay(currentIsActive).label})</div>
          )}
        </Button>
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
                        <th className="p-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-[220px]">
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