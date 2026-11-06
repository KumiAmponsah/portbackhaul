import { Bell, CheckCheck } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="mx-auto w-full max-w-[880px] animate-fade space-y-7">
      <Seo title="Notifications · PortBackhaul" description="Your platform notifications." path="/app/notifications" noIndex />

      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up."}
        actions={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="panel divide-y divide-border">
        {isError ? (
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="notifications" compact />
        ) : isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Assignment offers, status changes and payment events will appear here."
          />
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                if (!notification.read_at) markRead.mutate(notification.id);
              }}
              className={cn(
                "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50",
                !notification.read_at && "bg-primary/[0.03]",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  notification.read_at ? "bg-border" : "bg-accent",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">{relativeTime(notification.created_at)}</span>
                </span>
                {notification.body ? (
                  <span className="mt-1 block text-sm text-muted-foreground">{notification.body}</span>
                ) : null}
                <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
                  {notification.event_type.replace(/_/g, " ")}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
