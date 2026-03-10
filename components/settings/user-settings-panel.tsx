"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

interface UserAISettingsResponse {
  hasApiKey: boolean;
  maskedKey: string | null;
  model: string;
  source: "user" | "system" | "none";
  systemKeyStatus: "active" | "pending-restart" | "missing";
  strategyMode: "ai-enabled" | "rule-based";
  workflowLabels: string[];
  statusNote: string;
  dailyUsage: {
    date: string;
    timezone: "UTC";
    resetAt: string;
    selectedModel: string;
    selectedModelTokens: number;
    selectedModelDailyLimit: number | null;
    selectedModelRemaining: number | null;
    selectedModelPercentUsed: number | null;
    models: Array<{
      model: string;
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      requestCount: number;
      dailyLimit: number | null;
      remaining: number | null;
      percentUsed: number | null;
    }>;
  };
}

const RECOMMENDED_AI_MODELS = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5-codex"
];

function createDefaultAISettings(model = "gpt-5-mini"): UserAISettingsResponse {
  const normalizedModel = model.trim().toLowerCase() || "gpt-5-mini";
  const tomorrowUtc = new Date();
  tomorrowUtc.setUTCHours(24, 0, 0, 0);

  return {
    hasApiKey: false,
    maskedKey: null,
    model: normalizedModel,
    source: "none",
    systemKeyStatus: "missing",
    strategyMode: "rule-based",
    workflowLabels: ["Follow-up Draft regeneration", "Meeting Prep Brief regeneration"],
    statusNote: "No active OpenAI key is loaded. Follow-ups and meeting briefs will fall back to rule-based generation.",
    dailyUsage: {
      date: new Date().toISOString().slice(0, 10),
      timezone: "UTC",
      resetAt: tomorrowUtc.toISOString(),
      selectedModel: normalizedModel,
      selectedModelTokens: 0,
      selectedModelDailyLimit: normalizedModel.startsWith("gpt-5-mini")
        ? 2_500_000
        : normalizedModel === "gpt-5"
          ? 250_000
          : null,
      selectedModelRemaining: normalizedModel.startsWith("gpt-5-mini")
        ? 2_500_000
        : normalizedModel === "gpt-5"
          ? 250_000
          : null,
      selectedModelPercentUsed: 0,
      models: []
    }
  };
}

function normalizeModelInput(model: string): string {
  return model.trim().toLowerCase();
}

