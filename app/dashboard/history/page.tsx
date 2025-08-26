"use client";

import React, { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useSolanaAuth } from "@/providers/SolanaAuthProvider";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import TransactionDetailsModal from "@/components/TransactionDetailsModal";

type ParsedTx = {
  signature: string;
  status: "success" | "failed";
  blockTime: number | null;
  slot: number;
  feeLamports: number | null;
  direction: "in" | "out" | "self" | "unknown";
  amountLamports: number | null;
  source?: string;
  destination?: string;
  title: string;
  confirmation?: string | null;
  memo?: string | null;
};

function shorten(address: string, left = 4, right = 4) {
  return `${address.slice(0, left)}...${address.slice(-right)}`;
}

function lamportsToSOL(lamports: number | null | undefined) {
  if (!lamports && lamports !== 0) return null;
  return lamports / LAMPORTS_PER_SOL;
}

function formatNumber(n: number | null | undefined, digits = 4) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatRelativeTime(epochSeconds: number | null) {
  if (!epochSeconds) return "—";
  const diffMs = Date.now() - epochSeconds * 1000;
  const abs = Math.abs(diffMs);
  const mins = Math.floor(abs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type TxPage = { items: ParsedTx[]; nextCursor: string | null };

async function fetchTransactionsPage(connection: any, owner: string, before: string | null, limit = 5): Promise<TxPage> {
  const ownerKey = new PublicKey(owner);
  const opts: any = { limit };
  if (before) opts.before = before;
  const signatures = await connection.getSignaturesForAddress(ownerKey, opts);
  if (signatures.length === 0) return { items: [], nextCursor: null };

  const items: ParsedTx[] = signatures.map((s: any) => ({
    signature: s.signature,
    status: s.err ? "failed" : "success",
    blockTime: s.blockTime ?? null,
    slot: s.slot ?? 0,
    feeLamports: null,
    direction: "unknown",
    amountLamports: null,
    title: "Activity",
    confirmation: s.confirmationStatus ?? null,
    memo: s.memo ?? null,
  }));

  const nextCursor = signatures[signatures.length - 1]?.signature ?? null;
  return { items, nextCursor };
}

export default function HistoryPage() {
  const { address, accounts, connection } = useSolanaAuth();
  const owner = address ?? accounts?.[0] ?? null;
  const [cursor, setCursor] = useState<string | null>(null);
  const [detailsSig, setDetailsSig] = useState<string | null>(null);
  const [feeBySig, setFeeBySig] = useState<Record<string, number | null>>({});
  // Memoized in-memory cache for activity by signature (per owner)
  const activityCache = useMemo(() => new Map<string, ParsedTx>(), [owner]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    enabled: Boolean(connection && owner),
    queryKey: ["solana", "tx-history", owner, cursor],
    queryFn: async () => fetchTransactionsPage(connection, owner as string, cursor, 5),
    staleTime: 30_000,
    retry: false,
    retryDelay: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });

  const transactions = useMemo(() => data?.items ?? [], [data]);
  const hasNextPage = Boolean(data?.nextCursor);
  const isFetchingNextPage = isFetching && !isLoading;
  // Load-more via button; page size fixed at 5

  // Store latest fetched items into memoized cache
  useEffect(() => {
    const items = data?.items ?? [];
    if (!items.length) return;
    for (const item of items) {
      activityCache.set(item.signature, item);
    }
  }, [data, activityCache]);

  return (
    <div className="flex w-full h-full bg-white dark:bg-neutral-950">
      <div className="flex-1 flex justify-center items-start">
        <div className="p-6 md:p-8 w-full max-w-5xl">
        {/* Breadcrumbs are now rendered by layout; keeping this wrapper empty to maintain spacing consistency */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>History</h1>
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {!owner && (
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 bg-neutral-50 dark:bg-neutral-900">
            <div className="text-sm font-mono">Connect your wallet to view transactions.</div>
          </div>
        )}

        {owner && (
          <div className="space-y-3">
            {isLoading && (
              <div className="grid gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse" />
                ))}
              </div>
            )}

            {isError && transactions.length === 0 && (
              <div className="rounded-lg border border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 p-4 text-sm font-mono">
                Failed to load transactions.
              </div>
            )}

            {!isLoading && !isError && transactions.length === 0 && (
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 bg-neutral-50 dark:bg-neutral-900">
                <div className="text-sm font-mono">No recent transactions.</div>
              </div>
            )}

            <ul className="grid gap-3">
              {transactions.map((tx) => {
                const sol = lamportsToSOL(tx.amountLamports ?? null);
                const feeSol = lamportsToSOL(tx.feeLamports ?? null);
                const isOut = tx.direction === "out";
                const isIn = tx.direction === "in";
                return (
                  <li
                    key={tx.signature}
                    className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm uppercase tracking-wide"
                            style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                          >
                            {tx.title}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${tx.status === "success" ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}`}>
                            {tx.status}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono">{formatRelativeTime(tx.blockTime)}</span>
                        </div>
                        <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 font-mono truncate">
                          {isOut ? "Sent" : isIn ? "Received" : tx.direction === "self" ? "Self" : "Activity"}
                          {" "}
                          {sol !== null && (
                            <span style={{ fontFamily: '"Bitcount Prop Single", monospace' }}>
                              {isOut ? "-" : isIn ? "+" : ""}
                              {formatNumber(sol, 6)} SOL
                            </span>
                          )}
                          {" "}
                          <span className="text-[11px] text-neutral-500">{tx.confirmation ?? ""}</span>
                          {tx.source && (
                            <>
                              {"  from "}
                              <span className="underline decoration-dotted">{shorten(tx.source)}</span>
                            </>
                          )}
                          {tx.destination && (
                            <>
                              {"  to "}
                              <span className="underline decoration-dotted">{shorten(tx.destination)}</span>
                            </>
                          )}
                          {tx.memo && (
                            <>
                              {"  memo "}
                              <span className="opacity-80">{tx.memo}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm" style={{ fontFamily: '"Bitcount Prop Single", monospace' }}>
                            Slot {formatNumber(tx.slot, 0)}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            Fee {feeBySig[tx.signature] != null ? `${formatNumber(lamportsToSOL(feeBySig[tx.signature]) ?? 0, 6)} SOL` : feeSol !== null ? `${formatNumber(feeSol, 6)} SOL` : "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="View on Solscan"
                          >
                            Solscan
                          </a>
                          <button
                            onClick={() => setDetailsSig(tx.signature)}
                            className="text-xs font-mono px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => navigator.clipboard?.writeText(tx.signature)}
                            className="text-xs font-mono px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Copy signature"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-neutral-500 font-mono flex items-center gap-2">
                      <span className="truncate">{shorten(tx.signature, 6, 6)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex items-center justify-center">
              {hasNextPage ? (
                <button
                  onClick={() => setCursor(data?.nextCursor ?? null)}
                  disabled={isFetchingNextPage}
                  className="text-xs font-mono px-3 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              ) : (
                transactions.length > 0 ? (
                  <div className="text-[11px] text-neutral-500 font-mono">No more</div>
                ) : null
              )}
            </div>
          </div>
        )}
        {detailsSig && connection && (
          <TransactionDetailsModal
            open={Boolean(detailsSig)}
            onClose={() => setDetailsSig(null)}
            signature={detailsSig}
            connection={connection as any}
            sigInfo={activityCache.get(detailsSig) || transactions.find((t) => t.signature === detailsSig)}
            onFeeResolved={(sig, fee) => setFeeBySig((m) => ({ ...m, [sig]: fee }))}
            owner={owner as string}
          />
        )}
        </div>
      </div>
    </div>
  );
}
