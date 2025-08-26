"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import Dither from "./backgrounds/dither"
 
import { AuroraText } from "./Aurora"
import { RainbowButton } from "./Rainbow"
import { motion, type MotionValue } from 'motion/react'
import { useSolanaAuth } from "@/providers/SolanaAuthProvider"
import { useWeb3Auth, useWeb3AuthConnect } from "@web3auth/modal/react"
import { useRouter } from "next/navigation"

type HeroProps = {
  contentScale?: number | MotionValue<number>
  contentOpacity?: number | MotionValue<number>
}

export default function HeroSection({ contentScale = 1, contentOpacity = 1 }: HeroProps) {
  const { address, isConnecting, login, userInfo, connection } = useSolanaAuth();
  const web3authApi = useWeb3Auth() as unknown as { web3auth?: { showWallet?: () => void } };
  const { connect, loading: modalConnecting } = useWeb3AuthConnect();
  const router = useRouter();
  const [latestBlockHeight, setLatestBlockHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;
    const fetchHeight = async () => {
      try {
        const height = await connection.getBlockHeight();
        if (!cancelled) setLatestBlockHeight(height);
      } catch {}
    };
    fetchHeight();
    const interval = setInterval(fetchHeight, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [connection]);
  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@100..900&display=swap');
          .font-bitcount-prop {
            font-family: 'Bitcount Prop Single', sans-serif;
          }
        `}
      </style>
      <div className="min-h-screen bg-black font-bitcount-prop">
        {/* Border container acting as big card with spacing from viewport edges */}
        <div className="border border-gray-600 rounded-3xl bg-black m-2 min-h-[calc(100vh-1rem)] relative overflow-hidden">
          {/* Background animation */}
          <div className="absolute inset-0">
            <Dither />
          </div>
          {/* Masked blur overlay (behind content, above background) */}
          <div
            className="pointer-events-none absolute inset-0 z-10 backdrop-blur-3xl"
            style={{
              WebkitMaskImage:
                "radial-gradient(120% 80% at 50% 55%, black 55%, transparent 100%)",
              maskImage:
                "radial-gradient(120% 80% at 50% 55%, black 55%, transparent 100%)",
            }}
          />
          {/* Top-left brand header */}
          <div className="absolute top-6 left-6 z-20">
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-white">Auri.</h1>
          </div>
          {/* Center connect button between brand and nav */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
            <RainbowButton
              size="sm"
              className="text-black"
              onClick={async () => {
                try {
                  if (address) {
                    web3authApi.web3auth?.showWallet?.();
                  } else {
                    // Prefer direct modal connect for reliability
                    try {
                      await connect();
                    } catch (e) {
                      // Fallback to provider wrapper
                      await login();
                    }
                  }
                } catch (err) {
                  // no-op
                }
              }}
            >
              {isConnecting || modalConnecting ? "Connecting..." : userInfo?.name ? `Welcome , ${userInfo?.name} !` : "Connect"}
            </RainbowButton>
          </div>
     
          {/* Constrain the inner content and add padding from the border */}
          <div className="relative z-20 py-2 px-2">
            {/* Navigation */}
            <nav className="flex justify-end gap-6 mt-2">
              <Link
                href="#"
                className="text-white text-lg md:text-xl font-light hover:text-gray-300 transition-colors"
              >
                Home
              </Link>
              <Link
                href="#"
                className="text-white text-lg md:text-xl font-light hover:text-gray-300 transition-colors"
              >
                About
              </Link>
              <Link
                href="#"
                className="text-white text-lg md:text-xl font-light hover:text-gray-300 transition-colors"
              >
                Github
              </Link>
            </nav>
          </div>

          {/* Centered content scaled/faded independently (background unaffected) */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center will-change-transform">
            <motion.div style={{ scale: contentScale as any, opacity: contentOpacity as any, willChange: "transform, opacity" }} className="pointer-events-auto text-center px-6">
              
              <motion.h2
                className="text-3xl md:text-5xl lg:text-6xl mb-6"
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <AuroraText colors={["#FFFFFF", "#9CA3AF"]}>
                  Secure yourself from yourself.
                </AuroraText>
              </motion.h2>
              <motion.p
                className="max-w-2xl mx-auto text-white/70 text-sm md:text-base mb-6"
                initial={{ opacity: 0, y: 56 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                Smart vault Dapp monitored by AI agents 24/7 built on Solana and powered by Web3Auth.
              </motion.p>
              <div className="flex justify-center">
                <RainbowButton  size="lg" className="text-black" onClick={() => router.push('/dashboard')}>
                  Test on Devnet
                </RainbowButton>
              </div>
              {/* Metrics */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-medium">
                    
                  </div>
                 
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-medium">
                     Coming soon
                  </div>
                  <div className=" md:text-xs uppercase tracking-wider">Users, TVL, Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-medium">
                    
                  </div>
                  
                </div>
              </div>
              {/* Powered by strip */}
              <div className="mt-10 text-white/60 text-xs uppercase tracking-wider">Powered by</div>
              <div className="mt-3 flex items-center justify-center gap-6 opacity-90">
                <span className="inline-flex items-center gap-2">
                  <img src="/next.svg" alt="Next.js" className="h-5 w-auto grayscale invert" />
                  
                </span>
                <img src="/solanaLogo.svg" alt="Solana" className="h-6 w-auto" />
                <img src="/web-3-auth-logo-dark.svg" alt="Web3Auth" className="h-10 w-auto rounded-sm" />
              </div>
            </motion.div>
          </div>
          {/* Scroll cue */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 text-white/60 text-[10px] md:text-xs tracking-wider">
            <span>Scroll</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-bounce">
              <path d="M12 5v14m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Corner UI chips instead of glows */}
          <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-white/80">
            <span className="text-[10px] md:text-xs uppercase tracking-wider">Latest block</span>
            <span className="text-[10px] md:text-xs text-white">#{latestBlockHeight !== null ? latestBlockHeight.toLocaleString() : "—"}</span>
          </div>
          <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] md:text-xs uppercase tracking-wider">Status</span>
            <span className="text-[10px] md:text-xs text-white">Operational</span>
          </div>
        </div>
      </div>
    </>
  )
}
