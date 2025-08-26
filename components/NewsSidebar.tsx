"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconNews, IconBell, IconWallet } from "@tabler/icons-react";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useWalletUI } from "@web3auth/modal/react";
import { Avatar, AvatarFallback } from "@/components/avatar";
import { useSolanaAuth } from "@/providers/SolanaAuthProvider";
import NewsModal from "./NewsModal";

interface NewsItem {
  id: string;
  title: string;
  url: string;
  description?: string;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export default function NewsSidebar() {
  const [open, setOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const { isConnected } = useWeb3Auth();
  const { showWalletUI } = useWalletUI();
  const { address: solAddress } = useSolanaAuth();

  const fallbackNews: NewsItem[] = [
    {
      id: "1",
      title: "Solana Mainnet Experiences Record TPS",
      url: "https://solana.com/blog/record-tps",
      description: "Network throughput hits an all-time high as adoption grows.",
    },
    {
      id: "2",
      title: "New dApp Raises $10M on Solana",
      url: "https://example.com/solana-dapp",
      description: "Investors back the next-gen DeFi protocol built on Solana.",
    },
    {
      id: "3",
      title: "Solana Ecosystem Weekly Recap",
      url: "https://example.com/weekly-recap",
      description: "Highlights from this week’s ecosystem developments.",
    },
    {
      id: "4",
      title: "How Solana Is Powering Web3 Gaming",
      url: "https://example.com/web3-gaming",
      description: "A deep dive into Solana’s growing gaming landscape.",
    },
  ];

  useEffect(() => {
    // Use formatted placeholder news instead of API calls
    setNews(fallbackNews);
  }, []);

  // Memoize processed list to avoid recompute and re-renders; basic dedupe by URL
  const displayNews = useMemo(() => {
    const seen = new Set<string>();
    const result: NewsItem[] = [];
    for (const n of news) {
      const key = n.url.split("?")[0];
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(n);
      if (result.length >= 12) break;
    }
    return result;
  }, [news]);

  // Stagger: reveal content shortly after expanding; hide via mouse leave handler
  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    // Hide list first so it can animate out smoothly, then collapse width
    setShowContent(false);
    setTimeout(() => setOpen(false), 180);
  };

  return (
    <motion.div
      className="hidden md:flex flex-col h-full bg-neutral-100 dark:bg-neutral-900 px-4 py-4 flex-shrink-0 border-l border-neutral-200 dark:border-neutral-700 overflow-x-hidden"
      animate={{ width: open ? "300px" : "60px" }}
      initial={{ width: "60px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="header-open"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <IconNews className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-bitcount-prop text-neutral-700 dark:text-neutral-200"
              style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
            >
              Solana News
            </motion.span>
          </motion.div>
        ) : (
          <motion.div
            key="header-closed"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 relative overflow-hidden"
          >
            <IconNews className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            <div className="relative">
              <IconBell className="text-neutral-700 dark:text-neutral-200 h-4 w-4 flex-shrink-0" />
              {news.length > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute -top-1 -right-1 bg-white border border-neutral-400 text-black rounded-full px-1 text-[9px] leading-none font-bitcount-prop"
                  style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                >
                  {news.length}
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* News list */}
      <div className="mt-6 overflow-y-auto overflow-x-hidden flex-1 pr-1">
        <motion.ul
          className="flex flex-col gap-3 overflow-x-hidden"
          variants={listVariants}
          initial="hidden"
          animate={showContent ? "show" : "hidden"}
          transition={{ when: "beforeChildren" }}
        >
          <AnimatePresence initial={false}>
            {showContent && displayNews.length === 0 && (
              <motion.li
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-neutral-500 dark:text-neutral-400"
              >
                Loading…
              </motion.li>
            )}
            {showContent && displayNews.map((n) => (
              <motion.li
                key={n.id}
                variants={itemVariants}
                exit={{ opacity: 0, x: 8 }}
                layout
                whileHover={{ x: 4 }}
                className="group text-xs border-l-2 border-transparent hover:border-purple-500 transition-colors pl-2"
              >
                <button
                  type="button"
                  onClick={() => setSelected(n)}
                  className="flex flex-col gap-1 text-left w-full"
                >
                  <span
                    className="font-bitcount-prop text-neutral-800 dark:text-neutral-100 text-sm"
                    style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                  >
                    {n.title}
                  </span>
                  {n.description && (
                    <span
                      className="font-jetbrains-mono text-neutral-600 dark:text-neutral-300 text-[11px] line-clamp-2"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {n.description}
                    </span>
                  )}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>

      {/* Bottom wallet button: hidden by default unless already connected with a Solana address */}
      {(isConnected && solAddress) && (
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 justify-end flex-nowrap">
            <motion.span
              initial={{ opacity: 0, maxWidth: 0 }}
              animate={{ opacity: open ? 1 : 0, maxWidth: open ? 140 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-neutral-700 dark:text-neutral-200 overflow-hidden whitespace-nowrap"
              style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
            >
              Wallet UI
            </motion.span>
            <Avatar
              className="size-8 cursor-pointer select-none"
              onClick={async () => {
                try {
                  await showWalletUI();
                } catch {}
              }}
              aria-label="Open Wallet"
              title="Open Wallet"
            >
              <AvatarFallback className="bg-neutral-900 text-white font-semibold">
                <IconWallet className="h-4 w-4" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}
      <NewsModal
        open={!!selected}
        onClose={() => setSelected(null)}
        item={selected}
      />
    </motion.div>
  );
}
