import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "@/providers/Web3AuthProvider";
import { headers } from "next/headers";
import { cookieToWeb3AuthState } from "@web3auth/modal";
import ChainInitializer from "@/providers/ChainInitializer";
import { SolanaAuthProvider } from "@/providers/SolanaAuthProvider";
import { Toaster } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auri",
  description: "The Dapp to protect you from FOMO",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const web3authInitialState = cookieToWeb3AuthState(headersList.get("cookie"));

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased`}>
        <Provider web3authInitialState={web3authInitialState}>
          <ChainInitializer />
          <SolanaAuthProvider>
            {children}
            <Toaster />
          </SolanaAuthProvider>
        </Provider>
      </body>
    </html>
  );
}
