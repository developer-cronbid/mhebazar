"use client";

import React from "react";
import Link from "next/link";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="ml-8 text-sm py-2 px-2 sm:px-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-gray-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="flex items-center">
              {isLast ? (
                <span className=" text-gray-950 font-medium">{item.label}</span>
              ) : (
                <Link href={item.href || "#"} className="hover:underline">
                  {item.label}
                </Link>
              )}
              {idx < items.length - 1 && <span className="mx-2">{">"}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
