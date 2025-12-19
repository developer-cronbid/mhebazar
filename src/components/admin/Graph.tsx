"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { ChevronDown, Loader2 } from 'lucide-react';
import api from '@/lib/api'; // Your authenticated axios instance
import {
  subDays, format, eachDayOfInterval, parseISO,
  subMonths, eachMonthOfInterval, subYears, eachYearOfInterval
} from 'date-fns';

// --- Type Definitions ---
type TimeRange = 'daily' | 'monthly' | 'yearly';

interface ChartDataPoint {
  date: string; // Formatted label for the chart axis
  value: number;
}
interface ApiItem {
  created_at?: string;
  submitted_at?: string;
}

// --- Reusable UI Components ---
const ChartLoader = () => (
  <div className="h-64 flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
  </div>
);

const ChartHeader = ({
  title,
  timeRange,
  setTimeRange
}: {
  title: string;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const options: { key: TimeRange; label: string }[] = [
    { key: 'daily', label: 'Daily (Last 30 days)' },
    { key: 'monthly', label: 'Monthly (Last 12 months)' },
    { key: 'yearly', label: 'Yearly (Last 5 years)' },
  ];

  const currentLabel = options.find(opt => opt.key === timeRange)?.label.split('(')[0].trim();

  return (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center space-x-1 cursor-pointer text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200"
        >
          <span>{currentLabel}</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
            {options.map(option => (
              <a
                key={option.key}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setTimeRange(option.key);
                  setIsMenuOpen(false);
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// --- Main Dashboard Component ---
const AnalyticsDashboard = () => {
  // --- State Management ---
  const [productQuoteData, setProductQuoteData] = useState<ChartDataPoint[]>([]);
  const [rentBuyData, setRentBuyData] = useState<ChartDataPoint[]>([]);
  const [rentalData, setRentalData] = useState<ChartDataPoint[]>([]);
  const [contactData, setContactData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');

  // --- Data Fetching and Processing Logic ---
  useEffect(() => {
    // Helper to get date configurations based on the selected time range
    const getDateConfig = (range: TimeRange) => {
      const today = new Date();
      switch (range) {
        case 'monthly':
          const twelveMonthsAgo = subMonths(today, 11);
          return {
            startDate: twelveMonthsAgo,
            interval: eachMonthOfInterval({ start: twelveMonthsAgo, end: today }),
            groupFormat: 'yyyy-MM',
            labelFormat: 'MMM',
          };
        case 'yearly':
          const fiveYearsAgo = subYears(today, 4);
          return {
            startDate: fiveYearsAgo,
            interval: eachYearOfInterval({ start: fiveYearsAgo, end: today }),
            groupFormat: 'yyyy',
            labelFormat: 'yyyy',
          };
case 'daily':
default:
  // const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day of month
  return {
    startDate: firstDayOfMonth,
    interval: eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth }), // all days of month
    groupFormat: 'yyyy-MM-dd',
    labelFormat: 'dd', // show day number
  };



      }
    }

    const { startDate, interval, groupFormat, labelFormat } = getDateConfig(timeRange);

    // Helper to create a map of dates for the selected interval, initialized to zero
    const initializeDateMap = () => {
      const map = new Map<string, number>();
      interval.forEach(day => {
        map.set(format(day, groupFormat), 0);
      });
      return map;
    };

    // Helper to process API data into daily/monthly/yearly counts
 const processCounts = (items: ApiItem[], dateField: keyof ApiItem): ChartDataPoint[] => {
  const counts = initializeDateMap(); // daily keys: 'yyyy-MM-dd'
  
  items.forEach(item => {
    const dateStr = item[dateField];
    if (dateStr) {
      // Parse date safely
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        const key = format(parsed, groupFormat); // must match map key exactly
        if (counts.has(key)) {
          counts.set(key, counts.get(key)! + 1);
        }
      }
    }
  });

  // Convert to chart data
  return Array.from(counts.entries()).map(([date, value]) => ({
    date: format(new Date(date), labelFormat), // 'dd'
    value
  }));
};


    // Helper for cumulative data
    const processCumulativeCounts = (rentals: ApiItem[], orders: ApiItem[]): ChartDataPoint[] => {
      const totals = initializeDateMap();
      [...rentals, ...orders].forEach(item => {
        const dateStr = item.created_at;
        if (dateStr) {
          const formattedDate = format(parseISO(dateStr), groupFormat);
          if (totals.has(formattedDate)) {
            totals.set(formattedDate, totals.get(formattedDate)! + 1);
          }
        }
      });

      let cumulativeTotal = 0;
      return Array.from(totals.entries()).map(([date, dailyValue]) => {
        cumulativeTotal += dailyValue;
        return {
          date: format(parseISO(date), labelFormat),
          value: cumulativeTotal
        };
      });
    };

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const dateFilter = { created_at__gte: format(startDate, 'yyyy-MM-dd') };
        if (timeRange === 'monthly' || timeRange === 'yearly') {
  const [quoteRes, rentalRes] = await Promise.all([
    api.get('/quotes/vendor-stats/'),
    api.get('/rentals/vendor-stats/')
  ]);

  const quoteTrend =
    timeRange === 'monthly'
      ? quoteRes.data.monthly_trend
      : quoteRes.data.yearly_trend;

  const rentalTrend =
    timeRange === 'monthly'
      ? rentalRes.data.monthly_trend
      : rentalRes.data.yearly_trend;

if (timeRange === 'monthly') {
  const twelveMonthsAgo = subMonths(new Date(), 11);
  const monthInterval = eachMonthOfInterval({ start: twelveMonthsAgo, end: new Date() });

  // Zero-fill map for Product Quotes
  const quoteMap = new Map(monthInterval.map(d => [format(d, 'yyyy-MM'), 0]));
  quoteTrend.forEach((item: any) => {
    const monthKey = format(parseISO(item.month), 'yyyy-MM');
    if (quoteMap.has(monthKey)) quoteMap.set(monthKey, item.count);
  });
  setProductQuoteData(
    Array.from(quoteMap.entries()).map(([key, value]) => ({
      date: format(parseISO(key + '-01'), 'MMM'),
      value
    }))
  );

  // Zero-fill map for Rentals
  const rentalMap = new Map(monthInterval.map(d => [format(d, 'yyyy-MM'), 0]));
  rentalTrend.forEach((item: any) => {
    const monthKey = format(parseISO(item.month), 'yyyy-MM');
    if (rentalMap.has(monthKey)) rentalMap.set(monthKey, item.count);
  });
  setRentalData(
    Array.from(rentalMap.entries()).map(([key, value]) => ({
      date: format(parseISO(key + '-01'), 'MMM'),
      value
    }))
  );

  setLoading(false);
  return;
}}


       const [quoteRes, rentalRes, orderRes, contactRes] = await Promise.all([
  api.get('/quotes/', { params: { ...dateFilter, page_size: 5000 } }),
  api.get('/rentals/', { params: { ...dateFilter, page_size: 5000 } }),
  api.get('/orders/', { params: { ...dateFilter, page_size: 5000 } }),
  api.get('/contact-forms/', { params: { ...dateFilter, page_size: 5000 } })
]);


        setProductQuoteData(processCounts(quoteRes.data.results, 'created_at'));
        setRentalData(processCounts(rentalRes.data.results, 'created_at'));
        setContactData(processCounts(contactRes.data.results, 'created_at'));
        setRentBuyData(processCumulativeCounts(rentalRes.data.results, orderRes.data.results));

      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [timeRange]); // Re-run effect when timeRange changes

  return (
    <div className="bg-gray-50 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Quote Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Product Quotes" timeRange={timeRange} setTimeRange={setTimeRange} />
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
          <ChartHeader title="Cumulative Rentals & Orders" timeRange={timeRange} setTimeRange={setTimeRange} />
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
          <ChartHeader title="Rental Requests" timeRange={timeRange} setTimeRange={setTimeRange} />
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
          <ChartHeader title="Contact Submissions" timeRange={timeRange} setTimeRange={setTimeRange} />
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