function formatTokens(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
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
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [aiSettings, setAISettings] = useState<UserAISettingsResponse>(createDefaultAISettings());
  const [aiApiKeyInput, setAIApiKeyInput] = useState("");
  const [aiModelInput, setAIModelInput] = useState("gpt-5-mini");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAI, setIsSavingAI] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const [settingsResponse, aiResponse] = await Promise.all([
          fetch("/api/settings/user"),
          fetch("/api/settings/user/ai")
        ]);

        if (!settingsResponse.ok) {
          throw new Error("Failed to load settings");
        }

        const payload: UserSettingsResponse = await settingsResponse.json();
        setSettings(payload);

        if (aiResponse.ok) {
          const aiPayload = (await aiResponse.json()) as Partial<UserAISettingsResponse>;
          const normalizedModel = normalizeModelInput(aiPayload.model ?? "gpt-5-mini");
          const mergedAISettings: UserAISettingsResponse = {
            ...createDefaultAISettings(normalizedModel),
            ...aiPayload,
            model: normalizedModel,
            dailyUsage: aiPayload.dailyUsage ?? createDefaultAISettings(normalizedModel).dailyUsage
          };
          setAISettings(mergedAISettings);
          setAIModelInput(normalizedModel);
        } else {
          const fallbackAISettings = createDefaultAISettings();
          setAISettings(fallbackAISettings);
          setAIModelInput(fallbackAISettings.model);
        }
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
  const canSaveAI = useMemo(
    () => !isLoading && !isSavingAI && !!aiModelInput.trim(),
    [isLoading, isSavingAI, aiModelInput]
  );
  const selectedUsagePercent = aiSettings.dailyUsage.selectedModelPercentUsed ?? 0;
  const selectedUsageLimit = aiSettings.dailyUsage.selectedModelDailyLimit;
  const canClearPersonalKey = aiSettings.source === "user" && !isSavingAI;
  const modelSuggestions = useMemo(
    () =>
      Array.from(new Set([...RECOMMENDED_AI_MODELS, aiSettings.model, normalizeModelInput(aiModelInput)])).filter(
        (value) => value.length > 0
      ),
    [aiSettings.model, aiModelInput]
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

  async function saveAISettings() {
    const normalizedModel = normalizeModelInput(aiModelInput);
    if (!normalizedModel) {
      toast.error("Model is required.");
      return;
    }

    setIsSavingAI(true);
    try {
      const payload: { model: string; apiKey?: string } = { model: normalizedModel };
      const normalizedApiKey = aiApiKeyInput.trim();
      if (normalizedApiKey.length > 0) {
        payload.apiKey = normalizedApiKey;
      }

      const response = await fetch("/api/settings/user/ai", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error ?? "Failed to save AI settings");
      }

      const nextSettings: UserAISettingsResponse = await response.json();
      setAISettings(nextSettings);
      setAIModelInput(nextSettings.model);
      setAIApiKeyInput("");
      toast.success("AI settings saved.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not save AI settings.");
    } finally {
      setIsSavingAI(false);
    }
  }

  async function clearPersonalAIKey() {
    setIsSavingAI(true);
    try {
      const response = await fetch("/api/settings/user/ai", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ apiKey: null })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error ?? "Failed to clear AI key");
      }

      const nextSettings: UserAISettingsResponse = await response.json();
      setAISettings(nextSettings);
      setAIModelInput(nextSettings.model);
      setAIApiKeyInput("");
      toast.success("Personal AI key removed.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not clear personal AI key.");
    } finally {
      setIsSavingAI(false);
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

            <div className="grid gap-3 md:grid-cols-3">
              <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">System setup</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Review readiness, env state, and activation checks.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <a href="/setup">Open Setup</a>
                </Button>
              </div>
              <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Integrations</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Manage CRM, calendar, and external workflow connections.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <a href="/integrations">Open Integrations</a>
                </Button>
              </div>
              <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">LinkedIn companion</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Launch the capture workbench and install flow for reps.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <a href="/integrations/linkedin">Open Companion</a>
                </Button>
              </div>
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

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">AI CONFIGURATION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={aiSettings.source === "user" ? "success" : "outline"}>
                {aiSettings.source === "user" ? "personal key active" : "personal key inactive"}
              </Badge>
              <Badge
                variant={
                  aiSettings.source === "system"
                    ? "warning"
                    : aiSettings.systemKeyStatus === "pending-restart"
                      ? "warning"
                      : "outline"
                }
              >
                {aiSettings.source === "system"
                  ? "using workspace/system key"
                  : aiSettings.systemKeyStatus === "pending-restart"
                    ? "system key pending restart"
                    : "no workspace/system fallback"}
              </Badge>
              <Badge variant={aiSettings.hasApiKey ? "accent" : "destructive"}>
                {aiSettings.hasApiKey ? "ai enabled" : "ai unavailable"}
              </Badge>
              <Badge variant={aiSettings.strategyMode === "ai-enabled" ? "accent" : "outline"}>
                {aiSettings.strategyMode === "ai-enabled" ? "strategy ai enabled" : "strategy lab rule-based"}
              </Badge>
            </div>

            <p className="text-xs text-[hsl(var(--muted-foreground))]">{aiSettings.statusNote}</p>

            <div className="space-y-1">
              <Label htmlFor="ai-api-key">OpenAI API key (optional override)</Label>
              <Input
                id="ai-api-key"
                type="password"
                placeholder="sk-..."
                value={aiApiKeyInput}
                onChange={(event) => setAIApiKeyInput(event.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {aiSettings.maskedKey
                  ? `Saved personal key: ${aiSettings.maskedKey}`
                  : "No personal key saved. Workspace/system key will be used if configured."}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ai-model">Model</Label>
              <Input
                id="ai-model"
                value={aiModelInput}
                onChange={(event) => setAIModelInput(event.target.value)}
                placeholder="gpt-5-mini"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {modelSuggestions.map((model) => (
                  <Button
                    key={model}
                    type="button"
                    size="sm"
                    variant={normalizeModelInput(aiModelInput) === model ? "accent" : "outline"}
                    onClick={() => setAIModelInput(model)}
                    disabled={isSavingAI}
                  >
                    {model}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                AI is currently used for
              </p>
              <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                {aiSettings.workflowLabels.map((workflow) => (
                  <li
                    key={workflow}
                    className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2"
                  >
                    {workflow}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-2 pt-1">
              <Button type="button" onClick={saveAISettings} disabled={!canSaveAI} variant="cta" className="w-full">
                {isSavingAI ? "Saving..." : "Save AI Settings"}
              </Button>
              <Button
                type="button"
                onClick={clearPersonalAIKey}
                disabled={!canClearPersonalKey}
                variant="outline"
                className="w-full"
              >
                Clear Personal Key
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">DAILY TOKEN USAGE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {aiSettings.dailyUsage.selectedModel}
                </p>
                <Badge variant="outline">{aiSettings.dailyUsage.date} UTC</Badge>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Total used today: {formatTokens(aiSettings.dailyUsage.selectedModelTokens)} tokens
              </p>
              {selectedUsageLimit !== null ? (
                <>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Limit: {formatTokens(selectedUsageLimit)} | Remaining:{" "}
                    {formatTokens(aiSettings.dailyUsage.selectedModelRemaining ?? 0)}
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                    <div
                      className="h-full bg-[hsl(var(--accent))] transition-all duration-150"
                      style={{ width: `${Math.min(100, Math.max(0, selectedUsagePercent))}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  No daily cap configured for this model.
                </p>
              )}
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                Resets at {new Date(aiSettings.dailyUsage.resetAt).toLocaleString()} ({aiSettings.dailyUsage.timezone})
              </p>
            </div>

            {aiSettings.dailyUsage.models.length > 0 ? (
              <div className="space-y-2">
                {aiSettings.dailyUsage.models.slice(0, 6).map((usageRow) => (
                  <div
                    key={usageRow.model}
                    className="flex items-center justify-between gap-2 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-2"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--foreground))]">
                        {usageRow.model}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Requests: {usageRow.requestCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                        {formatTokens(usageRow.totalTokens)}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {usageRow.dailyLimit !== null
                          ? `${usageRow.percentUsed ?? 0}% of ${formatTokens(usageRow.dailyLimit)}`
                          : "uncapped"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Usage appears after the first successful AI response.
              </p>
            )}
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
