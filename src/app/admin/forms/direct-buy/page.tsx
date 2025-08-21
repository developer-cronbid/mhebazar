"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { OrderDetailsSheet } from './orderDetails';

// --- TypeScript Interfaces based on your Serializers ---
interface Image {
  id: number;
  image: string;
}

interface ProductDetails {
  name: string;
  images: Image[];
}

interface OrderItem {
  id: number;
  product_details: ProductDetails;
  quantity: number;
  unit_price: string;
}

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: number;
  order_number: string;
  user_name: string;
  status: OrderStatus;
  total_amount: string;
  item_count: number;
  shipping_address: string;
  phone_number: string;
  notes: string;
  items: OrderItem[];
  created_at: string;
}

const OrdersTable = () => {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', String(page));
        if (debouncedGlobalFilter) params.append('search', debouncedGlobalFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (sortBy.length > 0) {
          const sort = sortBy[0];
          params.append('ordering', `${sort.desc ? '-' : ''}${sort.id}`);
        }

        const response = await api.get(`/orders/`, { params });
        setData(response.data.results);
        setTotalOrders(response.data.count);
      } catch (error) {
        console.error("Failed to fetch order data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, debouncedGlobalFilter, sortBy, statusFilter]);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const response = await api.post(`/orders/${orderId}/update_status/`, { status: newStatus });
      const updatedOrder = response.data;

      setData(prevData => prevData.map(order => order.id === orderId ? updatedOrder : order));
      setSelectedOrder(updatedOrder);
      // alert("Order status updated successfully!");
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Error: Could not update order status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const totalPages = Math.ceil(totalOrders / 20);

  const columns = useMemo<ColumnDef<Order>[]>(() => [
    {
      accessorKey: 'order_number',
      header: 'Order #',
    },
    {
      accessorKey: 'user_name',
      header: 'Customer',
    },
    {
      accessorKey: 'created_at',
      header: 'Date Ordered',
      cell: info => new Date(info.getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: 'item_count',
      header: 'Items',
      cell: info => `${info.getValue()} item(s)`,
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: info => Number(info.getValue() as string).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const variant: "default" | "secondary" | "destructive" | "outline" =
          status === 'delivered' ? 'default' :
            status === 'shipped' ? 'default' :
              status === 'cancelled' ? 'destructive' :
                status === 'pending' ? 'secondary' : 'outline';
        return <Badge variant={variant} className={`capitalize ${status === 'shipped' ? 'bg-blue-600 text-white' : ''}`}>{status}</Badge>;
      },
    },
  ], []);

  const table = useReactTable({
    data, columns, state: { sorting: sortBy }, onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(), manualPagination: true, manualFiltering: true,
    manualSorting: true, pageCount: totalPages,
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const generatePagination = () => {
    // Logic remains the same
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <OrderDetailsSheet
        order={selectedOrder}
        isOpen={isSheetOpen}
        isUpdating={isUpdating}
        onOpenChange={setIsSheetOpen}
        onUpdateStatus={handleUpdateOrderStatus}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and manage all customer orders.</p>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className='flex items-center gap-4 flex-wrap'>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status</span>
            <Select value={statusFilter} onValueChange={value => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by</span>
            <Select value={sortBy[0] ? `${sortBy[0].id}:${sortBy[0].desc}` : 'created_at:true'}
              onValueChange={value => {
                const [id, desc] = value.split(':');
                setSortBy([{ id, desc: desc === 'true' }]);
              }}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:true">Newest First</SelectItem>
                <SelectItem value="created_at:false">Oldest First</SelectItem>
                <SelectItem value="total_amount:true">Total (High to Low)</SelectItem>
                <SelectItem value="total_amount:false">Total (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center">
            <input type="text" placeholder="Search by order #, customer..." value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm h-9 w-full md:w-auto" />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="relative overflow-auto h-[68vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="py-3 px-4 text-left font-medium text-gray-600 border-b">
                      <div className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-10">Loading orders...</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-10">No orders found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setSelectedOrder(row.original); setIsSheetOpen(true); }}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-3 px-4 text-gray-800">
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

      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="text-sm text-gray-600">
          {!loading && `Showing ${data.length > 0 ? (page - 1) * 20 + 1 : 0} to ${Math.min(page * 20, totalOrders)} of ${totalOrders} entries`}
        </div>
        {!loading && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => handlePageChange(page - 1)} className={page === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
              {generatePagination().map((p, index) => (
                <PaginationItem key={index}>
                  {typeof p === 'string' ? <PaginationEllipsis /> : <PaginationLink isActive={page === p} onClick={() => handlePageChange(p)}>{p}</PaginationLink>}
                </PaginationItem>
              ))}
              <PaginationItem><PaginationNext onClick={() => handlePageChange(page + 1)} className={page === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;