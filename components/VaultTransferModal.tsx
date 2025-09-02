"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";
import { PublicKey } from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";

type VaultTransferModalProps = {
  open: boolean;
  vaultName: string;
  vaultAddress?: string;
  onSubmit: (newOwnerAddress: string) => Promise<void> | void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
};

export default function VaultTransferModal({ open, vaultName, vaultAddress, onSubmit, onClose, busy, error }: VaultTransferModalProps) {
  const [address, setAddress] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) setAddress("");
  }, [open]);

  const parsed = useMemo(() => {
    const clean = address.trim();
    if (!clean) return { ok: false, msg: "Enter new owner address", pk: null as PublicKey | null } as const;
    try {
      const pk = new PublicKey(clean);
      return { ok: true, msg: "", pk } as const;
    } catch {
      return { ok: false, msg: "Invalid address", pk: null as PublicKey | null } as const;
    }
  }, [address]);

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
                <CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Transfer Ownership</CardTitle>
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
                <div className="grid gap-2">
                  <label className="text-sm text-neutral-500">New owner address</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value.trim())}
                    placeholder="Enter Solana address"
                    className="h-10 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                  />
                </div>
                {(!parsed.ok || error) && (
                  <div className="rounded-md border border-red-300/60 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300 px-3 py-2 text-[12px]">
                    {error || parsed.msg}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 justify-end" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <Button variant="outline" onClick={onClose} className="transition-colors hover:bg-neutral-300 hover:text-neutral-900 hover:border-neutral-300">Cancel</Button>
                <Button onClick={() => onSubmit(address)} disabled={busy || !parsed.ok} className="transition-colors hover:bg-neutral-300 hover:text-neutral-900 hover:border-neutral-300">
                  {busy ? "Transferring..." : "Transfer"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 