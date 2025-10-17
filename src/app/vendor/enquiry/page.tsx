// app/vendor-quotes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BriefcaseBusiness,
  Calendar,
  Clock,
  Hash,
  Inbox,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Rocket,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  LogIn,
  ChevronDown,
  Home,
} from 'lucide-react';

// Shadcn UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import api from '@/lib/api';
import localArchivedQuoteData from '@/data/quoteData.json';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- TYPESCRIPT INTERFACES ---
interface ApiProduct {
  id: number;
  user: number;
}

interface Quote {
  id: number;
  product_details: {
    id: any; user: number; name: string; images: { image: string }[] 
};
  user_name: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user: number;
}

interface Rental {
  id: number;
  product_details: {
    [x: string]: any; user: number; name: string; images: { image: string }[] 
};
  user_name: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
  user: number;
}

interface DetailedUser {
  description: string | null | undefined;
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  address: any; 
  profile_photo: string | null;
  date_joined: string;
  last_login: string | null;
  role: { name: string };
}


interface ArchivedQuote {
  id: string;
  name: string;
  email: string;
  no: string;
  cname: string;
  lcation: string | null;
  pname: string;
  meg: string;
  created_at: string;
  product_id: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

// --- REUSABLE HELPER COMPONENTS ---
const InfoLine = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string | null | undefined;
}) =>
  text ? (
    <div className="flex items-center text-sm text-muted-foreground">
      <div className="mr-2 shrink-0">{icon}</div>
      <span className="truncate">{String(text)}</span> 
    </div>
  ) : null;

const formatDate = (dateString: string) => {
  const date = dateString.includes('T') 
    ? new Date(dateString) 
    : new Date(dateString.replace(/-/g, '/'));
    
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: dateString.includes('T') ? 'numeric' : undefined,
    minute: dateString.includes('T') ? '2-digit' : undefined,
  });
};

// --- DESCRIPTION SECTION (NEW) ---
const DescriptionSection = ({ description }: { description: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 200; // Character limit for 'Show More' heuristic

    if (!description.trim()) return null;

    const needsToggle = description.length > MAX_LENGTH || description.includes('\n'); // Check for length or line breaks

    return (
        <div className="pt-2">
            <span className="font-semibold text-gray-700 block mb-1">Bio/Description:</span>
            
            <div 
                className={cn(
                    'text-sm text-muted-foreground transition-all duration-300',
                    { 'max-h-[100px] overflow-hidden relative': needsToggle && !isExpanded }, // Apply max height and overflow
                    { 'overflow-y-auto max-h-[200px] border border-gray-200 p-2 rounded-md': isExpanded && needsToggle }
                )}
            >
                <p style={{ whiteSpace: 'pre-wrap' }}>{description}</p>
                {/* Overlay gradient for non-expanded view */}
                {needsToggle && !isExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
                )}
            </div>
            
            {needsToggle && (
                <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-0 h-auto mt-1 text-primary hover:no-underline"
                >
                    {isExpanded ? 'Show Less' : 'Show More'}
                    <ChevronDown className={cn('w-4 h-4 ml-1 transition-transform', isExpanded ? 'rotate-180' : 'rotate-0')} />
                </Button>
            )}
        </div>
    );
}


