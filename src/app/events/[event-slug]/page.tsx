"use client";
import { useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Building2,
  ChevronRight,
  ExternalLink,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";

// --- Data Import ---
import eventData from "../events.json";

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
  ogImage: string; // Used for Open Graph image
  description: string;
  organizer: string;
  organizerInfo: string;
  blogs: BlogType[];
  category?: string;
  registrationLink: string;
}

// --- Utility Functions (kept as is) ---
// ... (Utility Functions kept as is) ...
const getEventStatus = (
  startDate: string,
  endDate: string
): "upcoming" | "ongoing" | "completed" => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
};

const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString("en-IN", { month: "short" });
  const endMonth = end.toLocaleDateString("en-IN", { month: "short" });
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} – ${endDay} ${startMonth} ${year}`;
  }

  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
};

// --- Detail Component ---

const handleRegister = (link: string) => {
  window.open(link, "_blank", "noopener,noreferrer");
};

const StatusBadge = ({
  status,
}: {
  status: "upcoming" | "ongoing" | "completed";
}) => {
  const styles = {
    upcoming:
      "bg-indigo-600/95 text-white backdrop-blur-sm shadow-lg shadow-indigo-500/50",
    ongoing:
      "bg-emerald-600/95 text-white backdrop-blur-sm shadow-lg shadow-emerald-500/50 animate-pulse",
    completed: "bg-gray-500/95 text-white backdrop-blur-sm shadow-lg",
  };

  const labels = {
    upcoming: "Upcoming Event",
    ongoing: "Live Now",
    completed: "Event Ended",
  };

  return (
    <span
      className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status === "ongoing" && (
        <span className="relative flex h-2.5 w-2.5 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
      )}
      {status === "upcoming" && <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
      {labels[status]}
    </span>
  );
};

import React from "react";

interface EventDetailPageProps {
  params: Promise<{
    "event-slug": string;
  }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { "event-slug": slug } = React.use(params);
  const selectedEvent = (eventData as EventType[]).find((e) => e.slug === slug);

  if (!selectedEvent) {
    notFound();
  }

  const status = getEventStatus(selectedEvent.startDate, selectedEvent.endDate);
  const formattedDate = formatDateRange(
    selectedEvent.startDate,
    selectedEvent.endDate
  );

  const title = `${selectedEvent.title} | MHE Bazar Event Details`;
  const description = selectedEvent.description.substring(0, 160) + "...";
  const url = `/events/${selectedEvent.slug}`;
  const ogImage = selectedEvent.ogImage;

  // --- FIX: Dynamic OG Meta Tags (Client-side) ---
  useEffect(() => {
    document.title = title;
    const currentUrl =
      typeof window !== "undefined"
        ? window.location.href
        : "https://yourdomain.com" + url;

    const setMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(
        `meta[property="${property}"]`
      ) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMetaTag("og:title", title);
    setMetaTag("og:description", description);
    setMetaTag("og:image", ogImage);
    setMetaTag("og:url", currentUrl);
    setMetaTag("og:type", "article");

    // Twitter Card
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:image", ogImage);
  }, [title, description, ogImage, url]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white antialiased">
      {/* Schema Markup for the specific Event */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: selectedEvent.title,
            startDate: selectedEvent.startDate,
            endDate: selectedEvent.endDate,
            image: selectedEvent.ogImage,
            location: {
              "@type": "Place",
              name: selectedEvent.location,
            },
            description: selectedEvent.description,
            organizer: {
              "@type": "Organization",
              name: selectedEvent.organizer,
            },
            url: `/events/${selectedEvent.slug}`,
          }),
        }}
      />

      {/* --- Event Detail View --- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Link
          href="/events"
          className="inline-flex items-center text-gray-600 hover:text-emerald-600 font-bold mb-8 transition-all group px-5 py-3 rounded-xl hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to All Events
        </Link>

        <article className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
          {/* FIX: Image Div - Changed aspect ratio to 16/9 for wider view and less cropping */}
          <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-emerald-100 to-green-100">
            <img
              src={selectedEvent.image}
              alt={selectedEvent.title}
              className="object-cover w-full h-full"
            />
            {/* FIX: Reduced the opacity of the overlay so image is clearer */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
            {/* FIX: Tags repositioned to the bottom to avoid covering the image focus area */}
            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end z-10">
              <StatusBadge status={status} />
              {selectedEvent.category && (
                <span className="inline-flex px-4 py-1.5 rounded-full text-sm font-bold bg-white/95 backdrop-blur-sm text-gray-800 shadow-lg border-2 border-gray-200">
                  {selectedEvent.category}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-tight">
              {selectedEvent.title}
            </h1>

            {/* Key Info Strip (kept as is) */}
            <div className="grid sm:grid-cols-3 gap-6 mb-10 p-6 sm:p-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 shadow-inner">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-lg mr-4 flex-shrink-0 border-2 border-emerald-100">
                  <Calendar className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Date
                  </p>
                  <p className="text-base font-black text-gray-900">
                    {formattedDate}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-lg mr-4 flex-shrink-0 border-2 border-indigo-100">
                  <Clock className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Time
                  </p>
                  <p className="text-base font-black text-gray-900">
                    {selectedEvent.time}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-lg mr-4 flex-shrink-0 border-2 border-red-100">
                  <MapPin className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Location
                  </p>
                  <p className="text-base font-black text-gray-900">
                    {selectedEvent.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-10">
              <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center">
                <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full mr-3"></div>
                Event Overview
              </h2>

              <div
                className="text-lg text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
              ></div>
            </div>

            {/* Registration Button - Maximum prominence */}
            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => handleRegister(selectedEvent.registrationLink)}
                disabled={status === "completed"}
                className={`inline-flex items-center px-12 py-5 rounded-xl font-black text-lg transition-all shadow-2xl ${
                  status === "completed"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner"
                    : "bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-white hover:shadow-2xl hover:shadow-emerald-400/50 transform hover:scale-[1.03] animate-pulse"
                }`}
                style={
                  status !== "completed" ? { animationDuration: "2s" } : {}
                }
              >
                {status === "completed"
                  ? "Event Completed"
                  : "Register Now - Free Entry"}
                {status !== "completed" && (
                  <ExternalLink className="w-5 h-5 ml-3" />
                )}
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
                  About{" "}
                  <span className="text-emerald-600">
                    {selectedEvent.organizer}
                  </span>
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
    </div>
  );
}
