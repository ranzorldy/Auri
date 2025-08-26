"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";
import { AnimatePresence, motion } from "framer-motion";

type LockdownNoticeModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function LockdownNoticeModal({ open, onClose }: LockdownNoticeModalProps) {
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
            className="relative w-full max-w-md"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Vault is in Lockdown</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <div className="rounded-md border border-red-300/60 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/20 px-3 py-2 text-red-700 dark:text-red-300 text-[13px]">
                  Risk checks indicate unstable market conditions. Withdrawals are temporarily disabled to prevent panic/FOMO exits and protect vault participants.
                </div>
                <div className="text-[12px] text-neutral-600 dark:text-neutral-400">
                  We’ll automatically re-open normal operations once conditions stabilize. You can review the latest risk analysis in the sidebar badge.
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={onClose}>Okay</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


