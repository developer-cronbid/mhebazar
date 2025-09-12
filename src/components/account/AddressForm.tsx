// src/components/account/AddressForm.tsx
import { useState, ChangeEvent } from "react";
import { Omit } from "react-hook-form";
import { Plus, Save } from "lucide-react";

interface Address {
  id: string;
  name: string;
  address: string;
  phone: string;
  landmark: string;
  type: 'Home' | 'Office' | 'Other';
  city: string;
  state: string;
  pincode: string;
}

interface AddressFormProps {
  isEditing: boolean;
  initialData: Omit<Address, "id">;
  onSave: (formData: Omit<Address, "id">) => void;
  onCancel: () => void;
}

export default function AddressForm({ isEditing, initialData, onSave, onCancel }: AddressFormProps) {
  const [formData, setFormData] = useState<Omit<Address, "id">>(initialData);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="mb-6 border-2 border-dashed border-blue-200 rounded-lg p-6 bg-blue-50">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{isEditing ? "Edit Address" : "Add New Address"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="addressName" className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              id="addressName"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Home, Office, etc."
              required
            />
          </div>
          <div>
            <label htmlFor="addressType" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="addressType"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
          <textarea
            id="fullAddress"
            name="address"
            value={formData.address}
            onChange={handleFormChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter complete address (House no, Building name, Road name, Area)"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="addressPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              id="addressPhone"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contact number"
              required
              pattern="\d{10}"
              title="Phone number must be 10 digits"
            />
          </div>
          <div>
            <label htmlFor="addressLandmark" className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
            <input
              type="text"
              id="addressLandmark"
              name="landmark"
              value={formData.landmark}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nearby landmark (optional)"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="addressCity" className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              id="addressCity"
              name="city"
              value={formData.city}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City"
              required
            />
          </div>
          <div>
            <label htmlFor="addressState" className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              id="addressState"
              name="state"
              value={formData.state}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="State"
              required
            />
          </div>
          <div>
            <label htmlFor="addressPincode" className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              id="addressPincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="6-digit pincode"
              required
              maxLength={6}
              pattern="\d{6}"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Save size={16} />
            {isEditing ? "Update Address" : "Add Address"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}