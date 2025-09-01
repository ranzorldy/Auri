"use client"

import { Card, CardContent } from "@/components/Card"
import { Play, Wallet, ShieldCheck, Send, Vault, X } from "lucide-react"
import { motion, type MotionValue, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import * as React from "react"
import MountOnView from "@/components/MountOnView"

// Animation variants for container and cards
const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1 },
}

type Step = {
  title: string
  subtitle?: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  videoSrcs?: string[]
  poster?: string
}

type HowItWorksProps = { fullBleed?: boolean; contentScale?: number | MotionValue<number> }

const steps: Step[] = [
  {
    title: "Connect",
    subtitle: "Connect using Web3Auth ",
    description: "Get easily connected to your wallet with Web3Auth, and start using the dapp.",
    icon: Wallet,
    videoSrcs: ["/connect-auri-1756237053649.mp4"],
    poster: "/solana.jpg",
  },
  {
    title: "Create",
    subtitle: "Create a Smart Vault",
    description: "Set a goal and amount, then confirm. Organize funds for saving, staking, or plans.",
    icon: Vault,
    videoSrcs: [
      "/create-vault.mp4",
    ],
    poster: "/solana.jpg",
  },
  {
    title: "Chill",
    subtitle: "Protected by an AI agent",
    description: "Our AI agent monitors mint age, liquidity, and price and takes action to prevent you from FOMO pullout.",
    icon: ShieldCheck,
    videoSrcs: [
      "/Vault-Status.mp4",
    ],
    poster: "/solana.jpg",
  },
]

const StepCard = React.memo(function StepCard({ step, index, isActive, visible, onOpen, onHoverActivate, onVisibleRatio, modalOpen }: { step: Step; index: number; isActive: boolean; visible: boolean; onOpen: (s: Step) => void; onHoverActivate: (idx: number) => void; onVisibleRatio: (idx: number, ratio: number) => void; modalOpen: boolean }) {
  const { title, subtitle, description, icon: Icon } = step
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let rafId: number | null = null
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (rafId) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => onVisibleRatio(index, entry.intersectionRatio))
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    observer.observe(container)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [])

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (modalOpen || !isActive) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }, [modalOpen, isActive])

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative h-full cursor-pointer"
      aria-labelledby={`${title.toLowerCase()}-title`}
      onClick={() => onOpen(step)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(step);
        }
      }}
      tabIndex={0}
    >
      {/* Gradient frame */}
      <div className="relative h-full rounded-3xl bg-gradient-to-br from-emerald-400/35 via-fuchsia-500/35 to-cyan-400/35 p-[1px]">
        <Card className="relative group h-full overflow-hidden rounded-3xl border-white/10 bg-zinc-950/95 backdrop-blur-sm shadow-[0_10px_40px_-20px_rgba(59,130,246,0.35)] transition-shadow group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_-20px_rgba(16,185,129,0.45)]">
          <CardContent className="grid h-full grid-rows-[auto_1fr_auto] gap-4 p-5 md:p-6">
            {/* Title row */}
            <div className="flex items-center gap-3">
              <span className="inline-grid h-9 w-9 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
                <Icon className="h-4.5 w-4.5 text-zinc-200" />
              </span>
              <div>
                <h3 id={`${title.toLowerCase()}-title`} className="text-lg md:text-xl text-white">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="text-xs md:text-sm text-zinc-400">{subtitle}</p>
                ) : null}
              </div>
            </div>

            {/* Themed preview area with fixed height */}
            <motion.div
              ref={containerRef}
              className="relative h-40 md:h-44 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
              onHoverStart={() => onHoverActivate(index)}
              onHoverEnd={() => onHoverActivate(-1)}
            >
              {step.poster ? (
                <>
                  <img
                    alt={step.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={step.poster}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/20">
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-white/90 text-xs ring-1 ring-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M8.75 5.75a.75.75 0 011.13-.65l8 5.25a.75.75 0 010 1.26l-8 5.25a.75.75 0 01-1.13-.65V5.75z" /></svg>
                      Tap to preview
                    </span>
                  </div>
                </>
              ) : (
                <span className="grid h-full w-full place-items-center text-xs text-zinc-500">Preview coming soon</span>
              )}
            </motion.div>

            

            {/* Description */}
            <p className="text-sm md:text-base text-zinc-300">
              {description}
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.article>
  )
})

