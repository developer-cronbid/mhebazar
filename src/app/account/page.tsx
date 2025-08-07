/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/account/page.tsx
"use client"; // This component runs on the client-side

import { useEffect, useState, ChangeEvent, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User, Mail, MapPin, Edit2, Plus, Trash2, LogOut, ShoppingBag, Phone,
  Calendar, Building2, Home, Briefcase, Navigation, Save, Menu, X
} from "lucide-react";
import { toast } from "sonner"; // For professional-looking toast notifications
import api from "@/lib/api"; // Your Axios instance for API calls
import { useUser } from "@/context/UserContext"; // Custom hook to access user data and global setUser
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios"; // For error handling with Axios

// --- Type Definitions ---
// Define the structure for an Address object, as stored in the User's 'address' JSONField
interface Address {
  id: string; // Client-side unique ID for managing array items
  name: string; // e.g., "Home", "Office"
  address: string; // Full street address
  phone: string; // Contact phone for this address
  landmark: string; // Nearby landmark (optional)
  type: 'Home' | 'Office' | 'Other'; // Type of address
  city: string;
  state: string;
  pincode: string;
}

// Define the structure for the User profile data fetched from API
interface UserProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string; // Derived field from backend
  phone: string | null;
  address: Address[] | null; // JSONField can be null or an array of Address
  date_joined: string;
  profile_photo: string | null;
}

// Define the structure for the profile/contact form state
interface ProfileFormState {
  first_name: string;
  last_name: string;
  phone: string;
  email: string; // Assuming email is also part of profile/contact editable fields
}

// --- Constants ---
const MAX_ADDRESSES = 5; // Maximum number of addresses a user can save

const TABS = [
  { key: "profile", label: "Personal Info", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "contact", label: "Contact", icon: Phone },
];

