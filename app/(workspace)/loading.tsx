function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-[hsl(var(--muted))] ${className}`} />;
}

export default function WorkspaceLoading() {
  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <div className="mb-4 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <LoadingBlock className="h-3 w-40" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6">
          <LoadingBlock className="h-3 w-28" />
          <LoadingBlock className="mt-4 h-10 w-3/4" />
          <LoadingBlock className="mt-3 h-4 w-1/2" />
          <div className="mt-4 flex gap-2">
            <LoadingBlock className="h-6 w-24" />
            <LoadingBlock className="h-6 w-20" />
            <LoadingBlock className="h-6 w-24" />
          </div>
        </div>

        <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <LoadingBlock className="h-4 w-32" />
          <div className="mt-4 space-y-3">
            <LoadingBlock className="h-12 w-full" />
            <LoadingBlock className="h-12 w-full" />
            <LoadingBlock className="h-12 w-full" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <LoadingBlock className="h-3 w-16" />
            <LoadingBlock className="mt-4 h-6 w-2/3" />
            <LoadingBlock className="mt-3 h-4 w-full" />
            <LoadingBlock className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </section>
  );
}
