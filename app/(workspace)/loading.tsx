export default function WorkspaceLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl py-4">
      <div className="mb-6 animate-pulse space-y-2">
        <div className="h-3 w-40 bg-[hsl(var(--muted))]" />
        <div className="h-8 w-72 bg-[hsl(var(--muted))]" />
        <div className="h-4 w-96 bg-[hsl(var(--muted))]" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))]" />
        <div className="h-28 animate-pulse border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))]" />
        <div className="h-28 animate-pulse border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))]" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="h-64 animate-pulse border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))]" />
          <div className="h-56 animate-pulse border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))]" />
        </div>
        <div className="space-y-4">
          <div className="h-72 animate-pulse border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))]" />
          <div className="h-48 animate-pulse border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))]" />
        </div>
      </div>
    </div>
  );
}
