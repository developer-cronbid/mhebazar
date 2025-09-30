// VendorMarquee.tsx
"use client";

import api from '@/lib/api';
import { useEffect, useState, useCallback } from 'react';
import Marquee from "react-fast-marquee";
import Link from 'next/link';
import Image from 'next/image';

// --- Type Interfaces ---

interface UserInfo {
    id: number;
    username: string;
    profile_photo: string | null; // This is the field we need
    first_name: string;
    last_name: string;
    date_joined: string;
}

interface ApprovedVendor {
    id: number;
    user_info: UserInfo; // The data is inside user_info
    company_name: string;
    brand: string;
    product_count: number;
    // Add other fields as needed, but for the marquee, these are sufficient
}

// --- Component Logic ---

const VendorMarquee = () => {
    // We use the ApprovedVendor type here
    const [vendors, setVendors] = useState<ApprovedVendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cleanImageUrl = (url: string | null): string => {
        if (!url) return '/default-profile.png';
        
        // FIX: Ensure image URL is HTTPS in production environment
        if (process.env.NODE_ENV === "production" && url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        return url;
    };


    const fetchVendors = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch data from the approved vendors endpoint
            const vendorsResponse = await api.get<{ results: ApprovedVendor[] }>('/vendor/approved/');
            
            // 2. The data is already complete, no need for extra /users/{id}/ calls
            setVendors(vendorsResponse.data.results);

        } catch (err) {
            console.error("Vendor Marquee Fetch Error:", err);
            setError('Failed to load approved vendors.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    if (isLoading) return <div className="text-center py-8 text-gray-500">Loading approved vendors...</div>;
    if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
    if (vendors.length === 0) return <div className="text-center py-8 text-gray-500">No approved vendors found.</div>;


    return (
        <div className="w-full py-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Our Trusted Vendors</h2>
            <Marquee className="my-8" pauseOnHover={true} speed={40}>
                {vendors.map((vendor) => (
                    <Link
                        key={vendor.id}
                        // Use vendor.brand for the slug as typically done
                        href={`/vendor-listing/${createSlug(vendor.brand)}`} 
                        className="mx-4 hover:scale-105 transition-transform duration-300 block"
                    >
                        <Image
                            // FIX: Use cleanImageUrl function on user_info.profile_photo
                            src={cleanImageUrl(vendor.user_info.profile_photo)}
                            alt={`${vendor.company_name} logo`}
                            width={120} // Adjusted width for better fit in marquee
                            height={120}
                            className="object-contain w-30 h-30 p-2 border border-gray-200 rounded-lg shadow-sm bg-white"
                            unoptimized
                            // Handle image loading error
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-profile.png';
                                (e.target as HTMLImageElement).classList.add('p-4'); // Add padding if default image loads
                            }}
                        />
                    </Link>
                ))}
            </Marquee>
        </div>
    );
};

// Simple utility function to create a clean slug
const createSlug = (name: string): string => {
    if (!name) return "";
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};


export default VendorMarquee;