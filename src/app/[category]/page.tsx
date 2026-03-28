// src/app/[category]/page.tsx
// import React from "react";
import { Metadata } from "next";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import CategoryClient from "@/components/category/CategoryClient";
import { getRouteContext, getProducts, getManufacturers } from "@/lib/product-api";
// import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ category: string; subcategory?: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category, subcategory } = await params;
    const context = await getRouteContext(category, subcategory);

    if (context.type === 'invalid') {
        return {
            title: "Not Found | MHE Bazar",
            description: "The requested category or subcategory was not found."
        };
    }

    return {
        title: context.metaTitle || `${context.subName || context.name} Products | MHE Bazar`,
        description: context.metaDescription || `Browse our wide range of ${context.subName || context.name} products and equipment.`,
    };
}

export default async function CategoryOrTypePage({
    params,
    searchParams,
}: PageProps) {
    const { category, subcategory } = await params;
    const search = await searchParams;

    // Fetch context on server
    const context = await getRouteContext(category, subcategory);

    // Initial filter state from URL
    const page = search.page ? Number(search.page) : 1;
    const minPrice = search.min_price ? Number(search.min_price) : '';
    const maxPrice = search.max_price ? Number(search.max_price) : '';
    const manufacturer = (search.search as string) || null;
    const rating = search.average_rating ? Number(search.average_rating) : null;
    const sortBy = (search.sort_by as string) || 'relevance';

    // Prefetch products on server
    const queryClient = new QueryClient();
    const queryKey = [
        'products',
        context.type,
        context.name,
        context.subName,
        context.id,
        context.subId,
        page,
        minPrice,
        maxPrice,
        manufacturer,
        rating,
        sortBy
    ];

    // Prefetch manufacturers (global for all categories)
    await queryClient.prefetchQuery({
        queryKey: ['manufacturers'],
        queryFn: getManufacturers,
    });

    // Prefetch products
    await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => getProducts({
            context,
            page,
            minPrice: minPrice as number | '',
            maxPrice: maxPrice as number | '',
            manufacturer,
            rating,
            sortBy
        }),
    });

    const dehydratedState = dehydrate(queryClient);

    // Render client component with dehydrated state
    // We pass the context separately to avoid complex serializable issues if any
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "http://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Material Handling Equipment Manufacturer and Supplier in India | MHE Bazar",
                                "item": "https://www.mhebazar.in/"
                            },
                            ...(context.name
                                ? [
                                    {
                                        "@type": "ListItem",
                                        "position": 2,
                                        "name": `${context.name} – MHE Bazar`,
                                        "item": `https://www.mhebazar.in/${category}`
                                    }
                                ]
                                : []),
                            ...(context.subName
                                ? [
                                    {
                                        "@type": "ListItem",
                                        "position": 3,
                                        "name": `${context.subName} – MHE Bazar`,
                                        "item": `https://www.mhebazar.in/${category}/${subcategory}`
                                    }
                                ]
                                : [])
                        ]
                    })
                }}
            />
            <CategoryClient 
                dehydratedState={dehydratedState}
                urlParamSlug={category}
                subcategoryParamSlug={subcategory}
                initialContext={context}
            />
        </>
    );
}