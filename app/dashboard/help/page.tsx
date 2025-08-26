"use client"

import React from "react";
import { IconChevronRight } from "@tabler/icons-react";

type Step = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  videoSrc?: string | null;
  poster?: string | null;
};

function VideoBlock({ videoSrc, poster }: { videoSrc?: string | null; poster?: string | null }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
      <div className="relative w-full h-32 md:h-40">
        {videoSrc ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
            loop
            autoPlay
            onMouseEnter={(e) => e.currentTarget.pause()}
            onMouseLeave={(e) => e.currentTarget.play()}
            poster={poster || undefined}
            src={videoSrc}
          />
        ) : (
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={poster || "/solana.jpg"}
            alt="Help preview"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}

const steps: Step[] = [
  {
    id: "overview",
    title: "Overview",
    description:
      "Welcome to Auri — the one-stop dApp to protect you from market FOMO. Auri provides smart vaults on Solana powered by Web3Auth. Unlike regular vaults, Auri vaults are monitored 24/7 by an AI agent. The agent continuously scans your wallet for newly minted or unstable tokens and monitors market conditions at set intervals. When tokens meet certain risk criteria (for example: recent mint, low liquidity, or volatile 1-hour pricing), the agent temporarily locks your vault. This pause helps you avoid impulsive buys during FOMO and gives you time to make thoughtful decisions. The lock automatically expires after a set timeout.",
    bullets: [
      "AI-guarded vaults that help curb FOMO-driven purchases.",
      "Continuous wallet and market monitoring on Solana.",
      "Automatic temporary locks when risk criteria are met.",
    ],
    videoSrc: null,
    poster: "/solana.jpg",
  },
  {
    id: "step-1",
    title: "Connect Your Wallet",
    description:
      "Click Connect in the top bar and choose your preferred wallet. We support Web3Auth and standard Solana wallets (Devnet). Your keys remain fully in your control.",
    bullets: [
      "Open the sidebar and sign in via Web3Auth or your wallet.",
      "Approve the connection in your wallet interface.",
      "Your address appears in the header once connected.",
    ],
    videoSrc: "/connect-auri-1756237053649.mp4",
    poster: "/solana.jpg",
  },
  {
    id: "step-2",
    title: "Explore The Dashboard",
    description:
      "Use the sidebar to navigate History, Vaults, and Settings. The top-right risk pill shows live wallet safety status.",
    bullets: [
      "Breadcrumbs help you keep track of where you are.",
      "The news rail on the right shows real-time Solana headlines.",
      "Look for the status pill to view security posture.",
    ],
    videoSrc: "/dashboard.mp4",
    poster: "/solana.jpg",
  },
  {
    id: "step-3",
    title: "Create a Vault",
    description:
      "Go to Vaults and select Create. Set a goal and amount, then confirm. Your vault organizes your funds and intentions while benefiting from AI risk controls.",
    bullets: [
      "Choose a clear vault goal and target amount.",
      "Review details in the preview before confirming.",
      "Confirm the transaction in your wallet.",
    ],
    videoSrc: "/create-vault.mp4",
    poster: "/solana.jpg",
  },
  {
    id: "step-4",
    title: "Run a Risk Check",
    description:
      "From the header, open Risk Details to analyze your wallet. We scan for high-risk tokens and provide clear reasoning behind any lock or alert.",
    bullets: [
      "Click the status pill (Calm / Lockdown / Analyzing).",
      "We fetch and cache analysis for faster reloads.",
      "Review rules, bird's-eye view, and model outputs.",
    ],
    videoSrc: "/Vault-Status.mp4",
    poster: "/solana.jpg",
  },
  {
    id: "step-5",
    title: "Manage & Stay Informed",
    description:
      "Use Settings to tailor your experience. Keep an eye on the Solana news rail for ecosystem updates while you work.",
    bullets: [
      "Adjust preferences in Settings.",
      "Open the wallet UI from the news rail when connected.",
      "Return here anytime for a quick refresher.",
    ],
    videoSrc: "/stayinformed.mp4",
    poster: "/solana.jpg",
  },
];

export default function HelpPage() {
  const [hoveredSectionId, setHoveredSectionId] = React.useState<string | null>(null);
  return (
    <div className="flex w-full h-full min-h-0 bg-white dark:bg-neutral-950">
      <div className="flex-1 h-full min-h-0 overflow-hidden px-4 md:px-6 py-4">
        <div className="h-full w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden">
          {/* Scrollable content with hidden scrollbar */}
          <div className="h-full w-full overflow-y-auto scrollbar-hide scroll-smooth font-jetbrains-mono">
            {/* Page header */}
            <div id="top" className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40">
              <div className="px-5 md:px-8 py-6">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-bitcount-prop">Help</h1>
                <p className="mt-1 text-sm md:text-base text-neutral-600 dark:text-neutral-300 max-w-3xl" style={{ textAlign: "justify" }}>
                  Learn about Auri’s AI-guarded vaults, then connect your wallet, explore the dashboard, create vaults, and run risk checks. Follow these steps to get productive quickly.
                </p>
              </div>
            </div>

            {/* Main docs layout */}
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-8 px-5 md:px-8 py-6 md:py-8">
              {/* TOC */}
              <nav aria-label="Table of contents" className="hidden md:block">
                <div className="sticky top-4 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">On this page</p>
                  <ul className="mt-2 space-y-1.5">
                    {steps.map((s, i) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className={`group inline-flex items-center gap-2 text-sm transition-colors ${
                            hoveredSectionId === s.id
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] ring-1 ring-inset transition-colors ${
                              hoveredSectionId === s.id
                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 ring-neutral-200 dark:ring-neutral-700"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span>{s.title}</span>
                          <IconChevronRight
                            className={`h-3.5 w-3.5 transition-opacity ${
                              hoveredSectionId === s.id
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        </a>
                      </li>
                    ))}
                    <li className="pt-2">
                      <a href="#top" className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">Back to top</a>
                    </li>
                  </ul>
                </div>
              </nav>

              {/* Content */}
              <div className="min-w-0">
                <div className="space-y-10">
                  {steps.map((s, i) => (
                    <section
                      id={s.id}
                      key={s.id}
                      aria-labelledby={`${s.id}-title`}
                      className="scroll-mt-20"
                      onMouseEnter={() => setHoveredSectionId(s.id)}
                      onMouseLeave={() => setHoveredSectionId((prev) => (prev === s.id ? null : prev))}
                    >
                      <header className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-700">
                          {i + 1}
                        </span>
                        <div>
                          <h2 id={`${s.id}-title`} className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-100 font-jetbrains-mono">
                            {s.title}
                          </h2>
                          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 max-w-3xl" style={{ textAlign: "justify" }}>{s.description}</p>
                        </div>
                      </header>

                      {s.bullets && (
                        <ul className="mt-3 space-y-2 list-disc pl-5">
                          {s.bullets.map((b, idx) => (
                            <li key={idx} className="text-sm text-neutral-700 dark:text-neutral-300" style={{ textAlign: "justify" }}>
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-4">
                        {s.id === "overview" ? (
                          <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-800">
                            <div className="relative w-full h-32 md:h-40 flex items-center justify-center">
                              <div className="text-7xl md:text-7xl  text-white font-bitcount-prop">Auri</div>
                            </div>
                          </div>
                        ) : (
                          <VideoBlock videoSrc={s.videoSrc} poster={s.poster} />
                        )}
                      </div>

                      <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-3 text-xs text-neutral-600 dark:text-neutral-300" style={{ textAlign: "justify" }}>
                        Tip: Replace the preview image with a lightweight MP4/WebM for richer guidance.
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
