"use client";
import { useState, useMemo } from "react";
import { Calendar, MapPin, Clock, ArrowLeft, Building2, ChevronRight, ExternalLink, Users, TrendingUp, Sparkles } from "lucide-react";

// --- Type Definitions ---

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
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  image: string;
  description: string;
  organizer: string;
  organizerInfo: string;
  blogs: BlogType[];
  category?: string;
  registrationLink: string;
}

// --- Event Data ---

const events: EventType[] = [

  {
  "id": 2,
  "title": "India Warehousing & Logistics Show 2025 (IWLS)",
  "startDate": "2025-11-20",
  "endDate": "2025-11-22",
  "time": "10:00 AM – 6:00 PM",
  "location": "Bombay Exhibition Centre, Goregaon (E), Mumbai",
  "image": "/event.webp",
  "description": "Attend the India Warehousing & Logistics Show 2025 (IWLS), Western & Southern India's only platform to display complete warehousing and logistics solutions. The event is co-located with the India Cold Chain Show and features the Cold Chain Conclave on November 20, 2025. This premier industry gathering is built by RX and is the ideal place to explore cutting-edge material handling, automation, and supply chain technology.",
  "organizer": "RX India (Built by RX)",
  "organizerInfo": "The India Warehousing & Logistics Show (IWLS) is built by RX (Reed Exhibitions), a leading global events organizer. IWLS is recognized as Western & Southern India's only dedicated platform for warehousing and logistics solutions. The show is co-located with the India Cold Chain Show, featuring the Cold Chain Conclave. SOTI is the Title Partner for the India Warehousing & Logistics Show.",
  "blogs": [
    // {
    //   "title": "Why You Should Attend India Warehousing & Logistics Show 2025 – Mumbai",
    //   "link": "https://www.mhebazar.in/blog/india-warehousing-logistics-show-2025-mumbai",
    //   "image": "/event.webp",
    //   "author": "MHE Bazar Team",
    //   "category": "Industry Events",
    //   "description": "Discover why the India Warehousing & Logistics Show 2025 in Mumbai is a must-attend event for professionals in material handling, logistics, and cold chain technology."
    // }
  ],
  "category": "Warehousing, Logistics & Cold Chain",
  "registrationLink": "https://www.indiawlshow.com/en-gb.html"
},
  {
    id: 1,
    title: "Intralogistics & Warehousing Expo 2025",
    startDate: "2025-11-06",
    endDate: "2025-11-08",
    time: "10:00 AM – 6:00 PM",
    location: "Bengaluru, KTPO, Whitefield",
    image: "/event.jpg",
    description:
      "Be Part of India Warehousing & Logistics Expo 2025 – Bengaluru's Biggest Industry Gathering! Experience cutting-edge Material Handling and Logistics solutions, meet top manufacturers, and drive business growth with MHE Bazar at IW Expo Bengaluru 2025. This premier event brings together industry leaders to showcase the future of intralogistics, automation, and supply chain technology.",
    organizer: "MHE Bazar",
    organizerInfo:
      "MHE Bazar, India’s trusted marketplace for Material Handling Equipment (MHE), actively participates in and hosts key industry events, trade fairs, and technology showcases across the country. These platforms allow us to highlight our latest innovations in forklifts, stackers, lithium-ion conversion kits, and energy-efficient warehouse solutions. As part of Greentech India Material Handling LLP, MHE Bazar is committed to driving India’s transition toward sustainable and smart material handling operations, aligning with the nation’s vision for net-zero emissions by 2070. Through our presence at these events, we connect with manufacturers, distributors, and logistics professionals—demonstrating how our digital platform simplifies the buying, selling, and renting of new or used equipment. We’re proud to announce that MHE Bazar is the official eCommerce Partner for this Expo. Visit us at Booth No. A-41 to explore the future of material handling technology and discover opportunities to build meaningful industry partnerships.",
    blogs: [
      {
        title: "Why You Should Attend Intralogistics and Warehousing Expo 2025 – Bengaluru",
        link: "https://www.mhebazar.in/blog/intralogistics-warehousing-expo-2025-bengaluru",
        image: "/event.jpg",
        author: "MHE Bazar Team",
        category: "Industry Events",
        description: "Discover why the Intralogistics and Warehousing Expo 2025 in Bengaluru is a must-attend event for professionals in material handling and logistics."
      }
    ],
    category: "Warehousing & Logistics",
    registrationLink: "https://fmeregistrations.com/iwe25/visitor-registration"
  },

];

