"use client";
import { useState, useMemo } from "react";
import { Calendar, MapPin, Clock, ArrowLeft, Building2, ChevronRight, ExternalLink, Users, TrendingUp } from "lucide-react";

// --- Type Definitions (No change) ---

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

// --- Event Data (No change) ---
// Note: Keeping only one event for brevity and focus on UI, but the structure is ready for multiple events.
const events: EventType[] = [
  {
    id: 1,
    title: "Intralogistics & Warehousing Expo 2025",
    startDate: "2025-11-06",
    endDate: "2025-11-08",
    time: "10:00 AM – 6:00 PM",
    location: "Bengaluru, KTPO, Whitefield",
    image: "/event.jpg", // Assuming this is placed in your public folder
    description:
      "Be Part of India Warehousing & Logistics Expo 2025 – Bengaluru's Biggest Industry Gathering! Experience cutting-edge Material Handling and Logistics solutions, meet top manufacturers, and drive business growth with MHE Bazar at IW Expo Bengaluru 2025. This premier event brings together industry leaders to showcase the future of intralogistics, automation, and supply chain technology.",
    organizer: "MHE Bazar",
    organizerInfo:
      "MHE Bazar, India's trusted marketplace for Material Handling Equipment (MHE), actively participates in and hosts key industry events, trade fairs, and technology showcases across the country. These events highlight our innovations in forklifts, stackers, lithium-ion conversion kits, and energy-efficient warehouse solutions. Through our event presence, we connect with manufacturers, distributors, and logistics professionals to demonstrate how MHE Bazar's digital platform simplifies buying, selling, and renting new or used equipment. As part of Greentech India Material Handling LLP, we aim to drive India's transition toward sustainable and smart material handling operations, supporting the nation's vision for net-zero emissions by 2070. Join us at upcoming MHE Bazar events to explore the future of material handling technology and build valuable industry partnerships.",
    blogs: [
      {
        title: "Why You Should Attend Intralogistics and Warehousing Expo 2025 – Bengaluru",
        link: "https://www.mhebazar.in/intralogistics-warehousing-expo-2025-bengaluru",
        image: "/event.jpg", // Using the same image for the blog thumbnail for this example
        author: "MHE Bazar Team",
        category: "Industry Events",
        description: "Discover why the Intralogistics and Warehousing Expo 2025 in Bengaluru is a must-attend event for professionals in material handling and logistics."
      }
    ],
    category: "Warehousing & Logistics",
    registrationLink: "https://fmeregistrations.com/iwe25/visitor-registration"
  },
];

// --- Utility Functions (Refactored for clarity and best practices) ---

type EventStatus = 'upcoming' | 'ongoing' | 'completed';

const getEventStatus = (startDate: string, endDate: string): EventStatus => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  // Set end date to end of the day to properly capture multi-day events
  end.setHours(23, 59, 59, 999); 

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'completed';
};

const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-IN', options);
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


// --- UI Components ---

// Status Badge Component - Enhanced with pulse animation
const StatusBadge = ({ status }: { status: EventStatus }) => {
  const styles = {
    upcoming: 'bg-indigo-600/10 text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
    ongoing: 'bg-emerald-600/10 text-emerald-700 ring-1 ring-inset ring-emerald-600/20', // Animation moved inside
    completed: 'bg-gray-400/10 text-gray-700 ring-1 ring-inset ring-gray-400/20'
  };

  const labels = {
    upcoming: 'Upcoming',
    ongoing: 'Live Now',
    completed: 'Completed'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status === 'ongoing' && (
        <span className="relative flex h-2 w-2 mr-1.5">
            {/* The pulsing effect for 'Live Now' */}
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      )}
      {labels[status]}
    </span>
  );
};


