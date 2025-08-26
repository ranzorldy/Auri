"use client";

import { useEffect } from "react";
import { useSwitchChain } from "@web3auth/modal/react";

export default function ChainInitializer() {
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    // With minimal config, default chain comes from wallet; don't force-switch here
  }, [switchChain]);

  return null;
}


