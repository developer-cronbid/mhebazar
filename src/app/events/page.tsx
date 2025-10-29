"use client";
import { useState, useMemo } from "react";
import { Calendar, MapPin, Clock, ArrowLeft, Building2, ChevronRight, ExternalLink, Users, TrendingUp } from "lucide-react";

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

const events: EventType[] = [
  {
    id: 1,
    title: "IntraLogistics & Warehousing Expo 2025",
    startDate: "2025-11-06",
    endDate: "2025-11-08",
    time: "10:00 AM – 6:00 PM",
    location: "Bengaluru",
    image: "/event.jpg",
    description:
      "Be Part of India Warehousing & Logistics Expo 2025 – Bengaluru's Biggest Industry Gathering! Experience cutting-edge Material Handling and Logistics solutions, meet top manufacturers, and drive business growth with MHE Bazar at IW Expo Bengaluru 2025.",
    organizer: "MHE Bazar",
    organizerInfo:
      "MHE Bazar, India's trusted marketplace for Material Handling Equipment (MHE), actively participates in and hosts key industry events, trade fairs, and technology showcases across the country. These events highlight our innovations in forklifts, stackers, lithium-ion conversion kits, and energy-efficient warehouse solutions. Through our event presence, we connect with manufacturers, distributors, and logistics professionals to demonstrate how MHE Bazar's digital platform simplifies buying, selling, and renting new or used equipment. As part of Greentech India Material Handling LLP, we aim to drive India's transition toward sustainable and smart material handling operations, supporting the nation's vision for net-zero emissions by 2070. Join us at upcoming MHE Bazar events to explore the future of material handling technology and build valuable industry partnerships.",
    blogs: [
      {
        title: "Why You Should Attend Intralogistics and Warehousing Expo 2025 – Bengaluru",
        link: "https://www.mhebazar.in/intralogistics-warehousing-expo-2025-bengaluru",
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
  
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-IN', options);
  }
  
  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = start.toLocaleDateString('en-IN', { month: 'long' });
  const year = start.getFullYear();
  
  return `${startDay} – ${endDay} ${month} ${year}`;
};

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

  const StatusBadge = ({ status }: { status: 'upcoming' | 'ongoing' | 'completed' }) => {
    const styles = {
      upcoming: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200',
      ongoing: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200 animate-pulse',
      completed: 'bg-gray-400 text-white'
    };

    const labels = {
      upcoming: 'Upcoming',
      ongoing: 'Live Now',
      completed: 'Completed'
    };

    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
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

      {!selectedEvent && (
        <>
          <section className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(92,161,49,0.05),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(92,161,49,0.05),transparent_50%)]"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
              <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 mb-8 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#5ca131] mr-2 animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-800">Industry Events & Exhibitions</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Connect, Learn & Grow at
                <span className="block mt-2 bg-gradient-to-r from-[#5ca131] to-emerald-600 bg-clip-text text-transparent">
                  MHE Bazar Events
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Join India's premier material handling and logistics exhibitions. Network with industry leaders, explore cutting-edge innovations, and accelerate your business growth.
              </p>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {eventsWithStatus.map((event) => (
                <article
                  key={event.id}
                  className={`group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 ${
                    event.status === 'completed' 
                      ? 'opacity-70 grayscale hover:grayscale-0 border-gray-200' 
                      : event.status === 'ongoing'
                      ? 'border-green-300 ring-4 ring-green-100'
                      : 'border-gray-100 hover:border-[#5ca131]'
                  } transform hover:-translate-y-1`}
                >
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={event.image}
                      alt={event.title}
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <StatusBadge status={event.status} />
                      {event.category && (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-gray-700 backdrop-blur-sm">
                          {event.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#5ca131] transition-colors line-clamp-2 leading-snug">
                      {event.title}
                    </h2>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 mr-3">
                          <Calendar className="w-4 h-4 text-[#5ca131]" />
                        </div>
                        <span className="font-medium">{event.formattedDate}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 mr-3">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 mr-3">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{event.location}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-5">
                      {event.description}
                    </p>

                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleRegister(event.registrationLink)}
                        disabled={event.status === 'completed'}
                        className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                          event.status === 'completed'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : event.status === 'ongoing'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-200 hover:scale-105'
                            : 'bg-gradient-to-r from-[#5ca131] to-green-600 text-white hover:shadow-lg hover:shadow-green-200 hover:scale-105'
                        }`}
                      >
                        {event.status === 'completed' ? 'Event Completed' : 'Register Now'}
                        {event.status !== 'completed' && <ExternalLink className="w-4 h-4 ml-2" />}
                      </button>
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:border-[#5ca131] hover:text-[#5ca131] hover:bg-green-50 transition-all group"
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

      {selectedEvent && (() => {
        const status = getEventStatus(selectedEvent.startDate, selectedEvent.endDate);
        const formattedDate = formatDateRange(selectedEvent.startDate, selectedEvent.endDate);
        
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button
              onClick={() => setSelectedEvent(null)}
              className="inline-flex items-center text-gray-600 hover:text-[#5ca131] font-semibold mb-8 transition-all group px-4 py-2 rounded-lg hover:bg-green-50"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to All Events
            </button>

            <article className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="relative h-80 lg:h-[28rem] w-full bg-gradient-to-br from-gray-100 to-gray-200">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                  <StatusBadge status={status} />
                  {selectedEvent.category && (
                    <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold bg-white/95 text-gray-700 backdrop-blur-sm shadow-lg">
                      {selectedEvent.category}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6 sm:p-8 lg:p-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-8 leading-tight">
                  {selectedEvent.title}
                </h1>

                <div className="grid sm:grid-cols-3 gap-6 mb-10 p-6 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100 shadow-sm">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm mr-4 flex-shrink-0">
                      <Calendar className="w-6 h-6 text-[#5ca131]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</p>
                      <p className="text-sm font-bold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm mr-4 flex-shrink-0">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time</p>
                      <p className="text-sm font-bold text-gray-900">{selectedEvent.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm mr-4 flex-shrink-0">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</p>
                      <p className="text-sm font-bold text-gray-900">{selectedEvent.location}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 mb-12">
                  <button
                    onClick={() => handleRegister(selectedEvent.registrationLink)}
                    disabled={status === 'completed'}
                    className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-base transition-all shadow-lg ${
                      status === 'completed'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : status === 'ongoing'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl hover:shadow-green-200 hover:scale-105'
                        : 'bg-gradient-to-r from-[#5ca131] to-green-600 text-white hover:shadow-xl hover:shadow-green-200 hover:scale-105'
                    }`}
                  >
                    {status === 'completed' ? 'Event Completed' : 'Register Now'}
                    {status !== 'completed' && <ExternalLink className="w-5 h-5 ml-2" />}
                  </button>
                </div>

                <div className="border-t-2 border-gray-200 pt-12">
                  <div className="flex items-center mb-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#5ca131] to-green-600 mr-4 shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      About {selectedEvent.organizer}
                    </h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-10 text-base">
                    {selectedEvent.organizerInfo}
                  </p>

                  {selectedEvent.blogs.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
                      <div className="flex items-center mb-6">
                        <TrendingUp className="w-6 h-6 text-[#5ca131] mr-3" />
                        <h3 className="text-xl font-bold text-gray-900">
                          Featured Insights
                        </h3>
                      </div>
                      <div className="grid gap-6">
                        {selectedEvent.blogs.map((blog, i) => (
                          <a
                            key={i}
                            href={blog.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col sm:flex-row gap-4 p-5 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#5ca131]"
                          >
                            <div className="relative w-full sm:w-48 h-40 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                              <img
                                src={blog.image}
                                alt={blog.title}
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-[#5ca131]">
                                    {blog.category}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {blog.author}
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-gray-900 group-hover:text-[#5ca131] transition-colors mb-2 line-clamp-2">
                                  {blog.title}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                  {blog.description}
                                </p>
                              </div>
                              <div className="flex items-center text-[#5ca131] font-semibold text-sm mt-3 group-hover:gap-2 transition-all">
                                <span>Read More</span>
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