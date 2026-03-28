// src/lib/product-functions.ts

/**
 * Formats a slug into a display name (e.g., 'fork-lifts' -> 'Fork Lifts').
 */
export const formatNameFromSlug = (slug: string): string => {
  return slug
    .replace(/-/g, ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Slugifies a string for use in URLs.
 */
export const slugify = (text: string): string => {
  let slug = (text || '')
    .toString()
    .toLowerCase()
    .trim();

  slug = slug.replace(/[^a-z0-9\.\s]/g, ' ');
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  slug = slug.replace(/^\.+|\.+$/g, '');

  return slug;
};
