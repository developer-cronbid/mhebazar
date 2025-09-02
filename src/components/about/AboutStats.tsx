'use client';

import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";

const stats = [
    {
    value: 25,
    label: "No. of Categories",
    color: "#F59E0B",
    suffix: "+",
  },
  {
    value: 150,
    label: "Countries Reached",
    color: "#3B82F6",
    suffix: "+",
  },
    {
    value: 99.9,
    label: "Solutions Delivered",
    color: "#10B981",
    suffix: "%",
  },
  {
    value: 25000,
    label: "Customers Served",
    color: "#22C55E",
    suffix: "+",
  },
  {
    value: 1,
    label: "MHE Solution Provider",
    color: "#264775",
    suffix: "st",
  },
];

interface AnimatedCircleProps {
  value: number;
  label: string;
  color: string;
  suffix: string;
  duration?: number;
}

const AnimatedCircle = ({
  value,
  label,
  color,
  suffix,
  duration = 1.5,
}: AnimatedCircleProps) => {
  const controls = useAnimation();
  const radius = 60;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const [currentValue, setCurrentValue] = useState(0); // Using state for the animated value
  const [ref, inView] = useInView({ triggerOnce: false, threshold: 0.3 });

  // Custom logic for the percentage fill based on user request
  const getPercent = () => {
    if (label === "Countries Reached") {
      // 150 out of approximately 190 countries
      return 150 / 190;
    }
    if (label === "No. of Categories") {
      // Visually increase the fill for a better look
      return 0.70;
    }
    if (label === "Customers Served") {
      // Show a full circle for this stat
      return 1;
    }
    // A slightly smaller circle for 99.9% as per request
    if (label === "Solutions Delivered") {
      return 0.98;
    }
    return value > 100 ? 1 : value / 100;
  };
  
  const percent = getPercent();
  const isSpecial = value === 1 && suffix === "st";

  useEffect(() => {
    if (!inView || isSpecial) return;

    controls.start({ strokeDashoffset: circumference * (1 - percent) });

    let startTimestamp: number | null = null;
    let raf: number;

    const animateValue = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min(
        (timestamp - startTimestamp) / (duration * 1000),
        1
      );
      
      let current;
      if (label === "Solutions Delivered") {
        current = (progress * value).toFixed(1);
      } else {
        current = Math.floor(progress * value);
      }

      setCurrentValue(current);
      
      if (progress < 1) {
        raf = requestAnimationFrame(animateValue);
      }
    };

    // Reset value to 0 when not in view, and start animation when in view
    if (inView) {
      setCurrentValue(0);
      raf = requestAnimationFrame(animateValue);
    }

    return () => cancelAnimationFrame(raf);
  }, [controls, circumference, percent, value, suffix, duration, inView, isSpecial, label]);

  // Handle the display text based on the label and current animated value
  const getDisplayText = () => {
    if (isSpecial) {
      return null;
    }
    if (label === "Customers Served") {
      // Animate up to 25 and then show "25K+"
      return currentValue >= 25 ? `25K${suffix}` : `${Math.floor(currentValue)}${suffix}`;
    }
    return `${currentValue}${suffix}`;
  }

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center transition-transform duration-300 ${
        isSpecial
          ? "hover:scale-[1.1]"
          : "hover:scale-[1.1]"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <svg width={140} height={140} className="mb-3">
          <circle
            cx={70}
            cy={70}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={stroke}
          />
          {isSpecial ? (
            <circle
              cx={70}
              cy={70}
              r={radius}
              fill="none"
              stroke="#264775"
              strokeWidth={stroke}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              strokeDasharray={circumference}
              strokeDashoffset={0}
            />
          ) : (
            <motion.circle
              cx={70}
              cy={70}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              transform="rotate(-90 70 70)"
              animate={controls}
              transition={{ duration, ease: "easeInOut" }}
            />
          )}
        </svg>

        {isSpecial ? (
          <div className="absolute left-1/2 top-1/2 w-[60px] h-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden flex items-center justify-center">
            <Image
              src="/first.png"
              alt="1st Badge"
              width={55}
              height={55}
              className="object-contain"
            />
          </div>
        ) : (
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl md:text-3xl font-bold"
            style={{ color }}
          >
            {getDisplayText()}
          </span>
        )}
      </div>
      <span
        className={`text-sm md:text-base text-gray-700 text-center font-medium leading-tight max-w-[120px] ${
          isSpecial ? "text-[#264775] font-semibold" : ""
        }`}
      >
        {label}
      </span>
    </div>
  );
};

const AboutStats = () => (
  <section className="w-full py-12 bg-white">
    <div className="max-w-8xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-gray-900">
        Brand Presence Globally
      </h2>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
        {stats.map((stat, i) => (
          <AnimatedCircle key={i} {...stat} duration={1.2 + i * 0.2} />
        ))}
      </div>
    </div>
  </section>
);

export default AboutStats;
