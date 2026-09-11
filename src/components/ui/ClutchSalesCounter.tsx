"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_RACE } from "@/lib/motion";

const CLUTCH_COUNTER_BASE = 813680;
const CLUTCH_COUNTER_BASE_DATE = Date.UTC(2026, 8, 11);
const DAY_MS = 24 * 60 * 60 * 1000;

function getArgentinaDateUtc(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return Date.UTC(year, month - 1, day);
}

function dailyClutchIncrement(dayIndex: number) {
  const x = Math.sin((dayIndex + 20260911) * 12.9898 + 78.233) * 43758.5453;
  const fraction = x - Math.floor(x);
  return 30 + Math.floor(fraction * 16);
}

function getEstimatedClutches(date = new Date()) {
  const currentDate = getArgentinaDateUtc(date);
  const elapsedDays = Math.max(
    0,
    Math.floor((currentDate - CLUTCH_COUNTER_BASE_DATE) / DAY_MS),
  );

  let total = CLUTCH_COUNTER_BASE;
  for (let dayIndex = 1; dayIndex <= elapsedDays; dayIndex += 1) {
    total += dailyClutchIncrement(dayIndex);
  }

  return total;
}

type Props = {
  className?: string;
};

export default function ClutchSalesCounter({ className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [target, setTarget] = useState(CLUTCH_COUNTER_BASE);
  const [display, setDisplay] = useState(CLUTCH_COUNTER_BASE);

  useEffect(() => {
    setTarget(getEstimatedClutches());
  }, []);

  useEffect(() => {
    if (!inView) return;

    const start = Math.max(CLUTCH_COUNTER_BASE, target - 900);
    const controls = animate(start, target, {
      duration: 1.8,
      ease: EASE_RACE,
      onUpdate(value) {
        setDisplay(Math.round(value));
      },
    });

    return () => controls.stop();
  }, [inView, target]);

  return (
    <span ref={ref} className={`display tabular-nums leading-none text-bone ${className}`}>
      {display.toLocaleString("es-AR")}
      <span className="text-barpran">+</span>
    </span>
  );
}
