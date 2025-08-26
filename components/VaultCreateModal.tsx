"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";
import { useSolanaWallet, useSignAndSendTransaction } from "@web3auth/modal/react/solana";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useWeb3Auth } from "@web3auth/modal/react";
import { deriveVaultPda, getProviderAndProgramFromSolanaWallet } from "@/lib/anchor";
import { PROGRAM_ID } from "@/lib/constants";
import { useSolanaAuth } from "@/providers/SolanaAuthProvider";

type VaultCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate?: (input: { name: string; amountSol: string; pda: string; signature?: string }) => void;
};

export default function VaultCreateModal({ open, onClose, onCreate }: VaultCreateModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { accounts, connection } = useSolanaWallet();
  const { signAndSendTransaction, loading: sendingTx } = useSignAndSendTransaction();
  const { web3auth } = useWeb3Auth() as any;
  const { login } = useSolanaAuth();

  async function waitForAccount(maxMs = 5000, stepMs = 200): Promise<string | null> {
    const deadline = Date.now() + maxMs;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const acc = accounts?.[0] ?? null;
      if (acc) return acc;
      if (Date.now() > deadline) return null;
      await new Promise((r) => setTimeout(r, stepMs));
    }
  }

  async function computeDiscriminator(ixName: string): Promise<Uint8Array> {
    const te = new TextEncoder();
    const preimage = te.encode(`global:${ixName}`);
    const digest = await crypto.subtle.digest("SHA-256", preimage);
    return new Uint8Array(digest).slice(0, 8);
  }

  useEffect(() => {
    if (open) {
      setName("");
      setAmount("");
      setErrorMsg(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={containerRef} className="relative w-full max-w-md">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Create a Vault</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              Name your vault and choose how much SOL to store.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            <div className="grid gap-2">
              <label className="text-sm text-neutral-500">Name your vault</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Savings Vault"
                className="h-10 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-neutral-500">Enter the amount you want to store (SOL)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="e.g. 0.10"
                inputMode="decimal"
                className="h-10 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
              />
            </div>
            {errorMsg && (
              <div className="rounded-md border border-red-300/60 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300 px-3 py-2 text-[12px]">
                {errorMsg}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={async () => {
                const cleanName = name.trim();
                const amtStr = amount.trim();
                if (!cleanName || !amtStr) return;
                try {
                  setSubmitting(true);
                  setErrorMsg(null);
                  // Ensure account from hook
                  let fromBase58 = accounts?.[0] ?? null;
                  if (!fromBase58) {
                    await login();
                    fromBase58 = await waitForAccount();
                  }
                  if (!fromBase58 || !connection) {
                    setErrorMsg("Wallet provider unavailable. Please reconnect and try again.");
                    return;
                  }

                  const userPk = new PublicKey(fromBase58);
                  const vaultPda = deriveVaultPda(userPk, cleanName);
                  const lamports = Math.floor(parseFloat(amtStr || "0") * LAMPORTS_PER_SOL);

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
                        console.log("[Vaults] create getLogs()", logs);
                      } else if (error && (error as any).logs) {
                        console.log("[Vaults] create error logs", (error as any).logs);
                      }
                    } catch (logErr) {
                      console.log("[Vaults] create: failed to read logs", logErr);
                    }
                  };

                  let signature: string | undefined = undefined;
                  // First try via Anchor program API (handles serialization and init constraints)
                  try {
                    const mod = await import("@web3auth/solana-provider");
                    const solanaWallet = new (mod as any).SolanaWallet((web3auth as any)?.provider);
                    const { program, wallet } = await getProviderAndProgramFromSolanaWallet(solanaWallet, connection);
                    // Ensure wallet matches the fromBase58
                    if (wallet.publicKey.toBase58() !== userPk.toBase58()) {
                      throw new Error("Wallet public key mismatch");
                    }
                    signature = await (program as any).methods
                      .initialize(cleanName)
                      .accounts({
                        vault: vaultPda,
                        user: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                      })
                      .rpc();
                  } catch (anchorErr) {
                    await logSendError(anchorErr);
                    // Fallback to raw Anchor-compatible instruction
                    const disc = await computeDiscriminator("initialize");
                    const nameBytes = new TextEncoder().encode(cleanName);
                    const nameLen = new Uint8Array(new Uint32Array([nameBytes.length]).buffer);
                    const data = new Uint8Array([...disc, ...new Uint8Array(nameLen), ...nameBytes]);
                    const keys = [
                      { pubkey: vaultPda, isSigner: false, isWritable: true },
                      { pubkey: userPk, isSigner: true, isWritable: true },
                      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                    ];
                    const tx = new Transaction().add({ keys, programId: PROGRAM_ID, data } as TransactionInstruction);
                    tx.feePayer = userPk;
                    const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });
                    tx.recentBlockhash = blockhash;
                    try {
                      signature = await signAndSendTransaction(tx);
                    } catch (rawErr) {
                      await logSendError(rawErr);
                      throw rawErr;
                    }
                  }

                  // Optional: deposit transfer as a separate transaction if requested
                  if (lamports > 0) {
                    const transferTx = new Transaction().add(
                      SystemProgram.transfer({ fromPubkey: userPk, toPubkey: vaultPda, lamports })
                    );
                    transferTx.feePayer = userPk;
                    const { blockhash: bh2 } = await connection.getLatestBlockhash({ commitment: "finalized" });
                    transferTx.recentBlockhash = bh2;
                    try {
                      await signAndSendTransaction(transferTx);
                    } catch (xferErr) {
                      await logSendError(xferErr);
                      throw xferErr;
                    }
                  }

                  onCreate?.({ name: cleanName, amountSol: amtStr, pda: vaultPda.toBase58(), signature });
                  onClose();
                } catch (e: any) {
                  setErrorMsg(e?.message ?? "Failed to create vault");
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting || sendingTx || name.trim().length === 0 || amount.trim().length === 0}
            >
              {submitting || sendingTx ? "Creating..." : "Create vault"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


