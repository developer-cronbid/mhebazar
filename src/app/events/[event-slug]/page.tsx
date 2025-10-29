"use client";
import { useMemo } from "react";
import { Calendar, MapPin, Clock, ChevronRight, ExternalLink, Sparkles, TrendingUp, Building2 } from "lucide-react";
import Link from "next/link";
import eventsData from "@/data/events.json";

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
  slug: string;
  title: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  venue: string;
  image: string;
  description: string;
  highlights: string[];
  organizer: string;
  organizerInfo: string;
  blogs: BlogType[];
  category?: string;
  registrationLink: string;
}

const events: EventType[] = eventsData as EventType[];

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
  
  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = start.toLocaleDateString('en-IN', { month: 'long' });
  const year = start.getFullYear();
  
  return `${startDay} – ${endDay} ${month} ${year}`;
};

export default function EventsPage() {
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

  const StatusBadge = ({ status }: { status: 'upcoming' | 'ongoing' | 'completed' }) => {
    const styles = {
      upcoming: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200',
      ongoing: 'bg-gradient-to-r from-[#5ca131] to-emerald-600 text-white shadow-lg shadow-green-300 animate-pulse',
      completed: 'bg-gray-400 text-white'
    };

    const labels = {
      upcoming: '🎯 Upcoming',
      ongoing: '🔴 Live Now',
      completed: '✓ Completed'
    };

    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${styles[status]} backdrop-blur-sm`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-white">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5ca131]/5 via-transparent to-blue-600/5"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#5ca131]/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#5ca131]/10 to-emerald-600/10 border-2 border-[#5ca131]/20 mb-8 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-[#5ca131]" />
              <span className="text-base font-bold text-gray-800">Industry-Leading Events & Exhibitions</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-8 leading-tight">
              Transform Your Business at
              <span className="block mt-3 bg-gradient-to-r from-[#5ca131] via-green-600 to-emerald-600 bg-clip-text text-transparent">
                MHE Bazar Events
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-medium">
              Join India's most prestigious material handling and logistics exhibitions. 
              <span className="block mt-2 text-[#5ca131] font-bold">Connect. Innovate. Grow.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          {eventsWithStatus.map((event) => (
            <article
              key={event.id}
              className={`group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 ${
                event.status === 'completed' 
                  ? 'opacity-60 border-gray-300' 
                  : event.status === 'ongoing'
                  ? 'border-[#5ca131] ring-4 ring-[#5ca131]/20'
                  : 'border-gray-200 hover:border-[#5ca131]'
              } transform hover:scale-[1.02]`}
            >
              {/* Image Section - Full Width */}
              <div className="relative w-full h-72 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                <img
                  src={event.image}
                  alt={event.title}
                  loading="lazy"
                  className="object-contain w-full h-full p-4"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Status Badge */}
                <div className="absolute top-6 left-6">
                  <StatusBadge status={event.status} />
                </div>
                
                {/* Category Badge */}
                {event.category && (
                  <div className="absolute top-6 right-6">
                    <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold bg-white/95 text-gray-800 backdrop-blur-md shadow-lg">
                      {event.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-8">
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-5 leading-tight group-hover:text-[#5ca131] transition-colors">
                  {event.title}
                </h2>

                {/* Event Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date</p>
                      <p className="text-sm font-bold text-gray-900">{event.formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm flex-shrink-0">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Time</p>
                      <p className="text-sm font-bold text-gray-900">{event.time}</p>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#5ca131]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Venue</p>
                      <p className="text-sm font-bold text-gray-900">{event.venue}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-6 line-clamp-3">
                  {event.description}
                </p>

                {/* Highlights */}
                {event.highlights && event.highlights.length > 0 && (
                  <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Event Highlights</h3>
                    </div>
                    <ul className="grid grid-cols-2 gap-2">
                      {event.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-amber-600 font-bold">✓</span>
                          <span className="font-medium">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-6 border-t-2 border-gray-100">
                  <button
                    onClick={() => handleRegister(event.registrationLink)}
                    disabled={event.status === 'completed'}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base transition-all shadow-lg ${
                      event.status === 'completed'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : event.status === 'ongoing'
                        ? 'bg-gradient-to-r from-[#5ca131] to-emerald-600 text-white hover:shadow-2xl hover:shadow-green-300 hover:scale-105'
                        : 'bg-gradient-to-r from-[#5ca131] to-green-600 text-white hover:shadow-2xl hover:shadow-green-300 hover:scale-105'
                    }`}
                  >
                    {event.status === 'completed' ? 'Event Completed' : '🎟️ Register Free Now'}
                    {event.status !== 'completed' && <ExternalLink className="w-5 h-5" />}
                  </button>
                  
                  <Link
                    href={`/events/${event.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 border-2 border-[#5ca131] rounded-xl font-bold text-base text-[#5ca131] hover:bg-[#5ca131] hover:text-white transition-all group"
                  >
                    View Complete Details
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5ca131] to-green-700 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Building2 className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Join thousands of industry professionals at India's premier material handling events
          </p>
          <button
            onClick={() => handleRegister(events[0].registrationLink)}
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#5ca131] rounded-xl font-black text-lg shadow-2xl hover:scale-105 transition-all"
          >
            Register for Free Today
            <ExternalLink className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
}