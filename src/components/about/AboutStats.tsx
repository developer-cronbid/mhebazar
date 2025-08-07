"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";

const stats = [
  {
    value: 240,
    label: "Countries Reached",
    color: "#3B82F6",
    suffix: "+",
  },
  {
    value: 25,
    label: "No. of Categories",
    color: "#F59E0B",
    suffix: "+",
  },
  {
    value: 25000,
    label: "Customers Served",
    color: "#22C55E",
    suffix: "",
  },
  {
    value: 99.9,
    label: "Solutions Delivered",
    color: "#10B981",
    suffix: "%",
  },
  {
    value: 1,
    label: "MHE Solution Provider",
    color: "#264775", // Custom professional shade
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
  const stroke = 13;
  const circumference = 2 * Math.PI * radius;
  const valueRef = useRef<HTMLSpanElement>(null);
  const [ref, inView] = useInView({ triggerOnce: false, threshold: 0.3 });

  const percent = value > 100 ? 1 : value / 100;
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
      const current = value > 100 ? value : Math.floor(progress * value);

      if (valueRef.current) {
        valueRef.current.textContent =
          value > 100 ? `${value}${suffix}` : `${current}${suffix}`;
      }

      if (progress < 1 && value <= 100) {
        raf = requestAnimationFrame(animateValue);
      } else if (valueRef.current) {
        valueRef.current.textContent = `${value}${suffix}`;
      }
    };

    raf = requestAnimationFrame(animateValue);
    return () => cancelAnimationFrame(raf);
  }, [controls, circumference, percent, value, suffix, duration, inView, isSpecial]);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center w-40 min-w-[140px] mx-auto transition-transform duration-300 ${
        isSpecial
          ? "hover:scale-[1.1] hover:shadow-[0_8px_30px_rgba(38,71,117,0.4)]"
          : "hover:scale-[1.05] hover:shadow-md"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <svg width={140} height={140} className="mb-2 block">
          <circle
            cx={70}
            cy={70}
            r={radius}
            fill="none"
            stroke="#E5ECE3"
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
          <div className="absolute left-1/2 top-1/2 w-[80px] h-[80px] -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden flex items-center justify-center">
            <Image
              src="/first.png"
              alt="1st Badge"
              width={70}
              height={70}
              className="object-contain"
            />
          </div>
        ) : (
          <span
            ref={valueRef}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.8rem] md:text-3xl font-extrabold"
            style={{ color }}
          >
            0{suffix}
          </span>
        )}
      </div>
      <span
        className={`text-base md:text-lg text-gray-900 text-center mt-2 font-medium leading-tight ${
          isSpecial ? "text-[#264775] font-semibold" : ""
        }`}
      >
        {label}
      </span>
    </div>
  );
};

const AboutStats = () => (
  <section className="w-full py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-extrabold mb-14 text-center text-gray-900 tracking-tight">
        Brand Presence Globally
      </h2>
      <div className="flex flex-wrap justify-center gap-10 md:gap-14">
        {stats.map((stat, i) => (
          <AnimatedCircle key={i} {...stat} duration={1.2 + i * 0.2} />
        ))}
      </div>
    </div>
  </section>
);

export default AboutStats;
