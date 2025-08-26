"use client";
import React, { useEffect, useState } from "react";
import { Sidebar, SidebarBody } from "./sidebarcomponents";
import {
  IconLayoutDashboard,
  IconLock,
  IconHistory,
  IconSettings,
  IconHelpCircle,
  IconPlus,
  IconEye,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { useWeb3Auth, useSwitchChain } from "@web3auth/modal/react";
import { useSolanaAuth } from "@/providers/SolanaAuthProvider";
import VaultCreateModal from "@/components/VaultCreateModal";

export function SidebarDemo({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [vaultsMenuOpen, setVaultsMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [oauthName, setOauthName] = useState<string | null>(null);
  const [showCreateVaultModal, setShowCreateVaultModal] = useState(false);
  const router = useRouter();
  const { switchChain } = useSwitchChain();
  const web3authApi = useWeb3Auth() as unknown as { web3auth?: { provider?: any; showWallet?: () => void } };
  const {
    address: solAddress,
    balanceSOL,
    isConnecting: connectLoading,
    isDisconnecting: disconnectLoading,
    login,
    logout,
    userInfo,
  } = useSolanaAuth();

  useEffect(() => {
    const nameFromUserInfo = (ui: any | null | undefined): string | null => {
      if (!ui) return null;
      if (ui.name && typeof ui.name === "string" && ui.name.trim().length > 0) return ui.name.trim();
      if (ui.email && typeof ui.email === "string" && ui.email.includes("@")) {
        return ui.email.split("@")[0];
      }
      return null;
    };
 
    const next = nameFromUserInfo(userInfo);
    if (next) setOauthName(next);
  }, [userInfo]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Solana auth data is provided via useSolanaAuth

  if (!mounted) return null;

  const links = [
    {
      label: "Summary",
      href: "/dashboard",
      icon: <IconLayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Vaults",
      href: "/dashboard/vaults",
      icon: <IconLock className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "History",
      href: "/dashboard/history",
      icon: <IconHistory className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Help",
      href: "/dashboard/help",
      icon: <IconHelpCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    }
  ];

  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-gray-900 dark:bg-neutral-900 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}  style={ { fontFamily:  '"Bitcount Prop Single"' } }>
              Auri
            </motion.span>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => {
                if (link.label === "Vaults") {
                  return (
                    <div
                      key={idx}
                      className="relative"
                      onMouseEnter={() => setVaultsMenuOpen(true)}
                      onMouseLeave={() => setVaultsMenuOpen(false)}
                    >
                      <button
                        onClick={() => router.push(link.href)}
                        className="flex items-center justify-start gap-2 group/sidebar py-2 relative w-full"
                      >
                        <div className="z-10 flex items-center justify-start gap-2">
                          {link.icon}
                          <motion.span
                            animate={{
                              display: open ? "inline-block" : "none",
                              opacity: open ? 1 : 0,
                            }}
                            className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 font-mono"
                          >
                            {link.label}
                          </motion.span>
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {vaultsMenuOpen && open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="pl-7 pt-1 flex flex-col gap-1 overflow-hidden"
                          >
                            <button
                              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60 flex items-center gap-2"
                              onClick={() => {
                                setVaultsMenuOpen(false);
                                setShowCreateVaultModal(true);
                              }}
                            >
                              <IconPlus className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                              <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>Create a vault</span>
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60 flex items-center gap-2"
                              onClick={() => router.push("/dashboard/vaults")}
                            >
                              <IconEye className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                              <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>View Vault</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                  <button
                    key={idx}
                    onClick={() => router.push(link.href)}
                    className="flex items-center justify-start gap-2 group/sidebar py-2 relative"
                  >
                    
                    <div className="z-10 flex items-center justify-start gap-2">
                      {link.icon}
                      <motion.span
                        animate={{
                          display: open ? "inline-block" : "none",
                          opacity: open ? 1 : 0,
                        }}
                        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 font-mono"
                      >
                        {link.label}
                      </motion.span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mt-8 flex flex-col gap-4">
              {
                <div className="relative flex items-center gap-3">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    disabled={connectLoading || disconnectLoading}
                    className="group flex items-center gap-2"
                    title={solAddress ? "Wallet" : "Connect"}
                  >
                    <Avatar className="size-8">
                      <AvatarImage
                        src={
                          !avatarError && (userInfo as any)?.profileImage
                            ? (userInfo as any).profileImage
                            : solAddress
                              ? `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(solAddress)}`
                              : undefined
                        }
                        alt="wallet avatar"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                      />
                      <AvatarFallback>
                        {solAddress ? solAddress.slice(0, 2).toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <motion.span
                      animate={{
                        display: open ? "inline-block" : "none",
                        opacity: open ? 1 : 0,
                      }}
                      className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 font-mono text-neutral-600 dark:text-neutral-300 pl-2"
                      style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
                    >
                      {connectLoading || disconnectLoading
                        ? "Processing..."
                         : userInfo?.name || userInfo?.email}
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 6 }}
                        transition={{ type: "spring", stiffness: 480, damping: 28, mass: 0.7 }}
                        className="absolute right-0 bottom-full mb-2 w-64 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md shadow-xl ring-1 ring-black/5 z-50 font-jetbrains-mono"
                        style={{ transformOrigin: "bottom right" }}
                      >
                        <div className="relative">
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300/60 dark:via-neutral-600/60 to-transparent" />
                        </div>
                        <div className="py-2 text-sm">
                          {solAddress && (
                            <div className="px-3 pb-2 border-b border-neutral-200/70 dark:border-neutral-700/60 text-xs space-y-1">
                              <div className="text-neutral-700 dark:text-neutral-200">{`${solAddress.slice(0, 6)}...${solAddress.slice(-4)}`}</div>
                              <div className="text-neutral-500 dark:text-neutral-400">Chain: Solana Devnet</div>
                              <div className="text-neutral-500 dark:text-neutral-400">Balance: {balanceSOL != null ? `${balanceSOL.toFixed(4)} SOL` : "0 SOL"}</div>
                            </div>
                          )}
                          {solAddress ? (
                            <>
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-neutral-100/70 dark:hover:bg-neutral-700/70 transition-colors rounded-md"
                                onClick={() => {
                                  try {
                                    console.log("[Sidebar] Open Wallet clicked");
                                    web3authApi.web3auth?.showWallet?.();
                                  } catch (err) {
                                    console.log("[Sidebar] showWallet error", err);
                                  }
                                }}
                              >
                                Open Wallet
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-neutral-100/70 dark:hover:bg-neutral-700/70 transition-colors rounded-md"
                                onClick={() => {
                                  if (solAddress) navigator.clipboard?.writeText(solAddress);
                                }}
                              >
                                Copy Address
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-neutral-100/70 dark:hover:bg-neutral-700/70 transition-colors rounded-md text-red-600"
                                onClick={async () => {
                                  setMenuOpen(false);
                                  try {
                                    await logout();
                                  } finally {
                                    router.push("/");
                                  }
                                }}
                                disabled={disconnectLoading}
                              >
                                Log Out
                              </button>
                            </>
                          ) : (
                            <button
                              className="w-full text-left px-3 py-2 hover:bg-neutral-100/70 dark:hover:bg-neutral-700/70 transition-colors rounded-md"
                              onClick={async () => {
                                setMenuOpen(false);
                                try {
                                  console.log("[Sidebar] Login clicked — switching chain and logging in");
                                  await login();
                                } catch (err) {
                                  console.log("[Sidebar] Login error", err);
                                }
                              }}
                              disabled={connectLoading}
                            >
                              Login
                            </button>
                          )}
                          {!solAddress && (
                            <button
                              className="w-full text-left px-3 py-2 hover:bg-neutral-100/70 dark:hover:bg-neutral-700/70 transition-colors rounded-md"
                              onClick={() => {
                                try {
                                  console.log("[Sidebar] Open Wallet clicked (pre-login)");
                                  web3authApi.web3auth?.showWallet?.();
                                } catch (err) {
                                  console.log("[Sidebar] showWallet error", err);
                                }
                              }}
                            >
                              Open Wallet
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              }
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex-1">
        {children}
      </div>
      {showCreateVaultModal && (
        <VaultCreateModal
          open={showCreateVaultModal}
          onClose={() => setShowCreateVaultModal(false)}
          onCreate={(v) => {
            console.log("[VaultCreateModal] create", v);
          }}
        />
      )}
    </div>
  );
}

const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />

    </Link>
  );
};
