"use client"

import { motion, type MotionValue, useTransform } from "motion/react"

type MissionProps = {
  progress: MotionValue<number>
}

export default function Mission({ progress }: MissionProps) {
  const hOpacity = useTransform(progress, [0, 0.25], [0, 1])
  const hY = useTransform(progress, [0, 0.25], [24, 0])
  const hScale = useTransform(progress, [0, 0.25], [0.8, 1.2])

  const p1Opacity = useTransform(progress, [0.25, 0.45], [0, 1])
  const p1Y = useTransform(progress, [0.25, 0.45], [24, 0])
  const p1Scale = useTransform(progress, [0.25, 0.45], [0.85, 1.1])

  const p2Opacity = useTransform(progress, [0.45, 0.65], [0, 1])
  const p2Y = useTransform(progress, [0.45, 0.65], [24, 0])
  const p2Scale = useTransform(progress, [0.45, 0.65], [0.85, 1.1])

  const p3Opacity = useTransform(progress, [0.65, 0.85], [0, 1])
  const p3Y = useTransform(progress, [0.65, 0.85], [24, 0])
  const p3Scale = useTransform(progress, [0.65, 0.85], [0.85, 1.1])

  return (
    <div className="m-2 rounded-3xl min-h-[calc(100vh-1rem)] bg-black relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@100..900&display=swap');
        .font-bitcount-prop { font-family: 'Bitcount Prop Single', sans-serif; }
      `}</style>
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6 md:px-12 py-52">
        <div className="w-full max-w-6xl mx-auto text-center text-white font-bitcount-prop space-y-6 md:space-y-8">
          

          <motion.p
            className="text-lg md:text-5xl text-white/80"
            style={{ opacity: p1Opacity, y: p1Y, scale: p1Scale, transformOrigin: "50% 50%" }}
          >
            Auri helps you resist market FOMO.
          </motion.p>

          <motion.p
            className="text-lg md:text-5xl text-white/70"
            style={{ opacity: p2Opacity, y: p2Y, scale: p2Scale, transformOrigin: "50% 50%" }}
          >
            A 24/7 AI agent watches your wallet 
          </motion.p>

          <motion.p
            className="text-lg md:text-5xl text-white/60"
            style={{ opacity: p3Opacity, y: p3Y, scale: p3Scale, transformOrigin: "50% 50%" }}
          >
            If risk flags trigger, vaults auto‑lock until a timeout—slowing impulsive buys so you decide with intent.
          </motion.p>
        </div>
      </div>
    </div>
  )
}
