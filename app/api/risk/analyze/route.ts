import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { GoogleGenAI } from "@google/genai";

// Cache: in-memory plus optional disk persistence to survive server restarts
const CACHE_TTL_MS = 60_000; // 1 minute
const CACHE_VERSION = "v2"; // bump to invalidate old formats
const resultCache = new Map<string, { ts: number; payload: any }>();
// Best-effort persistent cache using Node globalThis to avoid reinit between HMR cycles
declare global {
  // eslint-disable-next-line no-var
  var __AURI_RISK_CACHE__: Map<string, { ts: number; payload: any }> | undefined;
}
if (!globalThis.__AURI_RISK_CACHE__) {
  globalThis.__AURI_RISK_CACHE__ = new Map();
}
const globalCache = globalThis.__AURI_RISK_CACHE__!;

type BirdEyeMarketData = {
  liquidity?: number;
  price?: number;
  priceChange1h?: number;
  price_change_1h?: number;
  priceChange1hPercent?: number;
  priceChange24h?: number;
  price_change_24h?: number;
  market_cap?: number;
  fdv?: number;
  total_supply?: number;
  circulating_supply?: number;
};

type BirdEyeMetaData = {
  createdAt?: number; // seconds
  created_time?: number; // seconds
  mintTime?: number; // seconds
};

type TokenRiskRequest = {
  walletAddress: string;
  mints?: string[];
};

type SingleTokenMetrics = {
  mint: string;
  liquidityUsd: number | null;
  priceChange1hPercent: number | null;
  top10HolderPercent: number | null;
  ageHours: number | null;
};

type RuleCheck = {
  id: string;
  ok: boolean;
  value: number | null;
  threshold: number;
  comparator: string;
  explain: string;
};

function evaluateRules(metrics: SingleTokenMetrics): { highRisk: boolean; rules: RuleCheck[] } {
  const rules: RuleCheck[] = [];
  const add = (id: string, ok: boolean, value: number | null, threshold: number, comparator: string, explain: string) => {
    rules.push({ id, ok, value, threshold, comparator, explain });
  };
  const { liquidityUsd: liq, priceChange1hPercent: pc1h, top10HolderPercent: top10, ageHours: age } = metrics;
  add("liquidity", !(typeof liq === "number" && liq < 20000), liq ?? null, 20000, ">=", "Liquidity must be at least $20,000");
  add("price_1h", !(typeof pc1h === "number" && Math.abs(pc1h) > 50), pc1h ?? null, 50, "<= |Δ|", "1-hour price change must be ≤ 50% (absolute)");
  add("top10", !(typeof top10 === "number" && top10 > 40), top10 ?? null, 40, "<=", "Top 10 holders must own ≤ 40%");
  add("age_hours", !(typeof age === "number" && age < 48), age ?? null, 48, ">=", "Token age must be ≥ 48 hours");
  const highRisk = rules.some((r) => r.ok === false);
  return { highRisk, rules };
}

function getEnv(name: string, fallback?: string): string {
  const v = process.env[name];
  return (v && v.length > 0 ? v : fallback) ?? "";
}

async function fetchBirdEyeMarket(mint: string, apiKey?: string): Promise<BirdEyeMarketData | null> {
  try {
    const url = `https://public-api.birdeye.so/defi/v3/token/market-data?address=${encodeURIComponent(mint)}&ui_amount_mode=scaled`;
    const res = await fetch(url, {
      headers: apiKey
        ? { "X-API-KEY": apiKey, accept: "application/json", "x-chain": "solana" }
        : { accept: "application/json", "x-chain": "solana" },
      cache: "no-store",
    });
    if (!res.ok) {
      let body: any = null;
      try { body = await res.text(); } catch {}
      console.log("[risk/analyze] Birdeye market error", { mint, status: res.status, statusText: res.statusText, body });
      return null;
    }
    const json = await res.json();
    const data = (json?.data ?? json) as any;
    const normalized: BirdEyeMarketData = {
      // Birdeye v3 returns { success, data: { price, liquidity, ... } }
      liquidity: typeof data?.liquidity === "number" ? data.liquidity : undefined,
      price: typeof data?.price === "number" ? data.price : undefined,
      priceChange1h: typeof data?.priceChange1h === "number" ? data.priceChange1h : undefined,
      price_change_1h: typeof data?.price_change_1h === "number" ? data.price_change_1h : undefined,
      priceChange1hPercent: typeof data?.priceChange1hPercent === "number" ? data.priceChange1hPercent : undefined,
      priceChange24h: typeof data?.priceChange24h === "number" ? data.priceChange24h : undefined,
      price_change_24h: typeof data?.price_change_24h === "number" ? data.price_change_24h : undefined,
      market_cap: typeof data?.market_cap === "number" ? data.market_cap : undefined,
      fdv: typeof data?.fdv === "number" ? data.fdv : undefined,
      total_supply: typeof data?.total_supply === "number" ? data.total_supply : undefined,
      circulating_supply: typeof data?.circulating_supply === "number" ? data.circulating_supply : undefined,
    };
    return normalized;
  } catch {
    return null;
  }
}

