"use client";

import React from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const CreateVaultPage = () => {
  return (
    <div className="flex w-full h-full bg-white border-neutral-200 dark:bg-neutral-950">
      <div className="flex-1 flex p-0 md:p-4">
        <div className="flex flex-col w-full ">
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-neutral-200 dark:border-neutral-800 py-3 md:-ml-4 md:-mr-4">
            <div className="px-4">
              <h1
                className="text-2xl"
                style={{ fontFamily: '"Bitcount Prop Single", sans-serif' }}
              >
                Create a Vault
              </h1>
              <p
                className="text-sm text-neutral-600 dark:text-neutral-400"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                Placeholder page for creating a new vault.
              </p>
            </div>
          </div>

          <div className="p-4">
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 text-sm text-neutral-700 dark:text-neutral-300" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              Form coming soon.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVaultPage;


