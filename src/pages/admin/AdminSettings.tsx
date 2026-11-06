import { Loader2, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAllPlatformSettings, useUpdatePlatformSetting } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { useLocations } from "@/hooks/use-platform-data";
import { describeError } from "@/lib/errors";

export default function AdminSettings() {
  const { hasPermission } = useAuth();
  const { data: settings, isLoading, isError, error, refetch } = useAllPlatformSettings();
  const { data: locations } = useLocations();
  const update = useUpdatePlatformSetting();

  const [commission, setCommission] = useState<string>("");
  const [autoAssign, setAutoAssign] = useState<boolean>(false);
  const [qrTtl, setQrTtl] = useState<string>("");
  const [gpsInterval, setGpsInterval] = useState<string>("");

  useEffect(() => {
    if (!settings) return;
    for (const row of settings) {
      const value = row.value;
      if (row.key === "commission_percent") setCommission(String(value));
      if (row.key === "auto_assign_drivers") setAutoAssign(value === true || value === "true");
      if (row.key === "qr_token_ttl_hours") setQrTtl(String(value));
      if (row.key === "gps_ping_interval_seconds") setGpsInterval(String(value));
    }
  }, [settings]);

  const canManage = hasPermission("SETTINGS_MANAGE");

  async function save(key: string, value: unknown) {
    try {
      await update.mutateAsync({ key, value });
      toast.success("Setting updated");
    } catch (error) {
      toast.error(describeError(error));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[900px] animate-fade space-y-6">
      <Seo title="Settings · PortBackhaul Admin" description="Platform configuration." path="/admin/settings" noIndex />

      <PageHeader
        eyebrow="Admin Dashboard"
        title="Platform settings"
        subtitle="Commission, assignment policy, QR validity and tracking frequency."
      />

      {!canManage ? (
        <div className="panel p-5 text-sm text-muted-foreground">
          You have read-only access. The SETTINGS_MANAGE permission is required to change these values.
        </div>
      ) : null}

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="platform settings" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading settings…</div>
      ) : (
        <div className="space-y-5">
          <section className="panel p-6">
            <h2 className="text-base font-bold">Commission</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              The percentage PortBackhaul retains from each transport fee. The remainder becomes driver earnings.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="w-40 space-y-1.5">
                <Label htmlFor="commission">Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min={0}
                  max={50}
                  step="0.5"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <Button onClick={() => void save("commission_percent", Number(commission))} disabled={!canManage || update.isPending}>
                {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </section>

          <section className="panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">Automatic driver assignment</h2>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  When off (recommended), a matched driver must explicitly accept every job before a trip is created.
                </p>
              </div>
              <Switch
                checked={autoAssign}
                disabled={!canManage}
                onCheckedChange={(checked) => {
                  setAutoAssign(checked);
                  void save("auto_assign_drivers", checked);
                }}
                aria-label="Automatic driver assignment"
              />
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-base font-bold">Trip QR validity</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              How long a trip's verification token stays valid after it is generated.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="w-40 space-y-1.5">
                <Label htmlFor="qr-ttl">Hours</Label>
                <Input
                  id="qr-ttl"
                  type="number"
                  min={1}
                  max={720}
                  value={qrTtl}
                  onChange={(e) => setQrTtl(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <Button variant="outline" onClick={() => void save("qr_token_ttl_hours", Number(qrTtl))} disabled={!canManage}>
                Save
              </Button>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-base font-bold">GPS tracking frequency</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Minimum seconds between stored location pings. Higher values reduce battery and database load. Tracking
              only happens while a trip is active.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="w-40 space-y-1.5">
                <Label htmlFor="gps">Seconds</Label>
                <Input
                  id="gps"
                  type="number"
                  min={30}
                  max={3600}
                  value={gpsInterval}
                  onChange={(e) => setGpsInterval(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => void save("gps_ping_interval_seconds", Number(gpsInterval))}
                disabled={!canManage}
              >
                Save
              </Button>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Settings className="h-4 w-4" aria-hidden />
              Supported locations & routes
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Countries, ports and cities are configuration, not hardcoded values. {(locations ?? []).length} active
              locations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(locations ?? []).map((location) => (
                <span key={location.id} className="rounded border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium">
                  {location.name} · {location.country}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
