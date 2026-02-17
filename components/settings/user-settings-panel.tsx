"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

interface UserSettingsResponse {
  profile: {
    email: string;
    fullName: string;
    role: "owner" | "manager" | "rep";
    workspaceSlug: string;
    workspaceName: string;
  };
  preferences: {
    themePreference: "system" | "light" | "dark";
    timezone: string;
    locale: string;
    weekStartsOn: "monday" | "sunday";
    compactMode: boolean;
    reduceMotion: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    desktopNotifications: boolean;
    mentionNotifications: boolean;
    pipelineAlerts: boolean;
    approvalQueueAlerts: boolean;
    dailyDigest: boolean;
    digestHour: number;
    productAnnouncements: boolean;
  };
  security: {
    loginAlerts: boolean;
    mfaEnabled: boolean;
  };
  capabilities: {
    canManageMembers: boolean;
    canManageBilling: boolean;
  };
  source: "database" | "fallback";
}

function RoleBadge({ role }: { role: UserSettingsResponse["profile"]["role"] }) {
  if (role === "owner") {
    return <Badge variant="accent">owner</Badge>;
  }

  if (role === "manager") {
    return <Badge variant="warning">manager</Badge>;
  }

  return <Badge variant="secondary">rep</Badge>;
}

function ToggleField({
  id,
  label,
  description,
  checked,
  onChange
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-3 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3"
    >
      <div>
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{label}</p>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 cursor-pointer border-[hsl(var(--border))]"
      />
    </label>
  );
}