// --- Event Page Component - The Extraordinary UI ---

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

  const primaryColor = '#5ca131'; // A deep MHE Bazar green

  return (
    // Minimalistic background color to make the cards pop
    <div className="min-h-screen bg-gray-50 antialiased">
      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            // ... SEO markup data
          })
        }}
      />

      {/* =========================================================
        --- Event List View (The main list/grid) ---
        =========================================================
      */}
      {!selectedEvent && (
        <>
          {/* Hero Section - Significantly Reduced Height
            The main content (cards) is strategically pulled up into this section 
            to solve the scroll issue, making them instantly visible.
          */}
          <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 bg-white shadow-lg border-b border-gray-100">
            {/* Background Pattern for design flair */}
            <div className="absolute inset-0 bg-repeat opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34L48 24 42 30 39 33 36 34zm9 3c-.71 0-1.38.21-1.93.57L33.72 45.42C33.2 46.84 31.69 48 30 48c-1.69 0-3.2-.84-3.72-2.58L16.93 37.57A3.99 3.99 0 0 1 15 37c-2.21 0-4 1.79-4 4s1.79 4 4 4c.21 0 .42-.02.63-.07l9.89 12.08C25.84 58.74 27.8 60 30 60c2.2 0 4.16-1.26 5.48-3.04l9.89-12.08c.21.05.42.07.63.07 2.21 0 4-1.79 4-4s-1.79-4-4-4z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              {/* Category Tagline */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 mb-4 shadow-sm">
                <span className="text-sm font-semibold text-gray-700">The Future of Logistics & MHE</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                Explore Industry-Leading
                <span className="block mt-2 bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, #10B981)` }}>
                  MHE Bazar Events 🌎
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Network with industry leaders, explore cutting-edge innovations, and accelerate your business growth.
              </p>
            </div>
          </section>

          {/* Event Cards Section - Overlaps the Hero for instant content visibility
            This is the core fix for the "big header" scroll issue. 
          */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-10 sm:-mt-12 z-10 relative">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {eventsWithStatus.map((event) => (
                <article
                  key={event.id}
                  className={`group bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden border 
                    ${event.status === 'completed' 
                      ? 'opacity-70 border-gray-100 hover:shadow-xl' 
                      : event.status === 'ongoing'
                      ? 'border-emerald-400 ring-4 ring-emerald-100' // Highlighting 'Live Now'
                      : 'border-gray-100 hover:border-emerald-300'
                    } transform hover:-translate-y-2`} // Stronger hover lift
                >
                  {/* Image Div - Maintained aspect ratio (2/1) for a modern, wide card look */}
                  <div className="relative aspect-[2/1] overflow-hidden bg-gray-100">
                    <img
                      src={event.image}
                      alt={event.title}
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" // Stronger image zoom
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <StatusBadge status={event.status} />
                      {event.category && (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 shadow-md backdrop-blur-sm">
                          {event.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                      {event.title}
                    </h2>

                    {/* Key details presented clearly */}
                    <div className="space-y-3 mb-5 border-y border-gray-100 py-4">
                      {/* Date */}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                        <span className="font-semibold">{event.formattedDate}</span>
                      </div>
                      {/* Time */}
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      {/* Location */}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                        <span className="font-medium">{event.location}</span>
                      </div>
                    </div>

                    <p className="text-gray-500 text-base leading-relaxed line-clamp-3 mb-6">
                      {event.description}
                    </p>

                    <div className="flex flex-col gap-3">
                      {/* Primary Action Button - Register */}
                      <button
                        onClick={() => handleRegister(event.registrationLink)}
                        disabled={event.status === 'completed'}
                        className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-base transition-all shadow-lg 
                          ${event.status === 'completed'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-2xl hover:shadow-green-300 transform hover:scale-[1.01]'
                          }`}
                      >
                        {event.status === 'completed' ? 'Event Completed' : 'Register Now'}
                        {event.status !== 'completed' && <ExternalLink className="w-4 h-4 ml-2" />}
                      </button>
                      
                      {/* Secondary Action Button - View Details */}
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-base text-gray-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all group"
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

      {/* =========================================================
        --- Event Detail View (Enhanced for maximum impact) ---
        =========================================================
      */}
      {selectedEvent && (() => {
        const status = getEventStatus(selectedEvent.startDate, selectedEvent.endDate);
        const formattedDate = formatDateRange(selectedEvent.startDate, selectedEvent.endDate);
        
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            
            {/* Back Button - Prominent and easy to hit */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="inline-flex items-center text-gray-600 hover:text-emerald-600 font-bold mb-8 transition-all group px-4 py-2 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200"
            >
              <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
              Back to All Events
            </button>

            <article className="bg-white rounded-3xl shadow-3xl overflow-hidden border border-gray-100">
              {/* Image Header with Status */}
              <div className="relative aspect-[2/1] w-full bg-gray-100">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                  <StatusBadge status={status} />
                  {selectedEvent.category && (
                    <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold bg-white text-gray-700 backdrop-blur-sm shadow-xl">
                      {selectedEvent.category}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6 sm:p-8 lg:p-12">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-8 leading-tight">
                  {selectedEvent.title} 
                </h1>

                {/* Key Info Strip - Prominent, visually engaging, and organized
                  A colored, bordered strip to draw attention to the essential details.
                */}
                <div className="grid sm:grid-cols-3 gap-6 mb-10 p-6 sm:p-8 bg-emerald-50/70 rounded-2xl border-2 border-emerald-200 shadow-inner">
                  
                  {/* Date Card */}
                  <div className="flex items-start bg-white p-4 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 mr-4 flex-shrink-0">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                      <p className="text-base font-bold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>
                  
                  {/* Time Card */}
                  <div className="flex items-start bg-white p-4 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 mr-4 flex-shrink-0">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Time</p>
                      <p className="text-base font-bold text-gray-900">{selectedEvent.time}</p>
                    </div>
                  </div>
                  
                  {/* Location Card */}
                  <div className="flex items-start bg-white p-4 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 mr-4 flex-shrink-0">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-base font-bold text-gray-900">{selectedEvent.location}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-10">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-4 border-b border-gray-100 pb-3">Event Overview</h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Registration Button - Maximum prominence */}
                <div className="flex flex-wrap gap-4 mb-12 border-t border-gray-100 pt-8">
                  <button
                    onClick={() => handleRegister(selectedEvent.registrationLink)}
                    disabled={status === 'completed'}
                    className={`inline-flex items-center px-12 py-4 rounded-full font-bold text-xl transition-all shadow-xl 
                      ${status === 'completed'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-2xl hover:shadow-green-400 transform hover:scale-[1.01]'
                      }`} // Full button effect
                  >
                    {status === 'completed' ? 'Event Completed' : 'Register Now for Free Entry'}
                    {status !== 'completed' && <ExternalLink className="w-5 h-5 ml-3" />}
                  </button>
                </div>

                {/* Organizer Info & Related Blogs */}
                <div className="border-t border-gray-200 pt-12">
                  
                  {/* Organizer Section */}
                  <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner">
                    <div className="flex items-center mb-6">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 mr-4 shadow-xl flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                        About <span className="text-emerald-600">{selectedEvent.organizer}</span>
                      </h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {selectedEvent.organizerInfo}
                    </p>
                  </div>

                  {/* Featured Insights/Blogs Section */}
                  {selectedEvent.blogs.length > 0 && (
                    <div className="mt-12">
                      <div className="flex items-center mb-6">
                        <TrendingUp className="w-6 h-6 text-emerald-600 mr-3" />
                        <h3 className="text-2xl font-bold text-gray-900">
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
                            className="group flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-emerald-400"
                          >
                            {/* Blog Image */}
                            <div className="relative w-full md:w-56 h-36 flex-shrink-0 rounded-xl overflow-hidden shadow-lg bg-gray-200">
                              <img
                                src={blog.image}
                                alt={blog.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                    {blog.category}
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                    By {blog.author}
                                  </span>
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2 line-clamp-2">
                                  {blog.title}
                                </h4>
                                <p className="text-base text-gray-600 line-clamp-2 leading-relaxed">
                                  {blog.description}
                                </p>
                              </div>
                              <div className="flex items-center text-emerald-600 font-semibold text-base mt-3 group-hover:gap-2 transition-all">
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