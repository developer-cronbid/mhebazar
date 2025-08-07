// components/cart/AddressStep.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useUser } from '@/context/UserContext'; // Import useUser hook for user object

interface Address {
  id: string; // Client-side generated ID for managing addresses in array
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  address: string; // Full address string (e.g., "House no, Building, Street, Area")
  city: string;
  state: string;
  pincode: string;
}

interface AddressStepProps {
  onNext: (address: string, phone: string) => void;
  onBack: () => void;
}

export default function AddressStep({ onNext, onBack }: AddressStepProps) {
  const { user } = useUser(); // Only get user, not fetchUser
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [currentAddressForm, setCurrentAddressForm] = useState<Omit<Address, 'id'>>({
    type: 'home',
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Load user addresses from backend on component mount or when user changes
  useEffect(() => {
    const loadUserAddresses = async () => {
      if (user?.id) {
        setIsLoadingAddresses(true);
        try {
          // Fetch the latest user data including the address JSONField
          const response = await api.get(`/users/me/`); // Using /users/me/ endpoint
          const userAddresses = response.data.address; // This is the JSONField 'address'
          if (Array.isArray(userAddresses)) {
            setAddresses(userAddresses as Address[]);
            // Try to set a default selected address
            if (userAddresses.length > 0) {
              const lastSelectedId = localStorage.getItem('selectedShippingAddressId');
              if (lastSelectedId && userAddresses.some((addr: Address) => addr.id === lastSelectedId)) {
                setSelectedAddressId(lastSelectedId);
              } else {
                setSelectedAddressId(userAddresses[0].id); // Select the first address if no previous selection or if saved ID is invalid
              }
            } else {
              setSelectedAddressId(null);
            }
          } else {
            setAddresses([]);
            setSelectedAddressId(null);
          }
        } catch (error) {
          console.error("Failed to fetch user addresses:", error);
          toast.error("Failed to load your saved addresses.");
          setAddresses([]);
          setSelectedAddressId(null);
        } finally {
          setIsLoadingAddresses(false);
        }
      } else {
        setIsLoadingAddresses(false);
        setAddresses([]); // No user, no addresses
        setSelectedAddressId(null);
      }
    };

    loadUserAddresses();
  }, [user]); // Re-fetch if user object changes

  // Function to update user's address JSONField in the backend
  const updateUserAddressesInDb = useCallback(async (updatedAddresses: Address[]) => {
    if (!user?.id) {
      toast.error("User not logged in. Cannot save addresses.");
      return;
    }

    // Convert the addresses array to a JSON string
    const addressJsonString = JSON.stringify(updatedAddresses);

    // Create a FormData object for PATCH request (even if only sending JSON, some DRF setups expect FormData)
    const formData = new FormData();
    formData.append('address', addressJsonString);

    try {
      // Use PATCH to update the specific user's profile, including the address JSONField
      await api.patch(`/users/${user.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads and FormData
        },
      });
      toast.success("Addresses synced with your account.");
      // No fetchUser() call needed here. The UI updates optimistically,
      // and on next load, addresses will be fetched from DB via useEffect.
    } catch (error) {
      console.error("Failed to update user addresses in DB:", error);
      toast.error("Failed to save addresses to your account.");
    }
  }, [user]);


  const resetForm = useCallback(() => {
    setCurrentAddressForm({
      type: 'home',
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    });
    setShowAddNew(false);
    setIsEditing(false);
    setEditingAddressId(null);
  }, []);

  const handleAddOrUpdateAddress = useCallback(() => {
    // Basic validation
    if (!currentAddressForm.name || !currentAddressForm.phone || !currentAddressForm.address || !currentAddressForm.city || !currentAddressForm.state || !currentAddressForm.pincode) {
      toast.error("Please fill in all required fields for the address.");
      return;
    }
    if (!/^\d{10}$/.test(currentAddressForm.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!/^\d{6}$/.test(currentAddressForm.pincode)) {
      toast.error("Please enter a valid 6-digit pincode.");
      return;
    }

    let updatedAddresses: Address[];

    if (isEditing && editingAddressId) {
      updatedAddresses = addresses.map(addr =>
        addr.id === editingAddressId
          ? { ...addr, ...currentAddressForm }
          : addr
      );
      toast.success("Address updated successfully!");
    } else {
      if (addresses.length >= 5) { // Enforce 5-address limit
        toast.error("You can save a maximum of 5 addresses.");
        return;
      }
      const newId = String(Date.now()); // Simple unique client-side ID
      const newAddr: Address = { ...currentAddressForm, id: newId };
      updatedAddresses = [...addresses, newAddr];
      toast.success("New address added successfully!");
    }

    setAddresses(updatedAddresses);
    updateUserAddressesInDb(updatedAddresses); // Sync with backend
    // After adding/updating, ensure selection is valid
    if (!selectedAddressId || updatedAddresses.length === 1 || (isEditing && selectedAddressId === editingAddressId)) {
        // If no address was selected, or it's the first address, or the currently selected address was just edited, select it
        setSelectedAddressId(isEditing && editingAddressId ? editingAddressId : updatedAddresses[updatedAddresses.length - 1].id);
    }
    resetForm();
  }, [addresses, isEditing, editingAddressId, currentAddressForm, resetForm, selectedAddressId, updateUserAddressesInDb]);


  const handleEditClick = useCallback((address: Address) => {
    setCurrentAddressForm({
      type: address.type,
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    });
    setEditingAddressId(address.id);
    setIsEditing(true);
    setShowAddNew(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    setAddresses(updatedAddresses);
    updateUserAddressesInDb(updatedAddresses); // Sync with backend

    if (selectedAddressId === id) {
      setSelectedAddressId(updatedAddresses.length > 0 ? updatedAddresses[0].id : null);
    }
    toast.success("Address deleted successfully!");
  }, [addresses, selectedAddressId, updateUserAddressesInDb]);

  const handleContinue = useCallback(() => {
    const selected = addresses.find(addr => addr.id === selectedAddressId);
    if (selected) {
      const fullAddressString = `${selected.address}, ${selected.city}, ${selected.state} - ${selected.pincode}`;
      // Store the full address string and phone number to localStorage for PaymentStep
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedShippingAddress', fullAddressString);
        localStorage.setItem('selectedShippingPhoneNumber', selected.phone);
        localStorage.setItem('selectedShippingAddressId', selected.id); // Save ID for persistence
      }
      onNext(fullAddressString, selected.phone);
    } else {
      toast.error("Please select a delivery address to continue.");
    }
  }, [addresses, selectedAddressId, onNext]);

  if (isLoadingAddresses) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <p className="ml-4 text-gray-600">Loading addresses...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 gap-8">
        {/* Address Selection & Add New Form */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Delivery Address
            </h2>
            <Button
              variant="outline"
              onClick={() => { resetForm(); setShowAddNew(true); }}
              className="flex items-center"
              disabled={addresses.length >= 5 && !showAddNew} // Disable "Add New" if 5 addresses are saved and form not open
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          </div>

          {/* Saved Addresses List */}
          <div className="space-y-4 mb-6">
            {addresses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No saved addresses. Please add one to proceed.
              </p>
            ) : (
              <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
                {addresses.map((address) => (
                  <motion.div
                    key={address.id}
                    whileHover={{ scale: 1.01 }}
                    className="relative"
                  >
                    <Card className={`cursor-pointer transition-all ${
                      selectedAddressId === address.id ? 'ring-2 ring-green-600 border-green-600' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={address.id}
                            id={address.id}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{address.name}</span>
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full capitalize">
                                  {address.type}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(address); }}
                                  aria-label="Edit address"
                                >
                                  <Edit className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(address.id); }}
                                  aria-label="Delete address"
                                >
                                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{address.phone}</p>
                            <p className="text-sm text-gray-700 mb-1">{address.address}</p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </RadioGroup>
            )}
          </div>

          {/* Add/Edit New Address Form */}
          <AnimatePresence>
            {showAddNew && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{isEditing ? "Edit Address" : "Add New Address"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Address Type Selection */}
                      <div className="md:col-span-2">
                        <Label>Address Type</Label>
                        <RadioGroup
                          value={currentAddressForm.type}
                          onValueChange={(value: 'home' | 'work' | 'other') => setCurrentAddressForm(prev => ({ ...prev, type: value }))}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="home" id="type-home" />
                            <Label htmlFor="type-home">Home</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="work" id="type-work" />
                            <Label htmlFor="type-work">Work</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="type-other" />
                            <Label htmlFor="type-other">Other</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={currentAddressForm.name}
                          onChange={(e) => setCurrentAddressForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter full name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={currentAddressForm.phone}
                          onChange={(e) => setCurrentAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+91 9876543210"
                          className="mt-1"
                          type="tel"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address (House no, Building name, Road name, Area) *</Label>
                        <Textarea
                          id="address"
                          value={currentAddressForm.address}
                          onChange={(e) => setCurrentAddressForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="House no, Building name, Road name, Area"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={currentAddressForm.city}
                          onChange={(e) => setCurrentAddressForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={currentAddressForm.state}
                          onChange={(e) => setCurrentAddressForm(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          value={currentAddressForm.pincode}
                          onChange={(e) => setCurrentAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                          placeholder="6-digit pincode"
                          className="mt-1"
                          maxLength={6}
                          type="text"
                          pattern="\d{6}"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <Button onClick={handleAddOrUpdateAddress} className="bg-[#5CA131] hover:bg-green-700">
                        {isEditing ? "Update Address" : "Save Address"}
                      </Button>
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons for Navigation */}
        <div className="lg:col-span-3 flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onBack}>
            Back to Cart
          </Button>
          <Button
            onClick={handleContinue}
            className="bg-[#5CA131] hover:bg-green-700"
            disabled={!selectedAddressId || addresses.length === 0}
          >
            Continue to Payment
          </Button>
        </div>
      </div>
    </motion.div>
  );
}