export function UserSettingsPanel() {
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/settings/user");
        if (!response.ok) {
          throw new Error("Failed to load settings");
        }

        const payload: UserSettingsResponse = await response.json();
        setSettings(payload);
      } catch (error) {
        console.error(error);
        toast.error("Could not load account settings.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const isDatabaseBacked = settings?.source === "database";
  const canSave = useMemo(
    () => !isLoading && !!settings && !isSaving && settings.source === "database",
    [isLoading, settings, isSaving]
  );

  async function saveSettings() {
    if (!settings) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        fullName: settings.profile.fullName,
        ...settings.preferences,
        ...settings.notifications,
        loginAlerts: settings.security.loginAlerts
      };

      const response = await fetch("/api/settings/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error ?? "Failed to save settings");
      }

      const nextSettings: UserSettingsResponse = await response.json();
      setSettings(nextSettings);
      toast.success("Settings saved.");
    } catch (error) {
      console.error(error);
      toast.error("Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Loading account settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">PROFILE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="full-name">Display name</Label>
              <Input
                id="full-name"
                value={settings.profile.fullName}
                onChange={(event) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          profile: {
                            ...prev.profile,
                            fullName: event.target.value
                          }
                        }
                      : prev
                  )
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={settings.profile.email} disabled />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Email is currently identity-scoped by workspace actor headers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={settings.profile.role} />
              <Badge variant="outline">{settings.profile.workspaceName}</Badge>
              <Badge variant={settings.source === "database" ? "success" : "warning"}>
                {settings.source === "database" ? "live settings" : "fallback settings"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">WORKSPACE CAPABILITIES</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Members & roles</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {settings.capabilities.canManageMembers
                  ? "You can manage workspace members."
                  : "Member management is restricted for your current role."}
              </p>
            </div>

            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Billing & seats</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {settings.capabilities.canManageBilling
                  ? "You can manage billing and seat-level settings."
                  : "Billing is owner-only in this workspace."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href="/setup">System Setup</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/integrations">Integrations</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">PREFERENCES</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="theme">Theme</Label>
                <NativeSelect
                  id="theme"
                  value={settings.preferences.themePreference}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              themePreference: event.target.value as "system" | "light" | "dark"
                            }
                          }
                        : prev
                    )
                  }
                >
                  <option value="system">system</option>
                  <option value="light">light</option>
                  <option value="dark">dark</option>
                </NativeSelect>
              </div>

              <div className="space-y-1">
                <Label htmlFor="week-start">Week starts on</Label>
                <NativeSelect
                  id="week-start"
                  value={settings.preferences.weekStartsOn}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              weekStartsOn: event.target.value as "monday" | "sunday"
                            }
                          }
                        : prev
                    )
                  }
                >
                  <option value="monday">monday</option>
                  <option value="sunday">sunday</option>
                </NativeSelect>
              </div>

              <div className="space-y-1">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings.preferences.timezone}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              timezone: event.target.value
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="locale">Locale</Label>
                <Input
                  id="locale"
                  value={settings.preferences.locale}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              locale: event.target.value
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            <ToggleField
              id="compact-mode"
              label="Compact mode"
              description="Reduce spacing in dense CRM tables and boards."
              checked={settings.preferences.compactMode}
              onChange={(value) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          compactMode: value
                        }
                      }
                    : prev
                )
              }
            />

            <ToggleField
              id="reduce-motion"
              label="Reduce motion"
              description="Use lower-motion transitions in cockpit and pipeline surfaces."
              checked={settings.preferences.reduceMotion}
              onChange={(value) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          reduceMotion: value
                        }
                      }
                    : prev
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">NOTIFICATIONS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleField
              id="notif-email"
              label="Email notifications"
              description="Get account and workflow updates by email."
              checked={settings.notifications.emailNotifications}
              onChange={(value) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          emailNotifications: value
                        }
                      }
                    : prev
                )
              }
            />

            <ToggleField
              id="notif-desktop"
              label="Desktop notifications"
              description="Show browser alerts for high-priority activity."
              checked={settings.notifications.desktopNotifications}
              onChange={(value) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          desktopNotifications: value
                        }
                      }
                    : prev
                )
              }
            />

            <ToggleField
              id="notif-mentions"
              label="Mentions"
              description="Alert when someone mentions you in notes, tasks, or approvals."
              checked={settings.notifications.mentionNotifications}
              onChange={(value) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          mentionNotifications: value
                        }
                      }
                    : prev
                )
              }
            />

            <ToggleField
              id="notif-pipeline"
              label="Pipeline alerts"
              description="Get nudges when deal risk or close pressure rises."
              checked={settings.notifications.pipelineAlerts}
              onChange={(value) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          pipelineAlerts: value
                        }
                      }
                    : prev
                )
              }
            />

            <ToggleField
              id="notif-approvals"
              label="Approval queue alerts"
              description="Notify when outbound drafts need review."
              checked={settings.notifications.approvalQueueAlerts}
              onChange={(value) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          approvalQueueAlerts: value
                        }
                      }
                    : prev
                )
              }
            />

            <ToggleField
              id="notif-digest"
              label="Daily digest"
              description="Receive one daily summary instead of frequent alerts."
              checked={settings.notifications.dailyDigest}
              onChange={(value) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          dailyDigest: value
                        }
                      }
                    : prev
                )
              }
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="digest-hour">Digest hour (0-23)</Label>
                <Input
                  id="digest-hour"
                  type="number"
                  min={0}
                  max={23}
                  value={settings.notifications.digestHour}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              digestHour: Math.min(23, Math.max(0, Number(event.target.value)))
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>

              <ToggleField
                id="notif-product"
                label="Product announcements"
                description="Release notes and feature updates."
                checked={settings.notifications.productAnnouncements}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            productAnnouncements: value
                          }
                        }
                      : prev
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-xs uppercase tracking-wider">SECURITY</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleField
            id="login-alerts"
            label="Login alerts"
            description="Alert on suspicious logins and unknown device sessions."
            checked={settings.security.loginAlerts}
            onChange={(value) =>
              setSettings((prev) =>
                prev
                  ? {
                      ...prev,
                      security: {
                        ...prev.security,
                        loginAlerts: value
                      }
                    }
                  : prev
              )
            }
          />
          <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Multi-factor authentication</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              MFA provisioning is planned. For now, treat this workspace as pre-auth hardening mode.
            </p>
            <Badge className="mt-2" variant={settings.security.mfaEnabled ? "success" : "warning"}>
              {settings.security.mfaEnabled ? "enabled" : "not enabled yet"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Button onClick={saveSettings} disabled={!canSave} variant="cta">
          {isSaving ? "Saving..." : isDatabaseBacked ? "Save Settings" : "Live DB Required"}
        </Button>
      </div>
    </div>
  );
}
