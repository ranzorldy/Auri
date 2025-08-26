"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/button";

type ThemeOption = "system" | "light" | "dark";
type VaultView = "grid" | "list";
type VaultSort = "balance_desc" | "name_asc" | "recent";

type Settings = {
  theme: ThemeOption;
  vaultView: VaultView;
  vaultSort: VaultSort;
  autoRefresh: "manual" | "10s" | "30s" | "60s";
  riskAutoCheck: boolean;
  newsSidebar: "show" | "hide";
  currency: "USD" | "EUR";
  compactMode: boolean;
};

const DEFAULTS: Settings = {
  theme: "system",
  vaultView: "grid",
  vaultSort: "balance_desc",
  autoRefresh: "manual",
  riskAutoCheck: false,
  newsSidebar: "show",
  currency: "USD",
  compactMode: false,
};

const STORAGE_KEY = "app_settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  // Apply theme immediately
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = settings.theme === "dark" || (settings.theme === "system" && prefersDark);
    root.classList.toggle("dark", isDark);
  }, [settings.theme]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-between">
      <h2 className="text-lg" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>{children}</h2>
    </div>
  );

  const Description = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm text-neutral-600 dark:text-neutral-400" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{children}</p>
  );

  return (
    <div className="flex w-full h-full bg-white dark:bg-neutral-950">
      <div className="flex-1 flex flex-col min-h-30">
        <div className="relative w-full h-16 md:h-20 bg-gradient-to-br from-neutral-100 to-white dark:from-neutral-900 dark:to-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,_black_40%,_transparent_75%)]" />
          <div className="h-full flex flex-col justify-end px-4 md:px-8 pb-1">
            <h1 className="text-3xl md:text-4xl tracking-tight" style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}>Settings</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>Customize your experience. Changes save automatically.</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-8 py-6 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-6xl">
            {/* Appearance */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader>
                <CardTitle>
                  <SectionTitle>Appearance</SectionTitle>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Description>Theme</Description>
                  <div className="mt-2 inline-flex rounded-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    {(["system","light","dark"] as ThemeOption[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => set("theme", opt)}
                        className={`h-9 px-3 text-sm ${settings.theme===opt? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100':'text-neutral-600 dark:text-neutral-400'}`}
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Description>Default vault view</Description>
                    <div className="mt-2 inline-flex rounded-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      {(["grid","list"] as VaultView[]).map((opt) => (
                        <button key={opt} onClick={() => set("vaultView", opt)} className={`h-9 px-3 text-sm ${settings.vaultView===opt? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100':'text-neutral-600 dark:text-neutral-400'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Description>Default vault sort</Description>
                    <select
                      value={settings.vaultSort}
                      onChange={(e) => set("vaultSort", e.target.value as VaultSort)}
                      className="mt-2 h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700 w-full"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      <option value="balance_desc">Balance</option>
                      <option value="name_asc">Name</option>
                      <option value="recent">Recent</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Behavior */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader>
                <CardTitle>
                  <SectionTitle>Behavior</SectionTitle>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Description>Auto-refresh</Description>
                    <select
                      value={settings.autoRefresh}
                      onChange={(e) => set("autoRefresh", e.target.value as Settings["autoRefresh"])}
                      className="mt-2 h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700 w-full"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      <option value="manual">Manual</option>
                      <option value="10s">Every 10s</option>
                      <option value="30s">Every 30s</option>
                      <option value="60s">Every 60s</option>
                    </select>
                  </div>
                  <div>
                    <Description>Risk auto-check</Description>
                    <div className="mt-2 h-9 inline-flex items-center">
                      <button
                        onClick={() => set("riskAutoCheck", !settings.riskAutoCheck)}
                        className={`w-12 h-7 rounded-full border transition-colors ${settings.riskAutoCheck ? 'bg-green-500/90 border-green-500' : 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'}`}
                        aria-pressed={settings.riskAutoCheck}
                        title={settings.riskAutoCheck? 'Enabled':'Disabled'}
                      >
                        <span className={`block size-6 rounded-full bg-white dark:bg-neutral-900 shadow -translate-x-0.5 transition-transform ${settings.riskAutoCheck ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interface */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader>
                <CardTitle>
                  <SectionTitle>Interface</SectionTitle>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Description>News sidebar</Description>
                    <div className="mt-2 inline-flex rounded-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      {(["show","hide"] as Settings["newsSidebar"][]).map((opt) => (
                        <button key={opt} onClick={() => set("newsSidebar", opt)} className={`h-9 px-3 text-sm ${settings.newsSidebar===opt? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100':'text-neutral-600 dark:text-neutral-400'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Description>Currency</Description>
                    <select
                      value={settings.currency}
                      onChange={(e) => set("currency", e.target.value as Settings["currency"])}
                      className="mt-2 h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700 w-full"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Description>Compact mode</Description>
                  <div className="mt-2 h-9 inline-flex items-center">
                    <button
                      onClick={() => set("compactMode", !settings.compactMode)}
                      className={`w-12 h-7 rounded-full border transition-colors ${settings.compactMode ? 'bg-green-500/90 border-green-500' : 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'}`}
                      aria-pressed={settings.compactMode}
                      title={settings.compactMode? 'Enabled':'Disabled'}
                    >
                      <span className={`block size-6 rounded-full bg-white dark:bg-neutral-900 shadow -translate-x-0.5 transition-transform ${settings.compactMode ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader>
                <CardTitle>
                  <SectionTitle>Actions</SectionTitle>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <Description>Reset all preferences back to defaults.</Description>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSettings(DEFAULTS)}
                >Reset</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
