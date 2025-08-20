"use client";

import React from "react";
import Link from "next/link";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      className="ml-4 text-sm sm:ml-8 py-2 px-2 sm:px-4"
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-2 text-gray-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <React.Fragment key={idx}>
              <li className="flex items-center">
                {isLast ? (
                  <span className="font-medium text-gray-950 line-clamp-1">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href || "#"} className="hover:underline">
                    {item.label}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li
                  className="flex items-center text-gray-500"
                  aria-hidden="true"
                >
                  {">"}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
