"use client";

import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { type IWeb3AuthState, WEB3AUTH_NETWORK } from "@web3auth/modal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { CHAIN_NAMESPACES } from "@web3auth/base";

const clientId = "BCAG_73unTMnXzO4ssrUiseKimqXaS8JGBfAw9kTtyXyTCcZg5InCvKnX0Jtf7IANVYS5yaHzAY5Gpy8XTIh0Bs"; // get from https://dashboard.web3auth.io

const queryClient = new QueryClient();

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    ssr: true,
  },
};

function Provider({ children, web3authInitialState }: { children: React.ReactNode; web3authInitialState: IWeb3AuthState | undefined }) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}

export default Provider;
export { Provider };


