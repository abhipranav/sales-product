import { UserSettingsPanel } from "@/components/settings/user-settings-panel";

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
          ACCOUNT // SETTINGS
        </p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">User & Workspace Settings</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Manage your profile, notification rules, and operating preferences.
        </p>
      </header>

      <UserSettingsPanel />
    </section>
  );
}