async function fetchBirdEyeMeta(mint: string, apiKey?: string): Promise<BirdEyeMetaData | null> {
  try {
    const url = `https://public-api.birdeye.so/defi/v3/token/meta-data/single?address=${encodeURIComponent(mint)}`;
    const res = await fetch(url, {
      headers: apiKey
        ? { "X-API-KEY": apiKey, accept: "application/json", "x-chain": "solana" }
        : { accept: "application/json", "x-chain": "solana" },
      cache: "no-store",
    });
    if (!res.ok) {
      let body: any = null;
      try { body = await res.text(); } catch {}
      console.log("[risk/analyze] Birdeye meta error", { mint, status: res.status, statusText: res.statusText, body });
      return null;
    }
    const json = await res.json();
    const data = (json?.data ?? json) as any;
    return data as BirdEyeMetaData;
  } catch {
    return null;
  }
}

function normalizePriceChange1hPercent(data: BirdEyeMarketData | null): number | null {
  if (!data) return null;
  const candidates = [
    (data as any).priceChange1h,
    (data as any).price_change_1h,
    (data as any).priceChange1hPercent,
    (data as any).priceChange24h,
    (data as any).price_change_24h,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && isFinite(c)) return c;
  }
  return null;
}

function normalizeCreatedUnix(meta: BirdEyeMetaData | null): number | null {
  if (!meta) return null;
  const candidates = [meta.createdAt, (meta as any).created_time, (meta as any).mintTime];
  for (const c of candidates) {
    if (typeof c === "number" && c > 0) return c;
  }
  return null;
}

async function computeTop10HolderPercent(connection: Connection, mintPk: PublicKey): Promise<number | null> {
  try {
    const [largest, supply] = await Promise.all([
      connection.getTokenLargestAccounts(mintPk),
      connection.getTokenSupply(mintPk),
    ]);
    const top10 = (largest.value || []).slice(0, 10);
    const top10Sum = top10.reduce((acc, a) => acc + (a.uiAmount || 0), 0);
    const total = supply.value.uiAmount || 0;
    if (!total || total <= 0) return null;
    return (top10Sum / total) * 100;
  } catch {
    return null;
  }
}

async function assessWithGemini(token: SingleTokenMetrics, apiKey?: string, birdseye?: Record<string, any>): Promise<any> {
  const systemPrompt = [
    "You are a highly advanced crypto risk analysis AI. Your task is to analyze the provided data for a Solana token and determine if it is \"HIGH_RISK\" or \"LOW_RISK\". Your response must be in JSON format.",
    "\nA token is considered HIGH_RISK if it meets any of the following criteria:",
    "\n- Liquidity is less than $20,000.",
    "\n- The price has changed more than 50% in the last hour.",
    "\n- The top 10 holders own more than 40% of the total supply.",
    "\n- The token was created less than 48 hours ago.",
  ].join("");

  const factors = birdseye ?? {};
  const combinedPrompt = `System Prompt:\n${systemPrompt}\n\nUser Prompt:\nYou will receive Birdseye market-data JSON (pairs) for a Solana token and minimal derived metrics.\n- Evaluate the risk strictly per the rules in the System Prompt. If a required field is missing, do not assume it; only conclude from available data.\n- Produce a detailed 3-5 sentence justification paragraph that references concrete numbers from the Birdseye data (e.g., liquidity, price, market_cap, fdv, supplies) and explains why the token is HIGH_RISK or LOW_RISK given the rules.\n\nReturn ONLY JSON with keys:\n- risk: HIGH_RISK or LOW_RISK\n- justification: a paragraph with concrete numbers and reasoning (no lists)\n- results: echo of the useful numeric fields you used (at least price, liquidity, market_cap, fdv, total_supply, circulating_supply when present)\n- factors: exactly the provided Birdseye object\n\nBirdseye factors:\n${JSON.stringify(factors, null, 2)}\n\nDerived metrics:\n${JSON.stringify(token, null, 2)}`;

  if (!apiKey) {
    return localRiskDecision(token, birdseye);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    const tools = [
      {
        googleSearch: {},
      },
    ];
    const config: any = {
      thinkingConfig: { thinkingBudget: -1 },
      tools,
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    };
    const model = "gemini-2.5-flash";
    const contents = [
      {
        role: "user",
        parts: [
          { text: combinedPrompt },
        ],
      },
    ];

    const response = await (ai as any).models.generateContentStream({ model, config, contents });
    let text = "";
    for await (const chunk of response) {
      if ((chunk as any)?.text) text += (chunk as any).text;
    }
    try {
      const parsed = JSON.parse(text);
      return { ...parsed, __rawText: text, usedFallback: false };
    } catch {
      return localRiskDecision(token, birdseye);
    }
  } catch {
    return localRiskDecision(token, birdseye);
  }
}

