"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";
import { IconCheck, IconX, IconChevronDown, IconChevronUp, IconCopy } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";

type Rule = {
  id: string;
  ok: boolean;
  value: number | null;
  threshold: number;
  comparator: string;
  explain: string;
};

type RiskDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  state: "Calm" | "Lockdown" | string;
  rules: Rule[] | undefined;
  justification?: string | null;
  birdseye?: Record<string, any> | null;
  modelResults?: Record<string, any> | null;
};

export default function RiskDetailsModal({ open, onClose, state, rules, justification, birdseye, modelResults }: RiskDetailsModalProps) {
  if (!open) return null;
  const healthy = (rules || []).filter((r) => r.ok);
  const failing = (rules || []).filter((r) => !r.ok);
  const [expanded, setExpanded] = useState(false);

  const metrics = useMemo(() => {
    const src = modelResults || birdseye || {};
    const num = (v: any) => typeof v === "number" && isFinite(v) ? v : null;
    return {
      price: num(src.price),
      liquidity: num(src.liquidity),
      marketCap: num(src.market_cap),
      fdv: num(src.fdv),
      totalSupply: num(src.total_supply),
      circulatingSupply: num(src.circulating_supply),
    };
  }, [birdseye, modelResults]);

  const fmtUSD = (n: number | null) => n === null ? "—" : `$${Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(n)}`;
  const fmtNum = (n: number | null) => n === null ? "—" : Intl.NumberFormat().format(n);
  const riskStyles = state === "Lockdown"
    ? { badge: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800", dot: "bg-red-500" }
    : { badge: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800", dot: "bg-green-500" };
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-5xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 max-h-[85vh] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Risk analysis</CardTitle>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${riskStyles.badge}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    <span className={`h-1.5 w-1.5 rounded-full ${riskStyles.dot}`} /> {state}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 overflow-y-auto" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {/* Justification paragraph */}
                {justification && (
                  <div className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-3 text-[13px] text-neutral-800 dark:text-neutral-200">
                    {justification}
                  </div>
                )}
                {/* Key metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[12px]">
                  <Metric label="Price" value={fmtUSD(metrics.price)} />
                  <Metric label="Liquidity" value={fmtUSD(metrics.liquidity)} />
                  <Metric label="Market Cap" value={fmtUSD(metrics.marketCap)} />
                  <Metric label="FDV" value={fmtUSD(metrics.fdv)} />
                  <Metric label="Total Supply" value={fmtNum(metrics.totalSupply)} />
                  <Metric label="Circulating" value={fmtNum(metrics.circulatingSupply)} />
                </div>
                {failing.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase opacity-70 mb-1">Failing rules</div>
                    <ul className="space-y-1 text-sm">
                      {failing.map((r) => (
                        <li key={r.id} className="flex items-center gap-2 rounded border border-red-300/60 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/20 px-2 py-1 text-red-700 dark:text-red-300">
                          <IconX className="h-3.5 w-3.5" />
                          <span className="truncate">{r.explain} — value: {String(r.value ?? "unknown")}, threshold {r.comparator} {r.threshold}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <div className="text-[11px] uppercase opacity-70 mb-1">Healthy rules</div>
                  <ul className="space-y-1 text-sm">
                    {healthy.map((r) => (
                      <li key={r.id} className="flex items-center gap-2 rounded border border-green-300/60 dark:border-green-800/60 bg-green-50/60 dark:bg-green-950/20 px-2 py-1 text-green-700 dark:text-green-300">
                        <IconCheck className="h-3.5 w-3.5" />
                        <span className="truncate">{r.explain} — value: {String(r.value ?? "unknown")}, threshold {r.comparator} {r.threshold}</span>
                      </li>
                    ))}
                    {healthy.length === 0 && <li className="text-neutral-500">No rule data available.</li>}
                  </ul>
                </div>
                {/* Expandable raw data */}
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="mt-1 inline-flex items-center gap-1 text-[12px] px-2 py-1 border rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 self-start"
                >
                  {expanded ? <IconChevronUp className="h-3.5 w-3.5" /> : <IconChevronDown className="h-3.5 w-3.5" />}
                  {expanded ? 'Hide raw data' : 'Show raw data'}
                </button>
                {expanded && (
                  <div className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-2 text-[11px] overflow-auto max-h-48">
                    <div className="flex items-center justify-between mb-1">
                      <span className="opacity-70">factors (Birdseye)</span>
                      <button
                        onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(birdseye ?? {}, null, 2)); } catch {} }}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 border rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <IconCopy className="h-3 w-3" /> Copy JSON
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(birdseye ?? {}, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={onClose}>Close</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-2">
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-sm truncate">{value}</div>
    </div>
  );
}


