"use client";

import React from "react";
import { motion } from "framer-motion";

export default function PageLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex items-center gap-1 select-none" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>
        <motion.span
          className="text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          Auri
        </motion.span>
        <motion.span
          className="text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.0 }}
        >
          .
        </motion.span>
        <motion.span
          className="text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.2 }}
        >
          .
        </motion.span>
        <motion.span
          className="text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.4 }}
        >
          .
        </motion.span>
      </div>
    </motion.div>
  );
}