function localRiskDecision(token: SingleTokenMetrics, birdseye?: Record<string, any>) {
  const liq = token.liquidityUsd;
  const pc1h = token.priceChange1hPercent;
  // Compute with what we have (liquidity and optional price1h). Ignore age/top10 when absent.
  const high = Boolean(
    (typeof liq === "number" && liq < 20000) ||
    (typeof pc1h === "number" && Math.abs(pc1h) > 50)
  );
  const price = typeof birdseye?.price === "number" ? birdseye.price : null;
  const marketCap = typeof birdseye?.market_cap === "number" ? birdseye.market_cap : null;
  const fdv = typeof birdseye?.fdv === "number" ? birdseye.fdv : null;
  const totalSupply = typeof birdseye?.total_supply === "number" ? birdseye.total_supply : null;
  const circ = typeof birdseye?.circulating_supply === "number" ? birdseye.circulating_supply : null;
  const liqText = typeof liq === "number" ? `$${Math.round(liq).toLocaleString()}` : "unknown";
  const priceText = typeof price === "number" ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : "unknown";
  const mcText = typeof marketCap === "number" ? `$${Math.round(marketCap).toLocaleString()}` : "unknown";
  const fdvText = typeof fdv === "number" ? `$${Math.round(fdv).toLocaleString()}` : "unknown";
  const supplyText = typeof totalSupply === "number" ? `${Math.round(totalSupply).toLocaleString()}` : "unknown";
  const circText = typeof circ === "number" ? `${Math.round(circ).toLocaleString()}` : "unknown";
  const p1hText = typeof pc1h === "number" ? `${pc1h.toFixed(2)}%` : "unknown";
  const justification = high
    ? `Risk flagged based on quantitative signals: liquidity ${liqText} ${typeof liq === "number" && liq < 20000 ? "(< $20k)" : ""}${typeof pc1h === "number" ? ` and 1h change ${p1hText} (${Math.abs(pc1h) > 50 ? "> 50%" : "≤ 50%"})` : ""}. Additional context — price ${priceText}, market cap ${mcText}, FDV ${fdvText}, supply ${supplyText} (circulating ${circText}).`
    : `No critical risk signals detected from available data: liquidity ${liqText} (≥ $20k threshold${typeof liq === "number" && liq < 20000 ? " not met" : " met"})${typeof pc1h === "number" ? ` and 1h change ${p1hText} (≤ 50% threshold${Math.abs(pc1h) > 50 ? " not met" : " met"})` : ""}. Context — price ${priceText}, market cap ${mcText}, FDV ${fdvText}, supply ${supplyText} (circulating ${circText}).`;
  const factors = birdseye ?? {};
  return { risk: high ? "HIGH_RISK" : "LOW_RISK", justification, results: { price, liquidity: liq ?? null, market_cap: marketCap, fdv, total_supply: totalSupply, circulating_supply: circ, priceChange1h: pc1h ?? null }, factors, usedFallback: true };
}

