"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";

type NewsLike = {
  id: string;
  title: string;
  url: string;
  description?: string;
} | null;

type Props = {
  open: boolean;
  onClose: () => void;
  item: NewsLike;
};

type Preview = {
  title?: string;
  description?: string;
  imageUrl?: string | null;
  url: string;
  site?: string | null;
};

// Placeholder preview and summary instead of external API calls
function buildPlaceholderPreview(url: string): Preview {
  const u = new URL(url);
  const placeholderImages = [
    "/solana.jpg",
    "/Solana-sol-logo-horizontal.svg",
    "/Solana-sol-logo.svg",
    "/web-3-auth-logo-dark.svg",
  ];
  const imageUrl = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
  return {
    title: undefined,
    description: undefined,
    imageUrl,
    url,
    site: u.hostname ?? null,
  };
}

function buildPlaceholderSummary(title?: string, site?: string | null): string {
  const lines = [
    "This is a placeholder summary for the selected article.",
    "Explore highlights, key takeaways, and context here.",
    "Open the full link for more details once live.",
  ];
  const header = title ? `${title}\n` : "";
  const origin = site ? `Source: ${site}\n\n` : "";
  return `${header}${origin}${lines.join(" ")}`;
}

export default function NewsModal({ open, onClose, item }: Props) {
  const url = item?.url ?? null;
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    if (!open || !url) return;
    setLoading(true);
    const p = buildPlaceholderPreview(url);
    setPreview(p);
    setSummary(buildPlaceholderSummary(item?.title, p.site));
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [open, url, item?.title]);

  const title = useMemo(() => item?.title || preview?.title || preview?.site || "Article", [item, preview]);
  const imageUrl = preview?.imageUrl ?? null;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-[94vw] max-w-4xl rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden"
          >
            <Card className="border-0 bg-transparent">
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>{title}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <div className="md:col-span-2 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                  {loading && (
                    <div className="aspect-video w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
                  )}
                  {!loading && imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                  )}
                  {!loading && !imageUrl && (
                    <div className="aspect-video w-full flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
                      No preview image
                    </div>
                  )}
                </div>
                <div className="md:col-span-3 flex flex-col gap-3">
                  <div className="text-sm font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                    {loading ? (
                      <>
                        <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-2" />
                        <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-2" />
                        <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                      </>
                    ) : (
                      summary || item?.description || ""
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-neutral-500 font-mono truncate">
                  {preview?.site ?? new URL(item?.url || preview?.url || "about:blank").hostname}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled>Read full article</Button>
                  <Button onClick={onClose}>Close</Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


