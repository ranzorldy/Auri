"use client";

import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";
import { AnimatePresence, motion } from "framer-motion";

const LAMPORTS_PER_SOL = 1_000_000_000;

type VaultDeleteModalProps = {
  open: boolean;
  vaultName: string;
  vaultAddress?: string;
  vaultLamports?: number | null;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
};

export default function VaultDeleteModal({ open, vaultName, vaultAddress, vaultLamports, onConfirm, onClose, busy, error }: VaultDeleteModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sol = useMemo(() => typeof vaultLamports === "number" ? (vaultLamports / LAMPORTS_PER_SOL).toFixed(9).replace(/0+$/, '').replace(/\.$/, '') : null, [vaultLamports]);

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
                <CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Close Vault</CardTitle>
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
                </div>
                <div className="rounded-md border border-yellow-300/60 dark:border-yellow-800/60 bg-yellow-50/60 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-300 px-3 py-2 text-[12px]">
                  Closing this vault will transfer its entire balance{sol !== null ? ` (${sol} SOL)` : ''} back to the current owner and delete the vault account. This action cannot be undone.
                </div>
                {error && (
                  <div className="rounded-md border border-red-300/60 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300 px-3 py-2 text-[12px]">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={() => onConfirm()} disabled={busy} className="bg-red-600 hover:bg-red-700 text-white dark:text-white">
                  {busy ? "Closing..." : "Close vault"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 