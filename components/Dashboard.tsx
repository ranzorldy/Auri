"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";



interface DashboardProps {
  activeTab: "ask" | "quiz" | "generate" | "pdf" | null;
  setActiveTab: (tab: "ask" | "quiz" | "generate" | "pdf" | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab, setActiveTab }) => {
  const [loading, setLoading] = useState<boolean>(true);
 

  return (
    <div className="flex justify-center items-center w-full h-full bg-white border-neutral-200 dark:bg-neutral-950">
      <div className="p-6 md:p-1 rounded-lg w-full max-w-4xl">
        
          <div className="space-y-4">
            <div className="h-20 rounded-lg bg-gray-100 dark:bg-neutral-700 animate-pulse" />
            <div className="h-20 rounded-lg bg-gray-100 dark:bg-neutral-700 animate-pulse" />
            <div className="h-20 rounded-lg bg-gray-100 dark:bg-neutral-700 animate-pulse" />
          </div>
     
          
      </div>
    </div>
  );
};
