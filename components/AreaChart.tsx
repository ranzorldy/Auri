"use client"

import React, { useMemo } from "react";
import { CartesianGrid, Bar, BarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./Chart";

type Point = { date: string; SOL: number; mSOL: number };

const chartConfig = {
  SOL: { label: "SOL", color: "#ffffff" },
  mSOL: { label: "mSOL", color: "#9ca3af" },
} as const;

function buildCurrentDummy(days = 30): Point[] {
  // Snapshot base prices (update these when needed)
  const baseSol = 190.00; // USD
  const baseMsol = 189.50; // USD
  const out: Point[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    // Small synthetic drift/noise around base
    const k = (days - 1) - i; // 0 oldest ... days-1 today
    const drift = (Math.sin((k + 1) / 5) * 0.6 + Math.cos((k + 1) / 7) * 0.4);
    let sol = baseSol * (1 + drift / 100);
    let msol = baseMsol * (1 + (drift * 0.9) / 100);
    // Inject a visible spike a few days back (3-4 days ago)
    if (k >= days - 5 && k <= days - 3) {
      const spikeBoost = 0.08 + (k === days - 3 ? 0.02 : 0); // up to ~10%
      sol = sol * (1 + spikeBoost);
      msol = msol * (1 + spikeBoost * 0.95);
    }
    sol = Number(sol.toFixed(2));
    msol = Number(msol.toFixed(2));
    out.push({ date: label, SOL: sol, mSOL: msol });
  }
  return out;
}

export default function ChartAreaInteractive() {
  const chartData = useMemo(() => buildCurrentDummy(30), []);
  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full font-jetbrains-mono aspect-auto justify-start">
      <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 8, top: 0, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickFormatter={(value) => `$${value}`}
          domain={[150, 250] as any}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />}
        />
        <Bar dataKey="SOL" fill="#ffffff" radius={[2, 2, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
        <Bar dataKey="mSOL" fill="#9ca3af" radius={[2, 2, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
      </BarChart>
    </ChartContainer>
  );
}
