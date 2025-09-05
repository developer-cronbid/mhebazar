// src/components/quotes/quotesDetails.tsx

"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, User, ClipboardList, Building } from "lucide-react";

// --- Types (Unchanged) ---
interface ApiQuote {
  id: number;
  product_details: {
    id: number;
    name: string;
    description: string;
    manufacturer: string;
    model: string;
    price: string;
    images: { id: number; image: string }[];
  };
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface ArchivedQuote {
  id: string;
  name: string;
  email: string;
  no: string;
  cname: string;
  lcation: string | null;
  pname: string;
  meg: string;
  created_at: string;
  brand?: string; // Optional brand/model properties
  model?: string;
}

export type Quote = ApiQuote | ArchivedQuote;

interface QuoteDetailsSheetProps {
  quote: Quote | null;
  isOpen: boolean;
  isUpdating: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApprove: (quoteId: number) => void;
  onReject: (quoteId: number) => void;
}

// --- UI Helper Components (Unchanged) ---
const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-3">
      {icon}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-3 rounded-lg border bg-gray-50/50 p-4">{children}</div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode; }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 items-start">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="col-span-2 text-sm text-gray-900 break-words">{value}</dd>
  </div>
);

// --- Main Component ---
export const QuoteDetailsSheet = ({
  quote,
  isOpen,
  isUpdating,
  onOpenChange,
  onApprove,
  onReject,
}: QuoteDetailsSheetProps) => {
  const displayData = useMemo(() => {
    if (!quote) return null;

    const isApiQuote = (q: Quote): q is ApiQuote => "product_details" in q && q.product_details !== null;

    if (isApiQuote(quote)) {
      return {
        id: quote.id,
        status: quote.status,
        isArchived: false,
        productName: quote.product_details.name,
        productManufacturer: quote.product_details.manufacturer || "N/A",
        productModel: quote.product_details.model || "N/A",
        productPrice: `₹${parseFloat(quote.product_details.price).toLocaleString()}`,
        requesterName: quote.full_name,
        requesterCompany: quote.company_name,
        requesterEmail: quote.email,
        requesterPhone: quote.phone,
        requesterLocation: "N/A",
        message: quote.message || "No message provided.",
        createdAt: quote.created_at,
      };
    } else {
      return {
        id: quote.id,
        status: "archived", // Archived quotes have a clear status
        isArchived: true,
        productName: quote.pname,
        productManufacturer: quote.brand || "N/A",
        productModel: quote.model || "N/A",
        productPrice: "N/A",
        requesterName: quote.name,
        requesterCompany: quote.cname,
        requesterEmail: quote.email,
        requesterPhone: quote.no,
        requesterLocation: quote.lcation || "N/A",
        message: quote.meg || "No message provided.",
        createdAt: quote.created_at,
      };
    }
  }, [quote]);

  if (!displayData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl font-bold text-gray-900">
            Quote Request Details
          </SheetTitle>
        </SheetHeader>

        <div className="flex-grow p-6">
          {/* Product Section */}
          <Section title="Product Information" icon={<Package className="h-5 w-5 text-indigo-600" />}>
            <DetailRow label="Product Name" value={<span className="font-bold">{displayData.productName}</span>} />
            <DetailRow label="Manufacturer/Brand" value={displayData.productManufacturer} />
            <DetailRow label="Model" value={displayData.productModel} />
            <DetailRow label="Price" value={displayData.productPrice} />
          </Section>

          {/* Requester Section */}
          <Section title="Requester Information" icon={<User className="h-5 w-5 text-indigo-600" />}>
            <DetailRow label="Name" value={displayData.requesterName} />
            <DetailRow label="Company" value={displayData.requesterCompany} />
            <DetailRow label="Email" value={displayData.requesterEmail} />
            <DetailRow label="Phone" value={displayData.requesterPhone} />
            <DetailRow label="Location" value={displayData.requesterLocation} />
          </Section>

          {/* Quote Section */}
          <Section title="Quote Details" icon={<ClipboardList className="h-5 w-5 text-indigo-600" />}>
            <DetailRow
              label="Status"
              value={
                <Badge
                  variant={
                    displayData.status === "approved"
                      ? "default"
                      : displayData.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                  className="capitalize"
                >
                  {displayData.status}
                </Badge>
              }
            />
            <DetailRow label="Requested At" value={new Date(displayData.createdAt).toLocaleString()} />
            <DetailRow
              label="Message"
              value={
                <p className="whitespace-pre-wrap bg-white p-3 rounded-md border text-sm text-gray-700">
                  {displayData.message}
                </p>
              }
            />
          </Section>
        </div>

        {/* --- FIX APPLIED HERE --- */}
        {/* Footer Actions - Only show for LIVE, PENDING quotes */}
        {displayData.status === "pending" && !displayData.isArchived && (
          <SheetFooter className="mt-auto p-4 border-t bg-gray-50 flex gap-3 flex-col sm:flex-row">
            <Button
              variant={"destructive"}
              className="w-full sm:w-auto"
              onClick={() => onReject(Number(displayData.id))}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
            <Button
              onClick={() => onApprove(Number(displayData.id))}
              disabled={isUpdating}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};