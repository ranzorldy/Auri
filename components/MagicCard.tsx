"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, animate } from "motion/react";
import React, { useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
  baseBackground?: string;
  baseRadius?: string;
  baseFrom?: string;
  baseMid?: string;
  baseTo?: string;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  gradientFrom = "#9E7AFF",
  gradientTo = "#FE8BBB",
  baseBackground = "rgba(0,0,0,0.6)",
  baseRadius = "1200px 800px",
  baseFrom = "rgba(31,41,55,0.85)",
  baseMid = "rgba(17,24,39,0.92)",
  baseTo = "rgba(3,7,18,0.97)",
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);
  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);

  // Smooth trailing for cursor glow to feel relaxed
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 30, mass: 0.6 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 30, mass: 0.6 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  return (
    <div
      ref={cardRef}
      className={cn("group relative rounded-[inherit]", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        // Shift base radial gradient toward center on hover
        animate(bgX, 35, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
        animate(bgY, 25, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
      }}
      onMouseLeave={() => {
        handleMouseLeave();
        animate(bgX, 0, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
        animate(bgY, 0, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-border duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
           radial-gradient(${gradientSize}px circle at ${smoothX}px ${smoothY}px,
          ${gradientFrom}, 
          ${gradientTo}, 
          var(--border) 100%
          )
          `,
        }}
      />
      {/* Base radial gradient that shifts on hover */}
      <motion.div
        className="absolute inset-px rounded-[inherit]"
        style={{
          background: useMotionTemplate`
            radial-gradient(${baseRadius} at ${bgX}% ${bgY}%, ${baseFrom} 0%, ${baseMid} 60%, ${baseTo} 100%)
          `,
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${smoothX}px ${smoothY}px, ${gradientColor}, transparent 100%)
          `,
          opacity: gradientOpacity,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
