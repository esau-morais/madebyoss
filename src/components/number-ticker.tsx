"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "~/hooks/use-reduced-motion";

export function NumberTicker({
  value,
  duration = 1500,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const digits = value.toString().length;

  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;

    let start: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;

      if (ref.current) {
        ref.current.textContent = Math.floor(eased * value).toString();
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration, prefersReducedMotion]);

  return (
    <span
      ref={ref}
      className="inline-block tabular-nums text-end"
      style={{ width: `${digits}ch` }}
    >
      {value}
    </span>
  );
}
