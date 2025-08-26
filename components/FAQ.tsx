"use client"

import { motion, AnimatePresence } from "motion/react"
import { ChevronDown } from "lucide-react"
import { MagicCard } from "@/components/MagicCard"
import { useState } from "react"

export default function FAQ() {
  const [hovered, setHovered] = useState<number | null>(null)
  const faqs = [
    {
      q: "What are Smart Vaults on Solana?",
      a: "Smart Vaults are non‑custodial accounts you create to segment funds for goals like saving or staking. Funds stay in your wallet; the vault just enforces rules such as goals, staking preferences, or cooldowns.",
    },
    {
      q: "How does the 24/7 AI agent protect me?",
      a: "Our agent continuously checks mint age, liquidity depth, and short‑term price action. If risk rises, it can recommend or trigger a temporary lockdown that blocks impulsive buys from the vaults you select.",
    },
    {
      q: "What is Lockdown mode?",
      a: "Lockdown is a temporary restriction that prevents new buys or withdrawals from tagged vaults during volatile periods. You can configure which vaults are affected and how long lockdown lasts.",
    },
    {
      q: "Do I keep custody of my keys?",
      a: "Yes. Authentication is via Web3Auth or your wallet, and private keys never leave your control. We do not have custody of funds.",
    },
    {
      q: "Can I stake SOL from a vault?",
      a: "Yes. You can allocate a portion of a vault to staking and track rewards inside the dashboard. Unstaking obeys your configured cooldown if enabled.",
    },
    {
      q: "Which networks are supported?",
      a: "Solana is supported today. Devnet is used for testing in this build; mainnet support can be enabled with the same flows.",
    },
    {
      q: "Is pricing and news live?",
      a: "Yes. We fetch SOL pricing periodically and surface a curated Solana news rail so you can react to ecosystem events quickly.",
    },
  ] as const

  return (
    <div className="m-2 rounded-3xl bg-black relative overflow-hidden text-white">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full h-screen max-w-6xl mx-auto flex items-center justify-center px-6 md:px-10 transform-gpu"
      >
          <MagicCard
            className=" bg-transparent rounded-4xl"
          gradientSize={220}
          gradientFrom="#4b5563"
          gradientTo="#0b0f19"
          gradientOpacity={0.35}
          baseRadius="1400px 900px"
          baseFrom="#1f2937" 
          baseMid="#0b0f19"
          baseTo="#000000"
        >
            {/* corner add-ons removed as requested */}

          {/* Foreground content - expanded two-column layout without boxes */}
          <div className="relative z-10 px-6 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 font-bitcount-prop">
            {/* Left: Big title and description */}
            <div className="lg:col-span-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80">
                Need help?
              </span>
              <h2 className="mt-4 font-bitcount-prop text-4xl md:text-6xl bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 max-w-xl text-sm md:text-base text-white/75 font-jetbrains-mono">
                Quick answers about Smart Vaults, AI protection, staking, and custody on Solana.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-white/80">
                {['Fast setup', 'Live pricing', 'Secure vaults', 'Responsive UI'].map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-bitcount-prop">{t}</span>
                ))}
              </div>
            </div>

            {/* Right: Masonry-like FAQ list (hover to reveal answers) */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 content-start overflow-visible">
              {faqs.map((item, i) => (
                <motion.div
                  key={item.q}
                  onHoverStart={() => setHovered(i)}
                  onHoverEnd={() => setHovered(prev => (prev === i ? null : prev))}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  transition={{ duration: 0.2 }}
                  className={"group relative rounded-2xl border border-white/10 bg-white/5 transition-colors duration-300 " + (i % 3 === 0 ? "md:col-span-2" : "")}
                >
                  <div className="flex w-full select-none items-center justify-between gap-3 cursor-pointer px-4 md:px-5 py-3 md:py-4 font-bitcount-prop">
                    <span className="text-base md:text-lg text-white/95 font-bitcount-prop">{item.q}</span>
                    <ChevronDown className="size-5 shrink-0 text-white/70 transition-transform duration-300 group-hover:rotate-180" />
                  </div>

                  <AnimatePresence>
                    {hovered === i && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.6 }}
                        className="absolute left-3 right-3 top-[calc(100%-8px)] z-10 rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-4 md:p-5 shadow-xl shadow-black/30"
                      >
                        <p className="text-sm md:text-base text-white/85 leading-relaxed font-jetbrains-mono">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {/* Footer moved outside the card */}
            </div>
          </div>
        </MagicCard>

      </motion.div>
    </div>
  )
}


