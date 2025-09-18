import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";
import BannerCarouselClient from "./BannerCarouselClient";

const BANNER_DATA = [
	{
		image: "/Banner1.webp",
		alt: "Forklift rentals and purchases",
		url: "/forklift",
	},
	{
		image: "/Banner2.webp",
		alt: "Reliable batteries for your operations",
		url: "/battery",
	},
	{
		image: "/Banner3.webp",
		alt: "Keep your machines running and operate with skill",
		splitUrls: {
			left: "/spare-parts",
			right: "/training",
		},
	},
];

export default function HomeBanner() {
	// Remove async and fetch logic, just use default data
	const banners = BANNER_DATA;
	const isDefault = true;

	return (
		<div className={cn("w-full relative bg-white overflow-hidden flex flex-col")}>
			<BannerCarouselClient banners={banners} isDefault={isDefault} />
		</div>
	);
}