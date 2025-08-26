"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";
import { AnimatePresence, motion } from "framer-motion";

type ComingSoonModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string | null;
};

export default function ComingSoonModal({ open, onClose, title = "Coming Soon", subtitle = null }: ComingSoonModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: "spring", stiffness: 480, damping: 32, mass: 0.7 }}
            style={{ transformOrigin: "center" }}
         >
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>{title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <div className="text-sm text-neutral-700 dark:text-neutral-300">This feature is on the way.</div>
                {subtitle && <div className="text-[12px] text-neutral-500">{subtitle}</div>}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={onClose}>Close</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


