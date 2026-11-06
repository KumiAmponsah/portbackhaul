import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/** Marks records that come from the clearly-labelled development seed data. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent",
        className,
      )}
      title="Development demo record"
    >
      <FlaskConical className="h-3 w-3" aria-hidden />
      Demo
    </span>
  );
}
