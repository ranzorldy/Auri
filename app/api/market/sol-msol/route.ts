import { NextResponse } from "next/server";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MIN_BIRDEYE_INTERVAL_MS = 5000; // simple throttle to avoid 429
declare global {
  // eslint-disable-next-line no-var
  var __AURI_SOL_MSOL_CACHE__: { ts: number; data: any } | undefined;
  // eslint-disable-next-line no-var
  var __AURI_SOL_MSOL_LAST_GOOD__: { ts: number; data: any } | undefined;
  // eslint-disable-next-line no-var
  var __AURI_SOL_MSOL_LAST_FETCH_TS__: number | undefined;
}

async function fetchBirdeyeHistory(mint: string, days = 30): Promise<[number, number][]> {
  const key = process.env.BIRDEYE_API_KEY || "";
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-chain": "solana",
  };
  if (key) headers["X-API-KEY"] = key;
  // Use Birdeye OHLCV endpoint: /defi/history_price
  // Choose granularity: 1m for <= 1 day, 1d for larger windows
  const type = days > 7 ? "1d" : "1m";
  const url = `https://public-api.birdeye.so/defi/history_price?address=${encodeURIComponent(mint)}&address_type=token&type=${type}&time_from=${from}&time_to=${now}&ui_amount_mode=raw`;
  console.log("[sol-msol] fetch", { url, days, type, hasKey: Boolean(key) });
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.log("[sol-msol] birdeye non-ok", { status: res.status, statusText: res.statusText, body: body?.slice(0, 300) });
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  // Try various common shapes from Birdeye
  const candidateArrays: any[] = [];
  if (Array.isArray(json)) candidateArrays.push(json);
  if (Array.isArray(json?.data)) candidateArrays.push(json.data);
  if (Array.isArray(json?.data?.items)) candidateArrays.push(json.data.items);
  if (Array.isArray(json?.items)) candidateArrays.push(json.items);
  if (Array.isArray(json?.data?.values)) candidateArrays.push(json.data.values);
  let items: any[] = [];
  for (const arr of candidateArrays) {
    if (arr && arr.length) { items = arr; break; }
  }
  console.log("[sol-msol] birdeye ok", { mint, arraysTried: candidateArrays.length, count: items.length || 0 });
  const out: [number, number][] = [];
  for (const it of items) {
    const tsSec = typeof it.unixTime === "number" ? it.unixTime
      : typeof it.time === "number" ? it.time
      : typeof it.t === "number" ? it.t
      : typeof it.startTime === "number" ? it.startTime
      : null;
    const ts = tsSec ? (tsSec > 1e12 ? tsSec : tsSec * 1000) : null; // seconds or ms
    const val = typeof it.value === "number" ? it.value
      : typeof it.price === "number" ? it.price
      : typeof it.close === "number" ? it.close
      : typeof it.c === "number" ? it.c
      : null;
    if (ts && val) out.push([ts, val]);
  }
  return out;
}

async function fetchCoingeckoHistory(id: string, days = 30): Promise<[number, number][]> {
  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`coingecko ${id} ${res.status}`);
  const json = await res.json();
  return (json?.prices ?? []) as [number, number][];
}

export async function GET(req: Request) {
  try {
    const now = Date.now();
    const cached = globalThis.__AURI_SOL_MSOL_CACHE__;
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      console.log("[sol-msol] returning cached payload", { count: cached.data?.data?.length ?? 0 });
      return NextResponse.json(cached.data);
    }
    const { searchParams } = new URL(req.url);
    const daysParam = Number(searchParams.get("days") || "30");
    const days = isFinite(daysParam) && daysParam > 0 ? Math.min(30, Math.floor(daysParam)) : 30;
    const SOL_MINT = "So11111111111111111111111111111111111111112";
    const MSOL_MINT = process.env.MSOL_MINT || "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So";
    console.log("[sol-msol] start", { days, SOL_MINT, MSOL_MINT, hasKey: Boolean(process.env.BIRDEYE_API_KEY) });
    let sol: [number, number][] = [];
    let msol: [number, number][] = [];

    // First try Coingecko (more lenient rate limits for history), then Birdeye if needed
    try {
      [sol, msol] = await Promise.all([
        fetchCoingeckoHistory("solana", Math.min(days, 30)),
        fetchCoingeckoHistory("marinade-staked-sol", Math.min(days, 30)),
      ]);
      console.log("[sol-msol] coingecko ok", { sol: sol.length, msol: msol.length });
    } catch (cgErr) {
      console.log("[sol-msol] coingecko error, attempting birdeye", { error: String(cgErr) });
      const lastFetch = globalThis.__AURI_SOL_MSOL_LAST_FETCH_TS__ || 0;
      const since = now - lastFetch;
      if (since < MIN_BIRDEYE_INTERVAL_MS) {
        console.log("[sol-msol] throttled birdeye (returning last_good if available)");
        const lg = globalThis.__AURI_SOL_MSOL_LAST_GOOD__;
        if (lg?.data) return NextResponse.json(lg.data);
      }
      try {
        [sol, msol] = await Promise.all([
          fetchBirdeyeHistory(SOL_MINT, days),
          fetchBirdeyeHistory(MSOL_MINT, days),
        ]);
        globalThis.__AURI_SOL_MSOL_LAST_FETCH_TS__ = now;
      } catch (e2) {
        console.log("[sol-msol] birdeye failed", { error: String(e2) });
      }
    }
    console.log("[sol-msol] series lens", { sol: sol.length, msol: msol.length });
    const len = Math.min(sol.length, msol.length);
    const merged = [] as Array<{ date: string; SOL: number; mSOL: number }>;
    for (let i = 0; i < len; i++) {
      const [ts, solPrice] = sol[i];
      const [, msolPrice] = msol[i];
      const d = new Date(ts);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      merged.push({ date: label, SOL: Number(solPrice.toFixed(2)), mSOL: Number(msolPrice.toFixed(2)) });
    }
    // If still empty, retry with 1 day explicitly
    if (merged.length === 0 && days !== 1) {
      try {
        const [sol1, msol1] = await Promise.all([
          fetchBirdeyeHistory(SOL_MINT, 1),
          fetchBirdeyeHistory(MSOL_MINT, 1),
        ]);
        const len1 = Math.min(sol1.length, msol1.length);
        for (let i = 0; i < len1; i++) {
          const [ts, solPrice] = sol1[i];
          const [, msolPrice] = msol1[i];
          const d = new Date(ts);
          const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
          merged.push({ date: label, SOL: Number(solPrice.toFixed(2)), mSOL: Number(msolPrice.toFixed(2)) });
        }
      } catch {}
    }
    const payload = { data: merged, ts: now };
    console.log("[sol-msol] response", { count: merged.length, first: merged[0], last: merged[merged.length - 1] });
    globalThis.__AURI_SOL_MSOL_CACHE__ = { ts: now, data: payload };
    if (merged.length > 0) globalThis.__AURI_SOL_MSOL_LAST_GOOD__ = { ts: now, data: payload };
    return NextResponse.json(payload);
  } catch (e: any) {
    console.log("[sol-msol] fatal", { error: String(e) });
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}


