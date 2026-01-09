"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { 
  Trash2, Download, MoreHorizontal, UserCheck, UserX, User, 
  UserMinus, UserPlus, X, Save, Shield, CheckCircle, XCircle, 
  Loader2, ChevronLeft, ChevronRight, Edit, Eye, Image, Upload,
  Mail, Phone, MapPin, Building, Briefcase, FileText
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// --- TYPES AND INTERFACES ---
interface Role {
  id: number;
  name: string;
  description?: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  username: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  last_login: string | null;
  role: Role;
  is_active: boolean;
  is_email_verified: boolean;
  profile_photo: string | null;
  address: any;
  description: string | null;
  user_banner: any[];
}

interface Vendor {
  id: number;
  company_name: string;
  company_email: string;
  company_address: string;
  company_phone: string;
  brand: string | null;
  pcode: string | null;
  gst_no: string | null;
  user: number;
}

interface UserWithVendor extends User {
  vendor?: Vendor;
}

// --- MODAL COMPONENTS ---
interface ViewUserModalProps {
  user: UserWithVendor;
  onClose: () => void;
  onEdit: (user: UserWithVendor) => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b p-6">
          <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
          <div className="flex gap-2">
            <Button onClick={() => onEdit(user)} className="bg-blue-600 hover:bg-blue-700">
              <Edit size={16} className="mr-2" />
              Edit
            </Button>
            <Button onClick={onClose} variant="outline">
              <X size={16} />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
                  {user.profile_photo ? (
                    <img 
                      src={user.profile_photo} 
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-full h-full p-6 text-gray-400" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{user.full_name}</h3>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <div className="flex justify-center gap-2 mb-4">
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={user.is_email_verified ? "default" : "secondary"}>
                    {user.is_email_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <Badge variant={
                    user.role.id === 1 ? "destructive" : 
                    user.role.id === 2 ? "default" : "secondary"
                  }>
                    {user.role.name}
                  </Badge>
                </div>
                {user.description && (
                  <p className="text-sm text-gray-600 text-left">{user.description}</p>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Personal Information</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Username</p>
                          <p className="text-sm text-gray-600">{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-gray-600">{user.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Account Information</Label>
                    <div className="mt-2 space-y-3">
                      <div>
                        <p className="text-sm font-medium">Date Joined</p>
                        <p className="text-sm text-gray-600">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Login</p>
                        <p className="text-sm text-gray-600">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vendor Information */}
                {user.vendor && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Vendor Information</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center gap-3">
                          <Building size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Company</p>
                            <p className="text-sm text-gray-600">{user.vendor.company_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Briefcase size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Brand</p>
                            <p className="text-sm text-gray-600">{user.vendor.brand || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Address</p>
                            <p className="text-sm text-gray-600">{user.vendor.company_address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">GST No</p>
                            <p className="text-sm text-gray-600">{user.vendor.gst_no || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Address Information */}
              {user.address && (
                <div className="mt-6">
                  <Label className="text-sm font-medium text-gray-700">Address</Label>
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(user.address, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditUserModalProps {
  user: UserWithVendor;
  onClose: () => void;
  onSave: (user: UserWithVendor, profilePhoto?: File | null) => Promise<void>;
  isLoading: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState<UserWithVendor>(user);
  const [vendorData, setVendorData] = useState<Vendor | null>(user.vendor || null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.profile_photo);

  const roleOptions = useMemo(() => [
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'VENDOR' },
    { id: 3, name: 'USER' },
  ], []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVendorChange = (field: string, value: any) => {
    setVendorData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const updatedUser = { ...formData, vendor: vendorData || undefined };
    await onSave(updatedUser, profilePhoto);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b p-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit User</h2>
          <Button onClick={onClose} variant="outline">
            <X size={16} />
          </Button>
        </div>

        <div className="overflow-y-auto p-6 max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Photo Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt={formData.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-full h-full p-6 text-gray-400" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mb-4"
                />
                <p className="text-sm text-gray-500">Upload profile photo</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                  
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                {/* Account Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={String(formData.role.id)}
                      onValueChange={(value) => handleInputChange('role', { id: Number(value), name: roleOptions.find(r => r.id === Number(value))?.name })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map(role => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Active Status</Label>
                    <Switch
                      id="isActive"
                      checked={formData.is_active}
                      onCheckedChange={(checked: any) => handleInputChange('is_active', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailVerified">Email Verified</Label>
                    <Switch
                      id="emailVerified"
                      checked={formData.is_email_verified}
                      onCheckedChange={(checked: any) => handleInputChange('is_email_verified', checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Information */}
              {vendorData && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={vendorData.company_name}
                        onChange={(e) => handleVendorChange('company_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={vendorData.company_email}
                        onChange={(e) => handleVendorChange('company_email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPhone">Company Phone</Label>
                      <Input
                        id="companyPhone"
                        value={vendorData.company_phone}
                        onChange={(e) => handleVendorChange('company_phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={vendorData.brand || ''}
                        onChange={(e) => handleVendorChange('brand', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="companyAddress">Company Address</Label>
                      <Textarea
                        id="companyAddress"
                        value={vendorData.company_address}
                        onChange={(e) => handleVendorChange('company_address', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gstNo">GST Number</Label>
                      <Input
                        id="gstNo"
                        value={vendorData.gst_no || ''}
                        onChange={(e) => handleVendorChange('gst_no', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pcode">Pincode</Label>
                      <Input
                        id="pcode"
                        value={vendorData.pcode || ''}
                        onChange={(e) => handleVendorChange('pcode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-[#5CA131] hover:bg-[#4a8f28]"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const UsersTable = () => {
  const [data, setData] = useState<UserWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserWithVendor | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithVendor | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');

  // Pagination and search
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([{ id: 'date_joined', desc: true }]);

  // Fetch vendor data for a specific user
  const fetchVendorData = async (userId: number): Promise<Vendor | null> => {
    try {
      // Fetch vendor data by user ID
      const vendorResponse = await api.get(`/vendor/`, {
        params: { user: userId }
      });
      
      if (vendorResponse.data && vendorResponse.data.results && vendorResponse.data.results.length > 0) {
        return vendorResponse.data.results[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch vendor data for user ${userId}:`, error);
      // Return null on 404 or other errors to prevent crashes
      return null;
    }
  };

  // Fetch data
  // --- MODIFIED fetchAllData Logic ---
  const fetchAllData = useCallback(async () => {
    setLoading(true); // Only show loader for the very first batch
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('is_email_verified', statusFilter === 'verified' ? 'true' : 'false');
      }
      if (roleFilter !== 'all') {
        params.append('role__name', roleFilter);
      }

      let nextPage = 1;
      let hasMore = true;
      const allDataAccumulator: UserWithVendor[] = [];

      while (hasMore) {
        const response = await api.get(`/users/`, {
          params: {
            ...Object.fromEntries(params.entries()),
            page: String(nextPage),
            page_size: '100',
          },
        });
        
        // Fetch vendor data for this specific batch
        const batchWithVendors = await Promise.all(
          response.data.results.map(async (user: User) => {
            if (user.role.id === 2) {
              const vendorData = await fetchVendorData(user.id);
              return { ...user, vendor: vendorData || undefined };
            }
            return user;
          })
        );

        allDataAccumulator.push(...batchWithVendors);

        // --- THE "CHEAT" LOGIC ---
        // If this is the first page, show it to the user immediately
        if (nextPage === 1) {
          setData([...allDataAccumulator]);
          setLoading(false); // Hide spinner so user can start interacting
        } else {
          // Update data silently in background for subsequent pages
          setData([...allDataAccumulator]);
        }

        if (response.data.next) {
          nextPage++;
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setLoading(false);
    }
  }, [statusFilter, roleFilter]);
  
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Create FormData for file uploads (FIXED to handle role_id, booleans, and nulls)
  const createFormData = (data: any, file?: File | null): FormData => {
    const formData = new FormData();
    
    // Append all user data
    Object.keys(data).forEach(key => {
      // 1. Skip objects and complex types (except File/Blob)
      if (key === 'vendor' || key === 'full_name' || key === 'date_joined' || key === 'last_login' || key === 'address' || key === 'user_banner' || key === 'is_account_locked') return; 
      
      // 2. Handle Role ID explicitly
      if (key === 'role' && data[key] && data[key].id) {
        formData.append('role_id', String(data[key].id));
      } 
      // 3. Handle booleans
      else if (typeof data[key] === 'boolean') {
        formData.append(key, data[key] ? 'true' : 'false');
      }
      // 4. Handle simple types and strings (including nulls as empty string or simply exclude)
      else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });

    // 5. Append profile photo if exists
    if (file) {
      formData.append('profile_photo', file);
    }

    return formData;
  };

  // Action handlers
  const handleUserUpdate = async (updatedUser: UserWithVendor, profilePhoto?: File | null) => {
    setIsUpdating(true);
    try {
      // 1. Prepare User Data for PATCH/Multipart
      const userFormData = createFormData(updatedUser, profilePhoto);
      
      // 2. Update user data with multipart/form-data
      const userResponse = await api.patch(`/users/${updatedUser.id}/`, userFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // 3. Update vendor data if user is a vendor
      let vendorResponseData: Vendor | undefined = updatedUser.vendor;
      if (updatedUser.vendor) {
        const vendorResponse = await api.patch(`/vendor/${updatedUser.vendor.id}/`, updatedUser.vendor);
        vendorResponseData = vendorResponse.data;
      }

      // 4. Update local state
      setData(prevData => prevData.map(user => 
        user.id === updatedUser.id ? { 
          ...user, 
          ...userResponse.data, 
          vendor: vendorResponseData || user.vendor,
          role: updatedUser.role // Ensure role object is updated immediately from form data
        } : user
      ));

      setEditingUser(null);
      alert('User updated successfully!');
    } catch (error: any) {
      console.error("Failed to update user:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Error updating user. Check console for details.';
      alert(`Failed to update user: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUserDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${userId}/`);
      setData(prevData => prevData.filter(user => user.id !== userId));
      alert('User deleted successfully.');
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      const errorMessage = error.response?.data?.detail || 'Error deleting user. Check console for details.';
      alert(`Failed to delete user: ${errorMessage}`);
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(id => parseInt(id));
    if (selectedIds.length === 0) {
      alert('Please select users to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;

    try {
      // Delete users one by one, suppressing 404 errors for robustness
      const deletePromises = selectedIds.map(async (id) => {
        try {
          await api.delete(`/users/${id}/`);
          return { id, success: true };
        } catch (error: any) {
          // 💥 FIX: Suppress 404 Not Found error (means user was already deleted by another request)
          if (error.response?.status === 404) {
             return { id, success: true, warning: 'User not found, assumed already deleted.' };
          }
          console.error(`Failed to delete user ${id}:`, error);
          return { id, success: false, error: error.response?.data?.detail || 'Unknown error' };
        }
      });

      const results = await Promise.all(deletePromises);
      
      const successfulDeletes = results.filter(result => result.success);
      const failedDeletes = results.filter(result => !result.success);

      // Update data state with successful deletes (including 404s)
      setData(prevData => prevData.filter(user => !successfulDeletes.some(d => d.id === user.id)));
      setRowSelection({});

      if (failedDeletes.length > 0) {
        alert(`${successfulDeletes.length} users deleted successfully (or already deleted). Failed to delete ${failedDeletes.length} users.`);
      } else {
        alert(`${successfulDeletes.length} users deleted successfully.`);
      }
    } catch (error) {
      console.error("Failed to delete users:", error);
      alert('Error deleting users. Check console for details.');
    }
  };

  // Table configuration
  const columns = useMemo<ColumnDef<UserWithVendor>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300 text-[#5CA131] focus:ring-[#5CA131]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300 text-[#5CA131] focus:ring-[#5CA131]"
          />
        ),
        size: 40,
      },
      {
        header: 'ID',
        accessorKey: 'id',
        size: 60,
      },
      {
        accessorKey: 'profile_photo',
        header: 'Photo',
        size: 70,
        cell: ({ row }) => (
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
            {row.original.profile_photo ? (
              <img 
                src={row.original.profile_photo} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-full h-full p-1 text-gray-400" />
            )}
          </div>
        ),
      },
      {
        accessorKey: 'full_name',
        header: 'Full Name',
        size: 150,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        size: 120,
        cell: info => info.getValue() || 'N/A',
      },
      {
        accessorKey: 'role.id',
        header: 'Role',
        size: 100,
        cell: ({ row }) => {
          const roleId = row.original.role.id;
          const roleName = row.original.role.name;
          const colorClass = 
            roleId === 1 ? 'bg-red-100 text-red-800' : 
            roleId === 2 ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800';
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
              {roleName}
            </span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 100,
        cell: ({ row }) => (
          <div className='flex flex-col gap-1'>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              row.original.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {row.original.is_active ? 'Active' : 'Inactive'}
            </span>
            {row.original.vendor && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                Vendor
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'date_joined',
        header: 'Joined',
        size: 120,
        cell: info => new Date(info.getValue() as string).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 100,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewingUser(row.original)}>
                <Eye size={16} className="mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditingUser(row.original)}>
                <Edit size={16} className="mr-2" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleUserDelete(row.original.id)}
                className="text-red-600"
              >
                <Trash2 size={16} className="mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  // Filter and paginate data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply vendor filter
    if (vendorFilter !== 'all') {
      result = result.filter(user => 
        vendorFilter === 'vendor' ? user.vendor : !user.vendor
      );
    }

    // Apply search filter
    if (globalFilter) {
      const filterValue = globalFilter.toLowerCase();
      result = result.filter(user =>
        user.full_name?.toLowerCase().includes(filterValue) ||
        user.email?.toLowerCase().includes(filterValue) ||
        user.username?.toLowerCase().includes(filterValue) ||
        user.phone?.toLowerCase().includes(filterValue) ||
        user.vendor?.company_name?.toLowerCase().includes(filterValue)
      );
    }

    // Apply sorting
    if (sortBy.length > 0) {
      const { id, desc } = sortBy[0];
      result.sort((a, b) => {
        const aVal = (a as any)[id];
        const bVal = (b as any)[id];
        
        if (id === 'role.id') return desc ? bVal - aVal : aVal - bVal;
        if (id === 'date_joined') {
          return desc ? new Date(bVal).getTime() - new Date(aVal).getTime() 
                     : new Date(aVal).getTime() - new Date(bVal).getTime();
        }
        
        return desc ? String(bVal).localeCompare(String(aVal)) 
                   : String(aVal).localeCompare(String(bVal));
      });
    }

    return result;
  }, [data, vendorFilter, globalFilter, sortBy]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const table = useReactTable({
    data: paginatedData,
    columns,
    state: { 
      sorting: sortBy,
      rowSelection,
    },
    onSortingChange: setSortBy,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="bg-white p-6 min-h-screen">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users, roles, and vendor accounts</p>
          </div>
          <div className="flex gap-3">
            {Object.keys(rowSelection).length > 0 && (
              <Button 
                onClick={handleBulkDelete}
                variant="destructive"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Selected ({Object.keys(rowSelection).length})
              </Button>
            )}
            <Button
              onClick={() => {
                // Export functionality
                const csvContent = [
                  ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Joined Date'],
                  ...filteredData.map(user => [
                    user.id,
                    user.full_name,
                    user.email,
                    user.phone || 'N/A',
                    user.role.name,
                    user.is_active ? 'Active' : 'Inactive',
                    new Date(user.date_joined).toLocaleDateString()
                  ])
                ].map(row => row.join(',')).join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'users.csv';
                a.click();
              }}
              disabled={loading || filteredData.length === 0}
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Role:</span>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="not_verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Vendor:</span>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="vendor">Vendors Only</SelectItem>
                  <SelectItem value="non-vendor">Non-Vendors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[300px]">
              <Input
                placeholder="Search users..."
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-1 ${
                              header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="text-gray-400">
                                {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? '↕'}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center">
                      <Loader2 className="animate-spin mx-auto text-[#5CA131]" size={24} />
                      <p className="mt-2 text-gray-600">Loading users...</p>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Showing {paginatedData.length} of {filteredData.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewingUser && (
        <ViewUserModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onEdit={setEditingUser}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUserUpdate}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

export default UsersTable;