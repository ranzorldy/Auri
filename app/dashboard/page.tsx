"use client"
import MagicBento from "@/components/Bento";
import React, { useMemo } from "react";
import { useSolanaAuth } from "@/providers/SolanaAuthProvider";

const SummaryPage = () => {
  const { address } = useSolanaAuth();
  const stateBadge = useMemo(() => {
    try {
      const wa = address || (typeof window !== 'undefined' ? localStorage.getItem('auri.address') : null) || null;
      const raw = wa && typeof window !== 'undefined' ? localStorage.getItem(`risk_cache_payload_${wa}`) : null;
      const parsed = raw ? JSON.parse(raw) : null;
      const isLock = Boolean(parsed?.lock);
      return {
        text: isLock ? 'Lockdown' : 'Calm',
        textClass: isLock ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
      } as const;
    } catch {
      return { text: 'Calm', textClass: 'text-neutral-700 dark:text-neutral-300' } as const;
    }
  }, [address]);
  return (
    <div className="flex w-full h-full bg-white border-neutral-200 dark:bg-neutral-950">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex justify-center items-center">
          <MagicBento />
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
