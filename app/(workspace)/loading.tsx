export default function WorkspaceLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl py-4">
      <div className="mb-6 animate-pulse space-y-2">
        <div className="h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-96 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
        <div className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
        <div className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
          <div className="h-56 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
        </div>
        <div className="space-y-4">
          <div className="h-72 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
          <div className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
        </div>
      </div>
    </div>
  );
}
