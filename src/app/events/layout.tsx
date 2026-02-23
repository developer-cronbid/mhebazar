import { Metadata } from 'next';
import eventData from './events.json';

export async function generateMetadata(): Promise<Metadata> {
  const now = new Date();
  
  // Sort logic to find the 'Live' or 'Upcoming' event for SEO
  const sortedEvents = [...eventData].sort((a, b) => {
    const getPriority = (start: string, end: string) => {
      const s = new Date(start);
      const e = new Date(end);
      if (now >= s && now <= e) return 0; // ongoing
      if (now < s) return 1;              // upcoming
      return 2;                           // completed
    };
    return getPriority(a.startDate, a.endDate) - getPriority(b.startDate, b.endDate);
  });

  const latestEvent = sortedEvents[0];

  // Debugging: If it's still not working, check your console during build
  // console.log("SEO Title:", latestEvent?.meta_title);

  const title = latestEvent?.meta_title || "MHE Bazar | Material Handling Events";
  const description = latestEvent?.meta_description || "Explore the latest logistics and MHE expos.";
  const image = latestEvent?.ogImage || latestEvent?.image || "/default-og.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}