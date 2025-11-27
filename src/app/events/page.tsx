"use client";
import { useState, useMemo, useEffect } from "react";
import Link from 'next/link'; 
import { Calendar, MapPin, Clock, ArrowLeft, Building2, ChevronRight, ExternalLink, Users, TrendingUp, Sparkles } from "lucide-react";

// --- Data Import ---
import eventData from './events.json';

// --- Type Definitions (kept as is) ---
interface BlogType {
  title: string;
  link: string;
  image: string;
  author: string;
  category: string;
  description: string;
}

interface EventType {
  id: number;
  title: string;
  slug: string; 
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  image: string;
  ogImage: string; 
  description: string;
  organizer: string;
  organizerInfo: string;
  blogs: BlogType[];
  category?: string;
  registrationLink: string;
}

// --- Utility Functions (kept as is) ---
// ... (Utility Functions kept as is) ...
const getEventStatus = (startDate: string, endDate: string): 'upcoming' | 'ongoing' | 'completed' => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'completed';
};

const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('en-IN', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-IN', { month: 'short' });
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} – ${endDay} ${startMonth} ${year}`;
  }
  
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
};


// --- Event Page Component ---

export default function EventsPage() {
  
  const eventsWithStatus = useMemo(() => 
    (eventData as EventType[]) 
    .map(event => ({
      ...event,
      status: getEventStatus(event.startDate, event.endDate),
      formattedDate: formatDateRange(event.startDate, event.endDate)
    })),
    []
  );

  const latestEvent = eventsWithStatus[0];
  const pageTitle = "MHE Bazar | Explore Industry-Leading Material Handling & Logistics Events";
  const pageDescription = "Find India's biggest upcoming events, expos, and trade fairs for warehousing, intralogistics, automation, and material handling equipment (MHE) solutions.";


  // --- FIX: Robust Client-side OG Tags (List Page) ---
  // Using an external function to append meta tags robustly for social sharing tools.
  useEffect(() => {
    if (latestEvent) {
        document.title = pageTitle;
        const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://yourdomain.com/events';

        const setMetaTag = (property: string, content: string) => {
            let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
            if (!tag) { 
                tag = document.createElement('meta'); 
                tag.setAttribute('property', property); 
                document.head.appendChild(tag); 
            }
            tag.setAttribute('content', content);
        };

        setMetaTag('og:title', pageTitle);
        setMetaTag('og:description', pageDescription);
        setMetaTag('og:image', latestEvent.ogImage); // Using latest event's image
        setMetaTag('og:url', currentUrl);
        setMetaTag('og:type', 'website');
        
        // Twitter Card
        setMetaTag('twitter:card', 'summary_large_image');
        setMetaTag('twitter:image', latestEvent.ogImage);
    }
  }, [latestEvent, pageTitle, pageDescription]);


  const handleRegister = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: 'upcoming' | 'ongoing' | 'completed' }) => {
    const styles = {
      upcoming: 'bg-indigo-600/95 text-white backdrop-blur-sm shadow-lg shadow-indigo-500/50',
      ongoing: 'bg-emerald-600/95 text-white backdrop-blur-sm shadow-lg shadow-emerald-500/50 animate-pulse',
      completed: 'bg-gray-500/95 text-white backdrop-blur-sm shadow-lg'
    };

    const labels = {
      upcoming: 'Upcoming Event',
      ongoing: 'Live Now',
      completed: 'Event Ended'
    };

    return (
      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
        {status === 'ongoing' && (
          <span className="relative flex h-2.5 w-2.5 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
        )}
        {status === 'upcoming' && <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white antialiased">
      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": eventData.map((event, index) => ({
              "@type": "Event",
              "position": index + 1,
              "name": event.title,
              "startDate": event.startDate,
              "endDate": event.endDate,
              "location": {
                "@type": "Place",
                "name": event.location
              },
              "description": event.description,
              "organizer": {
                "@type": "Organization",
                "name": event.organizer
              },
              "url": `/events/${event.slug}` 
            }))
          })
        }}
      />

      {/* --- Event List View --- */}
      <>
        {/* Hero Section (kept as is) */}
        <section className="relative overflow-hidden pt-20 pb-32 sm:pb-40 bg-gradient-to-br from-emerald-50 via-white to-green-50">
          {/* Animated Background Gradient Orbs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Geometric Pattern Overlay */}
          <div className="absolute inset-0 bg-repeat opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235ca131' fill-opacity='1'%3E%3Cpath d='M36 34L48 24 42 30 39 33 36 34zm9 3c-.71 0-1.38.21-1.93.57L33.72 45.42C33.2 46.84 31.69 48 30 48c-1.69 0-3.2-.84-3.72-2.58L16.93 37.57A3.99 3.99 0 0 1 15 37c-2.21 0-4 1.79-4 4s1.79 4 4 4c.21 0 .42-.02.63-.07l9.89 12.08C25.84 58.74 27.8 60 30 60c2.2 0 4.16-1.26 5.48-3.04l9.89-12.08c.21.05.42.07.63.07 2.21 0 4-1.79 4-4s-1.79-4-4-4z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Animated Badge with Pulse */}
            <div className="inline-flex items-center px-5 py-2 rounded-full bg-white border-2 border-emerald-200 mb-8 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">The Future of Logistics & MHE</span>
            </div>
            
            {/* Main Heading with Enhanced Typography */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-tight tracking-tight">
              Explore Industry-Leading
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700">
                MHE Events
              </span>
            </h1>
          </div>
        </section>

        {/* Event Cards Section - Floating effect with better spacing */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-35">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {eventsWithStatus.map((event) => (
              <article
                key={event.id}
                className={`group bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden border-2 ${
                  event.status === 'completed' 
                    ? 'opacity-70 border-gray-200 hover:border-gray-300' 
                    : event.status === 'ongoing'
                    ? 'border-emerald-500 ring-8 ring-emerald-100/50 shadow-emerald-200/50' 
                    : 'border-gray-100 hover:border-emerald-400 hover:ring-4 hover:ring-emerald-100/50'
                } transform hover:-translate-y-2 hover:scale-[1.02]`}
              >
                {/* FIX: Image Div - Changed aspect ratio to 16/9 for wider view */}
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-emerald-100 to-green-100">
                  <img
                    src={event.image}
                    alt={event.title}
                    loading="lazy"
                    className="object-cover w-full h-full group-hover:scale-110 group-hover:rotate-1 transition-all duration-700"
                  />
                  {/* Enhanced gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                  {/* FIX: Tags repositioned to the bottom to avoid covering the image focus area */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
                    <StatusBadge status={event.status} />
                    {event.category && (
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-gray-800 shadow-lg border border-gray-200">
                        {event.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                    {event.title}
                  </h2>

                  {/* Key details (kept as is) */}
                  <div className="space-y-3 mb-5 border-y border-gray-100 py-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="font-bold">{event.formattedDate}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <Clock className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="font-semibold">{event.time}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-semibold">{event.location}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-base leading-relaxed line-clamp-3 mb-6">
                    {event.description}
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleRegister(event.registrationLink)}
                      disabled={event.status === 'completed'}
                      className={`w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
                        event.status === 'completed'
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-white hover:shadow-2xl hover:shadow-emerald-300/50 transform hover:scale-[1.02]'
                      }`}
                    >
                      {event.status === 'completed' ? 'Event Completed' : 'Register Now Free'}
                      {event.status !== 'completed' && <ExternalLink className="w-4 h-4 ml-2" />}
                    </button>
                    {/* Updated to use Link for client-side navigation */}
                    <Link
                      href={`/events/${event.slug}`}
                      className="w-full inline-flex items-center justify-center px-6 py-3.5 border-2 border-gray-200 rounded-xl font-bold text-base text-gray-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all group"
                    >
                      View Full Details
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </>
      
    </div>
  );
}