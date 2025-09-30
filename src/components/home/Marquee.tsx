"use client";

import api from '@/lib/api';
import { useEffect, useState, useCallback } from 'react';
import Marquee from "react-fast-marquee";
import Link from 'next/link';
import Image from 'next/image';

interface UserRole {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  description: string | null;
  role: UserRole;
  phone: string | null;
  address: string | null;
  profile_photo: string | null;
  user_banner: string[];
  is_email_verified: boolean;
  is_account_locked: boolean;
  date_joined: string;
  last_login: string | null;
}

interface Vendor {
  id: number;
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  company_name: string;
  company_email: string;
  brand: string;
  is_approved: boolean;
  application_date: string;
  user?: User;
}

const VendorMarquee = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      const vendorsResponse = await api.get('/vendor/approved/');
      const vendorsData = vendorsResponse.data.results;

      // Use Promise.all to fetch all user data concurrently
      const vendorPromises = vendorsData.map((vendor: Vendor) =>
        api.get(`/users/${vendor.user_id}/`)
          .then(userResponse => ({
            ...vendor,
            user: userResponse.data
          }))
          .catch(() => vendor) // Return the original vendor if user data fetch fails
      );

      const vendorsWithUserData = await Promise.all(vendorPromises);
      setVendors(vendorsWithUserData);
    } catch (err) {
      setError('Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  if (isLoading) return <div>Loading vendors...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="w-full py-6">
      <Marquee className="my-8" pauseOnHover={true} speed={40}>
        {vendors.map((vendor) => (
          <Link
            key={vendor.id}
            href={`/vendor-listing/${vendor.brand}`}
            className=" hover:scale-105 transition-transform"
          >
            <Image
              src={vendor.user?.profile_photo || '/default-profile.png'}
              alt={`${vendor.company_name} logo`}
              width={150}
              height={150}
              className="object-cover mx-6"
              unoptimized
            />
          </Link>
        ))}
      </Marquee>
    </div>
  );
};

export default VendorMarquee;
