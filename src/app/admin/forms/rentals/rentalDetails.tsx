"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, User, ClipboardList, Undo2, Mail, Phone } from "lucide-react";

// --- Types (Updated) ---
interface Image {
  id: number;
  image: string;
}

interface ProductDetails {
  name: string;
  user_name: string; // Vendor name
  price?: string | null;
  images: Image[];
  model?: string | null;
  manufacturer?: string | null;
}

// MODIFICATION: Expanded the Rental interface to include all fields from rentData.json
interface Rental {
  id: number | string;
  product_details: ProductDetails;
  user_name: string; // Requester's name
  email?: string | null;
  no?: string | null; // Phone number
  start_date: string;
  end_date: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  created_at: string;
  rentbuy?: string | null; // Added rent/buy preference
}

interface RentalDetailsSheetProps {
  rental: Rental | null;
  isOpen: boolean;
  isUpdating: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // MODIFICATION: Updated rentalId to accept string for archived items
  onUpdateStatus: (rentalId: number | string, action: 'approve' | 'reject' | 'mark_returned') => void;
}

// --- UI Helpers ---
const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      {children}
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode; }) => (
  <div className="grid grid-cols-3 gap-4 items-start">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="col-span-2 text-sm text-gray-900 break-words">{value}</dd>
  </div>
);

// --- Main Component (Updated) ---
export const RentalDetailsSheet = ({ rental, isOpen, isUpdating, onOpenChange, onUpdateStatus }: RentalDetailsSheetProps) => {
  if (!rental) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto flex flex-col">
        <SheetHeader className="pb-5 border-b border-gray-100">
          <SheetTitle className="text-xl font-semibold text-gray-900">
            Rental Request Details
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 pb-0">
          {/* Product Section */}
          <Section title="Product Information" icon={<Package className="h-5 w-5 text-gray-600" />}>
            {rental.product_details.images?.length > 0 && (
              <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4">
                {rental.product_details.images.map((img) => (
                  <a href={img.image} target="_blank" rel="noopener noreferrer" key={img.id}>
                    <img
                      src={img.image}
                      alt="Product"
                      className="w-28 h-28 object-cover rounded-lg border flex-shrink-0 transition-transform hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            )}
            <DetailRow label="Product Name" value={<span className="font-medium">{rental.product_details.name || "Not Specified"}</span>} />
            <DetailRow label="Vendor" value={rental.product_details.user_name} />
            {/* MODIFICATION: Conditionally render fields to avoid showing "N/A" */}
            {rental.product_details.model && <DetailRow label="Model" value={rental.product_details.model} />}
            {rental.product_details.manufacturer && <DetailRow label="Manufacturer" value={rental.product_details.manufacturer} />}
            {rental.product_details.price && rental.product_details.price !== 'N/A' && (
              <DetailRow label="Price" value={`₹${Number(rental.product_details.price).toLocaleString()} / day`} />
            )}
          </Section>

          {/* Rental Section */}
          <Section title="Rental Details" icon={<ClipboardList className="h-5 w-5 text-gray-600" />}>
            <DetailRow
              label="Status"
              value={
                <Badge
                  variant={
                    rental.status === "approved" ? "default" :
                      rental.status === "rejected" ? "destructive" :
                        rental.status === "returned" ? "outline" : "secondary"
                  }
                  className="capitalize"
                >
                  {rental.status}
                </Badge>
              }
            />
            {/* MODIFICATION: Display Request Type (Rent/Buy) if available */}
            {rental.rentbuy && <DetailRow label="Request Type" value={rental.rentbuy} />}
            <DetailRow label="Requested At" value={new Date(rental.created_at).toLocaleString()} />
            <DetailRow label="Start Date" value={new Date(rental.start_date).toLocaleDateString()} />
            <DetailRow label="End Date" value={new Date(rental.end_date).toLocaleDateString()} />
            <DetailRow
              label="Notes"
              value={
                <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border text-sm text-gray-700">
                  {rental.notes || "No notes provided."}
                </p>
              }
            />
          </Section>

          {/* Requester Section */}
          <Section title="Requester Information" icon={<User className="h-5 w-5 text-gray-600" />}>
            <DetailRow label="Name" value={rental.user_name} />
            {/* MODIFICATION: Added Email and Phone Number fields */}
            {rental.email && <DetailRow label="Email" value={<a href={`mailto:${rental.email}`} className="text-blue-600 hover:underline">{rental.email}</a>} />}
            {rental.no && <DetailRow label="Phone" value={<a href={`tel:${rental.no}`} className="text-blue-600 hover:underline">{rental.no}</a>} />}
          </Section>
        </div>

        {/* Footer Actions */}
        <SheetFooter className="mt-auto border-t border-gray-100 bg-white flex gap-3 flex-col sm:flex-row">
          {rental.status === "pending" && (
            <>
              <Button
                variant={"destructive"}
                className="w-full sm:w-auto"
                onClick={() => onUpdateStatus(rental.id, 'reject')}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reject
              </Button>
              <Button
                onClick={() => onUpdateStatus(rental.id, 'approve')}
                disabled={isUpdating}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Approve
              </Button>
            </>
          )}
          {rental.status === "approved" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onUpdateStatus(rental.id, 'mark_returned')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
              Mark as Returned
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};