// --- Utility Functions ---

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
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  const eventsWithStatus = useMemo(() => 
    events.map(event => ({
      ...event,
      status: getEventStatus(event.startDate, event.endDate),
      formattedDate: formatDateRange(event.startDate, event.endDate)
    })),
    []
  );

  const handleRegister = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Status Badge Component - Enhanced styling
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
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
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
            "itemListElement": events.map((event, index) => ({
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
              }
            }))
          })
        }}
      />

      {/* --- Event List View --- */}
      {!selectedEvent && (
        <>
          {/* Hero Section - Enhanced with animated gradient and floating elements */}
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
                <span className="block  bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700">
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
                  {/* Image Div - Enhanced with gradient overlay and better hover effect */}
                  <div className="relative aspect-[2/1] overflow-hidden bg-gradient-to-br from-emerald-100 to-green-100">
                    <img
                      src={event.image}
                      alt={event.title}
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-110 group-hover:rotate-1 transition-all duration-700"
                    />
                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                      <StatusBadge status={event.status} />
                      {event.category && (
                        <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-gray-800 shadow-lg border border-gray-200">
                          {event.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                      {event.title}
                    </h2>

                    {/* Key details presented clearly with enhanced icons */}
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
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="w-full inline-flex items-center justify-center px-6 py-3.5 border-2 border-gray-200 rounded-xl font-bold text-base text-gray-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all group"
                      >
                        View Full Details
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {/* --- Event Detail View (Enhanced) --- */}
      {selectedEvent && (() => {
        const status = getEventStatus(selectedEvent.startDate, selectedEvent.endDate);
        const formattedDate = formatDateRange(selectedEvent.startDate, selectedEvent.endDate);
        
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <button
              onClick={() => setSelectedEvent(null)}
              className="inline-flex items-center text-gray-600 hover:text-emerald-600 font-bold mb-8 transition-all group px-5 py-3 rounded-xl hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to All Events
            </button>

            <article className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
              {/* Image Div - Enhanced */}
              <div className="relative aspect-[2/1] w-full bg-gradient-to-br from-emerald-100 to-green-100">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
                  <StatusBadge status={status} />
                  {selectedEvent.category && (
                    <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold bg-white/95 backdrop-blur-sm text-gray-800 shadow-lg border-2 border-gray-200">
                      {selectedEvent.category}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6 sm:p-8 lg:p-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-tight">
                  {selectedEvent.title}
                </h1>

                {/* Key Info Strip - Enhanced with better visual hierarchy */}
                <div className="grid sm:grid-cols-3 gap-6 mb-10 p-6 sm:p-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 shadow-inner">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-lg mr-4 flex-shrink-0 border-2 border-emerald-100">
                      <Calendar className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</p>
                      <p className="text-base font-black text-gray-900">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-lg mr-4 flex-shrink-0 border-2 border-indigo-100">
                      <Clock className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time</p>
                      <p className="text-base font-black text-gray-900">{selectedEvent.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-lg mr-4 flex-shrink-0 border-2 border-red-100">
                      <MapPin className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</p>
                      <p className="text-base font-black text-gray-900">{selectedEvent.location}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-10">
                  <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full mr-3"></div>
                    Event Overview
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Registration Button - Maximum prominence */}
                <div className="flex flex-wrap gap-4 mb-12">
                  <button
                    onClick={() => handleRegister(selectedEvent.registrationLink)}
                    disabled={status === 'completed'}
                    className={`inline-flex items-center px-12 py-5 rounded-xl font-black text-lg transition-all shadow-2xl ${
                      status === 'completed'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner'
                        : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-white hover:shadow-2xl hover:shadow-emerald-400/50 transform hover:scale-[1.03] animate-pulse'
                    }`}
                    style={status !== 'completed' ? { animationDuration: '2s' } : {}}
                  >
                    {status === 'completed' ? 'Event Completed' : 'Register Now - Free Entry'}
                    {status !== 'completed' && <ExternalLink className="w-5 h-5 ml-3" />}
                  </button>
                </div>

                {/* Organizer Info & Related Blogs */}
                <div className="border-t-2 border-gray-200 pt-12">
                  {/* Organizer Section */}
                  <div className="flex items-center mb-8">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 mr-4 shadow-xl flex-shrink-0">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                      About <span className="text-emerald-600">{selectedEvent.organizer}</span>
                    </h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-10 text-base">
                    {selectedEvent.organizerInfo}
                  </p>

                  {/* Featured Insights/Blogs Section */}
                  {selectedEvent.blogs.length > 0 && (
                    <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-inner">
                      <div className="flex items-center mb-6">
                        <TrendingUp className="w-7 h-7 text-emerald-600 mr-3" />
                        <h3 className="text-xl font-black text-gray-900">
                          Featured Insights & Articles
                        </h3>
                      </div>
                      <div className="grid gap-6">
                        {selectedEvent.blogs.map((blog, i) => (
                          <a
                            key={i}
                            href={blog.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col md:flex-row gap-6 p-5 bg-white rounded-xl hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-emerald-400 transform hover:-translate-y-1"
                          >
                            {/* Blog Image */}
                            <div className="relative w-full md:w-56 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-100 to-green-100">
                              <img
                                src={blog.image}
                                alt={blog.title}
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    {blog.category}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center font-semibold">
                                    <Users className="w-3.5 h-3.5 mr-1" />
                                    By {blog.author}
                                  </span>
                                </div>
                                <h4 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors mb-2 line-clamp-2">
                                  {blog.title}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                  {blog.description}
                                </p>
                              </div>
                              <div className="flex items-center text-emerald-600 font-bold text-sm mt-3 group-hover:gap-2 transition-all">
                                <span>Continue Reading</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </section>
        );
      })()}
    </div>
  );
}