'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton'; 
import { ArrowUpRight } from 'lucide-react';
import api from '@/lib/api'; 
import Link from 'next/link';

// Define the shape of the data from the API
interface ApiResponse {
  id: number;
  product_details: { name: string; images: { image: string }[] };
  user_name: string;
  created_at: string;
}

// A unified type for our combined list
type Enquiry = {
  id: string;
  type: 'Quote' | 'Rental';
  productName: string;
  productImage: string;
  customerName: string;
  createdAt: Date;
};

// A simple skeleton loader for a better user experience
const EnquirySkeleton = () => (
  <div className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-2">
        <Skeleton className="h-14 w-14 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export function RecentEnquiries() {
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Make API calls directly inside the component
        const [quoteResponse, rentalResponse] = await Promise.all([
          api.get('/quotes/'),
          api.get('/rentals/'),
        ]);

        const quotes: ApiResponse[] = quoteResponse.data.results || [];
        const rentals: ApiResponse[] = rentalResponse.data.results || [];

        // 1. Combine quotes and rentals into a single list
        const combined: Enquiry[] = [
          ...quotes.map(q => ({
            id: `q-${q.id}`,
            type: 'Quote',
            productName: q.product_details.name,
            productImage: q.product_details.images[0]?.image || 'https://placehold.co/100',
            customerName: q.user_name,
            createdAt: new Date(q.created_at),
          })),
          ...rentals.map(r => ({
            id: `r-${r.id}`,
            type: 'Rental',
            productName: r.product_details.name,
            productImage: r.product_details.images[0]?.image || 'https://placehold.co/100',
            customerName: r.user_name,
            createdAt: new Date(r.created_at),
          })),
        ];

        // 2. Sort the list by date, most recent first
        const sorted = combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // 3. Keep only the first 4 items
        setRecentEnquiries(sorted.slice(0, 4));

      } catch (err) {
        console.error("Failed to fetch enquiries:", err);
        setError("Could not load recent enquiries.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // The empty dependency array ensures this runs only once when the component mounts

  return (
    <div className="w-full md:w-1/2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Recent Enquiries</h2>
        <Link href="/vendor/enquiry" className="flex items-center text-sm text-green-600 hover:underline">
          View all <ArrowUpRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {/* Handle Loading and Error states */}
      {loading && <EnquirySkeleton />}
      {error && <p className="py-8 text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          {recentEnquiries.length > 0 ? (
            recentEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="flex cursor-pointer items-center space-x-4 rounded-md p-2 transition-colors hover:bg-muted/50"
              >
                <img
                  src={enquiry.productImage}
                  alt={enquiry.productName}
                  className="h-14 w-14 rounded-md border object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{enquiry.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        From: {enquiry.customerName}
                      </p>
                    </div>
                    <Badge variant={enquiry.type === 'Quote' ? 'default' : 'secondary'}>
                      {enquiry.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No recent enquiries found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}