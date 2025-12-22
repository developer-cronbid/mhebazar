// src/components/vendor-listing/AllVendorsTable.tsx
"use client";

import { useState, useMemo } from "react";
import { CheckCircle, XCircle, Loader2, Mail, Calendar, Eye, User, Briefcase, MoreVertical, ChevronUp, ChevronDown, Phone, Check, Clock } from "lucide-react";
import Link from "next/link";
// Assuming Dropdown components are mocked or imported correctly

// --- Dropdown Menu Components (Mocked or Imported) ---
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block text-left w-full">{children}</div>;
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
    company_phone: string;
    brand: string;
    is_approved: boolean; 
    application_date: string; // The field used for sorting by date
};

type FilterStatus = 'all' | 'pending' | 'approved';

type AllVendorsTableProps = {
    vendors: AllVendor[]; // ASSUMED TO BE PAGINATED DATA (Current Page only)
    onToggleApproval: (vendorId: number, isCurrentlyApproved: boolean) => Promise<void>;
    isLoading: boolean;
    // Sorting Props
    sortField: string;
    sortDirection: 'asc' | 'desc';
    handleSortChange: (field: string) => void;
    // Status Filter Props from Parent
    statusFilter: FilterStatus;
    setStatusFilter: (filter: FilterStatus) => void;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// --- Sortable Header Component ---
const SortableHeader = ({ field, label, currentField, currentDirection, onSortChange, align = 'left' }: { 
    field: string, 
    label: string, 
    currentField: string, 
    currentDirection: 'asc' | 'desc', 
    onSortChange: (field: string) => void,
    align?: 'left' | 'center' | 'right'
}) => {
    const isCurrent = currentField === field;
    const Icon = isCurrent ? (currentDirection === 'desc' ? ChevronDown : ChevronUp) : ChevronDown;
    const justifyClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

    return (
        <th 
            className={`p-4 text-${align} text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors w-1/4`}
            onClick={() => onSortChange(field)}
        >
            <div className={`flex items-center ${justifyClass} space-x-1`}>
                <span>{label}</span>
                <Icon className={`w-3 h-3 ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`} />
            </div>
        </th>
    );
};


// --- Row Component (Contact Info Fix Applied) ---
const VendorRow = ({ vendor, onToggleApproval }: { 
    vendor: AllVendor; 
    onToggleApproval: AllVendorsTableProps['onToggleApproval'];
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isTogglingApproval, setIsTogglingApproval] = useState(false);
    
    const { id, user_id, company_name, brand, email, full_name, is_approved, application_date, username, company_phone, company_email } = vendor;

    const handleToggleApproval = async () => {
        if (isTogglingApproval) return;
        setIsTogglingApproval(true);
        
        try {
            await onToggleApproval(id, is_approved);
            setIsMenuOpen(false);
        } catch (error) {
            console.error("Toggle approval failed:", error);
        } finally {
            setIsTogglingApproval(false);
        }
    };
    
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

            {/* Applicant / Contact (Fixed for better visibility) */}
            <td className="p-4 text-sm text-gray-700 hidden sm:table-cell">
                <div className="flex items-center space-x-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{full_name || username || 'N/A'}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px] text-gray-700">{company_email || email || 'N/A'}</span>
                    </div>
                    {company_phone && (
                        <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[200px] font-medium text-indigo-600">{company_phone}</span>
                        </div>
                    )}
                </div>
            </td>

            {/* Application Date */}
            <td className="p-4 text-sm text-gray-700 hidden lg:table-cell text-center">
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


// --- Main Table Component (with Status Filter Toggle via Header Click) ---
export default function AllVendorsTable({ vendors, onToggleApproval, isLoading, sortField, sortDirection, handleSortChange, statusFilter, setStatusFilter }: AllVendorsTableProps) {
    
    // Handle click on the Status Header to toggle filter (which triggers refetch in parent)
    const handleStatusToggle = () => {
        const newStatus = statusFilter === 'all' ? 'pending' : statusFilter === 'pending' ? 'approved' : 'all';
        setStatusFilter(newStatus);
        
        // This is crucial: By triggering handleSortChange (even with a dummy field), 
        // we signal the parent component (page.tsx) to reset pagination and refetch with the new filter.
        // handleSortChange('status_filter_toggle'); 
    };
    
    // Determine the label and icon for the Status Header
    const getStatusLabel = () => {
        if (statusFilter === 'pending') return 'Pending Only';
        if (statusFilter === 'approved') return 'Approved Only';
        return 'Approval Status';
    };
    
    // Determine the icon for the Status Header
    const StatusIcon = statusFilter === 'approved' ? Check : statusFilter === 'pending' ? Clock : ChevronDown;
    
    
    if (isLoading) {
        return (
            <div className='flex justify-center items-center h-48 bg-white rounded-xl shadow-lg'>
                <Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
                <span className='ml-3 text-lg text-gray-600'>Loading data for the current page...</span>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                            <SortableHeader 
                                field="brand" 
                                label="Brand / Company" 
                                currentField={sortField} 
                                currentDirection={sortDirection} 
                                onSortChange={handleSortChange}
                                align="left"
                            />
                            <SortableHeader 
                                field="full_name" 
                                label="Applicant / Contact" 
                                currentField={sortField} 
                                currentDirection={sortDirection} 
                                onSortChange={handleSortChange}
                                align="left"
                            />
                            <SortableHeader 
                                field="application_date" 
                                label="Applied On" 
                                currentField={sortField} 
                                currentDirection={sortDirection} 
                                onSortChange={handleSortChange}
                                align="center"
                            />
                            {/* Status Header with Filter Toggle logic */}
                            <th 
                                className="p-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-[180px] cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={handleStatusToggle}
                            >
                                <div className={`flex items-center justify-center space-x-1`}>
                                    <span>{getStatusLabel()}</span>
                                    {/* Icon change based on the filter status */}
                                    <StatusIcon className={`w-3 h-3 ${statusFilter !== 'all' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                </div>
                            </th>
                            <th className="p-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-[100px]">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {vendors.length > 0 ? (
                            vendors.map((vendor) => (
                                <VendorRow key={vendor.id} vendor={vendor} onToggleApproval={onToggleApproval} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 text-lg font-medium">
                                    No {getStatusLabel()} vendors found on this page matching criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}