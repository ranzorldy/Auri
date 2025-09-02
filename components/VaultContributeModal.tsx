"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";
import QRCode from "react-qr-code";
import { encodeURL, TransactionRequestURLFields } from "@solana/pay";

type Props = {
	open: boolean;
	vaultName: string;
	vaultAddress: string;
	defaultAmountSol?: string;
	onClose: () => void;
};

// Build a backend transaction request link that the wallet will call (GET, then POST)
function buildTransactionRequestLink(origin: string, params: {
	vault: string;
	name: string;
	amount: string;
}) {
	const { vault, name, amount } = params;
	const u = new URL("/api/pay/contribute", origin);
	u.searchParams.set("vault", vault);
	u.searchParams.set("name", name);
	u.searchParams.set("amount", amount);
	return u;
}

export default function VaultContributeModal({ open, vaultName, vaultAddress, defaultAmountSol, onClose }: Props) {
	const [amount, setAmount] = useState<string>(defaultAmountSol ?? "");

	useEffect(() => {
		if (open) setAmount(defaultAmountSol ?? "");
	}, [open, defaultAmountSol]);

	const isAmountValid = useMemo(() => {
		const clean = (amount || "").trim();
		if (!clean) return false;
		if (!/^\d*(?:\.\d{0,9})?$/.test(clean)) return false;
		const n = Number(clean);
		return isFinite(n) && n > 0;
	}, [amount]);

	const solanaPayURL = useMemo(() => {
		if (!open || !isAmountValid) return null as string | null;
		const origin = typeof window !== "undefined" ? window.location.origin : "";
		const link = buildTransactionRequestLink(origin, { vault: vaultAddress, name: vaultName, amount: amount.trim() });
		const fields: TransactionRequestURLFields = {
			link,
			label: "AuraVault",
			message: `Contribute ${amount.trim()} SOL to ${vaultName}`,
		};
		return encodeURL(fields).toString();
	}, [open, isAmountValid, amount, vaultAddress, vaultName]);

	return (
		open ? (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
				<div className="relative w-full max-w-md">
					<Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
						<CardHeader>
							<CardTitle className="text-xl" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Contribute to Vault</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
							<div className="grid gap-1 text-[12px] text-neutral-700 dark:text-neutral-300">
								<div className="truncate"><span className="text-neutral-500">Vault:</span> {vaultName}</div>
								<div className="flex items-center gap-2 truncate">
									<span className="text-neutral-500">Address:</span>
									<span className="truncate">{vaultAddress}</span>
								</div>
							</div>
							<div className="grid gap-2">
								<label className="text-sm text-neutral-500">Amount (SOL)</label>
								<input
									value={amount}
									onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
									placeholder="e.g. 0.50"
									inputMode="decimal"
									className="h-10 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
								/>
								<div className="text-[11px] text-neutral-500">Scan with Phantom to approve</div>
							</div>
							<div className="flex items-center justify-center py-2">
								<div className="bg-neutral-900 dark:bg-neutral-950 p-3 rounded-md border border-neutral-800">
									{solanaPayURL ? (
										<QRCode value={solanaPayURL} size={196} />
									) : (
										<div className="text-[12px] text-neutral-500">Enter amount to generate QR</div>
									)}
								</div>
							</div>
							{solanaPayURL && (
								<div className="flex items-center justify-center">
									<a href={solanaPayURL} target="_blank" rel="noreferrer" className="text-[12px] underline text-neutral-700 dark:text-neutral-300">Open in Phantom</a>
								</div>
							)}
						</CardContent>
						<CardFooter className="flex gap-2 justify-end" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
							<Button variant="outline" onClick={onClose}>Close</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
		) : null
	);
} 