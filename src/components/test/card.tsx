import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GitCompare, Heart, Share2, ShoppingCart } from "lucide-react";
import React, { JSX } from "react";

export default function ProductCards(): JSX.Element {
  return (
    <Card className="w-[260px] h-[430px] bg-white rounded-2xl border border-[#ecf0f7] overflow-hidden">
      <div className="relative">
        <img
          className="w-full h-[260px] object-cover"
          alt="Mhe Bazar Engine Oil Filter"
          src="https://via.placeholder.com/260x260"
        />

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-sm"
          >
            <Heart className="w-5 h-5 text-gray-600" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-sm"
          >
            <GitCompare className="w-5 h-5 text-gray-600" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-sm"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <h3 className="[font-family:'Inter-Bold',Helvetica] font-bold text-[#434344] text-base leading-6">
            Mhe Bazar Engine Oil Filter D141099 – Fits Doosan...
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-[#5ca131] text-2xl font-bold">₹</span>
            <span className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#5ca131] text-2xl leading-7">
              2,618
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="icon"
            className="h-auto px-5 py-[13px] bg-[#5ca131] hover:bg-[#4a8a28] rounded-lg shadow-shadow-xs"
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-1 px-5 py-[11px] border-[#5ca131] text-[#5ca131] hover:bg-[#5ca131] hover:text-white rounded-lg shadow-shadow-xs font-text-md-medium font-[number:var(--text-md-medium-font-weight)] text-[length:var(--text-md-medium-font-size)] tracking-[var(--text-md-medium-letter-spacing)] leading-[var(--text-md-medium-line-height)] [font-style:var(--text-md-medium-font-style)]"
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
