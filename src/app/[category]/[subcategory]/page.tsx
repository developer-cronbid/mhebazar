// src/app/[category]/[subcategory]/page.tsx
import React from "react";
import { Metadata } from "next";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import CategoryClient from "@/components/category/CategoryClient";
import { getRouteContext, getProducts, getManufacturers } from "@/lib/product-api";

interface PageProps {
    params: Promise<{ category: string; subcategory: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category, subcategory } = await params;
    const context = await getRouteContext(category, subcategory);

    if (context.type === 'invalid') {
        return {
            title: "Not Found | MHE Bazar",
            description: "The requested subcategory was not found."
        };
    }

    return {
        title: context.metaTitle || `${context.subName} | ${context.name} | MHE Bazar`,
        description: context.metaDescription || `Browse our wide range of ${context.subName} products under ${context.name}.`,
    };
}

export default async function SubCategoryPage({
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

    return (
        <CategoryClient 
            dehydratedState={dehydratedState}
            urlParamSlug={category}
            subcategoryParamSlug={subcategory}
            initialContext={context}
        />
    );
}