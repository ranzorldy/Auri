"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const EVENT_NAME = "auri-toast";

export function emitToast(message: string, variant: ToastVariant = "info") {
  if (typeof window === "undefined") return;
  const detail: ToastItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    variant,
  };
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const evt = e as CustomEvent<ToastItem>;
      const item = evt.detail;
      if (!item) return;
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 3000);
    }
    window.addEventListener(EVENT_NAME, onToast as EventListener);
    return () => window.removeEventListener(EVENT_NAME, onToast as EventListener);
  }, []);

  const variantStyles = useMemo(
    () => ({
      success: "bg-neutral-950 text-neutral-200 border border-neutral-700",
      error: "bg-neutral-950 text-neutral-200 border border-neutral-700",
      info: "bg-neutral-950 text-neutral-200 border border-neutral-700",
    }),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-start justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`pointer-events-auto rounded-md px-4 py-3 text-[12px] shadow-md ${variantStyles[t.variant]}`}
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}


