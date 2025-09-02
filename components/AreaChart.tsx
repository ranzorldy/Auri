"use client"

import React, { useMemo } from "react";
import { CartesianGrid, Line, Area, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./Chart";

type Point = { date: string; sol: number; msol: number };

const chartConfig = {
  sol: { label: "SOL", color: "#ffffff" },
  msol: { label: "MockSOL", color: "#9ca3af" },
} as const;

function buildNeutralTrend(days = 60): Point[] {
  const out: Point[] = [];
  const now = new Date();
  // Start baseline and gentle upward drift
  let sol = 165 + Math.random() * 8;
  let msol = sol - (0.6 + Math.random());
  const target = 205 + Math.random() * 6;
  const driftPerStep = (target - sol) / days;
  // Sprinkle a few mild spikes (more up than down)
  const spikeIdx = new Set<number>();
  const spikeCount = 6;
  while (spikeIdx.size < spikeCount) spikeIdx.add(Math.floor(Math.random() * days));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const k = (days - 1) - i;
    // Smooth drift + low-amplitude noise
    sol += driftPerStep + (Math.random() - 0.5) * 0.9;
    msol += driftPerStep * 0.95 + (Math.random() - 0.5) * 0.8;
    if (spikeIdx.has(k)) {
      const dir = Math.random() > 0.35 ? 1 : -1;
      const mag = 3 + Math.random() * 6; // 3%–9%
      sol *= 1 + dir * (mag / 100);
      msol *= 1 + dir * ((mag * 0.9) / 100);
    }
    sol = Math.max(150, Math.min(225, sol));
    msol = Math.max(150, Math.min(225, msol));
    out.push({ date: label, sol: Number(sol.toFixed(2)), msol: Number(msol.toFixed(2)) });
  }
  return out;
}

export default function ChartAreaInteractive() {
  const chartData = useMemo(() => buildNeutralTrend(60), []);
  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full font-jetbrains-mono aspect-auto justify-start">
      <LineChart accessibilityLayer data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 8 }}>
        <defs>
          <linearGradient id="fillSol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="fillMock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.03} />
          </linearGradient>
        </defs>
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
          domain={["dataMin", "dataMax"] as any}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />}
        />
        {/* Subtle filled areas under lines to keep neutral theme */}
        <Area dataKey="sol" type="monotone" stroke="transparent" fill="url(#fillSol)" isAnimationActive animationDuration={700} />
        <Area dataKey="msol" type="monotone" stroke="transparent" fill="url(#fillMock)" isAnimationActive animationDuration={700} />
        <Line type="monotone" dataKey="sol" stroke="#ffffff" strokeWidth={1.8} dot={false} isAnimationActive animationDuration={900} />
        <Line type="monotone" dataKey="msol" stroke="#9ca3af" strokeWidth={1.4} dot={false} isAnimationActive animationDuration={900} />
      </LineChart>
    </ChartContainer>
  );
}
