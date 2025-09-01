"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/avatar";
import { IconArrowDownRight, IconArrowUpRight, IconTrash, IconLayoutGrid, IconLayoutList, IconPlus, IconRefresh, IconShieldCheck, IconAlertTriangle, IconPlugConnected, IconActivity } from "@tabler/icons-react";
import VaultCreateModal from "@/components/VaultCreateModal";
import VaultAmountModal from "@/components/VaultAmountModal";
import VaultGoalModal from "@/components/VaultGoalModal";
import ComingSoonModal from "@/components/ComingSoonModal";
import { useSolanaAuth } from "@/providers/SolanaAuthProvider";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useSolanaWallet, useSignAndSendTransaction } from "@web3auth/modal/react/solana";
import { getProviderAndProgramFromSolanaWallet, deriveVaultPda } from "@/lib/anchor";
import { Button } from "@/components/button";
import { PROGRAM_ID } from "@/lib/constants";
import { emitToast, Toaster } from "@/components/Toast";
import RiskDetailsModal from "@/components/RiskDetailsModal";
import LockdownNoticeModal from "@/components/LockdownNoticeModal";
import VaultTransferModal from "@/components/VaultTransferModal";
import VaultDeleteModal from "@/components/VaultDeleteModal";

const statusOptions = ["Lockdown", "Disrupt", "Calm"] as const;
type VaultStatus = (typeof statusOptions)[number];

const statusStyles: Record<
  VaultStatus,
  { container: string; text: string; border: string; dot: string }
