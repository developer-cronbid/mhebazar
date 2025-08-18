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
import api from '@/lib/api';
import localArchivedQuoteData from '@/data/quoteData.json';
import { useUser } from '@/context/UserContext';

// --- TYPESCRIPT INTERFACES ---
interface ApiProduct {
  id: number;
  user: number;
}

interface Quote {
  id: number;
  product_details: { user: number; name: string; images: { image: string }[] };
  user_name: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Rental {
  id: number;
  product_details: { user: number; name: string; images: { image: string }[] };
  user_name: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
}

// This interface is for your local JSON file
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
  product_id: string; // The key we'll use for the lookup
}

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
      <div className="mr-2">{icon}</div>
      <span>{text}</span>
    </div>
  ) : null;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// --- CARD COMPONENTS ---
const QuoteCard = ({ quote }: { quote: Quote }) => (
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
        <div className="flex-1">
          <Badge
            variant={quote.status === 'pending' ? 'default' : 'secondary'}
            className="mb-1"
          >
            {quote.status}
          </Badge>
          <CardTitle className="text-lg">{quote.product_details.name}</CardTitle>
          <CardDescription>{formatDate(quote.created_at)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="mb-2 font-semibold text-primary">Customer Details:</div>
        <div className="space-y-2">
          <InfoLine icon={<User size={14} />} text={quote.user_name} />
        </div>
        <div className="mb-2 mt-4 font-semibold text-primary">Message:</div>
        <p className="text-sm italic text-muted-foreground">
          &quot;{quote.message}&quot;
        </p>
      </CardContent>
      <CardFooter className="bg-muted/40 p-4">
        <InfoLine icon={<Hash size={14} />} text={`Quote ID: Q-${quote.id}`} />
      </CardFooter>
    </Card>
  </motion.div>
);

const RentalCard = ({ rental }: { rental: Rental }) => (
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
        <div className="flex-1">
          <Badge
            variant={rental.status === 'pending' ? 'default' : 'secondary'}
            className="mb-1"
          >
            {rental.status}
          </Badge>
          <CardTitle className="text-lg">{rental.product_details.name}</CardTitle>
          <CardDescription>{formatDate(rental.created_at)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="mb-2 font-semibold text-primary">Customer & Rental Period:</div>
        <div className="space-y-2">
          <InfoLine icon={<User size={14} />} text={rental.user_name} />
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
      <CardFooter className="bg-muted/40 p-4">
        <InfoLine icon={<Hash size={14} />} text={`Rental ID: R-${rental.id}`} />
      </CardFooter>
    </Card>
  </motion.div>
);

const ArchivedQuoteCard = ({ quote }: { quote: ArchivedQuote }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="flex h-full flex-col overflow-hidden border-dashed transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="bg-muted/40 p-4">
        <Badge variant="outline" className="w-fit-content mb-2">
          Archived
        </Badge>
        <CardTitle>{quote.pname}</CardTitle>
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

  // Assume the vendor's user ID is 24
  const VENDOR_USER_ID = useUser().user?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Fetch quotes, rentals, and the new product map concurrently.
        const quotesPromise = api.get('/quotes/');
        const rentalsPromise = api.get('/rentals/');
        // ✅ This is the only change needed: call your new, efficient endpoint.
        const productMapPromise = api.get('/products/map-user/');

        const [quoteResponse, rentalResponse, productMapResponse] = await Promise.all([
          quotesPromise,
          rentalsPromise,
          productMapPromise,
        ]);

        // Filter LIVE quotes for the current vendor
        const vendorQuotes = quoteResponse.data.results.filter(
          (q: Quote) => q.product_details.user === VENDOR_USER_ID
        );

        // Filter LIVE rentals for the current vendor
        const vendorRentals = rentalResponse.data.results.filter(
          (r: Rental) => r.product_details.user === VENDOR_USER_ID
        );

        // ✅ Create the lookup map from the direct API response.
        const productUserMap: { [productId: string]: number } =
          productMapResponse.data.reduce((acc, product) => {
            acc[product.id] = product.user;
            return acc;
          }, {} as { [productId: string]: number });

        // Filter ARCHIVED quotes using the lookup map.
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

    fetchData();
  }, [VENDOR_USER_ID]);

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
          <TabsList className="grid w-full grid-cols-1 sm:w-fit sm:grid-cols-3">
            <TabsTrigger value="quotes">
              <Inbox className="mr-2 h-4 w-4" /> New Quotes{' '}
              <Badge className="ml-2">{quotes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rentals">
              <Rocket className="mr-2 h-4 w-4" /> Rental Requests{' '}
              <Badge className="ml-2">{rentals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived">
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
                {quotes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {quotes.map((quote) => (
                      <QuoteCard key={quote.id} quote={quote} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-10 text-center text-muted-foreground">
                    No new quotes found.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="rentals" className="mt-6">
                {rentals.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {rentals.map((rental) => (
                      <RentalCard key={rental.id} rental={rental} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-10 text-center text-muted-foreground">
                    No new rental requests found.
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
    </div>
  );
}