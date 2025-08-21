"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { ChevronDown, Loader2 } from 'lucide-react';
import api from '@/lib/api'; // Your authenticated axios instance
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

// --- Type Definitions ---
interface ChartDataPoint {
  date: string; // Formatted as 'dd/MM'
  value: number;
}
interface ApiItem {
  created_at?: string;
  submitted_at?: string;
}

// --- Main Dashboard Component ---
const AnalyticsDashboard = () => {
  const [productQuoteData, setProductQuoteData] = useState<ChartDataPoint[]>([]);
  const [rentBuyData, setRentBuyData] = useState<ChartDataPoint[]>([]);
  const [rentalData, setRentalData] = useState<ChartDataPoint[]>([]);
  const [contactData, setContactData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching and Processing Logic ---
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29); // Interval includes today
    const dateInterval = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

    // Helper to create a map of dates for the last 30 days, initialized to zero
    const initializeDateMap = () => {
      const map = new Map<string, number>();
      dateInterval.forEach(day => {
        map.set(format(day, 'yyyy-MM-dd'), 0);
      });
      return map;
    };

    // Helper to process API data into daily counts
    const processDailyCounts = (items: ApiItem[], dateField: keyof ApiItem): ChartDataPoint[] => {
      const dailyCounts = initializeDateMap();
      items.forEach(item => {
        const dateStr = item[dateField];
        if (dateStr) {
          const formattedDate = format(parseISO(dateStr), 'yyyy-MM-dd');
          if (dailyCounts.has(formattedDate)) {
            dailyCounts.set(formattedDate, dailyCounts.get(formattedDate)! + 1);
          }
        }
      });

      return Array.from(dailyCounts.entries()).map(([date, value]) => ({
        date: format(parseISO(date), 'dd/MM'),
        value
      }));
    };

    // Helper for cumulative data (Rent & Buy)
    const processCumulativeCounts = (rentals: ApiItem[], orders: ApiItem[]): ChartDataPoint[] => {
      const dailyTotals = initializeDateMap();
      [...rentals, ...orders].forEach(item => {
        const dateStr = item.created_at;
        if (dateStr) {
          const formattedDate = format(parseISO(dateStr), 'yyyy-MM-dd');
          if (dailyTotals.has(formattedDate)) {
            dailyTotals.set(formattedDate, dailyTotals.get(formattedDate)! + 1);
          }
        }
      });

      let cumulativeTotal = 0;
      return Array.from(dailyTotals.entries()).map(([date, dailyValue]) => {
        cumulativeTotal += dailyValue;
        return {
          date: format(parseISO(date), 'dd/MM'),
          value: cumulativeTotal
        };
      });
    };

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const dateFilter = { created_at__gte: format(thirtyDaysAgo, 'yyyy-MM-dd') };
        const submissionDateFilter = { submitted_at__gte: format(thirtyDaysAgo, 'yyyy-MM-dd') };

        // Fetch all data in parallel
        const [quoteRes, rentalRes, orderRes, contactRes] = await Promise.all([
          api.get('/quotes/', { params: { ...dateFilter, page_size: 1000 } }),
          api.get('/rentals/', { params: { ...dateFilter, page_size: 1000 } }),
          api.get('/orders/', { params: { ...dateFilter, page_size: 1000 } }),
          api.get('/contact-forms/', { params: { ...submissionDateFilter, page_size: 1000 } })
        ]);

        // Process and set state for each chart
        setProductQuoteData(processDailyCounts(quoteRes.data.results, 'created_at'));
        setRentalData(processDailyCounts(rentalRes.data.results, 'created_at'));
        setContactData(processDailyCounts(contactRes.data.results, 'submitted_at'));
        setRentBuyData(processCumulativeCounts(rentalRes.data.results, orderRes.data.results));

      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // --- UI Components ---
  const ChartHeader = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">Last 30 Days</span>
        <div className="flex items-center space-x-1 cursor-pointer">
          <span className="text-sm text-gray-500">Daily</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );

  const ChartLoader = () => (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  );

  return (
    <div className="bg-gray-50 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Quote Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Daily Product Quotes" />
          {loading ? <ChartLoader /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productQuoteData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} />
                  <Bar dataKey="value" name="Quotes" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Rent & Buy Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Cumulative Rentals & Orders" />
          {loading ? <ChartLoader /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rentBuyData} margin={{ top: 20, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Total" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Rental Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Daily Rental Requests" />
          {loading ? <ChartLoader /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rentalData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} />
                  <Bar dataKey="value" name="Rentals" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Contact Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Daily Contact Submissions" />
          {loading ? <ChartLoader /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contactData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} />
                  <Bar dataKey="value" name="Contacts" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;