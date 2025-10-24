"use client";

import { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarRange, Calendar, TrendingUp } from 'lucide-react';

interface StatsProps {
  data: any[];
  dateField: string;
  periodFilter: string;
  onPeriodChange: (value: string) => void;
}

export function RequestStats({ data, dateField, periodFilter, onPeriodChange }: StatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const periods = {
      thisMonth: new Date(now.getFullYear(), now.getMonth(), 1),
      lastMonth: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      last3Months: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      last6Months: new Date(now.getFullYear(), now.getMonth() - 6, 1),
      thisYear: new Date(now.getFullYear(), 0, 1),
      lastYear: new Date(now.getFullYear() - 1, 0, 1),
      total: new Date(0),
    };

    const counts = {
      thisMonth: 0,
      lastMonth: 0,
      last3Months: 0,
      last6Months: 0,
      thisYear: 0,
      lastYear: 0,
      total: data.length,
    };

    data.forEach(item => {
      const date = new Date(item[dateField]);
      Object.entries(periods).forEach(([key, periodDate]) => {
        if (date >= periodDate) {
          counts[key as keyof typeof counts]++;
        }
      });
    });

    return counts;
  }, [data, dateField]);

  const statCards = [
    {
      title: "This Month",
      value: stats.thisMonth,
      icon: <Calendar className="h-4 w-4 text-blue-600" />,
    },
    {
      title: "Last Month",
      value: stats.lastMonth,
      icon: <CalendarRange className="h-4 w-4 text-indigo-600" />,
    },
    {
      title: "Last 6 Months",
      value: stats.last6Months,
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Request Statistics</h2>
        <Select value={periodFilter} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="last3Months">Last 3 Months</SelectItem>
            <SelectItem value="last6Months">Last 6 Months</SelectItem>
            <SelectItem value="thisYear">This Year</SelectItem>
            <SelectItem value="lastYear">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-full">{stat.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
