"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, User, ClipboardList, Undo2 } from "lucide-react";

// --- Types ---
interface Image {
  id: number;
  image: string;
}

interface ProductDetails {
  name: string;
  user_name: string;
  price: string;
  images: Image[];
  model: string;
  manufacturer: string;
}

interface Rental {
  id: number;
  product_details: ProductDetails;
  user_name: string;
  start_date: string;
  end_date: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  created_at: string;
}

interface RentalDetailsSheetProps {
  rental: Rental | null;
  isOpen: boolean;
  isUpdating: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateStatus: (rentalId: number, action: 'approve' | 'reject' | 'mark_returned') => void;
}

// --- UI Helpers ---
const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => (
  <div className="mb-8">
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
  <div className="grid grid-cols-3 gap-4">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="col-span-2 text-sm text-gray-900">{value}</dd>
  </div>
);

// --- Main Component ---
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

        <div className="flex-grow p-6">
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
            <DetailRow label="Product Name" value={<span className="font-medium">{rental.product_details.name}</span>} />
            <DetailRow label="Vendor" value={rental.product_details.user_name} />
            <DetailRow label="Model" value={rental.product_details.model || "N/A"} />
            <DetailRow label="Manufacturer" value={rental.product_details.manufacturer || "N/A"} />
            <DetailRow label="Price" value={`₹${Number(rental.product_details.price).toLocaleString()} / day`} />
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
          </Section>
        </div>

        {/* Footer Actions */}
        <SheetFooter className="mt-auto pt-4 border-t border-gray-100 bg-white flex gap-3 flex-col sm:flex-row">
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