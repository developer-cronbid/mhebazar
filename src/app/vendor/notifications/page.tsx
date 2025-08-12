'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, FileText, Calendar, AlertTriangle, CheckCircle2, XCircle, Package, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import api from '@/lib/api';

// --- TypeScript Type Definitions ---
type NotificationType = 'new_quote' | 'new_rental' | 'product_approved' | 'product_rejected' | 'low_stock' | 'general';

interface Notification {
  type: NotificationType;
  message: string;
  timestamp: string; // ISO 8601 date string
  related_object: {
    product_id: number;
    quote_id?: number;
    rental_id?: number;
  };
}


// --- Helper Components from Shadcn/ui (or your own component library) ---
// You would typically import these from your component library, e.g., '@/components/ui/card'
// For this self-contained example, I'll define simple versions here.

const Card = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 ${className}`}>{children}</div>
);

const CardContent = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`p-4 sm:p-6 ${className}`}>{children}</div>
);

const Badge = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>{children}</span>
);

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
);


// --- Main Page Component ---

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // IMPORTANT: Ensure your axios instance is configured to send the
        // authentication token (e.g., using an interceptor).
        // Example: axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const response = await api.get<Notification[]>('/vendor/notifications/'); // Replace with your actual API endpoint
        setNotifications(response.data);

      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setError("Couldn't load your notifications. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Helper function to get display properties based on notification type
  const getNotificationProps = (type: NotificationType): { Icon: LucideIcon; color: string; text: string } => {
    switch (type) {
      case 'new_quote':
        return { Icon: FileText, color: 'blue', text: 'New Quote' };
      case 'new_rental':
        return { Icon: Calendar, color: 'purple', text: 'New Rental' };
      case 'product_approved':
        return { Icon: CheckCircle2, color: 'green', text: 'Approved' };
      case 'product_rejected':
        return { Icon: XCircle, color: 'red', text: 'Rejected' };
      case 'low_stock':
        return { Icon: AlertTriangle, color: 'yellow', text: 'Low Stock' };
      default:
        return { Icon: Bell, color: 'gray', text: 'General' };
    }
  };

  // Helper function to format date
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const renderContent = () => {
    if (loading) {
      return <NotificationListSkeleton />;
    }

    if (error) {
      return (
        <div className="text-center py-16">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Something went wrong</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No notifications yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">New updates about your products and sales will appear here.</p>
        </div>
      );
    }

    return (
      <motion.ul
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {notifications.map((notification) => {
          const { Icon, color, text } = getNotificationProps(notification.type);
          const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
            blue: { bg: 'bg-blue-50 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
            purple: { bg: 'bg-purple-50 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500/20' },
            green: { bg: 'bg-green-50 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-500/20' },
            red: { bg: 'bg-red-50 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20' },
            yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500/20' },
            gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', ring: 'ring-gray-500/20' },
          };
          const currentTheme = colorClasses[color];

          return (
            <motion.li
              key={notification.timestamp + notification.message} // Use a more unique key
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className={`flex items-start space-x-4 p-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50`}
            >
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-900 ${currentTheme.bg} ${currentTheme.ring}`}>
                <Icon className={`h-5 w-5 ${currentTheme.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{notification.message}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimeAgo(notification.timestamp)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge className={`${currentTheme.bg} ${currentTheme.text}`}>{text}</Badge>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Vendor Notifications
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Updates on your products, sales, and account activity.
            </p>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Skeleton Component for Loading State ---
const NotificationListSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
};
