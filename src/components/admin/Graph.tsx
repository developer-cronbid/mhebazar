"use client";

import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const AnalyticsDashboard = () => {
  // Sample data for charts
  const productQuoteData = [
    { date: '01/06', value: 7 },
    { date: '02/06', value: 9 },
    { date: '03/06', value: 13 },
    { date: '04/06', value: 7 },
    { date: '05/06', value: 11 },
    { date: '06/06', value: 4 },
    { date: '07/06', value: 6 },
    { date: '08/06', value: 12 },
    { date: '09/06', value: 10 }
  ];

  const rentBuyData = [
    { date: '01/06', value: 20 },
    { date: '02/06', value: 20 },
    { date: '03/06', value: 30 },
    { date: '04/06', value: 40 },
    { date: '05/06', value: 40 },
    { date: '06/06', value: 40 },
    { date: '07/06', value: 42 },
    { date: '08/06', value: 52 },
    { date: '09/06', value: 62 }
  ];

  const rentalData = [
    { date: '01/06', value: 3 },
    { date: '02/06', value: 4 },
    { date: '03/06', value: 8 },
    { date: '04/06', value: 6 },
    { date: '05/06', value: 9 },
    { date: '06/06', value: 5 },
    { date: '07/06', value: 7 },
    { date: '08/06', value: 11 },
    { date: '09/06', value: 8 }
  ];

  const contactData = [
    { date: '01/06', value: 5 },
    { date: '02/06', value: 7 },
    { date: '03/06', value: 10 },
    { date: '04/06', value: 5 },
    { date: '05/06', value: 8 },
    { date: '06/06', value: 3 },
    { date: '07/06', value: 4 },
    { date: '08/06', value: 9 },
    { date: '09/06', value: 7 }
  ];

  const ChartHeader = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">June 2025</span>
        <div className="flex items-center space-x-1 cursor-pointer">
          <span className="text-sm text-gray-500">Monthly</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Quote Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Product Quote" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productQuoteData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={[0, 14]}
                  ticks={[0, 2, 4, 6, 8, 10, 12]}
                />
                <Bar
                  dataKey="value"
                  fill="#93C5FD"
                  radius={[2, 2, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rent & Buy Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Rent & Buy" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rentBuyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={[0, 70]}
                  ticks={[0, 10, 20, 30, 40, 50, 60]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rental Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Rental" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rentalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={[0, 12]}
                  ticks={[0, 2, 4, 6, 8, 10, 12]}
                />
                <Bar
                  dataKey="value"
                  fill="#93C5FD"
                  radius={[2, 2, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contact Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ChartHeader title="Contact" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contactData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={[0, 12]}
                  ticks={[0, 2, 4, 6, 8, 10, 12]}
                />
                <Bar
                  dataKey="value"
                  fill="#86EFAC"
                  radius={[2, 2, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;