// --- Main Account Page Component ---
export default function AccountPage() {
  // --- Global State from Context ---
  const { user: currentUser, logout, setUser: setGlobalUser } = useUser();

  // --- Local Component States ---
  const [activeTab, setActiveTab] = useState("profile");
  const [userLoading, setUserLoading] = useState(true); // Tracks initial user data loading
  const [userData, setUserData] = useState<UserProfileData | null>(null); // Stores fetched user data

  // States for Profile Info tab
  const [editProfile, setEditProfile] = useState(false); // Controls edit mode for personal info
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    first_name: '', last_name: '', phone: '', email: '',
  });

  // States for Address tab
  const [addresses, setAddresses] = useState<Address[]>([]); // Array of user's saved addresses
  const [showAddressForm, setShowAddressForm] = useState(false); // Controls visibility of add/edit address form
  const [isEditingAddress, setIsEditingAddress] = useState(false); // True if editing existing address, false if adding new
  const [currentAddressForm, setCurrentAddressForm] = useState<Omit<Address, "id">>({
    name: "", address: "", phone: "", landmark: "", type: "Home", city: "", state: "", pincode: "",
  });

  // States for Contact tab
  const [editContact, setEditContact] = useState(false); // Controls edit mode for contact info

  // State for mobile sidebar navigation
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Data Fetching Logic ---
  // Fetches the current user's profile and addresses from the backend
  const fetchCurrentUserProfile = useCallback(async () => {
    if (!currentUser?.id) { // Only fetch if a user is logged in
      setUserLoading(false);
      return;
    }
    setUserLoading(true); // Indicate loading starts
    try {
      const response = await api.get<UserProfileData>(`/users/me/`); // API call to get user's own profile
      const fetchedUser = response.data;
      setUserData(fetchedUser); // Store fetched data

      // Initialize addresses state from fetched user data's JSONField
      if (Array.isArray(fetchedUser.address)) {
        setAddresses(fetchedUser.address);
      } else {
        setAddresses([]); // Ensure it's an empty array if null/not array
      }

      // Initialize profile and contact forms with fetched data
      setProfileForm({
        first_name: fetchedUser.first_name || '',
        last_name: fetchedUser.last_name || '',
        phone: fetchedUser.phone || '',
        email: fetchedUser.email || '',
      });

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load your account information. Please try again.");
      setUserData(null);
      setAddresses([]);
    } finally {
      setUserLoading(false); // Indicate loading ends
    }
  }, [currentUser]); // Dependency: re-fetch if currentUser object changes (e.g., after login/logout)

  // Trigger data fetching on component mount or when dependencies change
  useEffect(() => {
    fetchCurrentUserProfile();
  }, [fetchCurrentUserProfile]); // fetchCurrentUserProfile is a useCallback, so its dependencies are stable

  // --- Profile Info Handlers ---
  const handleProfileFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    if (!currentUser?.id) {
      toast.error("User not logged in. Cannot save profile.");
      return;
    }

    try {
      // Create FormData to send data, as backend expects multipart/form-data
      const formData = new FormData();
      formData.append('first_name', profileForm.first_name);
      formData.append('last_name', profileForm.last_name);
      formData.append('phone', profileForm.phone || ''); // Send empty string for null phone

      // If email is directly editable on the User model
      formData.append('email', profileForm.email); 

      // Send PATCH request to update user profile
      const response = await api.patch<UserProfileData>(`/users/${currentUser.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Essential header for FormData
        },
      });
      setGlobalUser(response.data); // Update global user context with the latest user data
      toast.success("Profile updated successfully!");
      setEditProfile(false); // Exit edit mode
    } catch (error: any) { // Use 'any' here for AxiosError if structure is unpredictable
      console.error("Failed to save profile:", error);
      if (axios.isAxiosError(error) && error.response?.data) {
        // Concatenate all error messages from backend response
        const errorMessages = Object.values(error.response.data).flat().join(' ');
        toast.error(`Failed to save profile: ${errorMessages}`);
      } else {
        toast.error("Failed to save profile changes. Please try again.");
      }
    }
  };

  // --- Address Management Handlers ---

  // Resets the address form to its initial empty state and hides it
  const resetAddressFormState = useCallback(() => { // Renamed for clarity
    setCurrentAddressForm({ name: "", address: "", phone: "", landmark: "", type: "Home", city: "", state: "", pincode: "" });
    setShowAddressForm(false);
    setIsEditingAddress(false);
  }, []);

  // Handles changes in the add/edit address form fields
  const handleAddressFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCurrentAddressForm({ ...currentAddressForm, [e.target.name]: e.target.value });
  };

  // Handles adding a new address or updating an existing one
  const handleAddOrUpdateAddress = async () => {
    if (!currentUser?.id) {
      toast.error("User not logged in. Cannot save addresses.");
      return;
    }
    // Form validation
    if (!currentAddressForm.name || !currentAddressForm.address || !currentAddressForm.phone || !currentAddressForm.city || !currentAddressForm.state || !currentAddressForm.pincode) {
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
    if (isEditingAddress) {
      // If editing, map through existing addresses and update the one that matches
      updatedAddresses = addresses.map(addr =>
        addr.id === currentAddressForm.id // currentAddressForm will have the ID if loaded from an existing address
          ? { ...addr, ...currentAddressForm } // Update the matched address
          : addr // Keep others as they are
      );
      toast.success("Address updated successfully!");
    } else {
      // If adding new, first check limit
      if (addresses.length >= MAX_ADDRESSES) {
        toast.error(`You can save a maximum of ${MAX_ADDRESSES} addresses.`);
        return;
      }
      const newId = String(Date.now()); // Generate a unique client-side ID for the new address
      updatedAddresses = [...addresses, { ...currentAddressForm, id: newId }]; // Add new address
      toast.success("New address added successfully!");
    }

    setAddresses(updatedAddresses); // Optimistically update UI
    await updateUserAddressesInDb(updatedAddresses); // Sync changes to backend
    resetAddressFormState(); // Reset form state and hide form
  };

  // Syncs the client-side addresses array with the backend's JSONField
  const updateUserAddressesInDb = async (currentAddresses: Address[]) => {
    if (!currentUser?.id) return;
    try {
      const formData = new FormData();
      // Stringify the entire addresses array as it's a JSONField in Django
      formData.append('address', JSON.stringify(currentAddresses));

      const response = await api.patch<UserProfileData>(`/users/${currentUser.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setGlobalUser(response.data); // Update global user context with latest user data (including addresses)
    } catch (error) {
      console.error("Failed to update user addresses in DB:", error);
      toast.error("Failed to sync addresses with your account (DB error).");
    }
  };

  // Populates the form with data of an existing address for editing
  const handleEditAddress = useCallback((addr: Address) => {
    setCurrentAddressForm({ ...addr }); // Load address data into form
    setShowAddressForm(true); // Show the form
    setIsEditingAddress(true); // Set to edit mode
  }, []);

  // Deletes an address from the list and syncs with backend
  const handleDeleteAddress = async (id: string) => {
    if (!currentUser?.id) return;
    // Filter out the address to be deleted
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    setAddresses(updatedAddresses); // Optimistically update UI
    await updateUserAddressesInDb(updatedAddresses); // Sync with backend
    toast.success("Address deleted successfully!");
  };

  // --- Contact Info Handlers ---
  const handleContactFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleContactSave = async () => {
    if (!currentUser?.id) return;
    try {
      const formData = new FormData();
      formData.append('email', profileForm.email);
      formData.append('phone', profileForm.phone || '');

      const response = await api.patch<UserProfileData>(`/users/${currentUser.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setGlobalUser(response.data); // Update global user context
      toast.success("Contact details updated successfully!");
      setEditContact(false); // Exit edit mode
    } catch (error: any) {
      console.error("Failed to save contact details:", error);
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorMessages = Object.values(error.response.data).flat().join(' ');
        toast.error(`Failed to save contact details: ${errorMessages}`);
      } else {
        toast.error("Failed to save contact details.");
      }
    }
  };

  // --- Helper Functions for UI ---
  // Returns an icon based on address type
  const getAddressIcon = (type: string) => {
    switch (type) {
      case "Home": return <Home size={16} />;
      case "Office": return <Briefcase size={16} />;
      default: return <Navigation size={16} />; // Generic icon for 'Other'
    }
  };

  // --- Loading State Display ---
  if (userLoading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="ml-4 text-gray-600">Loading account information...</p>
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
              <Image src={userData.profile_photo || `https://ui-avatars.com/api/?name=${userData.first_name}+${userData.last_name}&background=3b82f6&color=fff&size=128`} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium text-gray-700">{userData.full_name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-80 bg-white rounded-xl border border-gray-200 h-fit p-6">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="relative">
                <Image src={userData.profile_photo || `https://ui-avatars.com/api/?name=${userData.first_name}+${userData.last_name}&background=3b82f6&color=fff&size=128`} alt="Avatar" width={64} height={64} className="w-16 h-16 rounded-full border-2 border-blue-100" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{userData.full_name}</h3>
                <p className="text-sm text-gray-500 truncate">{userData.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{(userData as any).totalOrders || 0} Orders</span>
                  <span className="text-xs text-gray-500">Since {new Date(userData.date_joined).getFullYear()}</span>
                </div>
              </div>
            </div>
            <nav className="space-y-2">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === tab.key ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
              <Link href="/account/orders" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
                <ShoppingBag size={20} />
                <span className="font-medium">My Orders</span>
              </Link>
              <Link href="/contact" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
                <Phone size={20} />
                <span className="font-medium">Contact Support</span>
              </Link>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all mt-4">
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Mobile Sidebar (Drawer) */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} /> {/* Overlay */}
              <div className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 animate-slide-in-left"> {/* Drawer panel */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                    <Image src={userData.profile_photo || `https://ui-avatars.com/api/?name=${userData.first_name}+${userData.last_name}&background=3b82f6&color=fff&size=128`} alt="Avatar" width={48} height={48} className="w-12 h-12 rounded-full border-2 border-blue-100" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{userData.full_name}</h3>
                      <p className="text-sm text-gray-500">{userData.email}</p>
                    </div>
                  </div>
                  <nav className="space-y-2">
                    {TABS.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setSidebarOpen(false); // Close sidebar on tab click
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                          activeTab === tab.key ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <tab.icon size={20} />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Personal Info Tab Content */}
            {activeTab === "profile" && (
              <section className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                    {!editProfile && (
                      <button
                        onClick={() => setEditProfile(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit2 size={16} />
                        Edit Profile
                      </button>
                    )}
                  </div>
                  {editProfile ? ( // Render edit form if editProfile is true
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            id="firstName"
                            name="first_name"
                            value={profileForm.first_name}
                            onChange={handleProfileFormChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            id="lastName"
                            name="last_name"
                            value={profileForm.last_name}
                            onChange={handleProfileFormChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileFormChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleProfileSave}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save size={16} />
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditProfile(false);
                            if (userData) { // Reset form to original data if cancelled
                              setProfileForm({
                                first_name: userData.first_name || '',
                                last_name: userData.last_name || '',
                                phone: userData.phone || '',
                                email: userData.email || '',
                              });
                            }
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : ( // Render view mode if editProfile is false
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <User className="text-gray-400" size={20} />
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium text-gray-900">{userData.full_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="text-gray-400" size={20} />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{userData.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="text-gray-400" size={20} />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{userData.phone || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="text-gray-400" size={20} />
                          <div>
                            <p className="text-sm text-gray-500">Member Since</p>
                            <p className="font-medium text-gray-900">{new Date(userData.date_joined).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <MapPin className="text-gray-400" size={20} />
                            <div>
                                <p className="text-sm text-gray-500">Primary Address</p>
                                {addresses.length > 0 ? (
                                    <p className="font-medium text-gray-900">
                                        {addresses[0].address}, {addresses[0].city}, {addresses[0].state} - {addresses[0].pincode}
                                    </p>
                                ) : (
                                    <p className="font-medium text-gray-900">No primary address set</p>
                                )}
                            </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Addresses Tab Content */}
            {activeTab === "addresses" && (
              <section className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Delivery Addresses</h2>
                    {/* Show "Add Address" button only if form is not open and max addresses limit not reached */}
                    {!showAddressForm && addresses.length < MAX_ADDRESSES && (
                      <button
                        onClick={() => {
                          resetAddressFormState(); // Reset form state before showing for new add
                          setShowAddressForm(true); // Show the form
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                        Add Address
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {/* Display existing addresses if any, otherwise a message */}
                    {addresses.length === 0 && !showAddressForm ? (
                      <p className="text-gray-500 text-center py-4">No saved addresses. Click Add Address to add one.</p>
                    ) : (
                      addresses.map(addr => (
                        <div key={addr.id} className="flex items-start justify-between border border-blue-100 rounded-lg p-4 bg-white">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getAddressIcon(addr.type)}
                              <h3 className="font-semibold text-gray-900">{addr.name}</h3>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{addr.type}</span>
                            </div>
                            <p className="text-gray-600 mb-1">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-gray-500 text-sm">Phone: {addr.phone}</p>
                            {addr.landmark && <p className="text-gray-400 text-sm">Landmark: {addr.landmark}</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEditAddress(addr)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Add/Edit Address Form (conditionally rendered with AnimatePresence) */}
                    <AnimatePresence>
                      {showAddressForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 border-2 border-dashed border-blue-200 rounded-lg p-6 bg-blue-50"
                        >
                          <h3 className="text-lg font-medium text-gray-900 mb-4">{isEditingAddress ? "Edit Address" : "Add New Address"}</h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="addressName" className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                                <input
                                  type="text"
                                  id="addressName"
                                  name="name"
                                  value={currentAddressForm.name}
                                  onChange={handleAddressFormChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Home, Office, etc."
                                />
                              </div>
                              <div>
                                <label htmlFor="addressType" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                  id="addressType"
                                  name="type"
                                  value={currentAddressForm.type}
                                  onChange={handleAddressFormChange}
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
                                value={currentAddressForm.address}
                                onChange={handleAddressFormChange}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter complete address (House no, Building name, Road name, Area)"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="addressPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                  type="tel"
                                  id="addressPhone"
                                  name="phone"
                                  value={currentAddressForm.phone}
                                  onChange={handleAddressFormChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Contact number"
                                />
                              </div>
                              <div>
                                <label htmlFor="addressLandmark" className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                                <input
                                  type="text"
                                  id="addressLandmark"
                                  name="landmark"
                                  value={currentAddressForm.landmark}
                                  onChange={handleAddressFormChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Nearby landmark (optional)"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Adjusted to 3 columns for city, state, pincode */}
                                <div>
                                    <label htmlFor="addressCity" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                    type="text"
                                    id="addressCity"
                                    name="city"
                                    value={currentAddressForm.city}
                                    onChange={handleAddressFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="City"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="addressState" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                    type="text"
                                    id="addressState"
                                    name="state"
                                    value={currentAddressForm.state}
                                    onChange={handleAddressFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="State"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="addressPincode" className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                    <input
                                    type="text"
                                    id="addressPincode"
                                    name="pincode"
                                    value={currentAddressForm.pincode}
                                    onChange={handleAddressFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="6-digit pincode"
                                    maxLength={6}
                                    pattern="\d{6}"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={handleAddOrUpdateAddress}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                {isEditingAddress ? "Update Address" : "Add Address"}
                              </button>
                              <button
                                onClick={resetAddressFormState} // Use the correct reset function
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>
            )}

            {/* Contact Tab Content */}
            {activeTab === "contact" && (
              <section className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Phone size={28} className="text-blue-600" />
                      <h2 className="text-2xl font-bold">Contact Details</h2>
                    </div>
                    {!editContact && (
                      <button
                        onClick={() => setEditContact(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                    )}
                  </div>
                  {editContact ? ( // Render edit form if editContact is true
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="emailInput" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            id="emailInput"
                            name="email"
                            value={profileForm.email}
                            onChange={handleContactFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            id="contactPhone"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleContactFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleContactSave}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save size={16} />
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditContact(false);
                            if (userData) { // Reset form to original data if cancelled
                                setProfileForm(prev => ({
                                    ...prev,
                                    email: userData.email,
                                    phone: userData.phone || '',
                                }));
                            }
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : ( // Render view mode if editContact is false
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-lg">
                        <Mail size={20} className="text-blue-600" />
                        <span>{userData.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-lg">
                        <Phone size={20} className="text-blue-600" />
                        <span>{userData.phone || 'N/A'}</span>
                      </div>
                      {/* Display location from first address or 'N/A' */}
                      <div className="flex items-center gap-3 text-lg">
                        <Building2 size={20} className="text-blue-600" />
                        <span>
                            {addresses[0]?.city || 'N/A'}, {addresses[0]?.state || 'N/A'}, {addresses[0]?.pincode || 'N/A'} - {addresses[0]?.country || 'India'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}