export default function HowItWorks({ fullBleed = false, contentScale = 1 }: HowItWorksProps) {
  const [selected, setSelected] = React.useState<Step | null>(null)
  const [activeIndex, setActiveIndex] = React.useState<number>(0)
  const visibleRatiosRef = React.useRef<number[]>(steps.map(() => 0))
  const [visibleMap, setVisibleMap] = React.useState<Record<number, boolean>>({})

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const body = document.body
    if (selected) {
      const prev = body.style.overflow
      body.style.overflow = "hidden"
      return () => {
        body.style.overflow = prev
      }
    }
  }, [selected])

  return (
    <div className=" p-2 m-2 rounded-3xl border border-gray-600 min-h-[calc(100vh-1rem)] h-full  bg-black relative overflow-hidden cv-auto contain-paint">
      {/* Background gradient (replaces Silk) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 h-full w-full bg-[radial-gradient(120%_80%_at_50%_55%,rgba(255,255,255,0.06),transparent_70%)]" />
      </div>

      {/* Local Bitcount font import (removed sheen keyframes) */}
       <style>{``}</style>
      {/* Apply Bitcount font to entire section */}
      <section
        aria-labelledby="how-it-works-title"
        className="font-bitcount-prop relative z-10 flex h-full min-h-full flex-col text-white p-2"
      >
        <motion.div
          style={{ scale: contentScale as any, transformOrigin: "50% 50%", willChange: "transform" }}
          className="h-full flex flex-col"
        >
          <div className="flex-1 rounded-2xl">
            <motion.h2
              id="how-it-works-title"
              className="text-center pt-8 md:pt-12 text-3xl md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              How it Works
            </motion.h2>
            <motion.p
              className="mt-3 text-center text-sm md:text-lg text-zinc-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              A simple, secure flow to get started fast.
            </motion.p>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="relative mt-10 md:mt-12 flex-1"
            >
              <div className="grid min-h-0 grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 mx-auto max-w-6xl">
                {steps.map((step, idx) => (
                  <StepCard
                    key={idx}
                    step={step}
                    index={idx}
                    isActive={activeIndex === idx}
                    onOpen={(s) => setSelected(s)}
                    onHoverActivate={(i) => {
                      if (i >= 0) setActiveIndex(i)
                    }}
                    onVisibleRatio={(i, ratio) => {
                      visibleRatiosRef.current[i] = ratio
                      setVisibleMap((m) => ({ ...m, [i]: ratio > 0 }));
                      if (!selected) {
                        let best = 0
                        let bestIdx = 0
                        for (let j = 0; j < visibleRatiosRef.current.length; j++) {
                          if (visibleRatiosRef.current[j] > best) {
                            best = visibleRatiosRef.current[j]
                            bestIdx = j
                          }
                        }
                        setActiveIndex(bestIdx)
                      }
                    }}
                    modalOpen={!!selected}
                    visible={!!visibleMap[idx]}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="w-[96vw] max-w-5xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl">
                <button
                  aria-label="Close"
                  className="absolute right-3 top-3 inline-grid h-8 w-8 place-items-center rounded-md bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                  onClick={() => setSelected(null)}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-grid h-9 w-9 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
                      {(() => {
                        const Icon = selected.icon
                        return <Icon className="h-4.5 w-4.5 text-zinc-200" />
                      })()}
                    </span>
                    <div>
                      <h3 className="text-lg md:text-xl text-white font-bitcount-prop">{selected.title}</h3>
                      {selected.subtitle ? (
                        <p className="text-xs md:text-sm text-zinc-400 font-jetbrains-mono">{selected.subtitle}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-white/10 aspect-video bg-gradient-to-br from-zinc-900 to-zinc-950">
                    {selected.videoSrcs?.length ? (
                      <ModalVideo sources={selected.videoSrcs} poster={selected.poster} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-zinc-500">No preview available</div>
                    )}
                  </div>

                  <p className="mt-3 text-sm md:text-base text-zinc-300 font-jetbrains-mono">{selected.description}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModalVideo({ sources, poster }: { sources: string[]; poster?: string }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const playSafe = () => v.play().catch(() => {})
    playSafe()

    const onVisibility = () => {
      if (document.hidden) {
        v.pause()
      } else {
        playSafe()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      v.pause()
    }
  }, [])

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      playsInline
      muted
      loop
      autoPlay
      preload="metadata"
      controls={false}
      controlsList="nodownload nofullscreen noplaybackrate"
      disablePictureInPicture
      poster={poster}
    >
      {sources.map((src) => (
        <source key={src} src={src} type="video/mp4" />
      ))}
    </video>
  )
}
