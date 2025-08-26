"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconChevronRight, IconHome, IconActivity, IconAlertTriangle, IconShieldCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useSolanaAuth } from "@/providers/SolanaAuthProvider";
import RiskDetailsModal from "@/components/RiskDetailsModal";

const titleMap: Record<string, string> = {
  dashboard: "Dashboard",
  vaults: "Vaults",
  history: "History",
  settings: "Settings",
  help: "Help",
  create: "Create",
};

function humanize(segment: string): string {
  if (titleMap[segment]) return titleMap[segment];
  return segment
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  const dashboardIndex = parts.indexOf("dashboard");
  const scoped = dashboardIndex >= 0 ? parts.slice(dashboardIndex) : parts;

  // Build cumulative hrefs for each crumb
  const crumbs = scoped.map((segment, idx) => {
    const href = "/" + scoped.slice(0, idx + 1).join("/");
    return { label: humanize(segment), href };
  });

  if (crumbs.length === 0) return null;

  const isDashboardRoot = scoped.length === 1 && scoped[0] === "dashboard";

  // Vault state pill + modal
  const { address } = useSolanaAuth();
  const [riskOpen, setRiskOpen] = React.useState(false);
  const [riskPayload, setRiskPayload] = React.useState<any | null>(null);

  React.useEffect(() => {
    try {
      const wa = address || (typeof window !== 'undefined' ? localStorage.getItem('auri.address') : null) || null;
      const raw = wa && typeof window !== 'undefined' ? localStorage.getItem(`risk_cache_payload_${wa}`) : null;
      setRiskPayload(raw ? JSON.parse(raw) : null);
    } catch {
      setRiskPayload(null);
    }
  }, [address, pathname]);

  const isLockdown = Boolean(riskPayload?.lock);
  const hasData = Boolean(riskPayload);
  const stateText = hasData ? (isLockdown ? 'Lockdown' : 'Calm') : 'Analyzing';
  const pillStyles = React.useMemo(() => {
    if (!hasData) {
      return {
        container: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-700 dark:text-yellow-400",
        dot: "bg-yellow-500",
      } as const;
    }
    return isLockdown
      ? {
          container: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
          text: "text-red-700 dark:text-red-400",
          dot: "bg-red-500",
        } as const
      : {
          container: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
          text: "text-green-700 dark:text-green-400",
          dot: "bg-green-500",
        } as const;
  }, [hasData, isLockdown]);

  return (
    <nav aria-label="Breadcrumb" className={cn("w-full relative", className)}>
      <ol className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 justify-between" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
        {/* Home icon */}
        <li className="flex items-center gap-2">
          <Link href="/dashboard" aria-label="Home">
            <IconHome className="h-4 w-4 text-black dark:text-white" />
          </Link>
          {crumbs.length > 1 && <IconChevronRight className="h-4 w-4 text-neutral-400" />}
          {/* Always show Dashboard label */}
          {crumbs.length >= 1 && (
            <>
              {crumbs.length === 1 && <IconChevronRight className="h-4 w-4 text-neutral-400" />}
              <span className="font-normal">Dashboard</span>
              {crumbs.length > 1 && <IconChevronRight className="h-4 w-4 text-neutral-400" />}
            </>
          )}
          {crumbs.slice(1).map((crumb, idx) => {
            const isLast = idx === crumbs.slice(1).length - 1;
            return (
              <span key={crumb.href} className="flex items-center gap-2">
                {isLast ? (
                  <span className="font-normal">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="font-normal hover:underline hover:text-neutral-800 dark:hover:text-neutral-100"
                  >
                    {crumb.label}
                  </Link>
                )}
                {!isLast && <IconChevronRight className="h-4 w-4 text-neutral-400" />}
              </span>
            );
          })}
        </li>

        {/* Right-aligned vault state pill */}
        <li className="ml-auto">
          <button
            onClick={() => setRiskOpen(true)}
            className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border ${pillStyles.container} ${pillStyles.text}`}
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
            title={stateText}
          >
            {stateText === 'Analyzing' ? (
              <IconActivity className="h-3.5 w-3.5" />
            ) : isLockdown ? (
              <IconAlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <IconShieldCheck className="h-3.5 w-3.5" />
            )}
            <span className={`h-1.5 w-1.5 rounded-full ${pillStyles.dot}`} />
            <span>{stateText}</span>
          </button>
        </li>
      </ol>
      {isDashboardRoot && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[14px]  text-neutral-800 dark:text-neutral-200 font-bitcount-prop">
            Welcome to Auri!
          </span>
        </div>
      )}
      <RiskDetailsModal
        open={riskOpen}
        onClose={() => setRiskOpen(false)}
        state={stateText}
        rules={(riskPayload?.results && riskPayload.results[0]?.rules) || []}
        justification={(riskPayload?.results && (riskPayload.results[0]?.gemini?.justification || riskPayload.results[0]?.gemini?.reasoning)) || null}
        birdseye={(riskPayload?.results && riskPayload.results[0]?.birdseye) || null}
        modelResults={(riskPayload?.results && riskPayload.results[0]?.gemini?.results) || null}
      />
    </nav>
  );
}