// --- CUSTOMER DETAILS MODAL COMPONENT (FIXED) ---
interface ModalProps {
    user: DetailedUser | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const CustomerDetailsModal: React.FC<ModalProps> = ({ user, isOpen, onOpenChange }) => {
    if (!user) return null;
    
    // Defensive function to safely extract and format address
    const getFormattedAddress = (addressData: any): string | null => {
        if (!addressData) return null;

        if (typeof addressData === 'string' && addressData.trim() !== '') {
            return addressData;
        }
        
        if (typeof addressData === 'object' && addressData !== null) {
            const parts = Object.values(addressData)
                .filter(p => typeof p === 'string' && p.trim())
                .join(', ');
            
            return parts || null;
        }

        return null;
    };

    const formattedAddress = getFormattedAddress(user.address);
    const displayName = user.full_name || user.username || 'User';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className='h-5 w-5 text-primary'/> Customer Profile
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto"> {/* Max height and scroll for content */}
                    <div className="flex flex-col items-center border-b pb-4">
                        <Avatar className="h-20 w-20 mb-3 border-4 border-primary/20">
                            <AvatarImage src={user.profile_photo || undefined} alt={displayName} />
                            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{displayName}</h2>
                        {user.role?.name && <Badge variant="outline" className='mt-1'>{user.role.name}</Badge>}
                    </div>
                    
                    <div className="space-y-3">
                        {user.email && <InfoLine icon={<Mail size={16} />} text={user.email} />}
                        
                        {user.phone && user.phone.trim() && <InfoLine icon={<Phone size={16} />} text={user.phone} />}
                        
                        {formattedAddress && <InfoLine icon={<MapPin size={16} />} text={formattedAddress} />}
                        
                        <InfoLine icon={<Clock size={16} />} text={`Joined: ${formatDate(user.date_joined)}`} />
                        
                        {user.last_login && (
                            <InfoLine icon={<LogIn size={16} />} text={`Last Login: ${formatDate(user.last_login)}`} />
                        )}
                        
                        {user.description && <DescriptionSection description={user.description} />}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


// --- CARD COMPONENTS (UPDATED WITH CLICK HANDLER) ---
const QuoteCard = ({ quote, onCustomerClick }: { quote: Quote, onCustomerClick: (userId: number) => void }) => {
  const router = useRouter();
  const handleViewProduct = () => {
    router.push(`/products-details/${quote.product_details.id}`);
  };

  const customerName = quote.full_name || quote.user_name;

  // Helper function to extract company address
  const extractCompanyAddress = (message: string) => {
    const addressMatch = message.match(/Company Address:\s*(.+?)(?=\n|$)/);
    if (addressMatch) {
      const address = addressMatch[1].trim();
      const cleanMessage = message.replace(/Company Address:\s*.+?(?=\n|$)/, '').trim();
      return { address, cleanMessage };
    }
    return { address: null, cleanMessage: message };
  };

  const { address, cleanMessage } = extractCompanyAddress(quote.message);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="flex-row items-start gap-4 bg-muted/40 p-4">
          <img
            src={quote.product_details.images[0]?.image}
            alt={quote.product_details.name}
            width={80}
            height={80}
            className="aspect-square rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <Badge
              variant={
                quote.status === 'pending'
                  ? 'default'
                  : quote.status === 'approved'
                    ? 'secondary'
                    : 'destructive'
              }
              className="mb-1"
            >
              {quote.status}
            </Badge>
            <CardTitle className="text-lg truncate">{quote.product_details.name}</CardTitle>
            <CardDescription>{formatDate(quote.created_at)}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <div className="mb-2 font-semibold text-primary">Customer Details:</div>
          <div className="space-y-2">
            {customerName && (
              <div 
                  className='flex items-center text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors'
                  onClick={() => onCustomerClick(quote.user)}
              >
                  <div className="mr-2 shrink-0"><User size={14} /></div>
                  <span className="truncate font-medium">{customerName}</span>
              </div>
            )}
            {quote.email && <InfoLine icon={<Mail size={14} />} text={quote.email} />}
            {quote.phone && <InfoLine icon={<Phone size={14} />} text={quote.phone} />}
            {quote.company_name && <InfoLine icon={<BriefcaseBusiness size={14} />} text={quote.company_name} />}
            {address && <InfoLine icon={<MapPin size={14} />} text={address} />}
          </div>
          <div className="mb-2 mt-4 font-semibold text-primary">Message:</div>
          <p className="text-sm italic text-muted-foreground">
            &quot;{cleanMessage}&quot;
          </p>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/40 p-4">
          <InfoLine icon={<Hash size={14} />} text={`Quote ID: Q-${quote.id}`} />
          <Button onClick={handleViewProduct} variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Product
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const RentalCard = ({ rental, onCustomerClick }: { rental: Rental, onCustomerClick: (userId: number) => void }) => {
  const router = useRouter();
  const handleViewProduct = () => {
    router.push(`/products-details/${rental.product_details.id}`);
  };

  const customerName = rental.full_name || rental.user_name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="flex-row items-start gap-4 bg-muted/40 p-4">
          <img
            src={rental.product_details.images[0]?.image}
            alt={rental.product_details.name}
            width={80}
            height={80}
            className="aspect-square rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <Badge
              variant={
                rental.status === 'pending'
                  ? 'default'
                  : rental.status === 'approved'
                    ? 'secondary'
                    : 'destructive'
              }
              className="mb-1"
            >
              {rental.status}
            </Badge>
            <CardTitle className="text-lg truncate">{rental.product_details.name}</CardTitle>
            <CardDescription>{formatDate(rental.created_at)}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <div className="mb-2 font-semibold text-primary">Customer Details:</div>
          <div className="space-y-2">
            {customerName && (
              <div 
                className='flex items-center text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors'
                onClick={() => onCustomerClick(rental.user)}
              >
                <div className="mr-2 shrink-0"><User size={14} /></div>
                <span className="truncate font-medium">{customerName}</span>
              </div>
            )}
            {rental.email && <InfoLine icon={<Mail size={14} />} text={rental.email} />}
            {rental.phone && <InfoLine icon={<Phone size={14} />} text={rental.phone} />}
            {rental.address && <InfoLine icon={<Home size={14} />} text={rental.address} />}
          </div>
          
          <div className="mb-2 mt-4 font-semibold text-primary">Rental Period:</div>
          <div className="space-y-2">
            <InfoLine
              icon={<Calendar size={14} />}
              text={`From: ${formatDate(rental.start_date)}`}
            />
            <InfoLine
              icon={<Calendar size={14} />}
              text={`To: ${formatDate(rental.end_date)}`}
            />
          </div>
          
          <div className="mb-2 mt-4 font-semibold text-primary">Notes:</div>
          <p className="text-sm italic text-muted-foreground">
            &quot;{rental.notes}&quot;
          </p>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/40 p-4">
          <InfoLine icon={<Hash size={14} />} text={`Rental ID: R-${rental.id}`} />
          <Button onClick={handleViewProduct} variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Product
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const ArchivedQuoteCard = ({ quote }: { quote: ArchivedQuote }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="flex h-full flex-col overflow-hidden border-dashed transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="bg-muted/40 p-4">
        <Badge variant="outline" className="mb-2">
          Archived
        </Badge>
        <CardTitle className="truncate">{quote.pname}</CardTitle>
        <CardDescription>{formatDate(quote.created_at)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="mb-2 font-semibold text-primary">Enquirer Details:</div>
        <div className="space-y-2">
          <InfoLine icon={<User size={14} />} text={quote.name} />
          <InfoLine icon={<Mail size={14} />} text={quote.email} />
          <InfoLine icon={<Phone size={14} />} text={quote.no} />
          <InfoLine
            icon={<BriefcaseBusiness size={14} />}
            text={quote.cname}
          />
          <InfoLine icon={<MapPin size={14} />} text={quote.lcation} />
        </div>
        <div className="mb-2 mt-4 font-semibold text-primary">Original Message:</div>
        <p className="text-sm italic text-muted-foreground">
          &quot;{quote.meg}&quot;
        </p>
      </CardContent>
      <CardFooter className="bg-muted/40 p-4">
        <InfoLine icon={<Hash size={14} />} text={`Ref ID: ${quote.id}`} />
      </CardFooter>
    </Card>
  </motion.div>
);

// --- MAIN PAGE COMPONENT ---
export default function VendorQuotesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [archivedQuotes, setArchivedQuotes] = useState<ArchivedQuote[]>([]);

  // New states for the Customer Details Modal
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);

  // Filter states
  const [quoteFilter, setQuoteFilter] = useState<FilterStatus>('all');
  const [rentalFilter, setRentalFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(undefined);

  const VENDOR_USER_ID = useUser().user?.id;

  // Function to fetch detailed user info and open modal
  const handleCustomerNameClick = async (userId: number) => {
    setIsUserLoading(true);
    setIsUserModalOpen(true);
    try {
        const response = await api.get(`/users/${userId}/`);
        setSelectedUser(response.data as DetailedUser);
    } catch (err) {
        toast.error("Failed to fetch customer details.");
        console.error("Error fetching user details:", err);
        setSelectedUser(null);
    } finally {
        setIsUserLoading(false);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const quotesPromise = api.get('/quotes/');
        const rentalsPromise = api.get('/rentals/');
        const productMapPromise = api.get('/products/map-user/');

        const [quoteResponse, rentalResponse, productMapResponse] = await Promise.all([
          quotesPromise,
          rentalsPromise,
          productMapPromise,
        ]);

        const vendorQuotes = quoteResponse.data.results.filter(
          (q: Quote) => q.product_details.user === VENDOR_USER_ID
        );

        const vendorRentals = rentalResponse.data.results.filter(
          (r: Rental) => r.product_details.user === VENDOR_USER_ID
        );

        const productUserMap: { [productId: string]: number } =
          productMapResponse.data.reduce((acc: { [x: string]: any; }, product: { id: string | number; user: any; }) => {
            acc[product.id] = product.user;
            return acc;
          }, {} as { [productId: string]: number });

        const vendorArchivedQuotes = (
          localArchivedQuoteData as ArchivedQuote[]
        ).filter((quote) => productUserMap[quote.product_id] === VENDOR_USER_ID);

        setQuotes(vendorQuotes);
        setRentals(vendorRentals);
        setArchivedQuotes(vendorArchivedQuotes);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (VENDOR_USER_ID) {
      fetchData();
    }
  }, [VENDOR_USER_ID]);

  // Combined filter logic (FIXED TS ERROR HERE)
  const filterData = (data: (Quote | Rental)[], statusFilter: FilterStatus, query: string, dateFilter: Date | undefined) => {
    return data.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      // FIX TS Error: Explicitly check for property existence before accessing
      const customerName = 'full_name' in item ? item.full_name : ('user_name' in item ? item.user_name : ''); 
      const itemEmail = 'email' in item ? item.email : '';
      const itemPhone = 'phone' in item ? item.phone : '';

      const searchableText = `${'product_details' in item ? item.product_details.name : ''} ${customerName} ${itemEmail} ${itemPhone}`.toLowerCase();
      const matchesSearch = searchQuery.length === 0 || searchableText.includes(query.toLowerCase());

      const itemDate = new Date(item.created_at);
      const matchesDate = !dateFilter || (itemDate.getDate() === dateFilter.getDate() && itemDate.getMonth() === dateFilter.getMonth() && itemDate.getFullYear() === dateFilter.getFullYear());

      return matchesStatus && matchesSearch && matchesDate;
    });
  };


  const filteredQuotes = filterData(quotes, quoteFilter, searchQuery, date) as Quote[];
  const filteredRentals = filterData(rentals, rentalFilter, searchQuery, date) as Rental[];

  const getStatusButtonVariant = (status: FilterStatus, currentFilter: FilterStatus) => {
    return status === currentFilter ? 'default' : 'outline';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Vendor Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your customer quotes and rental requests in one place.
          </p>
        </motion.div>

        <Tabs defaultValue="quotes" className="mt-8">
          <TabsList className="flex flex-wrap h-auto gap-2 p-2 sm:grid sm:w-fit sm:grid-cols-3">
            <TabsTrigger value="quotes" className="flex-1 min-w-[120px]">
              <Inbox className="mr-2 h-4 w-4" /> Quotes{' '}
              <Badge className="ml-2">{quotes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rentals" className="flex-1 min-w-[120px]">
              <Rocket className="mr-2 h-4 w-4" /> Rentals{' '}
              <Badge className="ml-2">{rentals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex-1 min-w-[120px]">
              <Clock className="mr-2 h-4 w-4" /> Archived{' '}
              <Badge variant="secondary" className="ml-2">
                {archivedQuotes.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key="tab-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="quotes" className="mt-6">
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  {/* Search and Date filters */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by product or customer name, email, or phone..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-[280px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarPicker
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setDate(undefined);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
                {/* Status filters */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => setQuoteFilter('all')}
                    variant={getStatusButtonVariant('all', quoteFilter)}
                    className="flex-1 sm:flex-none"
                  >
                    All
                  </Button>
                  <Button
                    onClick={() => setQuoteFilter('pending')}
                    variant={getStatusButtonVariant('pending', quoteFilter)}
                    className="flex-1 sm:flex-none"
                  >
                    <Inbox className="mr-2 h-4 w-4" /> Pending
                  </Button>
                  <Button
                    onClick={() => setQuoteFilter('approved')}
                    variant={getStatusButtonVariant('approved', quoteFilter)}
                    className="flex-1 sm:flex-none"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Approved
                  </Button>
                  <Button
                    onClick={() => setQuoteFilter('rejected')}
                    variant={getStatusButtonVariant('rejected', quoteFilter)}
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Rejected
                  </Button>
                </div>
                {filteredQuotes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredQuotes.map((quote) => (
                      <QuoteCard 
                        key={quote.id} 
                        quote={quote} 
                        onCustomerClick={handleCustomerNameClick} 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-10 text-center text-muted-foreground">
                    No matching quotes found.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="rentals" className="mt-6">
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  {/* Search and Date filters */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by product or customer name, email, or phone..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-[280px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarPicker
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setDate(undefined);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
                {/* Status filters */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => setRentalFilter('all')}
                    variant={getStatusButtonVariant('all', rentalFilter)}
                    className="flex-1 sm:flex-none"
                  >
                    All
                  </Button>
                  <Button
                    onClick={() => setRentalFilter('pending')}
                    variant={getStatusButtonVariant('pending', rentalFilter)}
                    className="flex-1 sm:flex-none"
                  >
                    <Inbox className="mr-2 h-4 w-4" /> Pending
                  </Button>
                  <Button
                    onClick={() => setRentalFilter('approved')}
                    variant={getStatusButtonVariant('approved', rentalFilter)}
                    className="flex-1 sm:flex-none"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Approved
                  </Button>
                  <Button
                    onClick={() => setRentalFilter('rejected')}
                    variant={getStatusButtonVariant('rejected', rentalFilter)}
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Rejected
                  </Button>
                </div>
                {filteredRentals.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRentals.map((rental) => (
                      <RentalCard 
                        key={rental.id} 
                        rental={rental} 
                        onCustomerClick={handleCustomerNameClick} 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-10 text-center text-muted-foreground">
                    No matching rental requests found.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="archived" className="mt-6">
                {archivedQuotes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {archivedQuotes.map((quote) => (
                      <ArchivedQuoteCard key={quote.id} quote={quote} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-10 text-center text-muted-foreground">
                    No archived quotes found.
                  </p>
                )}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>
      
      {/* Customer Details Modal */}
      {isUserLoading ? (
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <div className="flex flex-col items-center justify-center py-8">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    <p className='mt-3 text-sm text-muted-foreground'>Fetching customer data...</p>
                </div>
            </DialogContent>
        </Dialog>
      ) : (
        <CustomerDetailsModal
            user={selectedUser}
            isOpen={isUserModalOpen}
            onOpenChange={setIsUserModalOpen}
        />
      )}
    </div>
  );
}