/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, ChangeEvent, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User, Mail, MapPin, Edit2, Plus, Trash2, LogOut, ShoppingBag, Phone,
  Calendar, Building2, Home, Briefcase, Navigation, Save, Menu, X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import AddressForm from "@/components/account/AddressForm";

// --- Type Definitions ---
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

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  address: Address[] | null;
  date_joined: string;
  profile_photo: string | null;
}

interface ProfileFormState {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

// --- Constants ---
const MAX_ADDRESSES = 5;

const TABS = [
  { key: "profile", label: "Personal Info", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "contact", label: "Contact", icon: Phone },
];

// --- Main Account Page Component ---
export default function AccountPage() {
  const { user: currentUser, logout, setUser: setGlobalUser } = useUser();

  const [activeTab, setActiveTab] = useState("profile");
  const [userLoading, setUserLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfileData | null>(null);

  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    first_name: '', last_name: '', phone: '', email: '',
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddressForm, setCurrentAddressForm] = useState<Omit<Address, "id">>({
    name: "", address: "", phone: "", landmark: "", type: "Home", city: "", state: "", pincode: "",
  });

  const [editContact, setEditContact] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Data Fetching Logic ---
  const fetchCurrentUserProfile = useCallback(async () => {
    if (!currentUser?.id) {
      setUserLoading(false);
      return;
    }
    setUserLoading(true);
    try {
      const response = await api.get<UserProfileData>(`/users/me/`);
      const fetchedUser = response.data;
      setUserData(fetchedUser);

      if (Array.isArray(fetchedUser.address)) {
        setAddresses(fetchedUser.address);
      } else {
        setAddresses([]);
      }

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
      setUserLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCurrentUserProfile();
  }, [fetchCurrentUserProfile]);

  // --- Profile Info Handlers ---
  const handleProfileFormChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleProfileSave = async () => {
    if (!currentUser?.id) {
      toast.error("User not logged in. Cannot save profile.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('first_name', profileForm.first_name);
      formData.append('last_name', profileForm.last_name);
      formData.append('phone', profileForm.phone || '');
      formData.append('email', profileForm.email);

      const response = await api.patch<UserProfileData>(`/users/${currentUser.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setGlobalUser(response.data);
      toast.success("Profile updated successfully!");
      setEditProfile(false);
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorMessages = Object.values(error.response.data).flat().join(' ');
        toast.error(`Failed to save profile: ${errorMessages}`);
      } else {
        toast.error("Failed to save profile changes. Please try again.");
      }
    }
  };

  // --- Address Management Handlers ---
  const resetAddressFormState = useCallback(() => {
    setCurrentAddressForm({ name: "", address: "", phone: "", landmark: "", type: "Home", city: "", state: "", pincode: "" });
    setShowAddressForm(false);
    setIsEditingAddress(false);
  }, []);

  const handleEditAddress = useCallback((addr: Address) => {
    setCurrentAddressForm({ ...addr });
    setShowAddressForm(true);
    setIsEditingAddress(true);
    setActiveTab('addresses');
  }, []);

  const handleDeleteAddress = async (id: string) => {
    if (!currentUser?.id) return;
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    setAddresses(updatedAddresses);
    await updateUserAddressesInDb(updatedAddresses);
    toast.success("Address deleted successfully!");
  };

  const updateUserAddressesInDb = async (currentAddresses: Address[]) => {
    if (!currentUser?.id) return;
    try {
      const formData = new FormData();
      formData.append('address', JSON.stringify(currentAddresses));

      const response = await api.patch<UserProfileData>(`/users/${currentUser.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setGlobalUser(response.data);
    } catch (error) {
      console.error("Failed to update user addresses in DB:", error);
      toast.error("Failed to sync addresses with your account (DB error).");
    }
  };

  // --- Contact Info Handlers ---
  const handleContactFormChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

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
      setGlobalUser(response.data);
      toast.success("Contact details updated successfully!");
      setEditContact(false);
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
  const getAddressIcon = (type: string) => {
    switch (type) {
      case "Home": return <Home size={16} />;
      case "Office": return <Briefcase size={16} />;
      default: return <Navigation size={16} />;
    }
  };

  if (userLoading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="ml-4 text-gray-600">Loading account information...</p>
      </div>
    );
  }

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
              {/* Profile Picture in Header */}
              <div className="w-10 h-10 relative rounded-xl overflow-hidden flex-shrink-0 bg-white">
                <Image
                  src={userData.profile_photo || `https://ui-avatars.com/api/?name=${userData.first_name}+${userData.last_name}&background=3b82f6&color=fff&size=128`}
                  alt="Avatar"
                  layout="fill"
                  objectFit="contain"
                  className="p-1"
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{userData.full_name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-80 bg-white rounded-xl border border-gray-200 h-fit p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
              {/* Profile Picture in Sidebar */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-blue-100 flex-shrink-0 bg-white p-2">
                <Image
                  src={userData.profile_photo || `https://ui-avatars.com/api/?name=${userData.first_name}+${userData.last_name}&background=3b82f6&color=fff&size=128`}
                  alt="Avatar"
                  layout="fill"
                  objectFit="contain"
                />
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
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden bg-black bg-opacity-50"
                onClick={() => setSidebarOpen(false)}
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                      {/* Profile Picture in Mobile Drawer */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-100 flex-shrink-0 bg-white p-1">
                        <Image
                          src={userData.profile_photo || `https://ui-avatars.com/api/?name=${userData.first_name}+${userData.last_name}&background=3b82f6&color=fff&size=128`}
                          alt="Avatar"
                          layout="fill"
                          objectFit="contain"
                        />
                      </div>
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
                            setSidebarOpen(false);
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
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <main className="flex-1">
            {activeTab === "profile" && (
              <section className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
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
                  {editProfile ? (
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
                            if (userData) {
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
                  ) : (
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

            {activeTab === "addresses" && (
              <section className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Delivery Addresses</h2>
                    {!showAddressForm && addresses.length < MAX_ADDRESSES && (
                      <button
                        onClick={() => {
                          setCurrentAddressForm({ name: "", address: "", phone: "", landmark: "", type: "Home", city: "", state: "", pincode: "" });
                          setShowAddressForm(true);
                          setIsEditingAddress(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                        Add Address
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
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
                    <AnimatePresence>
                      {showAddressForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <AddressForm
                            isEditing={isEditingAddress}
                            initialData={currentAddressForm}
                            onSave={async (formData) => {
                              const newAddress = { ...formData, id: isEditingAddress ? (currentAddressForm as Address).id : String(Date.now()) };
                              const updatedAddresses = isEditingAddress
                                ? addresses.map(addr => addr.id === newAddress.id ? newAddress : addr)
                                : [...addresses, newAddress];
                              
                              setAddresses(updatedAddresses);
                              await updateUserAddressesInDb(updatedAddresses);
                              toast.success(isEditingAddress ? "Address updated successfully!" : "New address added successfully!");
                              resetAddressFormState();
                            }}
                            onCancel={resetAddressFormState}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "contact" && (
              <section className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Phone size={28} className="text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Contact Details</h2>
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
                  {editContact ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="emailInput" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            id="emailInput"
                            name="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
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
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
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
                            if (userData) {
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
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-lg">
                        <Mail size={20} className="text-blue-600" />
                        <span>{userData.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-lg">
                        <Phone size={20} className="text-blue-600" />
                        <span>{userData.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-lg">
                        <Building2 size={20} className="text-blue-600" />
                        <span>
                            {addresses[0]?.city || 'N/A'}, {addresses[0]?.state || 'N/A'}, {addresses[0]?.pincode || 'N/A'}
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