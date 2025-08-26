"use client";
import { SidebarDemo } from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import NewsSidebar from "@/components/NewsSidebar";
import PageLoader from "@/components/PageLoader";
import { useSolanaAuth } from "@/providers/SolanaAuthProvider";
import React from "react";
import { AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { address } = useSolanaAuth();
  const loading = !address; // show loader until wallet address is available
  return (
    <SidebarDemo>
      <div className="flex w-full h-full bg-white dark:bg-neutral-950">
        <div className="flex-1 min-h-0 flex flex-col relative">
          <div className="px-4 pt-3 md:px-6 md:pt-4">
            <Breadcrumbs />
          </div>
          <div className="flex-1 min-h-0">
            {children}
          </div>
          <AnimatePresence>{loading && <PageLoader />}</AnimatePresence>
        </div>
        <NewsSidebar />
      </div>
    </SidebarDemo>
  );
}
