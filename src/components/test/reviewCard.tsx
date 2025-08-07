"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Star, X } from "lucide-react";
import React, { JSX, useState } from "react";

const MheWriteAReview = (): JSX.Element => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const stars = Array.from({ length: 5 }, (_, index) => index + 1);

  return (
    <div className="w-[736px] h-[909px] bg-[#66686980]">
      <Card className="w-[736px] h-[909px] bg-white border-0 rounded-none">
        <CardContent className="flex flex-col items-start gap-6 p-6 relative h-full">
          <div className="flex items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
            <img
              className="relative w-[79px] h-16 object-cover"
              alt="Product Image"
              src=""
            />

            <div className="flex flex-col items-start gap-2 pt-4 pb-0 px-0 relative flex-1 grow">
              <div className="relative self-stretch mt-[-1.00px] [font-family:'Inter-Bold',Helvetica] font-bold text-black text-2xl tracking-[0] leading-[normal]">
                How was the item?
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="relative w-fit [font-family:'Inter-Bold',Helvetica] font-bold text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Rate the item?
            </div>

            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              {stars.map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 cursor-pointer transition-colors ${star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                    }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch mt-[-1.00px] [font-family:'Inter-Bold',Helvetica] font-bold text-black text-base tracking-[0] leading-[normal]">
              Write a review
            </div>

            <div className="flex flex-col items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
              <Textarea
                className="h-[124px] resize-none border-[#dfe4ea] [font-family:'Inter-Regular',Helvetica] text-[13px] text-[#666869]"
                placeholder="What should other customers know?"
              />

              <div className="flex items-center justify-center gap-3 p-4 relative self-stretch w-full flex-[0_0_auto] bg-[#f9fcf8] rounded-md border-[1.5px] border-dashed border-[#cdf0b8] cursor-pointer hover:bg-[#f5faf2] transition-colors">
                <Camera className="w-6 h-6 text-[#666869]" />
                <div className="relative w-fit [font-family:'Inter-Regular',Helvetica] font-normal text-[#666869] text-[13px] tracking-[0] leading-[normal]">
                  Share a video or photo
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative self-stretch mt-[-1.00px] [font-family:'Inter-Bold',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal]">
                  <span className="font-bold">Title your review</span>
                  <span className="[font-family:'Inter-Regular',Helvetica] text-xs">
                    {" "}
                    (required)
                  </span>
                </div>

                <Input
                  className="border-[#dfe4ea] [font-family:'Inter-Regular',Helvetica] text-[13px] text-[#666869]"
                  placeholder="What should other customers know?"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
              <Button className="flex-1 bg-[#5ca131] hover:bg-[#4a8a28] text-white [font-family:'Inter-Bold',Helvetica] font-bold text-[13px] h-auto py-[19px] px-4">
                Submit
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3.5 right-6 w-6 h-6 p-0 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MheWriteAReview;
