// src/components/vendor-listing/AllVendorsTable.tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Mail, Calendar, Eye, User, Briefcase, MoreVertical, Zap, UserCheck, UserX, Shield, UserMinus, Phone, Home, Hash } from "lucide-react";
import Link from "next/link";
// import api from "@/lib/api"; // Not needed here

// --- Dropdown Menu Components (Robust and visible) ---
const DropdownMenu = ({ children }: { children: React.ReactNode[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative inline-block text-left w-full">
            {/* Trigger (child 0) */}
            <div onClick={() => setIsOpen(p => !p)} onMouseEnter={() => setIsOpen(true)}>{children[0]}</div>
            {/* Content (child 1) */}
            {isOpen && <div className="absolute right-0 z-20 w-56 mt-2 origin-top-right bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none p-1">{children[1]}</div>}
        </div>
    );
};
const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => <div className="cursor-pointer">{children}</div>;
const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const DropdownMenuItem = ({ children, onClick, className, disabled }: { children: React.ReactNode, onClick: () => void, className?: string, disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors ${className} ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}`}>
        {children}
    </button>
);
const DropdownMenuSeparator = () => <hr className="my-1 border-gray-100" />;

// --- Helper Functions and Types ---

const createSlug = (name: string): string => {
  if (!name) return "";
  // Simple slugification for display/link creation
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

// **UPDATED: Aligned with the new AdminVendorListSerializer response**
export type AllVendor = {
  id: number; // Vendor ID
  user_id: number; // User ID
  username: string;
  email: string;
  full_name: string;
  company_name: string;
  company_email: string;
  brand: string;
  application_date: string;
  
  // NEW FIELDS added directly from the new dedicated serializer:
  company_phone: string;
  company_address: string;
  pcode: string;
  gst_no: string;
  
  // STATUS FIELDS MAPPED (used for initial state):
  user_is_active: boolean; // Actual boolean from Django User model
  current_role_id: 1 | 2 | 3; // Actual role ID from Django Role model
  
  // The is_approved/is_active fields used internally by page.tsx logic (kept for compatibility)
  is_active: boolean; 
  is_approved: boolean;
};

type AllVendorsTableProps = {
  vendors: AllVendor[];
  // onStatusUpdate handles (userId, newRoleId, newStatus(0|1|2))
  onStatusUpdate: (userId: number, currentRoleId: 1 | 2 | 3, newStatus: 0 | 1 | 2) => Promise<void>; 
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

const VendorRow = ({ vendor, onStatusUpdate }: { 
    vendor: AllVendor; 
    onStatusUpdate: AllVendorsTableProps['onStatusUpdate'];
}) => {
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  
  // **FIXED: Initialize state using the data returned by the new serializer**
  // Initialize Role ID
  const [currentRoleId, setCurrentRoleId] = useState<1 | 2 | 3>(vendor.current_role_id);
  
  // Initialize 3-State Status: 1 if user_is_active is True, 0 otherwise (we default to 0 not 2 for initial load)
  const initialIsActive: 0 | 1 | 2 = vendor.user_is_active ? 1 : 0;
  const [currentIsActive, setCurrentIsActive] = useState<0 | 1 | 2>(initialIsActive); 
  
  const { 
      id, user_id, company_name, brand, email, full_name, application_date, username,
      company_phone, company_address, pcode, gst_no // Destructured fields
  } = vendor;

  // Define Role IDs for easy selection in the menu
  const ROLE_ADMIN = 1 as const;
  const ROLE_VENDOR = 2 as const;
  const ROLE_USER = 3 as const;


  
  // --- ROLE CHANGE (Directly to 1, 2, or 3) ---
  const handleRoleChange = async (newRoleId: 1 | 2 | 3) => {
    if (isTogglingStatus) return;
    setIsTogglingStatus(true);
    
    try {
        // Pass the new Role ID and the current visual 3-state status.
        await onStatusUpdate(user_id, newRoleId, currentIsActive);
        
        // Update local state only on success (page.tsx forces a re-fetch/re-render anyway)
        setCurrentRoleId(newRoleId);
        
    } catch (error) {
        console.error("Role change failed:", error);
    } finally {
        setIsTogglingStatus(false);
    }
  };
  
  // --- IS_ACTIVE TOGGLE (Custom 3-state via /users/admin_update/) ---
  const handleStatusChange = async (nextStatus: 0 | 1 | 2) => {
    if (isTogglingStatus) return;
    setIsTogglingStatus(true);
    
    try {
        // Pass the User ID, current Role ID, and new 3-state status
        await onStatusUpdate(user_id, currentRoleId, nextStatus);
        
        // Update local state if API call succeeds
        setCurrentIsActive(nextStatus);
        
    } catch (error) {
        console.error("User status update failed:", error);
    } finally {
        setIsTogglingStatus(false);
    }
  };
  
  // Helper for UI display
  const getStatusDisplay = (status: 0 | 1 | 2) => {
      switch (status) {
          case 1: return { label: 'Active (1)', color: 'bg-green-100 text-green-700' };
          case 2: return { label: 'Not Visible (2)', color: 'bg-yellow-100 text-yellow-700' };
          case 0: return { label: 'Inactive (0)', color: 'bg-red-100 text-red-700' };
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

      {/* Contact Info (Combined new fields) */}
      <td className="p-4 text-sm text-gray-700 hidden lg:table-cell w-1/4">
        <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-gray-700">
                <Phone className="w-4 h-4 text-blue-500" />
                <span className="font-mono">{company_phone || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-700">
                <Home className="w-4 h-4 text-red-500" />
                <span className="truncate max-w-[200px]">{company_address}, {pcode || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-700">
                <Hash className="w-4 h-4 text-green-500" />
                <span className="font-mono">{gst_no || 'N/A'}</span>
            </div>
        </div>
      </td>

      {/* Status */}
      <td className="p-4 text-center w-[180px]">
        {/* Role Status */}
        <span 
          className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap shadow-sm mb-1 inline-block ${
            currentRoleId === ROLE_ADMIN ? 'bg-purple-100 text-purple-800 border border-purple-300' :
            currentRoleId === ROLE_VENDOR ? 'bg-green-100 text-green-800 border border-green-300' : 
            'bg-yellow-100 text-yellow-800 border border-yellow-300'
          }`}
        >
          Role: {currentRoleId === ROLE_ADMIN ? "Admin (1)" : currentRoleId === ROLE_VENDOR ? "Vendor (2)" : "User (3)"}
        </span>
        
        {/* is_active Status */}
        <div className="mt-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                Status: {statusInfo.label}
            </span>
        </div>
        <div className="flex items-center space-x-2 justify-center text-xs text-gray-500 mt-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(vendor.application_date)}</span>
        </div>
      </td>

      {/* Actions Dropdown */}
      <td className="p-4 text-right w-[100px]">
        <DropdownMenu>
            <DropdownMenuTrigger>
                <button 
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-gray-300"
                    disabled={isTogglingStatus}
                >
                    <MoreVertical size={20} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {/* View Product Link */}
                <Link href={adminHref} passHref>
                    {/* onClick added to prevent console warning */}
                    <DropdownMenuItem onClick={() => {}} className='text-indigo-600'>
                        <Eye size={16} className="mr-2" />
                        View Products
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />

                {/* ROLE CHANGE ACTIONS (1, 2, 3) */}
                <div className="px-4 py-1 text-xs font-semibold text-gray-500">SET USER ROLE</div>
                <DropdownMenuItem 
                    onClick={() => handleRoleChange(ROLE_ADMIN)} 
                    className={`text-purple-600 ${currentRoleId === ROLE_ADMIN ? 'bg-purple-50/50 font-bold' : ''}`}
                    disabled={isTogglingStatus || currentRoleId === ROLE_ADMIN}
                >
                    {isTogglingStatus && currentRoleId !== ROLE_ADMIN ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Shield size={16} className="mr-2" />}
                    Set Role: Admin (1)
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => handleRoleChange(ROLE_VENDOR)} 
                    className={`text-blue-600 ${currentRoleId === ROLE_VENDOR ? 'bg-blue-50/50 font-bold' : ''}`}
                    disabled={isTogglingStatus || currentRoleId === ROLE_VENDOR}
                >
                    {isTogglingStatus && currentRoleId !== ROLE_VENDOR ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserCheck size={16} className="mr-2" />}
                    Set Role: Vendor (2)
                </DropdownMenuItem>
                 <DropdownMenuItem 
                    onClick={() => handleRoleChange(ROLE_USER)} 
                    className={`text-gray-600 ${currentRoleId === ROLE_USER ? 'bg-gray-50/50 font-bold' : ''}`}
                    disabled={isTogglingStatus || currentRoleId === ROLE_USER}
                >
                    {isTogglingStatus && currentRoleId !== ROLE_USER ? <Loader2 size={16} className="mr-2 animate-spin" /> : <User size={16} className="mr-2" />}
                    Set Role: User (3)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* 3-State Status Toggles */}
                <div className="px-4 py-1 text-xs font-semibold text-gray-500">SET IS_ACTIVE STATUS</div>

                <DropdownMenuItem 
                    onClick={() => handleStatusChange(1)} 
                    className={`text-green-600 ${currentIsActive === 1 ? 'bg-green-50/50 font-bold' : ''}`}
                    disabled={isTogglingStatus || currentIsActive === 1}
                >
                    {isTogglingStatus && currentIsActive !== 1 ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserCheck size={16} className="mr-2" />}
                    Set Active (1)
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => handleStatusChange(2)} 
                    className={`text-yellow-600 ${currentIsActive === 2 ? 'bg-yellow-50/50 font-bold' : ''}`}
                    disabled={isTogglingStatus || currentIsActive === 2}
                >
                    {isTogglingStatus && currentIsActive !== 2 ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
                    Set Not Visible (2)
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => handleStatusChange(0)} 
                    className={`text-red-600 ${currentIsActive === 0 ? 'bg-red-50/50 font-bold' : ''}`}
                    disabled={isTogglingStatus || currentIsActive === 0}
                >
                    {isTogglingStatus && currentIsActive !== 0 ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserMinus size={16} className="mr-2" />}
                    Set Inactive (0)
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};


export default function AllVendorsTable({ vendors, onStatusUpdate, isLoading }: AllVendorsTableProps) {
  if (isLoading) {
    return null; 
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-2xl">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                        <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/5">
                            Brand / Company
                        </th>
                        <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell w-1/5">
                            Applicant / Email
                        </th>
                        <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell w-1/4">
                            Contact & Address (New)
                        </th>
                        <th className="p-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-[180px]">
                            Role & Status
                        </th>
                        <th className="p-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-[100px]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {vendors.map((vendor) => (
                        <VendorRow key={vendor.id} vendor={vendor} onStatusUpdate={onStatusUpdate} />
                    ))}
                </tbody>
            </table >
        </div>
    </div>
  );
}
