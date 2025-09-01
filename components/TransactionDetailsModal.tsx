"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Connection, LAMPORTS_PER_SOL, VersionedTransactionResponse, ParsedTransactionWithMeta } from "@solana/web3.js";

type Props = {
  open: boolean;
  onClose: () => void;
  signature: string;
  connection: Connection;
  sigInfo?: any;
  onFeeResolved?: (signature: string, lamports: number | null) => void;
  owner?: string | null;
};

function shorten(address: string, left = 6, right = 6) {
  return `${address.slice(0, left)}...${address.slice(-right)}`;
}

export default function TransactionDetailsModal({ open, onClose, signature, connection, sigInfo, onFeeResolved, owner }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<VersionedTransactionResponse | ParsedTransactionWithMeta | null>(null);
  const [loadedSignature, setLoadedSignature] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !signature || !connection) return;
    if (loadedSignature === signature && tx) return; // already loaded
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const fetched = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
        if (cancelled) return;
        setTx(fetched);
        setLoadedSignature(signature);
        const feeLamports = fetched?.meta?.fee ?? null;
        if (onFeeResolved) onFeeResolved(signature, feeLamports);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load transaction");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, signature, connection, onFeeResolved, loadedSignature, tx]);

  const details = useMemo(() => {
    if (!tx) return null as null | {
      direction: "in" | "out" | "self" | "unknown";
      amountLamports: number | null;
      feeLamports: number | null;
      source?: string;
      destination?: string;
      programs: { program: string; type: string }[];
    };
    const message = tx.transaction.message as any;
    const accountKeys: string[] = (message?.accountKeys || []).map((k: any) => (typeof k === "string" ? k : k.pubkey?.toString?.() ?? k.pubkey?.toBase58?.())) as string[];
    const selfIndex = owner ? accountKeys.findIndex((k) => k === owner) : -1;
    const meta = tx.meta as any;
    const pre = selfIndex >= 0 ? meta?.preBalances?.[selfIndex] ?? null : null;
    const post = selfIndex >= 0 ? meta?.postBalances?.[selfIndex] ?? null : null;
    const fee = meta?.fee ?? null;
    const outer = (message?.instructions || []);
    const inner = (meta?.innerInstructions || []).flatMap((x: any) => x.instructions || []);
    const all = [...outer, ...inner];
    const programs = all.slice(0, 4).map((ix: any) => ({ program: ix.program || "program", type: ix?.parsed?.type || ix?.type || "instruction" }));
    let direction: "in" | "out" | "self" | "unknown" = "unknown";
    let amountLamports: number | null = null;
    let source: string | undefined;
    let destination: string | undefined;
    const parsedTransfer = all.find((ix: any) => ix?.parsed?.type === "transfer" && ix?.parsed?.info);
    if (parsedTransfer) {
      const info = parsedTransfer.parsed.info;
      source = info.source;
      destination = info.destination;
      amountLamports = Number(info.lamports ?? 0);
      if (owner) {
        if (source === owner && destination === owner) direction = "self";
        else if (source === owner) direction = "out";
        else if (destination === owner) direction = "in";
      }
    } else if (pre !== null && post !== null) {
      const delta = post - pre + (fee ?? 0) * (selfIndex === 0 ? 1 : 0);
      if (delta < 0) { direction = "out"; amountLamports = Math.abs(delta); }
      else if (delta > 0) { direction = "in"; amountLamports = delta; }
      else { direction = "unknown"; amountLamports = 0; }
    }
    return { direction, amountLamports, feeLamports: fee ?? null, source, destination, programs };
  }, [tx, owner]);

  const amountSOL = useMemo(() => {
    const n = details?.amountLamports;
    if (n == null) return null;
    return n / LAMPORTS_PER_SOL;
  }, [details]);
  const feeSOL = useMemo(() => {
    const n = details?.feeLamports;
    if (n == null) return null;
    return n / LAMPORTS_PER_SOL;
  }, [details]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[94vw] max-w-4xl rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="text-sm font-mono">
            <span className="uppercase tracking-wide mr-2" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Transaction</span>
            <span className="opacity-80">{shorten(signature)}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://solscan.io/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 transition-colors hover:bg-neutral-300 hover:text-neutral-900 hover:border-neutral-300 dark:hover:bg-neutral-800"
            >
              View on Solscan
            </a>
            <button
              onClick={onClose}
              className="text-xs font-mono px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 transition-colors hover:bg-neutral-300 hover:text-neutral-900 hover:border-neutral-300 dark:hover:bg-neutral-800"
            >
              Close
            </button>
          </div>
        </div>
        <div className="p-5">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="h-6 w-40 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-5 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
            </div>
          )}
          {!loading && error && (
            <div className="text-xs font-mono rounded border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950 p-3">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-sm font-mono">
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-70">Amount</div>
                  <div style={{ fontFamily: '"Bitcount Prop Single", monospace' }}>{amountSOL != null ? `${amountSOL.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL` : "—"}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">Direction</div>
                    <div>{details?.direction ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">Fee</div>
                    <div>{feeSOL != null ? `${feeSOL.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL` : "—"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">Status</div>
                    <div>{tx?.meta?.err ? "failed" : "success"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">Confirmation</div>
                    <div>{sigInfo?.confirmationStatus ?? "—"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">Block time</div>
                    <div>{sigInfo?.blockTime ? new Date(sigInfo.blockTime * 1000).toLocaleString() : tx?.blockTime ? new Date((tx as any).blockTime * 1000).toLocaleString() : "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">Slot</div>
                    <div>{tx?.slot ?? sigInfo?.slot ?? "—"}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm font-mono">
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-70">From</div>
                  <div className="truncate">{details?.source ? shorten(details.source) : "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-70">To</div>
                  <div className="truncate">{details?.destination ? shorten(details.destination) : "—"}</div>
                </div>
                {sigInfo?.memo && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">Memo</div>
                    <div className="truncate">{sigInfo.memo}</div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-70">Programs</div>
                  <div className="flex flex-wrap gap-2">
                    {details?.programs?.length ? details.programs.map((p, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">{p.program}:{p.type}</span>
                    )) : <span className="opacity-60">—</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-70">Signature</div>
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{shorten(signature)}</span>
                    <button onClick={() => navigator.clipboard?.writeText(signature)} className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 transition-colors hover:bg-neutral-300 hover:text-neutral-900 hover:border-neutral-300">Copy</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


