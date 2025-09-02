"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser, useSwitchChain, useWeb3Auth } from "@web3auth/modal/react";
import { useSolanaWallet } from "@web3auth/modal/react/solana";
import { PublicKey, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { CHAIN_NAMESPACES } from "@web3auth/base";

type SolanaAuthContextValue = {
  address: string | null;
  balanceLamports: number | null;
  balanceSOL: number | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  accounts: string[] | null;
  connection: Connection | null;
  userInfo: ReturnType<typeof useWeb3AuthUser>["userInfo"];
};

const SolanaAuthContext = createContext<SolanaAuthContextValue | undefined>(undefined);

function SolanaWalletBridge({ onAccounts, onConnection }: { onAccounts: (acc: string[] | null) => void; onConnection: (conn: Connection | null) => void }) {
  const { accounts, connection } = useSolanaWallet();
  useEffect(() => {
    if (accounts && accounts.length > 0) onAccounts(accounts as string[]);
  }, [accounts, onAccounts]);
  useEffect(() => {
    if (connection) {
      onConnection(connection as unknown as Connection);
    }
  }, [connection, onConnection]);
  return null;
}

export function SolanaAuthProvider({ children }: { children: React.ReactNode }) {
  const web3authCtx = useWeb3Auth() as unknown as { isConnected: boolean; web3auth?: { provider?: { request?: (args: any) => Promise<any> } | null } };
  const { connect, loading: isConnecting } = useWeb3AuthConnect();
  const { disconnect, loading: isDisconnecting } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const { switchChain } = useSwitchChain();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [accounts, setAccounts] = useState<string[] | null>(null);
  const [hookEnabled, setHookEnabled] = useState(false);

  // Persist userInfo across refreshes
  const [persistedUserInfo, setPersistedUserInfo] = useState<ReturnType<typeof useWeb3AuthUser>["userInfo"]>(null);

  const [address, setAddress] = useState<string | null>(null);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const fetchBalance = async (addr: string) => {
    if (!connection) return;
    try {
      setLoadingBalance(true);
      const lamports = await connection.getBalance(new PublicKey(addr));
      setBalanceLamports(lamports);
    } finally {
      setLoadingBalance(false);
    }
  };

  const refresh = async () => {
    try {
      const next = accounts && accounts.length > 0 ? accounts[0] : null;
      setAddress(next ?? null);
      if (next) await fetchBalance(next);
    } catch {
    }
  };

  // Load persisted userInfo on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("auri.userInfo") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setPersistedUserInfo(parsed);
      }
      // Optimistic hydrate of address to avoid UI delay on refresh
      const rawAddr = typeof window !== "undefined" ? localStorage.getItem("auri.address") : null;
      if (rawAddr && !address) {
        setAddress(rawAddr);
      }
    } catch {
      // ignore parse / storage errors
    }
  }, []);

  // Persist any new userInfo from Web3Auth
  useEffect(() => {
    if (userInfo) {
      setPersistedUserInfo(userInfo);
      try {
        if (typeof window !== "undefined") localStorage.setItem("auri.userInfo", JSON.stringify(userInfo));
      } catch {
        // ignore storage errors
      }
    }
  }, [userInfo]);

  useEffect(() => {
    // Allow overriding the RPC URL via env for higher rate limits
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const conn = new Connection(rpcUrl, { commitment: "confirmed" });
    setConnection(conn);
  }, []);

  // Removed global fetch patch and RPC 429 logging to improve performance

  // Always enable the Solana wallet hook (will no-op until wallet ready)
  useEffect(() => {
    if (!hookEnabled) {
      setHookEnabled(true);
    }
  }, [hookEnabled]);

  // Whenever a provider appears (user connected via Wallet UI or session restored), refresh accounts
  useEffect(() => {
    const provider = web3authCtx.web3auth?.provider;
    // provider for Solana may remain null; rely on hook accounts instead
    refresh();
    // Try again shortly in case provider needs a moment to be ready
    const timeout = setTimeout(() => {
      if (!address) refresh();
    }, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3authCtx.web3auth?.provider]);

  // Fallback: when provider appears but accounts are still null, try @web3auth/solana-provider directly
  useEffect(() => {
    const provider = web3authCtx.web3auth?.provider as any;
    if (!provider) return;
    if (accounts && accounts.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@web3auth/solana-provider");
        const solanaWallet = new (mod as any).SolanaWallet(provider);
        const acc: string[] = await solanaWallet.requestAccounts();
        if (cancelled) return;
        if (Array.isArray(acc) && acc.length > 0) {
          setAccounts(acc);
          setAddress(acc[0] ?? null);
          await fetchBalance(acc[0]);
        }
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3authCtx.web3auth?.provider, accounts]);

  // Also refresh when connection state flips to connected
  useEffect(() => {
    if (web3authCtx.isConnected && !address) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3authCtx.isConnected]);

  useEffect(() => {
    if (address) {
      fetchBalance(address);
    } else {
      setBalanceLamports(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, connection]);

  // Persist address to localStorage for instant re-hydration on next refresh
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (address) localStorage.setItem("auri.address", address);
      else localStorage.removeItem("auri.address");
    } catch {}
  }, [address]);

  const contextValue: SolanaAuthContextValue = useMemo(() => {
    const effectiveUserInfo = (userInfo as any) || persistedUserInfo || null;
    return {
      address,
      balanceLamports,
      balanceSOL: typeof balanceLamports === "number" ? balanceLamports / LAMPORTS_PER_SOL : null,
      isAuthenticated: Boolean(address),
      isConnecting,
      isDisconnecting,
      login: async () => {
        // Best-effort: some versions do not accept object params, so ignore errors
        try {
          await (switchChain as unknown as (id: string) => Promise<void>)("0x3");
        } catch {
        }
        await connect();
        try {
          const provider = (web3authCtx as any)?.web3auth?.provider;
          if (provider) {
            const mod = await import("@web3auth/solana-provider");
            const solanaWallet = new (mod as any).SolanaWallet(provider);
            const acc: string[] = await solanaWallet.requestAccounts();
            if (Array.isArray(acc) && acc.length > 0) {
              setAccounts(acc);
              setAddress(acc[0] ?? null);
              await fetchBalance(acc[0]);
            }
          }
        } catch {
        }
      },
      logout: async () => {
        await disconnect();
        setAddress(null);
        setBalanceLamports(null);
        setAccounts(null);
        try {
          if (typeof window !== "undefined") localStorage.removeItem("auri.userInfo");
          if (typeof window !== "undefined") localStorage.removeItem("auri.address");
        } catch {
          // ignore storage errors
        }
        setPersistedUserInfo(null);
      },
      refresh,
      accounts,
      connection,
      userInfo: effectiveUserInfo,
    };
  }, [address, accounts, balanceLamports, isConnecting, isDisconnecting, connect, disconnect, refresh, connection, userInfo, persistedUserInfo, switchChain]);

  return (
    <SolanaAuthContext.Provider value={contextValue}>
      {hookEnabled && (
        <SolanaWalletBridge
          onAccounts={(acc) => {
            setAccounts(acc);
            if (acc && acc.length > 0) {
              setAddress(acc[0] ?? null);
              fetchBalance(acc[0]).catch(() => {});
            }
          }}
          onConnection={(conn) => {
            // Only accept devnet connections from wallet; otherwise keep our devnet connection
            try {
              if (conn && (conn as any).rpcEndpoint?.includes("devnet")) {
                setConnection(conn);
              } else {
              }
            } catch {
              // keep existing connection
            }
          }}
        />
      )}
      {children}
    </SolanaAuthContext.Provider>
  );
}

export function useSolanaAuth(): SolanaAuthContextValue {
  const ctx = useContext(SolanaAuthContext);
  if (!ctx) throw new Error("useSolanaAuth must be used within SolanaAuthProvider");
  return ctx;
}


