"use client"

import { motion, type MotionValue, useTransform } from "motion/react"
import { AuroraText } from "./Aurora"

type MissionProps = {
  progress: MotionValue<number>
}

export default function Mission({ progress }: MissionProps) {
  const p1Opacity = useTransform(progress, [0.25, 0.45], [0, 1])
  const p1Y = useTransform(progress, [0.25, 0.45], [24, 0])
  const p1Scale = useTransform(progress, [0.25, 0.45], [0.85, 1.1])

  return (
    <div className="m-2 rounded-3xl min-h-[calc(100vh-1rem)] bg-black relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@100..900&display=swap');
        .font-bitcount-prop { font-family: 'Bitcount Prop Single', sans-serif; }
      `}</style>
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6 md:px-12 py-52">
        <div className="w-full max-w-4xl mx-auto text-center text-white font-bitcount-prop space-y-6 md:space-y-8">
          

          <motion.p
            className="text-3xl md:text-6xl text-white/50"
            style={{ opacity: p1Opacity, y: p1Y, scale: p1Scale, transformOrigin: "50% 50%" }}
          >
            Auri helps you resist market <AuroraText colors={["#FFFFFF", "#D1D5DB", "#9CA3AF"]}>FOMO</AuroraText>. A <AuroraText colors={["#FFFFFF", "#D1D5DB", "#9CA3AF"]}>24/7 AI agent</AuroraText> watches your <AuroraText colors={["#FFFFFF", "#D1D5DB", "#9CA3AF"]}>wallet</AuroraText>. If <AuroraText colors={["#FFFFFF", "#D1D5DB", "#9CA3AF"]}>risk flags</AuroraText> trigger, vaults <AuroraText colors={["#FFFFFF", "#D1D5DB", "#9CA3AF"]}>auto‑lock</AuroraText> until a timeout—slowing <AuroraText colors={["#FFFFFF", "#D1D5DB", "#9CA3AF"]}>impulsive buys</AuroraText> so you decide with <AuroraText colors={["#FFFFFF", "#D1D5DB", "#9CA3AF"]}>intent</AuroraText>.
          </motion.p>
        </div>
      </div>
    </div>
  )
}
