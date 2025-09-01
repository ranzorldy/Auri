"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";
import { AnimatePresence, motion } from "framer-motion";

type VaultGoalModalProps = {
  open: boolean;
  vaultName: string;
  vaultAddress?: string;
  vaultLamports?: number | null;
  currentGoalLamports?: number | null;
  onSave: (goalSol: string | null) => Promise<void> | void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
};

export default function VaultGoalModal({ open, vaultName, vaultAddress, vaultLamports, currentGoalLamports, onSave, onClose, busy, error }: VaultGoalModalProps) {
  const [amount, setAmount] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      if (typeof currentGoalLamports === "number" && currentGoalLamports > 0) {
        const sol = (currentGoalLamports / 1_000_000_000).toFixed(9).replace(/0+$/, '').replace(/\.$/, '');
        setAmount(sol);
      } else {
        setAmount("");
      }
    }
  }, [open, currentGoalLamports]);

  const vaultSol = useMemo(() => typeof vaultLamports === "number" ? (vaultLamports / 1_000_000_000).toFixed(9).replace(/0+$/, '').replace(/\.$/, '') : "-", [vaultLamports]);
  const goalSol = useMemo(() => typeof currentGoalLamports === "number" ? (currentGoalLamports / 1_000_000_000).toFixed(9).replace(/0+$/, '').replace(/\.$/, '') : "-", [currentGoalLamports]);

  const parsed = useMemo(() => {
    const clean = amount.trim();
    if (!clean) return { ok: true, msg: "", lamports: 0 } as const; // empty means clear
    if (!/^\d*(?:\.\d{0,9})?$/.test(clean)) return { ok: false, msg: "Max 9 decimals", lamports: 0 } as const;
    const n = Number(clean);
    if (!isFinite(n) || n <= 0) return { ok: false, msg: "Goal must be > 0", lamports: 0 } as const;
    const lamports = Math.floor(n * 1_000_000_000);
    if (lamports === 0) return { ok: false, msg: "Too small", lamports: 0 } as const;
    return { ok: true, msg: "", lamports } as const;
  }, [amount]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={containerRef}
            className="relative w-full max-w-md"
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Set Vault Goal</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <div className="grid gap-1 text-[12px] text-neutral-700 dark:text-neutral-300">
                  <div className="truncate"><span className="text-neutral-500">Vault:</span> {vaultName}</div>
                  {vaultAddress && (
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-neutral-500">Address:</span>
                      <span className="truncate">{vaultAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Current balance:</span>
                    <span>{vaultSol} SOL</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Current goal:</span>
                    <span>{goalSol !== "-" ? `${goalSol} SOL` : "(none)"}</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-neutral-500">Goal (SOL)</label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 5.00"
                    inputMode="decimal"
                    className="h-10 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                  />
                  {(!parsed.ok || error) && (
                    <div className="rounded-md border border-red-300/60 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300 px-3 py-2 text-[12px]">
                      {error || parsed.msg}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-between">
                <Button variant="outline" onClick={() => onSave(null as any)} disabled={busy} className="transition-colors hover:bg-neutral-300 hover:text-neutral-900 hover:border-neutral-300">Clear</Button>
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" onClick={onClose} className="transition-colors hover:bg-neutral-300 hover:text-neutral-900 hover:border-neutral-300">Cancel</Button>
                  <Button onClick={() => onSave(amount)} disabled={busy || (!parsed.ok && amount.trim() !== "")} className="transition-colors hover:bg-neutral-300 hover:text-neutral-900 hover:border-neutral-300">Save</Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


