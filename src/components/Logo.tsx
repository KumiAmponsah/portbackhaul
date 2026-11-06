import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Light mark for the deep-green sidebar, dark mark for light surfaces. */
  tone?: "light" | "dark";
  showTagline?: boolean;
}

export function Logo({ className, tone = "dark", showTagline = true }: LogoProps) {
  const title = tone === "light" ? "text-white" : "text-secondary";
  const tagline = tone === "light" ? "text-white/60" : "text-muted-foreground";
  const mark = tone === "light" ? "text-white" : "text-primary";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className={cn("h-7 w-7 shrink-0", mark)} aria-hidden>
        <path d="M3 21h26l-2.6 6H5.6L3 21Z" fill="currentColor" opacity="0.9" />
        <path d="M7 19V9.5L16 5l9 4.5V19H7Z" fill="currentColor" opacity="0.35" />
        <path d="M11 19v-6h10v6" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <circle cx="16" cy="9.5" r="1.8" fill="currentColor" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={cn("text-[17px] font-extrabold tracking-tight", title)}>PortBackhaul</span>
        {showTagline ? (
          <span className={cn("mt-1 text-[9px] font-bold uppercase tracking-[0.18em]", tagline)}>
            Move Ghana Forward
          </span>
        ) : null}
      </span>
    </span>
  );
}
