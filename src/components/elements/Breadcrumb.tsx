"use client";

import React from "react";
import Link from "next/link";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="text-sm py-2 px-2 sm:px-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-gray-500">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-700">{item.label}</span>
            )}
            {idx < items.length - 1 && (
              <span className="mx-2">{'>'}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}