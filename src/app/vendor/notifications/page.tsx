'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, FileText, Calendar, AlertTriangle, CheckCircle2, XCircle, Package, LucideIcon, Filter, X, MessageSquare, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// --- TypeScript Type Definitions ---
type NotificationType = 'new_quote' | 'new_rental' | 'product_approved' | 'product_rejected' | 'low_stock' | 'general';

interface Notification {
  type: NotificationType;
  message: string;
  timestamp: string; // ISO 8601 date string
  related_object: {
    product_id: number;
    product_name?: string;
    quote_id?: number;
    rental_id?: number;
  };
}

// Add types for Quote and Rental based on the API responses
interface Quote {
  id: number;
  user_name: string;
  message: string;
}

interface Rental {
  id: number;
  user_name: string;
  notes: string;
}


// --- Helper Components from Shadcn/ui (or your own component library) ---
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

// Helper function for creating a URL-friendly slug
const slugify = (text: string): string => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/-+$/, '');
};

// --- New MessageModal component for displaying details ---
const MessageModal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-gray-700 dark:text-gray-300">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


// --- Main Page Component ---
export default function VendorNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');

  // --- New state for the modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<ReactNode>(null);


  // Fetch notifications from the backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<Notification[]>('/vendor/notifications/');
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

  // Function to determine icon, color, and text for a notification type
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

  // Function to format the timestamp as "X time ago"
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
  
  // List of available notification types for the filter buttons
  const notificationTypes = ['all', 'new_quote', 'new_rental', 'product_approved', 'product_rejected', 'low_stock'] as const;

  // Filter the notifications based on the active filter
  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  // NEW: A helper function to render the message with a clickable product name
  const renderMessageWithProductLink = (message: string, productId: number) => {
    const productNameMatch = message.match(/'(.*?)'/);
    if (productNameMatch) {
      const productName = productNameMatch[1];
      const productSlug = slugify(productName);
      const parts = message.split(productNameMatch[0]);

      return (
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {parts[0]}
          <a
            href={`/product/${productSlug}/?id=${productId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            {productName}
          </a>
          {parts.slice(1).join(productNameMatch[0])}
        </p>
      );
    }
    return <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>;
  };
  
  // NEW: A helper function to parse the message and render it with styling
  const renderFormattedMessage = (message: string) => {
    // Split the message into details and main message part
    const [detailsPart, ...messageParts] = message.split('---').map(s => s.trim());
    const mainMessage = messageParts.join('\n\n');

    const renderDetails = () => {
      const lines = detailsPart.split('\n');
      return (
        <ul className="list-none space-y-2">
          {lines.map((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
              // This is a heading
              return (
                <li key={index} className="text-lg font-bold text-gray-900 dark:text-white mt-4">
                  {trimmedLine.replace(/\*\*/g, '')}
                </li>
              );
            }
            if (trimmedLine.startsWith('- ')) {
              // This is a key-value pair
              const [key, ...valueParts] = trimmedLine.substring(2).split(':');
              const value = valueParts.join(':').trim();
              return (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">{key.trim()}:</span> {value}
                </li>
              );
            }
            // Fallback for any other line
            return <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{trimmedLine}</li>;
          })}
        </ul>
      );
    };

    return (
      <>
        {renderDetails()}
        {mainMessage && (
          <>
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {mainMessage.replace('Message:', '').trim()}
            </p>
          </>
        )}
      </>
    );
  };


  // --- New function to fetch and display the message ---
  const fetchMessageContent = async (notification: Notification) => {
    if (notification.type === 'new_quote' && notification.related_object.quote_id) {
      try {
        const response = await api.get<Quote>(`/quotes/${notification.related_object.quote_id}/`);
        setModalTitle(`Quote Request from ${response.data.user_name}`);
        setModalContent(renderFormattedMessage(response.data.message));
        setIsModalOpen(true);
      } catch (err) {
        console.error("Failed to fetch quote details:", err);
        // Handle error, maybe show a toast notification
      }
    } else if (notification.type === 'new_rental' && notification.related_object.rental_id) {
      try {
        const response = await api.get<Rental>(`/rentals/${notification.related_object.rental_id}/`);
        setModalTitle(`Rental Request from ${response.data.user_name}`);
        setModalContent(renderFormattedMessage(response.data.notes));
        setIsModalOpen(true);
      } catch (err) {
        console.error("Failed to fetch rental details:", err);
        // Handle error, maybe show a toast notification
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalTitle('');
    setModalContent(null);
  };

  // Render the list of notifications or empty/error states
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

    if (filteredNotifications.length === 0) {
      return (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No notifications yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {activeFilter === 'all' 
                ? "New updates about your products and sales will appear here."
                : `No notifications found for the selected category.`
            }
          </p>
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
        {filteredNotifications.map((notification) => {
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
              key={notification.timestamp + notification.message}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className={`flex items-start justify-between space-x-4 p-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-900 ${currentTheme.bg} ${currentTheme.ring}`}>
                  <Icon className={`h-5 w-5 ${currentTheme.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  {renderMessageWithProductLink(notification.message, notification.related_object.product_id)}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimeAgo(notification.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-2">
                <Badge className={`${currentTheme.bg} ${currentTheme.text}`}>{text}</Badge>
                {(notification.type === 'new_quote' || notification.type === 'new_rental') && (
                  <button 
                    onClick={() => fetchMessageContent(notification)}
                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Eye size={20} />
                  </button>
                )}
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

            {/* Filter Buttons Section */}
            {!loading && notifications.length > 0 && (
              <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-wrap gap-2">
                {notificationTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-colors
                      ${activeFilter === type
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {type !== 'all' && (
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold
                          ${activeFilter === type ? 'bg-white text-blue-600' : 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}
                        `}>
                            {notifications.filter(n => n.type === type).length}
                        </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>

      {/* --- Add the MessageModal here --- */}
      <MessageModal isOpen={isModalOpen} onClose={handleCloseModal} title={modalTitle}>
        {modalContent}
      </MessageModal>
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