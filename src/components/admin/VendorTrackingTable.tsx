"use client";

import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, MousePointerClick, Search, FilterX, User, Calendar, Phone, Mail, MapPin, Building2, CreditCard } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// --- Updated Types to match new Serializer ---
interface VendorDetail {
  id: number;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  brand: string;
  pcode: string;
  gst_no: string;
}

interface UserDetail {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  date_joined: string;
  last_login: string;
}

interface TrackingLog {
  id: number;
  user_details: UserDetail;
  vendor_details: VendorDetail[];
  updated_at: string;
}

export default function VendorTrackingTable() {
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("all");
  
  // Modal State
  const [selectedLog, setSelectedLog] = useState<TrackingLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/vendor-tracking/');
      const data = Array.isArray(res.data) ? res.data : res.data.results;
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch tracking logs", error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueVendors = useMemo(() => {
    const brands = new Set<string>();
    logs.forEach(log => {
      log.vendor_details.forEach(v => {
        if (v.brand) brands.add(v.brand);
      });
    });
    return Array.from(brands).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.user_details.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_details.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVendor = 
        selectedVendorFilter === "all" || 
        log.vendor_details.some(v => v.brand === selectedVendorFilter);

      return matchesSearch && matchesVendor;
    });
  }, [logs, searchQuery, selectedVendorFilter]);

  const openDetails = (log: TrackingLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedVendorFilter("all");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#5CA131]" />
          <p className="text-sm text-gray-500 font-medium">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="w-full shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
              <div className="p-2 bg-green-50 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-[#5CA131]" />
              </div>
              User Vendor Interactions
              <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
                {filteredLogs.length}
              </Badge>
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search user or email..."
                  className="pl-9 w-full sm:w-[250px] bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={selectedVendorFilter} onValueChange={setSelectedVendorFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white">
                  <SelectValue placeholder="Filter by Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {uniqueVendors.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchQuery || selectedVendorFilter !== "all") && (
                <Button variant="ghost" size="icon" onClick={clearFilters} className="text-gray-500 hover:text-red-500">
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-600">User Name</TableHead>
                  <TableHead className="font-semibold text-gray-600">Email</TableHead>
                  <TableHead className="font-semibold text-gray-600">Last Clicked</TableHead>
                  <TableHead className="font-semibold text-gray-600">Total Vendors</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                        No results found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {log.user_details.full_name || <span className="text-gray-400 italic">Unknown</span>}
                      </TableCell>
                      <TableCell className="text-gray-600">{log.user_details.email}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(log.updated_at)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100">
                          {log.vendor_details.length} Vendors
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="text-[#5CA131] border-green-200 hover:bg-green-50" onClick={() => openDetails(log)}>
                          <Eye className="w-4 h-4 mr-1.5" /> View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- REDESIGNED DETAIL MODAL --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          
          <DialogHeader className="p-6 border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold text-gray-800">Tracking Details</DialogTitle>
                <Badge variant="outline" className="text-gray-500 bg-white">ID: #{selectedLog?.id}</Badge>
            </div>
          </DialogHeader>
          
          <div className="overflow-y-auto p-6 space-y-8">
            
            {/* 1. USER DETAILS SECTION */}
            {selectedLog && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">User Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Full Name</p>
                                <p className="font-medium text-gray-900">{selectedLog.user_details.full_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className='min-w-0'>
                                <p className="text-xs text-gray-500">Email Address</p>
                                <p className="font-medium text-gray-900 truncate" title={selectedLog.user_details.email}>{selectedLog.user_details.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Phone Number</p>
                                <p className="font-medium text-gray-900">{selectedLog.user_details.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Joined Date</p>
                                <p className="font-medium text-gray-900">{formatDate(selectedLog.user_details.date_joined)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Separator />

            {/* 2. VENDOR LIST SECTION */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Clicked Vendors ({selectedLog?.vendor_details.length})</h4>
                </div>
                
                <div className="border rounded-xl overflow-hidden">
                    <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                        <TableHead className="w-[200px]">Company Name</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Business Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedLog?.vendor_details.map((vendor) => (
                        <TableRow key={vendor.id}>
                            <TableCell>
                                <div className="font-medium text-gray-900">{vendor.company_name}</div>
                                {vendor.brand && <Badge variant="outline" className="mt-1 font-normal text-xs">{vendor.brand}</Badge>}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="w-3 h-3" /> {vendor.company_email}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-3 h-3" /> {vendor.company_phone}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-3 h-3 mt-1 flex-shrink-0" /> 
                                        <span className="line-clamp-2" title={vendor.company_address}>{vendor.company_address}</span>
                                    </div>
                                    {vendor.pcode && <span className="ml-5 text-xs text-gray-400">{vendor.pcode}</span>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 text-sm">
                                    {vendor.gst_no && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CreditCard className="w-3 h-3" /> 
                                            <span className="font-mono text-xs">{vendor.gst_no}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Building2 className="w-3 h-3" /> 
                                        <span className="text-xs">ID: {vendor.id}</span>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </div>

          </div>
          
          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}