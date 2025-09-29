// src/components/vendor-listing/AllVendorsTable.tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Mail, Calendar, Eye, User, Briefcase } from "lucide-react";
import Link from "next/link";

// Helper function to create a URL-safe slug (Copied from VendorCard logic)
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
  id: number;
  user_id: number;
  username: string; // <-- Now correctly defined
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
  const [isToggling, setIsToggling] = useState(false);
  // FIX: Destructure username correctly
  const { id, user_id, company_name, brand, email, full_name, is_approved, application_date, username } = vendor;

  const handleToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      await onToggleApproval(id, is_approved);
    } catch (error) {
      console.error("Toggle failed:", error);
    } finally {
      setIsToggling(false);
    }
  };
  
  // Calculate the correct admin path for "View Products"
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
            {/* FIX: Use destructured username */}
            <span className="font-medium">{full_name || username || 'N/A'}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
             <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate max-w-[150px]">{email}</span>
        </div>
      </td>

      {/* Application Date */}
      <td className="p-4 text-sm text-gray-700 hidden lg:table-cell">
        <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{formatDate(application_date)}</span>
        </div>
      </td>

      {/* Status */}
      <td className="p-4 text-center">
        <span 
          className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap shadow-sm ${
            is_approved ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
          }`}
        >
          {is_approved ? "Approved" : "Pending"}
        </span>
      </td>

      {/* Action Toggle & View Products */}
      <td className="p-4 text-right space-y-2 w-[180px]">
        {/* View Products Button - Directs to Admin Link */}
        <Link href={adminHref} passHref>
            <Button 
                className={`text-xs font-medium px-3 py-1.5 rounded-lg shadow-md w-full ${
                    is_approved 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
                disabled={!is_approved}
            >
                <Eye className="w-4 h-4 mr-1" /> View Admin
            </Button>
        </Link>
        
        {/* Approve / Unapprove Toggle */}
        <Button
          onClick={handleToggle}
          disabled={isToggling}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg shadow-md w-full transition-shadow ${
            isToggling 
                ? "bg-gray-400 text-white" 
                : is_approved 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-[#5CA131] hover:bg-[#4a8f28] text-white"
          }`}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : is_approved ? (
            <div className="flex items-center"><XCircle className="w-4 h-4 mr-1" /> Unapprove</div>
          ) : (
            <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Approve</div>
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
                        <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/3">
                            Brand / Company
                        </th>
                        <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell w-1/4">
                            Applicant / Email
                        </th>
                        <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell w-1/5">
                            Applied On
                        </th>
                        <th className="p-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-[120px]">
                            Status
                        </th>
                        <th className="p-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-[180px]">
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