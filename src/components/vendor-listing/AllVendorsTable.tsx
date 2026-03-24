// src/components/vendor-listing/AllVendorsTable.tsx
"use client";

import { useState, useMemo } from "react";
import { CheckCircle, XCircle, Loader2, Mail, Calendar, Eye, User, Briefcase, MoreVertical, ChevronUp, ChevronDown, Phone, Check, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";

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
    id: number;
    user_id?: number;
    username: string;
    email: string;
    full_name: string;
    company_name: string;
    company_email: string;
    company_phone: string;
    brand: string;
    is_approved: boolean;
    application_date: string;
    product_count?: number;
    user_info?: {
        id: number;
        profile_photo: string;
    };
};

type DetailedVendor = AllVendor & {
    company_address?: string;
    pcode?: string;
    gst_no?: string;
};

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

type FilterStatus = 'all' | 'pending' | 'approved';

type AllVendorsTableProps = {
    vendors: AllVendor[];
    onToggleApproval: (vendorId: number, isCurrentlyApproved: boolean) => Promise<void>;
    isLoading: boolean;
    sortField: string;
    sortDirection: 'asc' | 'desc';
    handleSortChange: (field: string) => void;
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


// --- Row Component ---
const VendorRow = ({ vendor, onToggleApproval, onViewDetails }: {
    vendor: AllVendor;
    onToggleApproval: AllVendorsTableProps['onToggleApproval'];
    onViewDetails?: (vendor: AllVendor) => void;
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isTogglingApproval, setIsTogglingApproval] = useState(false);

    const { id, user_id, user_info, company_name, brand, email, full_name, is_approved, application_date, username, company_phone, company_email } = vendor;

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
    const targetUserId = user_id || user_info?.id;
    const adminHref = `/admin/accounts/registered-vendors/${vendorSlug}/?user=${targetUserId}`;

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="p-4 text-sm font-medium text-gray-900">
                <div className="flex items-center space-x-3">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    <div>
                        <span className="text-base text-gray-900 font-semibold">{brand || 'N/A'}</span>
                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{company_name}</div>
                    </div>
                </div>
            </td>
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
            <td className="p-4 text-sm text-gray-700 hidden lg:table-cell text-center">
                <div className="flex items-center space-x-2 justify-center">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{formatDate(application_date)}</span>
                </div>
            </td>
            <td className="p-4 text-center">
                <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap shadow-sm mb-1 inline-block ${is_approved ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        }`}
                >
                    {is_approved ? "Approved" : "Pending"}
                </span>
            </td>
            <td className="p-4 text-right w-[100px]">
                <DropdownMenu>
                    <DropdownMenuTrigger onClick={() => setIsMenuOpen(p => !p)}>
                        <button
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-gray-300"
                            disabled={isTogglingApproval}
                        >
                            {isTogglingApproval ? <Loader2 size={20} className="animate-spin text-indigo-500" /> : <MoreVertical size={20} />}
                        </button>
                    </DropdownMenuTrigger>
                    {isMenuOpen && (
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setIsMenuOpen(false); onViewDetails && onViewDetails(vendor); }} className='text-indigo-600'>
                                <Eye size={16} className="mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <Link href={adminHref} passHref>
                                <DropdownMenuItem onClick={() => setIsMenuOpen(false)} className='text-indigo-600'>
                                    <Eye size={16} className="mr-2" />
                                    View Products
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            {is_approved ? (
                                <DropdownMenuItem onClick={handleToggleApproval} className='text-red-600 font-medium' disabled={isTogglingApproval}>
                                    {isTogglingApproval ? <Loader2 size={16} className="mr-2 animate-spin" /> : <XCircle size={16} className="mr-2" />}
                                    Unapprove
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={handleToggleApproval} className='text-[#5CA131] font-medium' disabled={isTogglingApproval}>
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


// --- Main Table Component ---
export default function AllVendorsTable({ vendors, onToggleApproval, isLoading, sortField, sortDirection, handleSortChange, statusFilter, setStatusFilter }: AllVendorsTableProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<'loading' | 'details' | 'error'>('loading');
    const [detailedVendor, setDetailedVendor] = useState<DetailedVendor | null>(null);
    const [vendorUserDetails, setVendorUserDetails] = useState<VendorUser | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<AllVendor | null>(null);
    const [modalProductCount, setModalProductCount] = useState<number>(0);

    const [_isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const fetchVendorDetails = async (vendor: AllVendor) => {
        setIsModalOpen(true);
        setModalStep('loading');
        setIsDetailsLoading(true);
        setDetailedVendor(null);
        setVendorUserDetails(null);
        setSelectedVendor(vendor);
        setDetailsError(null);
        setModalProductCount(0);

        // Optional: Track click in background just like VendorCard
        api.post("/track-vendor-click/", { vendor_id: vendor.id, admin_view: true }).catch(() => { });

        try {
            const targetUserId = vendor.user_id || vendor.user_info?.id;

            if (!targetUserId) {
                throw new Error("User ID is missing from the vendor object.");
            }

            const [vendorResp, userResp] = await Promise.all([
                api.get(`/vendor/${vendor.id}/`),
                api.get(`/users/${targetUserId}/`)
            ]);

            setDetailedVendor(vendorResp.data);
            setVendorUserDetails(userResp.data);

            // Fetch real product count from products API
            try {
                const prodResp = await api.get(`/products/?user=${targetUserId}&page=1`);
                setModalProductCount(prodResp.data?.count ?? 0);
            } catch {
                // fallback to vendor row's product_count if available
                setModalProductCount(vendor.product_count ?? 0);
            }

            setModalStep("details");

        } catch (err: any) {
            console.error('Failed to load vendor details', err);
            setDetailsError(err.message === "User ID is missing from the vendor object."
                ? err.message
                : "Unable to load complete vendor and user details. Please try again.");
            setModalStep('error');
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setDetailedVendor(null);
        setVendorUserDetails(null);
        setSelectedVendor(null);
        setModalProductCount(0);
    };

    const handleStatusToggle = () => {
        const newStatus = statusFilter === 'all' ? 'pending' : statusFilter === 'pending' ? 'approved' : 'all';
        setStatusFilter(newStatus);
    };

    const getStatusLabel = () => {
        if (statusFilter === 'pending') return 'Pending Only';
        if (statusFilter === 'approved') return 'Approved Only';
        return 'Approval Status';
    };

    const StatusIcon = statusFilter === 'approved' ? Check : statusFilter === 'pending' ? Clock : ChevronDown;

    // Resolve profile image URL safely (handles full URLs, absolute paths, and relative paths)
    const resolveProfileSrc = (profilePath?: string | null) => {
        if (!profilePath) return '/default-profile.png';
        if (profilePath.startsWith('http')) return profilePath;
        if (profilePath.startsWith('/')) return `https://api.mhebazar.in${profilePath}`;
        return `https://api.mhebazar.in/${profilePath}`;
    };

    // Image source used in the modal (prefer fetched user profile, fall back to selected row)
    const modalProfilePath = vendorUserDetails?.profile_photo ?? detailedVendor?.user_info?.profile_photo ?? selectedVendor?.user_info?.profile_photo ?? null;
    const modalImageSrc = resolveProfileSrc(modalProfilePath);

    // Cover image: use first user_banner image from the fetched user profile (same as vendor page)
    const modalCoverBanners = vendorUserDetails?.user_banner ?? [];
    const modalCoverSrc = modalCoverBanners.length > 0
        ? resolveProfileSrc(modalCoverBanners[0].image)
        : null;

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
                            <SortableHeader field="brand" label="Brand / Company" currentField={sortField} currentDirection={sortDirection} onSortChange={handleSortChange} align="left" />
                            <SortableHeader field="full_name" label="Applicant / Contact" currentField={sortField} currentDirection={sortDirection} onSortChange={handleSortChange} align="left" />
                            <SortableHeader field="application_date" label="Applied On" currentField={sortField} currentDirection={sortDirection} onSortChange={handleSortChange} align="center" />
                            <th className="p-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-[180px] cursor-pointer hover:bg-gray-200 transition-colors" onClick={handleStatusToggle}>
                                <div className={`flex items-center justify-center space-x-1`}>
                                    <span>{getStatusLabel()}</span>
                                    <StatusIcon className={`w-3 h-3 ${statusFilter !== 'all' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                </div>
                            </th>
                            <th className="p-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-[100px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {vendors.length > 0 ? (
                            vendors.map((vendor) => (
                                <VendorRow key={vendor.id} vendor={vendor} onToggleApproval={onToggleApproval} onViewDetails={fetchVendorDetails} />
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


            {/* Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                        <div className="bg-[#5CA131] p-4 flex justify-between items-center shrink-0">
                            <h3 className="text-white font-semibold text-lg">
                                {modalStep === 'details' ? 'Vendor Profile & User Info' : 'Loading Details'}
                            </h3>
                            <button className="text-white/80 hover:text-white text-2xl leading-none" onClick={closeModal}>
                                {'×'}
                            </button>
                        </div>

                        {/* Cover banner */}
                        <div className="w-full h-40 sm:h-48 bg-gray-100 relative">
                            {modalCoverSrc ? (
                                <Image src={modalCoverSrc} alt={`${detailedVendor?.brand || 'Vendor'} Cover`} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#5CA131]/20 to-[#5CA131]/5">
                                    <span className="text-[#5CA131]/40 text-sm">No cover image</span>
                                </div>
                            )}
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {modalStep === 'loading' && !detailsError && (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5CA131]"></div>
                                </div>
                            )}

                            {modalStep === 'error' && (
                                <div className="text-center py-4">
                                    <p className="text-red-500 mb-4 text-sm">{detailsError}</p>
                                    <button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                                        Close
                                    </button>
                                </div>
                            )}

                            {modalStep === 'details' && detailedVendor && vendorUserDetails && (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-lg overflow-hidden mb-2">
                                            <Image src={modalImageSrc} alt={`${detailedVendor?.brand || 'Vendor'} Logo`} width={80} height={80} className="object-contain" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900">{detailedVendor.brand}</h4>
                                        <span className={`mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${detailedVendor.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {detailedVendor.is_approved ? 'Approved Vendor' : 'Pending Approval'}
                                        </span>
                                    </div>

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

                                    <div>
                                        <h5 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1">Vendor Information</h5>
                                        <table className="w-full text-sm text-left border-collapse">
                                            <tbody>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Company</th>
                                                    <td className="py-2 text-gray-800">{detailedVendor.company_name}</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Comp. Email</th>
                                                    <td className="py-2 text-gray-800 break-all">{detailedVendor.company_email || detailedVendor.email || 'N/A'}</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Comp. Phone</th>
                                                    <td className="py-2 text-gray-800">
                                                        {detailedVendor.company_phone ? (
                                                            <a href={`tel:${detailedVendor.company_phone}`} className="text-[#5CA131] hover:underline">{detailedVendor.company_phone}</a>
                                                        ) : 'N/A'}
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-2 text-gray-500 font-medium w-1/3 align-top">GST No.</th>
                                                    <td className="py-2 text-gray-800">{detailedVendor.gst_no || 'N/A'}</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Products</th>
                                                    <td className="py-2 text-gray-800">{modalProductCount} items listed</td>
                                                </tr>
                                                <tr>
                                                    <th className="py-2 text-gray-500 font-medium w-1/3 align-top">Address</th>
                                                    <td className="py-2 text-gray-800">
                                                        {detailedVendor.company_address || 'N/A'}
                                                        {detailedVendor.pcode && ` (Pin: ${detailedVendor.pcode})`}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm" onClick={closeModal}>
                                            Close
                                        </button>
                                        <Link href={`/admin/accounts/registered-vendors/${createSlug(detailedVendor.brand)}/?user=${detailedVendor.user_id || detailedVendor.user_info?.id}`} className="flex-1">
                                            <button className="w-full bg-[#5CA131] hover:bg-[#4a8f28] text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm">
                                                Open Page
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}