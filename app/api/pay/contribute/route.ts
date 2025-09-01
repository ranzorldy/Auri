import { NextResponse } from "next/server";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/constants";
import crypto from "node:crypto";

export const runtime = "nodejs";

function badRequest(message: string) {
	return new NextResponse(JSON.stringify({ error: message }), {
		status: 400,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}

function ok(json: any) {
	return new NextResponse(JSON.stringify(json), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}

function encodeU64LE(n: bigint): Uint8Array {
	const buf = Buffer.alloc(8);
	buf.writeBigUInt64LE(n, 0);
	return new Uint8Array(buf);
}

function computeDiscriminator(ixName: string): Uint8Array {
	const pre = Buffer.from(`global:${ixName}`);
	const hash = crypto.createHash("sha256").update(pre).digest();
	return new Uint8Array(hash.slice(0, 8));
}

export async function OPTIONS() {
	return ok({ ok: true });
}

export async function GET(req: Request) {
	try {
		const { searchParams, origin } = new URL(req.url);
		const name = searchParams.get("name")?.trim();
		const vaultStr = searchParams.get("vault")?.trim();
		const amountSolStr = searchParams.get("amount")?.trim();

		if (!name) return badRequest("Missing name");
		if (!vaultStr) return badRequest("Missing vault");
		if (!amountSolStr) return badRequest("Missing amount");

		// Handshake response: label and icon only
		return ok({
			label: "AuraVault",
			icon: `${origin}/solanaLogo.svg`,
		});
	} catch (e: any) {
		return new NextResponse(JSON.stringify({ error: e?.message || "Failed" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	}
}

export async function POST(req: Request) {
	try {
		const url = new URL(req.url);
		const name = url.searchParams.get("name")?.trim();
		const vaultStr = url.searchParams.get("vault")?.trim();
		const amountSolStr = url.searchParams.get("amount")?.trim();

		if (!name) return badRequest("Missing name");
		if (!vaultStr) return badRequest("Missing vault");
		if (!amountSolStr) return badRequest("Missing amount");

		const body = await req.json().catch(() => null) as { account?: string } | null;
		const contributorStr = body?.account?.trim();
		if (!contributorStr) return badRequest("Missing account in body");

		let vault: PublicKey;
		let contributor: PublicKey;
		try {
			vault = new PublicKey(vaultStr);
			contributor = new PublicKey(contributorStr);
		} catch {
			return badRequest("Invalid pubkey(s)");
		}

		const amountSol = Number(amountSolStr);
		if (!isFinite(amountSol) || amountSol <= 0) return badRequest("Invalid amount");
		const lamportsBig = BigInt(Math.floor(amountSol * 1_000_000_000));
		if (lamportsBig <= BigInt(0)) return badRequest("Amount too small");

		const connection = new Connection(process.env.SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com", "confirmed");
		const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });

		// Build raw instruction for contribute(name: String, amount: u64)
		const disc = computeDiscriminator("contribute");
		const nameBytes = Buffer.from(name, "utf8");
		const nameLen = Buffer.alloc(4);
		nameLen.writeUInt32LE(nameBytes.length, 0);
		const amountBytes = encodeU64LE(lamportsBig);
		const data = new Uint8Array([...disc, ...nameLen, ...nameBytes, ...amountBytes]);

		const keys = [
			{ pubkey: vault, isSigner: false, isWritable: true },
			{ pubkey: contributor, isSigner: true, isWritable: true },
			{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
		];

		const tx = new Transaction();
		tx.add({ keys, programId: PROGRAM_ID, data } as any);
		tx.feePayer = contributor;
		tx.recentBlockhash = blockhash;

		const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

		return ok({
			transaction: serialized.toString("base64"),
			message: `Contribute ${amountSolStr} SOL to ${name}`,
		});
	} catch (e: any) {
		return new NextResponse(JSON.stringify({ error: e?.message || "Failed to build transaction" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	}
} 