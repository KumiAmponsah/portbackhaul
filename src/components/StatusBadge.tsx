import { cn } from "@/lib/utils";
import { statusLabel, statusTone, type StatusTone } from "@/lib/status";

const TONE_CLASS: Record<StatusTone, string> = {
  verified: "bg-status-verified-bg text-status-verified",
  pending: "bg-status-pending-bg text-status-pending",
  progress: "bg-status-progress-bg text-status-progress",
  danger: "bg-status-danger-bg text-status-danger",
  neutral: "bg-status-neutral-bg text-status-neutral",
};

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  /** Renders the raw SCREAMING_SNAKE value (matches operational data tables). */
  raw?: boolean;
}

export function StatusBadge({ status, className, raw = false }: StatusBadgeProps) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        TONE_CLASS[tone],
        className,
      )}
    >
      {raw ? (status ?? "—") : statusLabel(status)}
    </span>
  );
}