export async function POST(req: Request) {
  try {
    console.log("[risk/analyze] Request received");
    const { walletAddress, mints } = (await req.json()) as TokenRiskRequest;
    if (!walletAddress && (!mints || mints.length === 0)) {
      return NextResponse.json({ error: "walletAddress or mints is required" }, { status: 400 });
    }

    const birdeyeKey = getEnv("BIRDEYE_API_KEY");
    const geminiKey = getEnv("GEMINI_API_KEY") || getEnv("GOOGLE_GEMINI_API_KEY");
    const rpc = getEnv("SOLANA_RPC_MAINNET", "https://api.mainnet-beta.solana.com");
    const useChain = getEnv("RISK_CHAIN_FETCH", "0") === "1";
    const connection = useChain ? new Connection(rpc, { commitment: "confirmed" }) : null;

    let mintAddresses: string[] = Array.isArray(mints) ? [...mints] : [];
    if (walletAddress && useChain && connection) {
      // Fetch token mints owned by the wallet
      const owner = new PublicKey(walletAddress);
      const tokenProgramId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
      const parsed = await connection.getParsedTokenAccountsByOwner(owner, { programId: tokenProgramId });
      const held = parsed.value
        .map((acc: any) => acc?.account?.data?.parsed?.info)
        .filter(Boolean)
        .filter((info: any) => {
          const amt = info?.tokenAmount?.uiAmount as number | undefined;
          return typeof amt === "number" && amt > 0;
        })
        .map((info: any) => info.mint as string)
        .filter((v: any) => typeof v === "string");
      mintAddresses.push(...held);
    }
    // If no SPL tokens detected, include SOL mint to ensure at least one analysis
    if (mintAddresses.length === 0) {
      mintAddresses = ["So11111111111111111111111111111111111111112"]; // SOL
    }
    // Unique and limit to avoid rate limits
    mintAddresses = Array.from(new Set(mintAddresses)).slice(0, 25);
    console.log("[risk/analyze] Target mints", mintAddresses, "chainFetch:", useChain);

    // Cache key based on wallet + mints list
    const cacheKey = JSON.stringify({ v: CACHE_VERSION, w: walletAddress ?? null, m: mintAddresses });
    const cached = resultCache.get(cacheKey) || globalCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      const payload = { ...cached.payload, debug: { ...(cached.payload?.debug ?? {}), cached: true, ts: now } };
      console.log("[risk/analyze] Returning cached payload", payload);
      return NextResponse.json(payload);
    }

    const results: { mint: string; metrics: SingleTokenMetrics; rules: RuleCheck[]; gemini: any; birdseye?: any }[] = [];
    for (const mint of mintAddresses) {
      const mintPk = new PublicKey(mint);

      const market = await fetchBirdEyeMarket(mint, birdeyeKey);
      const top10Pct: number | null = null; // single Birdeye call only; skip chain holders

      const liquidity = typeof (market as any)?.liquidity === "number" ? (market as any).liquidity : null;
      const price1h = normalizePriceChange1hPercent(market);
      const ageHours = null; // no meta call; age unknown

      const metrics: SingleTokenMetrics = {
        mint,
        liquidityUsd: liquidity,
        priceChange1hPercent: price1h,
        top10HolderPercent: top10Pct,
        ageHours: null,
      };

      const localEval = evaluateRules(metrics);
      const gemini = await assessWithGemini(metrics, geminiKey, market ?? undefined);
      console.log("[risk/analyze] Token", mint, { birdseyeStatus: market ? 'ok' : 'null', market, metrics, rules: localEval.rules, geminiStatus: gemini ? 'ok' : 'null' });
      results.push({ mint, metrics, rules: localEval.rules, gemini, birdseye: market });
    }

    const anyHigh = results.some((r) => {
      const risk = (r.gemini?.risk ?? r.gemini?.riskLevel ?? r.gemini?.risk_status ?? "").toString();
      const gHigh = risk.toUpperCase().includes("HIGH");
      const localHigh = Array.isArray((r as any).rules) && (r as any).rules.some((rule: any) => rule && rule.ok === false);
      return gHigh || localHigh;
    });

    const payload = {
      walletAddress: walletAddress ?? null,
      results,
      lock: anyHigh,
      state: anyHigh ? "Lockdown" : "Calm",
      debug: { total: results.length, ts: Date.now(), model: "gemini-2.5-flash" },
    } as const;
    console.log("[risk/analyze] Response", payload);
    const entry = { ts: Date.now(), payload };
    resultCache.set(cacheKey, entry);
    globalCache.set(cacheKey, entry);
    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}


