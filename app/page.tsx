"use client";
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Mission from '@/components/Mission';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import { motion, useScroll, useSpring, useTransform, useMotionTemplate } from 'motion/react';
import { useRef } from 'react';
import LenisProvider from '@/providers/LenisProvider';

export default function Home() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Spring-smoothed progress for a "springy" feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 20,
    mass: 0.35,
  });

  // Hero content animations
  const heroContentOpacity = useTransform(smoothProgress, [0, 0.6, 1], [1, 0.9, 0.8]);
  const heroContentScale = useTransform(smoothProgress, [0, 0.6, 1], [1, 0.9, 0.8]);

  // Mission slide/scale (enters after Hero)
  const missionStart = 0.12;
  const missionEnd = 0.28;
  const missionY = useTransform(smoothProgress, [missionStart, missionEnd], ["100%", "0%"]);
  const missionScale = useTransform(smoothProgress, [missionStart, (missionStart + missionEnd) / 2, missionEnd], [0.95, 1.02, 1]);
  const missionProgress = useTransform(smoothProgress, [missionStart, missionEnd], [0, 1]);

  // Blur out previous sections as new ones enter
  const heroBlurPx = useTransform(smoothProgress, [missionStart, missionEnd], [0, 8]);
  const heroFilter = useMotionTemplate`blur(${heroBlurPx}px)`;

  // Features slide (after Mission, before HIW)
  const featStart = 0.28;
  const featEnd = 0.5;
  const featuresY = useTransform(smoothProgress, [featStart, featEnd], ["100%", "0%"]);
  const featuresScale = useTransform(smoothProgress, [featStart, (featStart + featEnd) / 2, featEnd], [0.95, 1.02, 1]);
  const missionBlurPx = useTransform(smoothProgress, [featStart, featEnd], [0, 3]);
  const missionFilter = useMotionTemplate`blur(${missionBlurPx}px)`;

  // HowItWorks slide/content scale (last)
  const hiwStart = 0.48;
  const hiwEnd = 0.72;
  const howItWorksY = useTransform(smoothProgress, [hiwStart, hiwEnd], ["120%", "0%"]);
  const howItWorksContentScale = useTransform(smoothProgress, [hiwStart, (hiwStart + hiwEnd) / 2, hiwEnd], [0.9, 1.02, 1]);
  const howItWorksScale = useTransform(smoothProgress, [hiwStart, (hiwStart + hiwEnd) / 2, hiwEnd], [0.95, 1.02, 1]);
  // Delay blurring Features until HIW is more present
  const featuresBlurPx = useTransform(smoothProgress, [hiwStart + 0.08, hiwEnd], [0, 8]);
  const featuresFilter = useMotionTemplate`blur(${featuresBlurPx}px)`;

  // FAQ appears after How It Works
  const faqStart = 0.6;
  const faqEnd = 0.9;
  const faqY = useTransform(smoothProgress, [faqStart, faqEnd], ["170%", "0%"]);
  const faqOpacity = useTransform(smoothProgress, [faqStart, faqStart + 0.04, faqEnd], [0, 1, 1]);
  const faqScale = useTransform(smoothProgress, [faqStart, (faqStart + faqEnd) / 2, faqEnd], [0.95, 1.02, 1]);
  // Delay blurring HIW until FAQ is more present
  const hiwBlurPx = useTransform(smoothProgress, [faqStart + 0.08, faqEnd], [0, 2]);
  const hiwFilter = useMotionTemplate`blur(${hiwBlurPx}px)`;
  const faqBlurPx = useTransform(smoothProgress, [faqEnd , 1], [0, 1]);
  const faqFilter = useMotionTemplate`blur(${faqBlurPx}px)`;

  // Footer entrance is handled on view using whileInView below

  return (
    <LenisProvider>
    <main className="bg-black">
      {/* Parallax container controls scroll range */}
      <section ref={containerRef} className="relative h-[1200vh]">
        {/* Single sticky viewport so all sections stay pinned */}
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Layer 1: Hero - animated center content only */}
          <motion.div style={{ filter: heroFilter, willChange: 'transform, filter' }} className="absolute inset-0 z-10">
            <Hero contentScale={heroContentScale} contentOpacity={heroContentOpacity} />
          </motion.div>

          {/* Layer 2: Mission */}
          <motion.div style={{ y: missionY, scale: missionScale, filter: missionFilter, willChange: 'transform, filter' }} className="absolute inset-0 z-30">
            <Mission progress={missionProgress} />
          </motion.div>

          {/* Layer 3: Features */}
          <motion.div style={{ y: featuresY, scale: featuresScale, filter: featuresFilter, willChange: 'transform, filter' }} className="absolute inset-0 z-40">
            <Features />
          </motion.div>

          {/* Layer 4: HowItWorks - last; only its foreground content scales */}
          <motion.div style={{ y: howItWorksY, scale: howItWorksScale, filter: hiwFilter, willChange: 'transform, filter' }} className="absolute inset-0 z-50">
            <HowItWorks fullBleed contentScale={howItWorksContentScale} />
          </motion.div>

          {/* Layer 5: FAQ - under How It Works */}
          <motion.div style={{ y: faqY, opacity: faqOpacity, scale: faqScale, filter: faqFilter, willChange: 'transform, opacity, filter' }} className="absolute inset-0 z-60">
            <FAQ />
          </motion.div>
        </div>
      </section>

      {/* Animated footer at the bottom */}
      <motion.div
        initial={{ opacity: 0, y: 64 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Footer />
      </motion.div>
    </main>
    </LenisProvider>
  );
}

 
