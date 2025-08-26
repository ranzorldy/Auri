"use client";

import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import idl from "@/idl/idl.json";
import { PROGRAM_ID } from "@/lib/constants";

// Lazy import to avoid SSR pitfalls and reduce initial bundle
async function importSolanaWallet() {
  const mod = await import("@web3auth/solana-provider");
  return mod.SolanaWallet as new (provider: any) => {
    requestAccounts: () => Promise<string[]>;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
    signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
  };
}

export type AnchorWallet = {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
};

export async function getWalletFromWeb3AuthProvider(web3authProvider: any): Promise<AnchorWallet> {
  if (!web3authProvider) throw new Error("Web3Auth provider is not available");
  const SolanaWallet = await importSolanaWallet();
  const solanaWallet = new SolanaWallet(web3authProvider);
  const accounts = await solanaWallet.requestAccounts();
  if (!accounts || accounts.length === 0) throw new Error("No Solana accounts available from Web3Auth");
  const publicKey = new PublicKey(accounts[0]);

  const wallet: AnchorWallet = {
    publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      const signed = await solanaWallet.signTransaction(tx as unknown as Transaction);
      return signed as unknown as T;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      const signed = await solanaWallet.signAllTransactions(txs as unknown as Transaction[]);
      return signed as unknown as T[];
    },
  };
  return wallet;
}

export async function getWalletFromSolanaWalletInstance(solanaWallet: {
  requestAccounts: () => Promise<string[]>;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
}): Promise<AnchorWallet> {
  const accounts = await solanaWallet.requestAccounts();
  if (!accounts || accounts.length === 0) throw new Error("No Solana accounts available from wallet");
  const publicKey = new PublicKey(accounts[0]);
  const wallet: AnchorWallet = {
    publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      const signed = await solanaWallet.signTransaction(tx as unknown as Transaction);
      return signed as unknown as T;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      const signed = await solanaWallet.signAllTransactions(txs as unknown as Transaction[]);
      return signed as unknown as T[];
    },
  };
  return wallet;
}

export function getAnchorProvider(connection: Connection, wallet: AnchorWallet, commitment: anchor.web3.Commitment = "confirmed"): AnchorProvider {
  return new AnchorProvider(connection, wallet, { commitment, preflightCommitment: commitment });
}

export function getProgram(provider: AnchorProvider): Program<anchor.Idl> {
  const program = new (anchor as any).Program(idl as any, PROGRAM_ID, provider);
  return program as Program<anchor.Idl>;
}

export async function getProviderAndProgramFromWeb3Auth(
  web3authProvider: any,
  connection?: Connection,
  commitment: anchor.web3.Commitment = "confirmed"
) {
  const wallet = await getWalletFromWeb3AuthProvider(web3authProvider);
  const conn = connection ?? new Connection("https://api.devnet.solana.com", commitment);
  const provider = getAnchorProvider(conn, wallet, commitment);
  const program = getProgram(provider);
  return { provider, program, wallet } as const;
}

export async function getProviderAndProgramFromSolanaWallet(
  solanaWallet: {
    requestAccounts: () => Promise<string[]>;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
    signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
  },
  connection?: Connection,
  commitment: anchor.web3.Commitment = "confirmed"
) {
  const wallet = await getWalletFromSolanaWalletInstance(solanaWallet);
  const conn = connection ?? new Connection("https://api.devnet.solana.com", commitment);
  const provider = getAnchorProvider(conn, wallet, commitment);
  const program = getProgram(provider);
  return { provider, program, wallet } as const;
}

export { BN };

export function deriveVaultPda(owner: PublicKey, name: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("aura-vault"), owner.toBuffer(), Buffer.from(name)],
    PROGRAM_ID
  );
  return pda;
}


