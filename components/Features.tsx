"use client"

import { motion } from "motion/react"
import { BentoGrid, BentoCard } from "@/components/Magicbento"
import Waves from "@/components/backgrounds/Waves"
import { IconAuth2fa, IconRobot } from "@tabler/icons-react"
import { CoinsIcon, NewspaperIcon, TimerIcon, VaultIcon } from "lucide-react"

export default function Features() {
  return (
    <div className="m-2 rounded-3xl bg-black relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@100..900&display=swap');
        .font-bitcount-prop { font-family: 'Bitcount Prop Single', sans-serif; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Background Waves */}
      <Waves lineColor="#1f2937" backgroundColor="transparent" className="z-0" />

      {/* Two-column full-screen section */}
      <div className="relative z-10 grid h-[calc(100vh-1rem)] grid-rows-[auto,1fr] md:grid-rows-1 md:grid-cols-2">
        {/* Left: Info */}
        <div className="flex flex-col justify-center gap-6 px-6 py-10 md:px-10 lg:px-16 overflow-hidden">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            transition={{ staggerChildren: 0.08, delayChildren: 0.05 }}
          >
            <motion.h2
              className="font-bitcount-prop text-left text-4xl md:text-6xl lg:text-7xl text-gray-200"
              variants={{
                hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
                visible: {
                  opacity: 1,
                  x: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, repeatType: "mirror", duration: 6, ease: "easeInOut" }}
            >
              Features
            </motion.h2>

            <motion.p
              className="mt-3 text-gray-300/90 text-sm md:text-base leading-relaxed max-w-xl font-jetbrains-mono"
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
            >
              Smart vaults on Solana, powered by Web3Auth, with a 24/7 AI agent that guards your wallet and market moves—so you don’t buy into unstable tokens on impulse.
            </motion.p>

            {/* Compact stats */}
            <motion.div
              className="mt-2 grid grid-cols-3 gap-3 md:gap-4 max-w-xl"
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4 }}
            >
              {[
                { label: "AI Agent", value: "24/7" },
                { label: "Auto‑Lock", value: "On risk" },
                { label: "Cooldown", value: "Timeout" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="rounded-xl border border-gray-800/60 bg-black/40 p-4"
                >
                  <div className="text-[11px] text-gray-400">{s.label}</div>
                  <div className="font-bitcount-prop text-xl md:text-2xl text-white">{s.value}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Bullets */}
            <motion.div className="mt-2 max-w-xl" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <motion.h3 className="font-bitcount-prop text-white text-xl mb-2" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                Highlights
              </motion.h3>
              <ul className="space-y-1.5 text-gray-300 text-sm font-jetbrains-mono">
                {[
                  "Smart vaults on Solana powered by Web3Auth",
                  "24/7 AI agent monitors wallet and markets",
                  "Checks mint age, liquidity and 1‑hour price action",
                  "Auto‑locks vaults on risk to prevent FOMO buys",
                ].map((t) => (
                  <motion.li key={t} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
                    {t}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Tags */}
            <motion.div className="mt-2 max-w-xl" variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {["Solana", "Web3Auth", "AI‑guarded", "Non‑custodial", "Simple"].map((t) => (
                  <motion.span
                    key={t}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                    className="rounded-full border border-gray-800/60 bg-black/40 px-3 py-1 text-gray-300"
                  >
                    {t}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right: Magic Bento grid */}
        <div className="h-full w-full overflow-hidden px-3 py-3">
          <motion.div
            className="relative w-full h-full max-h-full overflow-hidden p-6 md:p-8 xl:p-8"
            initial={{ scale: 1, opacity: 0.98 }}
            animate={{ scale: 0.9, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Subtle animated glow blobs inside grid area */}
            <div className="pointer-events-none absolute inset-0">
              <motion.div
                className="absolute -top-10 -right-20 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl"
                animate={{ x: [0, 24, -12, 0], y: [0, -16, 10, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"
                animate={{ x: [0, -18, 8, 0], y: [0, 12, -10, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <BentoGrid className="mx-auto w-full max-w-full grid-cols-3 auto-rows-[13rem] md:auto-rows-[14rem] gap-3">
              {getFeatures().map((feature, idx) => (
                <BentoCard key={idx} {...feature} />
              ))}
            </BentoGrid>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Local demo content to match the requested layout
function MarqueeFiles() {
  const files = [
    { name: "bitcoin.pdf", body: "Bitcoin is a cryptocurrency invented in 2008 by Satoshi Nakamoto." },
    { name: "finances.xlsx", body: "Rows and columns that arrange data and simplify calculations." },
    { name: "logo.svg", body: "SVG is an XML-based vector image format supporting interactivity." },
    { name: "keys.gpg", body: "GPG keys encrypt/decrypt files and authenticate messages." },
    { name: "seed.txt", body: "Seed phrases recover your wallet funds on-chain." },
  ]

  return (
    <div className="absolute inset-0 top-10 overflow-hidden [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)]">
      <div
        className="flex gap-4 w-[200%] animate-[marquee_20s_linear_infinite]"
        aria-hidden
      >
        {[...files, ...files].map((f, i) => (
          <figure
            key={i}
            className="relative w-40 cursor-pointer overflow-hidden rounded-xl border p-4 border-gray-800/60 bg-gray-900/20 hover:bg-gray-900/30 transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
          >
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col">
                <figcaption className="text-sm font-medium text-white/90">{f.name}</figcaption>
              </div>
            </div>
            <blockquote className="mt-2 text-xs text-gray-300/80">{f.body}</blockquote>
          </figure>
        ))}
      </div>
    </div>
  )
}

function NotificationsList() {
  const items = [
    "Balance updated: +0.42 SOL",
    "3 vaults active",
    "Price alert: SOL up 5%",
    "New integration connected",
    "Backup complete",
  ]

  return (
    <div className="absolute inset-0 right-2 top-4 p-2">
      <ul className="space-y-2">
        {items.map((text, i) => (
          <li
            key={i}
            className="w-full rounded-md border border-gray-800/60 bg-gray-900/30 px-3 py-2 text-xs text-gray-200"
          >
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CalendarMini() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDay + 1
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null
  })

  return (
    <div className="absolute right-0 top-10 origin-top scale-90 rounded-md border border-gray-800/60 bg-gray-950/40 p-3 text-gray-200">
      <div className="mb-2 text-xs text-gray-400">
        {now.toLocaleString(undefined, { month: "long", year: "numeric" })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d} className="text-gray-400">
            {d}
          </div>
        ))}
        {cells.map((d, idx) => (
          <div
            key={idx}
            className={`h-6 w-6 grid place-items-center rounded ${
              d ? "bg-gray-900/40" : "opacity-20"
            }`}
          >
            {d ?? ""}
          </div>
        ))}
      </div>
    </div>
  )
}

function getFeatures() {
  const NoIcon = () => null
  const commonCardClasses = "font-bitcount-prop text-white [&_[data-slot=button]]:hidden pointer-events-none"
  const features = [
    {
      Icon: IconRobot,
      name: "Autonomous AI Agent",
      description: "Agent Monitors your tokens and market to predict volatility",
      href: "#",
      cta: "Learn more",
      className: `col-span-3 lg:col-span-1 ${commonCardClasses}`,
      background: null,
    },
    {
      Icon: NewspaperIcon,
      name: "News on Solana",
      description: "Get notified when something happens on Solana.",
      href: "#",
      cta: "Learn more",
      className: `col-span-3 lg:col-span-2 ${commonCardClasses}`,
      background: null,
    },
    {
      Icon: VaultIcon,
      name: "Smart Vaults",
      description: "Safe Guard your precious Solana for later use by vaulting them",
      href: "#",
      cta: "Learn more",
      className: `col-span-3 lg:col-span-2 ${commonCardClasses}`,
      background: null,
    },
    {
      Icon: TimerIcon,
      name: "Cooldown",
      description: "Timed cooldown on deposit and withdrawals during market volatility",
      href: "#",
      cta: "Learn more",
      className: `col-span-3 lg:col-span-1 ${commonCardClasses}`,
      background: null,
    },
    {
      Icon: IconAuth2fa,
      name: "Web3Auth",
      description: "Authenticate and access your wallet directly from the browser",
      href: "#",
      cta: "Learn more",
      className: `col-span-3 lg:col-span-1 ${commonCardClasses}`,
      background: null,
    },
    {
      Icon: CoinsIcon,
      name: "Stake",
      description: "Stake your Solana directly through the smart vaults ",
      href: "#",
      cta: "Learn more",
      className: `col-span-3 lg:col-span-2 ${commonCardClasses}`,
      background: null,
    },
  ] as const

  return features
}