> = {
  Lockdown: {
    container: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
  Disrupt: {
    container: "bg-yellow-50 dark:bg-yellow-950/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    dot: "bg-yellow-500",
  },
  Calm: {
    container: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
};

const placeholders = Array.from({ length: 12 }).map((_, index) => {
  const status = statusOptions[index % statusOptions.length];
  return {
    id: `vault-${index + 1}`,
    name: `Vault ${index + 1}`,
    desc: "Placeholder vault",
    status,
  } as const;
});

type OnChainVault = {
  pubkey: string;
  name: string;
  lamports: number;
};

const VaultsPage = () => {
  const { address, connection, login, balanceLamports } = useSolanaAuth();
  const { web3auth } = useWeb3Auth() as any;
  const { accounts } = useSolanaWallet();
  const { signAndSendTransaction, loading: closingTx } = useSignAndSendTransaction();
  const [creating, setCreating] = useState(false);
  const [vaults, setVaults] = useState<OnChainVault[] | null>(null);
  const [lastFetchedCount, setLastFetchedCount] = useState<number | null>(null);
  const [providerAddress, setProviderAddress] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [closing, setClosing] = useState<OnChainVault | null>(null);
  const [confirmClose, setConfirmClose] = useState<OnChainVault | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [activeVault, setActiveVault] = useState<OnChainVault | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState<null | { name: string }>(null);
  const [riskData, setRiskData] = useState<{ lock: boolean; results?: any[] } | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [riskOpen, setRiskOpen] = useState(false);
  const [lockdownOpen, setLockdownOpen] = useState(false);
  // Transfer ownership state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  // Delete (close) modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // no page-level error banner; modal shows inline errors

  const REFRESH_DELAY_MS = 10000; // allow cluster/indexers to catch up

  const canUseChain = Boolean(address && connection);

  // UI controls
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"balance_desc" | "name_asc" | "recent">("balance_desc");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Local goals state (frontend only)
  type GoalsMap = Record<string, number>; // pubkey -> goal lamports
  const [goals, setGoals] = useState<GoalsMap>({});
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalVault, setGoalVault] = useState<OnChainVault | null>(null);
  const GOALS_KEY = "vault_goals_map";

  const loadGoals = useCallback(() => {
    try {
      const raw = localStorage.getItem(GOALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GoalsMap;
        setGoals(parsed || {});
      }
    } catch {}
  }, []);
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);
  const saveGoals = useCallback((next: GoalsMap) => {
    try { localStorage.setItem(GOALS_KEY, JSON.stringify(next)); } catch {}
  }, []);
  const setGoalFor = useCallback((pubkey: string, lamportsOrNull: number | null) => {
    setGoals((prev) => {
      const next = { ...prev } as GoalsMap;
      if (!lamportsOrNull || lamportsOrNull <= 0) {
        delete next[pubkey];
      } else {
        next[pubkey] = lamportsOrNull;
      }
      saveGoals(next);
      return next;
    });
  }, [saveGoals]);

  const refreshVaults = useCallback(async () => {
    if (!connection) return;
    try {
      setEndpoint(connection.rpcEndpoint);
      const programId = PROGRAM_ID;
      let ownerPk: PublicKey | null = null;
      if (address) {
        ownerPk = new PublicKey(address);
      } else {
        try {
          const mod = await import("@web3auth/solana-provider");
          const solanaWallet = new (mod as any).SolanaWallet((web3auth as any)?.provider);
          const accs: string[] = await solanaWallet.requestAccounts();
          if (accs && accs.length > 0) ownerPk = new PublicKey(accs[0]);
          setProviderAddress(accs && accs.length > 0 ? accs[0] : null);
        } catch {
          // ignore
        }
      }

      // Only show vaults owned by the connected wallet; if no wallet, show none
      if (!ownerPk) {
        setVaults([]);
        setLastFetchedCount(0);
        return;
      }

      const filters = [{ memcmp: { offset: 8 + 32, bytes: ownerPk.toBase58() } }];
      const accounts = await connection.getProgramAccounts(programId, { filters });
      const myVaults: OnChainVault[] = [];
      for (const acct of accounts) {
        // Try to deserialize owner pubkey and skip others
        try {
          // AuraVault layout: creator(32) + owner(32) + name(string) + bump(u8)
          const data = acct.account.data;
          if (data.length < 8 + 32 + 32 + 1) continue; // rough sanity
          // Anchor accounts start with 8-byte discriminator; fields follow
          const creatorBytes = data.slice(8, 8 + 32);
          const ownerBytes = data.slice(8 + 32, 8 + 32 + 32);
          const owner = new PublicKey(ownerBytes);
          if (ownerPk && owner.toBase58() !== ownerPk.toBase58()) continue;
          // name follows as Rust Anchor string: 4-byte LE length + utf8 bytes after creator+owner
          const nameLen = new DataView(data.buffer, data.byteOffset + 8 + 32 + 32, 4).getUint32(0, true);
          const nameStart = 8 + 32 + 32 + 4;
          const nameEnd = nameStart + nameLen;
          if (nameEnd <= data.length) {
            const name = new TextDecoder().decode(data.slice(nameStart, nameEnd));
            myVaults.push({ pubkey: acct.pubkey.toBase58(), name, lamports: acct.account.lamports });
          }
        } catch {
          // ignore malformed accounts
        }
      }
      setVaults(myVaults);
      setLastFetchedCount(myVaults.length);
    } catch (e) {
      console.log("[Vaults] refreshVaults error", e);
    }
  }, [connection, address, web3auth]);

  const updateVaultLamports = useCallback((pubkey: string, deltaLamports: number) => {
    setVaults((prev) => {
      if (!prev) return prev;
      return prev.map((v) => v.pubkey === pubkey ? { ...v, lamports: Math.max(0, v.lamports + deltaLamports) } : v);
    });
    setActiveVault((prev) => prev && prev.pubkey === pubkey ? { ...prev, lamports: Math.max(0, prev.lamports + deltaLamports) } : prev);
  }, []);

  const refreshAfterTx = useCallback(async (signature?: string) => {
    try {
      if (connection && signature) {
        // Best-effort confirmation on devnet
        await connection.confirmTransaction(signature, "confirmed");
      }
    } catch (e) {
      console.log("[Vaults] confirmTransaction error (continuing)", e);
    }
    // Multiple passes to cover eventual consistency
    setTimeout(() => refreshVaults(), 0);
    setTimeout(() => refreshVaults(), 4000);
    setTimeout(() => refreshVaults(), REFRESH_DELAY_MS);
    // Aggressive repeated refresh for up to ~20s
    for (let t = 2000; t <= 20000; t += 2000) {
      setTimeout(() => refreshVaults(), t);
    }
  }, [connection, refreshVaults]);

  const watchAndRefresh = useCallback((pubkeyBase58?: string) => {
    if (!connection || !pubkeyBase58) return;
    let cancelled = false;
    let subId: number | null = null;
    (async () => {
      try {
        subId = connection.onAccountChange(new PublicKey(pubkeyBase58), () => {
          if (cancelled) return;
          refreshVaults();
        }, "confirmed");
      } catch (e) {
        console.log("[Vaults] onAccountChange failed", e);
      }
    })();
    setTimeout(() => {
      cancelled = true;
      if (subId !== null) {
        try { connection.removeAccountChangeListener(subId); } catch {}
      }
    }, REFRESH_DELAY_MS + 5000);
  }, [connection, refreshVaults]);

  const pollVaultAndRefresh = useCallback(async (pubkeyBase58?: string, previousLamports?: number | null) => {
    if (!connection || !pubkeyBase58) return;
    const target = new PublicKey(pubkeyBase58);
    const start = Date.now();
    const timeoutMs = 60000; // poll up to ~60s
    let last = typeof previousLamports === "number" ? previousLamports : null;
    while (Date.now() - start < timeoutMs) {
      try {
        const info = await connection.getAccountInfo(target, { commitment: "confirmed" });
        const current = info?.lamports ?? null;
        if (current !== null && last !== null && current !== last) {
          await refreshVaults();
          return;
        }
        last = current;
      } catch {}
      // drive UI refresh even if unchanged yet
      await refreshVaults();
      await new Promise((r) => setTimeout(r, 1500));
    }
    await refreshVaults();
  }, [connection, refreshVaults, REFRESH_DELAY_MS]);

  const handleCreated = useCallback(async (_evt?: { pda?: string; signature?: string }) => {
    setCreating(false);
    await refreshAfterTx(_evt?.signature);
  }, [refreshAfterTx]);
  const handleDeposit = useCallback(async (amountSol: string) => {
    if (!connection || !activeVault) return;
    const ownerStr = address || accounts?.[0] || null;
    if (!ownerStr) return;
    try {
      setSubmitBusy(true);
      setFlowError(null);
      const ownerPk = new PublicKey(ownerStr);
      const amountLamports = Math.floor(parseFloat(amountSol || "0") * LAMPORTS_PER_SOL);
      const disc = await computeDiscriminator("deposit");
      const nameBytes = new TextEncoder().encode(activeVault.name);
      const nameLen = new Uint8Array(new Uint32Array([nameBytes.length]).buffer);
      const amountBuf = new ArrayBuffer(8);
      new DataView(amountBuf).setBigUint64(0, BigInt(amountLamports), true);
      const amountBytes = new Uint8Array(amountBuf);
      const data = new Uint8Array([...disc, ...new Uint8Array(nameLen), ...nameBytes, ...amountBytes]);
      const { Transaction, SystemProgram } = await import("@solana/web3.js");
      const keys = [
        { pubkey: new PublicKey(activeVault.pubkey), isSigner: false, isWritable: true },
        { pubkey: ownerPk, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];
      const tx = new Transaction().add({ keys, programId: PROGRAM_ID, data } as any);
      tx.feePayer = ownerPk;
      const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });
      tx.recentBlockhash = blockhash;
      const sig = await signAndSendTransaction(tx);
      updateVaultLamports(activeVault.pubkey, amountLamports); // optimistic
      emitToast(`Deposited ${amountSol} SOL to ${activeVault.name}`, "success");
      watchAndRefresh(activeVault.pubkey);
      pollVaultAndRefresh(activeVault.pubkey, activeVault.lamports);
      await refreshAfterTx(sig);
    } catch (e: any) {
      setFlowError(e?.message ?? "Deposit failed");
    } finally {
      setSubmitBusy(false);
    }
  }, [connection, activeVault, address, accounts, web3auth, refreshVaults]);

  const handleWithdraw = useCallback(async (amountSol: string) => {
    if (!connection || !activeVault) return;
    const ownerStr = address || accounts?.[0] || null;
    if (!ownerStr) return;
    try {
      setSubmitBusy(true);
      setFlowError(null);
      const ownerPk = new PublicKey(ownerStr);
      const amountLamports = Math.floor(parseFloat(amountSol || "0") * LAMPORTS_PER_SOL);
      const disc = await computeDiscriminator("withdraw");
      const nameBytes = new TextEncoder().encode(activeVault.name);
      const nameLen = new Uint8Array(new Uint32Array([nameBytes.length]).buffer);
      const amountBuf = new ArrayBuffer(8);
      new DataView(amountBuf).setBigUint64(0, BigInt(amountLamports), true);
      const amountBytes = new Uint8Array(amountBuf);
      const data = new Uint8Array([...disc, ...new Uint8Array(nameLen), ...nameBytes, ...amountBytes]);
      const { Transaction, SystemProgram } = await import("@solana/web3.js");
      const keys = [
        { pubkey: new PublicKey(activeVault.pubkey), isSigner: false, isWritable: true },
        { pubkey: ownerPk, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];
      const tx = new Transaction().add({ keys, programId: PROGRAM_ID, data } as any);
      tx.feePayer = ownerPk;
      const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });
      tx.recentBlockhash = blockhash;
      const sig = await signAndSendTransaction(tx);
      updateVaultLamports(activeVault.pubkey, -amountLamports); // optimistic
      emitToast(`Withdrew ${amountSol} SOL from ${activeVault.name}`, "success");
      watchAndRefresh(activeVault.pubkey);
      pollVaultAndRefresh(activeVault.pubkey, activeVault.lamports);
      await refreshAfterTx(sig);
    } catch (e: any) {
      setFlowError(e?.message ?? "Withdraw failed");
    } finally {
      setSubmitBusy(false);
    }
  }, [connection, activeVault, address, accounts, web3auth, refreshVaults]);

  const handleTransferOwnership = useCallback(async (newOwnerStr: string): Promise<boolean> => {
    if (!connection || !activeVault) return false;
    const ownerStr = address || accounts?.[0] || null;
    if (!ownerStr) return false;
    let ok = false;
    try {
      setTransferBusy(true);
      setTransferError(null);
      const ownerPk = new PublicKey(ownerStr);
      const newOwnerPk = new PublicKey(newOwnerStr.trim());
      const logSendError = async (error: any) => {
        try {
          if (error && typeof (error as any).getLogs === "function") {
            let logs: any = null;
            try { logs = await (error as any).getLogs(); } catch { try { logs = await (error as any).getLogs(connection); } catch {} }
            console.log("[Vaults] transfer getLogs()", logs);
          } else if (error && (error as any).logs) {
            console.log("[Vaults] transfer error logs", (error as any).logs);
          }
        } catch {}
      };
      // Try Anchor first via SolanaWallet
      try {
        const mod = await import("@web3auth/solana-provider");
        const solanaWallet = new (mod as any).SolanaWallet((web3auth as any)?.provider);
        const { program, wallet } = await getProviderAndProgramFromSolanaWallet(solanaWallet, connection);
        const owner = wallet.publicKey;
        const sig = await (program as any).methods
          .transferOwnership(activeVault.name, newOwnerPk)
          .accounts({
            vault: new PublicKey(activeVault.pubkey),
            owner,
          })
          .rpc();
        emitToast(`Transferred ownership of ${activeVault.name}`, "success");
        setVaults((prev) => (prev ? prev.filter((v) => v.pubkey !== activeVault.pubkey) : prev));
        setActiveVault(null);
        watchAndRefresh(activeVault.pubkey);
        await refreshAfterTx(sig);
        ok = true;
      } catch (e) {
        await logSendError(e);
        // Fallback to manual instruction
        const disc = await computeDiscriminator("transfer_ownership");
        const nameBytes = new TextEncoder().encode(activeVault.name);
        const nameLen = new Uint8Array(new Uint32Array([nameBytes.length]).buffer);
        const data = new Uint8Array([...disc, ...new Uint8Array(nameLen), ...nameBytes, ...newOwnerPk.toBytes()]);
        const { Transaction } = await import("@solana/web3.js");
        const keys = [
          { pubkey: new PublicKey(activeVault.pubkey), isSigner: false, isWritable: true },
          { pubkey: ownerPk, isSigner: true, isWritable: false },
        ];
        const tx = new Transaction().add({ keys, programId: PROGRAM_ID, data } as any);
        tx.feePayer = ownerPk;
        const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });
        tx.recentBlockhash = blockhash;
        const sig = await signAndSendTransaction(tx);
        emitToast(`Transferred ownership of ${activeVault.name}`, "success");
        setVaults((prev) => (prev ? prev.filter((v) => v.pubkey !== activeVault.pubkey) : prev));
        setActiveVault(null);
        watchAndRefresh(activeVault.pubkey);
        await refreshAfterTx(sig);
        ok = true;
      }
    } catch (e: any) {
      setTransferError(e?.message ?? "Transfer failed");
    } finally {
      setTransferBusy(false);
    }
    return ok;
  }, [connection, activeVault, address, accounts, web3auth, refreshAfterTx, watchAndRefresh, signAndSendTransaction]);

  async function computeDiscriminator(ixName: string): Promise<Uint8Array> {
    const te = new TextEncoder();
    const preimage = te.encode(`global:${ixName}`);
    const digest = await crypto.subtle.digest("SHA-256", preimage);
    return new Uint8Array(digest).slice(0, 8);
  }

  const handleCloseVault = useCallback(async (vault: OnChainVault) => {
    if (!connection) return;
    const ownerStr = address || accounts?.[0] || null;
    if (!ownerStr) return;
    try {
      setClosing(vault);
      const ownerPk = new PublicKey(ownerStr);
      // Sanity: ensure the selected vault address matches seeds(owner, name)
      try {
        const derived = deriveVaultPda(ownerPk, vault.name);
        if (derived.toBase58() !== vault.pubkey) {
          console.log("[Vaults] close: PDA mismatch for", vault.name, "expected", derived.toBase58(), "got", vault.pubkey);
        }
      } catch {}
      const logSendError = async (error: any) => {
        try {
          if (error && typeof (error as any).getLogs === "function") {
            let logs: any = null;
            try {
              logs = await (error as any).getLogs();
            } catch {
              try {
                logs = await (error as any).getLogs(connection);
              } catch {}
            }
            console.log("[Vaults] close getLogs()", logs);
          } else if (error && (error as any).logs) {
            console.log("[Vaults] close error logs", (error as any).logs);
          }
        } catch (logErr) {
          console.log("[Vaults] failed to read logs", logErr);
        }
      };
      // First try Anchor method via SolanaWallet
      try {
        const mod = await import("@web3auth/solana-provider");
        const solanaWallet = new (mod as any).SolanaWallet((web3auth as any)?.provider);
        const { program, wallet } = await getProviderAndProgramFromSolanaWallet(solanaWallet, connection);
        const owner = wallet.publicKey;
        // derive just to verify; but pass the known vault address from list
        const sig = await (program as any).methods
          .close(vault.name)
          .accounts({
            vault: new PublicKey(vault.pubkey),
            owner,
          })
          .rpc();
        watchAndRefresh(vault.pubkey);
        pollVaultAndRefresh(vault.pubkey, vault.lamports);
        await refreshAfterTx(sig);
        // optimistic removal
        setVaults((prev) => (prev ? prev.filter((v) => v.pubkey !== vault.pubkey) : prev));
        if (activeVault?.pubkey === vault.pubkey) setActiveVault(null);
      } catch (e) {
        await logSendError(e);
        const disc = await computeDiscriminator("close");
        const keysBase = [
          { pubkey: new PublicKey(vault.pubkey), isSigner: false, isWritable: true },
          { pubkey: ownerPk, isSigner: true, isWritable: true },
        ];
        // Build the correct instruction with the required name arg
        const nameBytes = new TextEncoder().encode(vault.name);
        const nameLen = new Uint8Array(new Uint32Array([nameBytes.length]).buffer);
        const data = new Uint8Array([...disc, ...new Uint8Array(nameLen), ...nameBytes]);
        const tx = new (await import("@solana/web3.js")).Transaction().add({
          keys: keysBase,
          programId: PROGRAM_ID,
          data,
        } as any);
        tx.feePayer = ownerPk;
        const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });
        tx.recentBlockhash = blockhash;
        const sig = await signAndSendTransaction(tx);
        watchAndRefresh(vault.pubkey);
        pollVaultAndRefresh(vault.pubkey, vault.lamports);
        await refreshAfterTx(sig);
        // optimistic removal
        setVaults((prev) => (prev ? prev.filter((v) => v.pubkey !== vault.pubkey) : prev));
        if (activeVault?.pubkey === vault.pubkey) setActiveVault(null);
      }
      // refresh handled above
    } catch (err) {
      console.log("[Vaults] close error", err);
      try {
        if (err && typeof (err as any).getLogs === "function") {
          const logs = await (err as any).getLogs();
          console.log("[Vaults] close getLogs() (outer)", logs);
        } else if (err && (err as any).logs) {
          console.log("[Vaults] close error logs (outer)", (err as any).logs);
        }
      } catch {}
    } finally {
      setClosing(null);
    }
  }, [address, accounts, connection, signAndSendTransaction, refreshVaults]);

  useEffect(() => {
    refreshVaults();
  }, [refreshVaults]);
  useEffect(() => {
    if (canUseChain) refreshVaults();
  }, [canUseChain, refreshVaults]);

  // Manual risk analysis trigger with 60s throttle
  const [cooldownMs, setCooldownMs] = useState(0);
  const analyzeRisk = useCallback(async () => {
    const wa = address || providerAddress;
    if (!wa) return;
    const cacheKey = `risk_cache_payload_${wa}`;
    const now = Date.now();
    const last = Number(localStorage.getItem('risk_last_run') || '0');
    const remain = 60000 - (now - last);
    if (remain > 0) {
      setCooldownMs(remain);
      return;
    }
    try {
      setRiskLoading(true);
      setRiskError(null);
      const res = await fetch('/api/risk/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wa }),
        cache: 'no-store',
      });
      const json = await res.json();
      console.log('[Vaults] risk/analyze response', json);
      setRiskData(json);
      localStorage.setItem('risk_last_run', String(Date.now()));
      try { localStorage.setItem(cacheKey, JSON.stringify(json)); } catch {}
      setCooldownMs(60000);
    } catch (e: any) {
      setRiskError(e?.message ?? 'Risk check failed');
    } finally {
      setRiskLoading(false);
    }
  }, [address, providerAddress]);

  // Cooldown timer UI
  useEffect(() => {
    if (cooldownMs <= 0) return;
    const id = setInterval(() => setCooldownMs((m) => Math.max(0, m - 1000)), 1000);
    return () => clearInterval(id);
  }, [cooldownMs]);

  // Simulate a Lockdown state for UI testing (no network calls)
  const simulateLockdown = useCallback(() => {
    const wa = address || providerAddress || null;
    const birdseye = {
      price: 0.0023,
      liquidity: 15000, // < 20k to trigger
      market_cap: 1200000,
      fdv: 5000000,
      total_supply: 1000000000,
      circulating_supply: 450000000,
    };
    const dummy = {
      walletAddress: wa,
      results: [
        {
          mint: "SIMULATED_MINT",
          metrics: {
            mint: "SIMULATED_MINT",
            liquidityUsd: birdseye.liquidity,
            priceChange1hPercent: 12,
            top10HolderPercent: null,
            ageHours: null,
          },
          rules: [
            { id: "liquidity", ok: false, value: birdseye.liquidity, threshold: 20000, comparator: ">=", explain: "Liquidity must be at least $20,000" },
            { id: "price_1h", ok: true, value: 12, threshold: 50, comparator: "<= |Δ|", explain: "1-hour price change must be ≤ 50% (absolute)" },
          ],
          gemini: {
            risk: "HIGH_RISK",
            justification: `Liquidity is only $${birdseye.liquidity.toLocaleString()}, below the $20,000 threshold, which alone warrants caution. The token trades around $${birdseye.price} with market cap ~$${birdseye.market_cap.toLocaleString()} and FDV ~$${birdseye.fdv.toLocaleString()}. Given the shallow liquidity, even moderate orders could materially move price; vault operations are locked until conditions improve.`,
            results: birdseye,
            factors: birdseye,
          },
          birdseye,
        },
      ],
      lock: true,
      state: "Lockdown",
      debug: { simulated: true, ts: Date.now() },
    } as const;
    setRiskData(dummy as any);
    setRiskOpen(true);
  }, [address, providerAddress]);

  // Load cached last response on mount or when wallet changes (does not hit server)
  useEffect(() => {
    const wa = address || providerAddress;
    if (!wa) return;
    const cacheKey = `risk_cache_payload_${wa}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setRiskData(parsed);
      }
      const last = Number(localStorage.getItem('risk_last_run') || '0');
      const remain = 60000 - (Date.now() - last);
      if (remain > 0) setCooldownMs(remain);
    } catch {}
  }, [address, providerAddress]);

  // Derived UI data
  const filteredAndSortedVaults = useMemo(() => {
    if (!vaults) return null;
    const q = query.trim().toLowerCase();
    let list = vaults.filter((v) => {
      if (!q) return true;
      return v.name.toLowerCase().includes(q) || v.pubkey.toLowerCase().includes(q);
    });
    if (sortBy === "balance_desc") {
      list = [...list].sort((a, b) => b.lamports - a.lamports);
    } else if (sortBy === "name_asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // recent (no on-chain timestamp; roughly keep current order)
      list = list;
    }
    return list;
  }, [vaults, query, sortBy]);

  const totalAllSol = useMemo(() => {
    if (!vaults) return 0;
    return vaults.reduce((sum, v) => sum + v.lamports, 0) / LAMPORTS_PER_SOL;
  }, [vaults]);
  const totalFilteredSol = useMemo(() => {
    if (!filteredAndSortedVaults) return 0;
    return filteredAndSortedVaults.reduce((sum, v) => sum + v.lamports, 0) / LAMPORTS_PER_SOL;
  }, [filteredAndSortedVaults]);

  return (
    <div className="flex w-full h-full bg-white border-neutral-200 dark:bg-neutral-950">
      {/* Main content */}
      <div className="flex-1 flex p-0 md:p-4">
        <div className="flex flex-col w-full ">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-neutral-200 dark:border-neutral-800 py-3 md:-ml-4 md:-mr-4">
              <div className="px-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <h1
                    className="text-2xl"
                    style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                  >
                    Vaults
                  </h1>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setCreating(true)}
                      disabled={!canUseChain}
                      title="Create a new vault"
                    >
                      <IconPlus className="size-4" />
                      New
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => refreshVaults()}
                      disabled={!connection}
                      title="Refresh vault list"
                    >
                      <IconRefresh className="size-4" />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={analyzeRisk}
                      disabled={!canUseChain || riskLoading || cooldownMs > 0}
                      title={cooldownMs > 0 ? `Wait ${Math.ceil(cooldownMs/1000)}s` : 'Analyze wallet risk'}
                    >
                      <IconShieldCheck className="size-4" />
                      {riskLoading ? 'Analyzing…' : cooldownMs > 0 ? `Analyze (${Math.ceil(cooldownMs/1000)}s)` : 'Analyze risk'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={simulateLockdown}
                      title="Simulate a lockdown state (no network calls)"
                    >
                      <IconAlertTriangle className="size-4" />
                      Lockdown
                    </Button>
                    {!address && (
                      <Button size="sm" onClick={() => login()} title="Connect wallet">
                        <IconPlugConnected className="size-4" />
                        Connect
                      </Button>
                    )}
                    {/* State representation */}
                    {(() => {
                      const state = (riskData?.lock ? 'Lockdown' : 'Calm') as VaultStatus;
                      const isError = Boolean(riskError);
                      const isLoading = Boolean(riskLoading);
                      const pillBase = 'inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors';
                      const pillClasses = isLoading
                        ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                        : isError
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                        : `${statusStyles[state].container} ${statusStyles[state].text} ${statusStyles[state].border}`;
                      return (
                        <div className="hidden md:flex items-center gap-2">
                          <button
                            className={`${pillBase} ${pillClasses}`}
                            style={{ fontFamily: '"JetBrains Mono", monospace' }}
                            title={riskError ?? (riskLoading ? 'Analyzing risk…' : (riskData?.lock ? 'High-risk tokens detected' : 'Stable'))}
                            onClick={() => setRiskOpen(true)}
                            aria-label="Open risk details"
                          >
                            {isLoading ? (
                              <IconActivity className="h-3.5 w-3.5" />
                            ) : isError ? (
                              <IconAlertTriangle className="h-3.5 w-3.5" />
                            ) : state === 'Lockdown' ? (
                              <IconAlertTriangle className="h-3.5 w-3.5" />
                            ) : (
                              <IconShieldCheck className="h-3.5 w-3.5" />
                            )}
                            <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : isError ? 'bg-red-500' : statusStyles[state].dot}`} />
                            <span>{isLoading ? 'Analyzing' : isError ? 'Error' : state}</span>
                          </button>
                          <button
                            onClick={() => setRiskOpen(true)}
                            title="State details"
                            className="group flex items-center"
                            aria-label="Open risk details"
                          >
                            <div className="flex w-28 h-1.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 overflow-hidden">
                              <div className={`w-1/2 ${state === 'Lockdown' ? 'bg-red-500' : 'bg-transparent'} group-hover:bg-red-400 transition-colors`} />
                              <div className={`w-1/2 ${state === 'Calm' ? 'bg-green-500' : 'bg-transparent'} group-hover:bg-green-400 transition-colors`} />
                            </div>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="text-sm text-neutral-700 dark:text-neutral-300" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  Vaults are on-chain accounts you control to deposit SOL, set goals, and manage balances securely.
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                  <div className="flex-1">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name or address"
                      className="h-9 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      <option value="balance_desc">Sort: Balance</option>
                      <option value="name_asc">Sort: Name</option>
                      <option value="recent">Sort: Recent</option>
                    </select>
                    <div className="inline-flex rounded-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      <button
                        className={`h-9 w-10 inline-flex items-center justify-center ${view === 'grid' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}
                        onClick={() => setView('grid')}
                        title="Grid view"
                      >
                        <IconLayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        className={`h-9 w-10 inline-flex items-center justify-center ${view === 'list' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}
                        onClick={() => setView('list')}
                        title="List view"
                      >
                        <IconLayoutList className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 px-2">
                      <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>Vaults: {filteredAndSortedVaults ? `${filteredAndSortedVaults.length}${vaults && filteredAndSortedVaults.length !== vaults.length ? `/${vaults.length}` : ''}` : (lastFetchedCount ?? 0)}</span>
                      <span className="inline-block h-1 w-1 rounded-full bg-neutral-400" />
                      <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>Total: {(filteredAndSortedVaults ? totalFilteredSol : totalAllSol).toFixed(4)} SOL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex flex-col gap-2 p-4">
              {closing && (
                <div className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-[12px] text-neutral-700 dark:text-neutral-300" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  Closing vault "{closing.name}" …
                </div>
              )}
              
              
              {/* Grid view */}
              {view === 'grid' && filteredAndSortedVaults && filteredAndSortedVaults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredAndSortedVaults.map((vault, index) => {
                    const styles = statusStyles["Calm"];
                    const solAmount = (vault.lamports / LAMPORTS_PER_SOL).toFixed(4);
                    const usdAmount = (Number(solAmount) * 150).toFixed(2);
                    const goalLamports = goals[vault.pubkey] ?? null;
                    const progressPct = goalLamports && goalLamports > 0 ? Math.min(100, Math.floor((vault.lamports / goalLamports) * 100)) : null;
                    return (
                      <motion.div
                        key={vault.pubkey}
                        className="group rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:shadow-sm transition-shadow"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.35, ease: 'easeOut', delay: (index % 6) * 0.03 }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="size-8 hidden sm:flex">
                            <AvatarFallback style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }} className="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {index + 1}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>{vault.name}</span>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border ${styles.container} ${styles.text} ${styles.border}`}
                                style={{ fontFamily: '"JetBrains Mono", monospace' }}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                                Owned
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 truncate" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{vault.pubkey}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-neutral-900 dark:text-neutral-100" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>{solAmount} SOL</div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-400" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>${usdAmount}</div>
                          </div>
                        </div>
                        {progressPct !== null && (
                          <div className="mt-3 h-1.5 w-full bg-neutral-200/70 dark:bg-neutral-800/70 rounded">
                            <div
                              className="h-1.5 rounded bg-green-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          {progressPct !== null ? (
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-400" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                              Goal: {(goalLamports! / LAMPORTS_PER_SOL).toFixed(2)} SOL · {progressPct}%
                            </div>
                          ) : (
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400" style={{ fontFamily: '"JetBrains Mono", monospace' }}>No goal set</div>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setGoalVault(vault); setGoalOpen(true); }}
                              className="size-7 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              title={progressPct !== null ? 'Edit goal' : 'Set goal'}
                              aria-label="Set goal"
                            >
                              <IconPlus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setComingSoonOpen({ name: vault.name })}
                              className="h-7 px-2 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px]"
                              title="Stake"
                              aria-label="Stake"
                              style={{ fontFamily: '"JetBrains Mono", monospace' }}
                            >
                              Stake
                            </button>
                            <button
                              onClick={() => { setActiveVault(vault); setTransferError(null); setTransferOpen(true); }}
                              className="h-7 px-2 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px]"
                              title="Transfer ownership"
                              aria-label="Transfer ownership"
                              style={{ fontFamily: '"JetBrains Mono", monospace' }}
                            >
                              Transfer
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400" style={{ fontFamily: '"JetBrains Mono", monospace' }}>Balance updates live</div>
                          <div className="flex items-center gap-1">
                            <button aria-label="Deposit" disabled={riskLoading} onClick={() => { if (riskData?.lock) { setLockdownOpen(true); return; } setActiveVault(vault); setFlowError(null); setDepositOpen(true); setWithdrawOpen(false); }} className="size-7 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                              <IconArrowDownRight className="h-3.5 w-3.5" />
                            </button>
                            <button aria-label="Withdraw" disabled={riskLoading} onClick={() => { if (riskData?.lock) { setLockdownOpen(true); return; } setActiveVault(vault); setFlowError(null); setWithdrawOpen(true); setDepositOpen(false); }} className="size-7 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                              <IconArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                            <button aria-label="Close" onClick={() => { setActiveVault(vault); setDeleteError(null); setDeleteOpen(true); }} className="size-7 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-red-50 dark:hover:bg-red-950/30">
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* List view */}
              {view === 'list' && filteredAndSortedVaults && filteredAndSortedVaults.length > 0 && filteredAndSortedVaults.map((vault, index) => {
                const styles = statusStyles["Calm"];
                const solAmount = (vault.lamports / LAMPORTS_PER_SOL).toFixed(4);
                const usdAmount = (Number(solAmount) * 150).toFixed(2);
                const updatedAgo = `${(index % 5) + 1}h ago`;
                const changePct = 0;
                const goalLamports = goals[vault.pubkey] ?? null;
                const progressPct = goalLamports && goalLamports > 0 ? Math.min(100, Math.floor((vault.lamports / goalLamports) * 100)) : null;
                return (
                  <motion.div
                    key={vault.pubkey}
                    className="group rounded-lg border border-transparent px-3 py-2 flex items-center justify-between gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.35, ease: 'easeOut', delay: (index % 6) * 0.03 }}
                  >
                    {/* Left avatar */}
                    <div className="hidden sm:flex">
                      <Avatar className="size-7">
                        <AvatarFallback style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }} className="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {index + 1}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="truncate text-sm"
                          style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                        >
                          {vault.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border ${styles.container} ${styles.text} ${styles.border}`}
                          style={{ fontFamily: '"JetBrains Mono", monospace' }}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                          Owned
                        </span>
                      </div>
                      <div
                        className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-1"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {vault.pubkey}
                      </div>
                      {/* Goal progress bar if set */}
                      {progressPct !== null && (
                        <div className="mt-1 h-1.5 w-full bg-neutral-200/70 dark:bg-neutral-800/70 rounded">
                          <div
                            className="h-1.5 rounded bg-green-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        <span className="inline-block h-1 w-1 rounded-full bg-neutral-400" />
                        <span>Updated {updatedAgo}</span>
                        <span className="inline-block h-1 w-1 rounded-full bg-neutral-400" />
                        {progressPct !== null ? (
                          <span>Goal {(goalLamports! / LAMPORTS_PER_SOL).toFixed(2)} SOL · {progressPct}%</span>
                        ) : (
                          <span>Balance updates live</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 min-w-[200px] justify-end">
                      {/* change badge */}
                      <span
                        className={`hidden sm:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border ${changePct > 0 ? 'text-green-700 dark:text-green-400 border-green-300/70 dark:border-green-800' : changePct < 0 ? 'text-red-700 dark:text-red-400 border-red-300/70 dark:border-red-800' : 'text-neutral-600 dark:text-neutral-400 border-neutral-300/70 dark:border-neutral-700'}`}
                        style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                      >
                        {changePct > 0 ? '+' : ''}{changePct}%
                      </span>
                      <span
                        className="text-sm text-neutral-800 dark:text-neutral-100"
                        style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                      >
                        {solAmount} SOL
                      </span>
                      <span
                        className="text-[11px] text-neutral-600 dark:text-neutral-400"
                        style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                      >
                        ${usdAmount}
                      </span>
                      {/* hover actions */}
                      <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          <button aria-label="Set goal" onClick={() => { setGoalVault(vault); setGoalOpen(true); }} className="size-7 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <IconPlus className="h-3.5 w-3.5" />
                          </button>
                          <button aria-label="Stake" onClick={() => setComingSoonOpen({ name: vault.name })} className="h-7 px-2 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                            Stake
                          </button>
                          <button aria-label="Transfer ownership" onClick={() => { setActiveVault(vault); setTransferError(null); setTransferOpen(true); }} className="h-7 px-2 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                            Transfer
                          </button>
                        </div>
                        <button aria-label="Deposit" disabled={riskLoading} onClick={() => { if (riskData?.lock) { setLockdownOpen(true); return; } setActiveVault(vault); setFlowError(null); setDepositOpen(true); setWithdrawOpen(false); }} className="size-7 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <IconArrowDownRight className="h-3.5 w-3.5" />
                        </button>
                        <button aria-label="Withdraw" disabled={riskLoading} onClick={() => { if (riskData?.lock) { setLockdownOpen(true); return; } setActiveVault(vault); setFlowError(null); setWithdrawOpen(true); setDepositOpen(false); }} className="size-7 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <IconArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                        <button aria-label="Close" onClick={() => { setActiveVault(vault); setDeleteError(null); setDeleteOpen(true); }} className="size-7 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-red-50 dark:hover:bg-red-950/30">
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {/* Loading skeletons */}
              {vaults === null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 animate-pulse">
                      <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      <div className="mt-2 h-3 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      <div className="mt-4 h-1 w-full bg-neutral-200/70 dark:bg-neutral-800/70 rounded" />
                      <div className="mt-3 flex items-center justify-between">
                        <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
                        <div className="h-7 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Empty state */}
              {vaults && filteredAndSortedVaults && filteredAndSortedVaults.length === 0 && (
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 text-center">
                  <div className="text-sm text-neutral-700 dark:text-neutral-300" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {query ? 'No vaults match your search.' : (canUseChain ? 'No vaults yet. Create your first one.' : 'Connect your wallet to load your vaults.')}
                  </div>
                  <div className="mt-3">
                    {canUseChain ? (
                      <Button onClick={() => setCreating(true)}>New vault</Button>
                    ) : (
                      <Button onClick={() => login()}>Connect</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right news sidebar is rendered by layout */}

      {/* Hide scrollbars visually (keeps scrolling functional) */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
      <VaultCreateModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={handleCreated}
      />
      <VaultAmountModal
        open={Boolean(activeVault) && depositOpen}
        mode="deposit"
        vaultName={activeVault?.name ?? ""}
        vaultAddress={activeVault?.pubkey}
        vaultLamports={activeVault?.lamports ?? null}
        walletLamports={typeof balanceLamports === "number" ? balanceLamports : null}
        error={flowError}
        busy={submitBusy}
        onClose={() => { setDepositOpen(false); setActiveVault(null); }}
        onSubmit={async (amt) => { await handleDeposit(amt); setDepositOpen(false); setActiveVault(null); }}
      />
      <VaultAmountModal
        open={Boolean(activeVault) && withdrawOpen}
        mode="withdraw"
        vaultName={activeVault?.name ?? ""}
        vaultAddress={activeVault?.pubkey}
        vaultLamports={activeVault?.lamports ?? null}
        walletLamports={null}
        error={flowError}
        busy={submitBusy}
        onClose={() => { setWithdrawOpen(false); setActiveVault(null); }}
        onSubmit={async (amt) => { await handleWithdraw(amt); setWithdrawOpen(false); setActiveVault(null); }}
      />
      <VaultTransferModal
        open={Boolean(activeVault) && transferOpen}
        vaultName={activeVault?.name ?? ""}
        vaultAddress={activeVault?.pubkey}
        error={transferError}
        busy={transferBusy}
        onClose={() => { setTransferOpen(false); setActiveVault(null); }}
        onSubmit={async (addr) => { const success = await handleTransferOwnership(addr); if (success) { setTransferOpen(false); setActiveVault(null); } }}
      />
      <VaultDeleteModal
        open={Boolean(activeVault) && deleteOpen}
        vaultName={activeVault?.name ?? ""}
        vaultAddress={activeVault?.pubkey}
        vaultLamports={activeVault?.lamports ?? null}
        error={deleteError}
        busy={deleteBusy}
        onClose={() => { setDeleteOpen(false); setActiveVault(null); setDeleteError(null); }}
        onConfirm={async () => {
          if (!activeVault) return;
          try {
            setDeleteBusy(true);
            setDeleteError(null);
            await handleCloseVault(activeVault);
            setDeleteOpen(false);
            setActiveVault(null);
          } catch (e: any) {
            setDeleteError(e?.message ?? 'Failed to close vault');
          } finally {
            setDeleteBusy(false);
          }
        }}
      />
      <Toaster />
      <VaultGoalModal
        open={goalOpen && Boolean(goalVault)}
        vaultName={goalVault?.name ?? ""}
        vaultAddress={goalVault?.pubkey}
        vaultLamports={goalVault?.lamports ?? null}
        currentGoalLamports={goalVault ? (goals[goalVault.pubkey] ?? null) : null}
        onSave={async (goalSolStr) => {
          if (!goalVault) return;
          const clean = (goalSolStr ?? "").trim();
          if (!clean) {
            setGoalFor(goalVault.pubkey, null);
          } else {
            const n = Number(clean);
            if (isFinite(n) && n > 0) {
              setGoalFor(goalVault.pubkey, Math.floor(n * LAMPORTS_PER_SOL));
            }
          }
          setGoalOpen(false);
          setGoalVault(null);
        }}
        onClose={() => { setGoalOpen(false); setGoalVault(null); }}
      />
      <RiskDetailsModal
        open={riskOpen}
        onClose={() => setRiskOpen(false)}
        state={riskData?.lock ? 'Lockdown' : 'Calm'}
        rules={(riskData?.results && riskData.results[0]?.rules) || []}
        justification={(riskData?.results && (riskData.results[0]?.gemini?.justification || riskData.results[0]?.gemini?.reasoning)) || null}
        birdseye={(riskData?.results && riskData.results[0]?.birdseye) || null}
        modelResults={(riskData?.results && riskData.results[0]?.gemini?.results) || null}
      />
      <ComingSoonModal
        open={Boolean(comingSoonOpen)}
        onClose={() => setComingSoonOpen(null)}
        title="Stake"
        subtitle={comingSoonOpen ? `Staking for ${comingSoonOpen.name} is coming soon.` : null}
      />
      <LockdownNoticeModal open={lockdownOpen} onClose={() => setLockdownOpen(false)} />
    </div>
  );
};

export default VaultsPage;
