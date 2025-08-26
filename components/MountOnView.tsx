"use client";

import React from "react";

type MountOnViewProps = {
  children: React.ReactNode;
  rootMargin?: string;
  className?: string;
};

export default function MountOnView({ children, rootMargin = "200px", className }: MountOnViewProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { root: null, rootMargin, threshold: 0 }
    );
    io.observe(element);
    return () => io.disconnect();
  }, [rootMargin]);

  return <div ref={ref} className={className}>{active ? children : null}</div>;
}


