"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface Props {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

export function StatCounter({ value, label, prefix = "", suffix = "" }: Props) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * value);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value]);

  const formatted = count >= 1000
    ? (count / 1000).toFixed(count >= 10000 ? 0 : 1) + "K"
    : count.toFixed(value % 1 !== 0 ? 1 : 0);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold mb-1">
        {prefix}{formatted}{suffix}
      </div>
      <div className="text-muted text-sm">{label}</div>
    </div>
  );
}