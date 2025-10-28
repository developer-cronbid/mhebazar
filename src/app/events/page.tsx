"use client";
import { useState } from "react";
import { Calendar, MapPin, Clock, ArrowLeft, Building2, ExternalLink, ChevronRight } from "lucide-react";

interface BlogPost {
  title: string;
  link: string;
}

interface EventType {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  description: string;
  organizer: string;
  organizerInfo: string;
  organizerBlogs: BlogPost[];
  category?: string;
}

const events: EventType[] = [
  {
    id: 1,
    title: "India Warehousing & Logistics Expo 2025",
    date: "12 – 14 March 2025",
    time: "10:00 AM – 6:00 PM",
    location: "Pragati Maidan, New Delhi",
    image: "/event.jpg",
    description:
      "Join India's leading warehousing and logistics exhibition featuring top manufacturers, equipment suppliers, and automation solutions for industrial and eCommerce sectors. This premier event brings together industry leaders, innovators, and decision-makers to explore cutting-edge material handling solutions, warehouse automation technologies, and sustainable logistics practices.",
    organizer: "MHE Bazar",
    organizerInfo:
      "MHE Bazar is India's trusted marketplace for Material Handling Equipment, offering forklifts, stackers, and industrial solutions for logistics and warehouses nationwide.",
    organizerBlogs: [
      {
        title: "Top 5 Trends in Material Handling for 2025",
        link: "#",
      },
      {
        title: "Automation & IoT Transforming Indian Warehousing",
        link: "#",
      },
    ],
    category: "Warehousing & Logistics"
  },
//   {
//     id: 2,
//     title: "Industrial Equipment & Safety Summit 2025",
//     date: "20 – 22 April 2025",
//     time: "9:30 AM – 5:30 PM",
//     location: "BIEC, Bengaluru",
//     image: "/event.jpg",
//     description:
//       "A major event focusing on industrial equipment innovation, safety gear, and sustainable manufacturing practices. Explore new technologies and connect with industry experts to transform your operations with state-of-the-art solutions.",
//     organizer: "TechSafe India",
//     organizerInfo:
//       "TechSafe India is a leading platform promoting industrial safety, innovation, and compliance in manufacturing and logistics sectors.",
//     organizerBlogs: [
//       {
//         title: "How to Build a Safe & Smart Factory in 2025",
//         link: "#",
//       },
//       {
//         title: "Top Industrial Safety Practices for Modern Warehouses",
//         link: "#",
//       },
//     ],
//     category: "Industrial Safety"
//   },
];

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
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
              "startDate": event.date,
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

      {/* Header Section */}
      {!selectedEvent && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <span className="text-sm font-medium text-blue-700">Discover Industry Events</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Upcoming Events & Exhibitions
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Connect with industry leaders at premier industrial and logistics exhibitions across India. Explore innovations, network with experts, and stay ahead in material handling.
            </p>
          </div>
        </section>
      )}

      {/* Events Grid */}
      {!selectedEvent && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {events.map((event) => (
              <article
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img
                    src={event.image}
                    alt={event.title}
                    loading="lazy"
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                  {event.category && (
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-gray-700 backdrop-blur-sm">
                        {event.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {event.title}
                  </h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                    {event.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Event Detail Page */}
      {selectedEvent && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => setSelectedEvent(null)}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 font-medium mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to All Events
          </button>

          <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="relative h-80 lg:h-96 w-full bg-gray-100">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              {selectedEvent.category && (
                <div className="absolute top-6 left-6">
                  <span className="inline-flex px-4 py-2 rounded-full text-sm font-semibold bg-white/95 text-gray-700 backdrop-blur-sm">
                    {selectedEvent.category}
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-6 sm:p-8 lg:p-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {selectedEvent.title}
              </h1>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedEvent.date}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Time</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedEvent.location}</p>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none mb-10">
                <p className="text-lg text-gray-700 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <button className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
                  Register Now
                </button>
                <button className="inline-flex items-center px-8 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all">
                  Contact Organizer
                </button>
                <button className="inline-flex items-center px-8 py-3 text-gray-700 font-semibold hover:text-blue-600 transition-colors">
                  Learn More
                  <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              </div>

              {/* About Organizer */}
              <div className="border-t border-gray-200 pt-10">
                <div className="flex items-center mb-6">
                  <Building2 className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    About {selectedEvent.organizer}
                  </h2>
                </div>
                <p className="text-gray-700 leading-relaxed mb-8 text-lg">
                  {selectedEvent.organizerInfo}
                </p>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
                    <span className="w-1 h-6 bg-blue-600 mr-3 rounded-full"></span>
                    Featured Articles from {selectedEvent.organizer}
                  </h3>
                  <ul className="space-y-3">
                    {selectedEvent.organizerBlogs.map((blog, i) => (
                      <li key={i}>
                        <a
                          href={blog.link}
                          className="group flex items-start p-3 rounded-lg hover:bg-white/70 transition-all"
                        >
                          <ChevronRight className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                          <span className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">
                            {blog.title}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}