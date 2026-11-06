import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/errors";

interface QueryErrorStateProps {
  /** The raw error thrown by the failed query. */
  error: unknown;
  /** Retry callback — normally the query's `refetch`. */
  onRetry: () => void;
  /** What failed, e.g. "shipments". Shown as the heading context. */
  subject?: string;
  /** Minimal mode for inline/panel usage inside tables. */
  compact?: boolean;
}

/**
 * Shared "failed to load" state with a working Retry button. Renders the real
 * backend error message (sanitised through describeError) — never fake data.
 */
export function QueryErrorState({ error, onRetry, subject, compact = false }: QueryErrorStateProps) {
  const message = describeError(error, `Could not load ${subject ?? "this data"}.`);
  const label = subject ? `Retry loading ${subject}` : "Retry";

  return (
    <div
      role="alert"
      className={
        compact
          ? "flex flex-col items-start gap-3 p-5"
          : "panel flex flex-col items-center gap-3 p-8 text-center"
      }
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-rejected-bg text-status-rejected">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </span>
      <div className={compact ? "" : "max-w-sm"}>
        <p className="text-sm font-bold">Failed to load {subject ?? "data"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden />
        {label}
      </Button>
    </div>
  );
}
