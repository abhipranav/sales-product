"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  type: "account" | "contact" | "deal";
  id: string;
  title: string;
  subtitle: string | null;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search on query change
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results ?? []);
        setSelectedIndex(0);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      let path: string;
      switch (result.type) {
        case "account":
          path = `/accounts/${result.id}`;
          break;
        case "contact":
          path = `/contacts/${result.id}`;
          break;
        case "deal":
          path = `/pipeline/${result.id}`;
          break;
        default:
          path = "/";
      }
      router.push(path as Parameters<typeof router.push>[0]);
    },
    [router]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [results, selectedIndex, handleSelect]
  );

  const typeIcon = (type: string) => {
    switch (type) {
      case "account":
        return "🏢";
      case "contact":
        return "👤";
      case "deal":
        return "💰";
      default:
        return "📄";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b border-[hsl(var(--border))] px-4">
          <svg
            className="mr-2 h-4 w-4 shrink-0 opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Search accounts, contacts, deals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 h-12"
            autoFocus
          />
          <kbd className="ml-2 text-xs bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded text-[hsl(var(--muted-foreground))]">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Searching...
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Type at least 2 characters to search
            </div>
          )}

          {results.length > 0 && (
            <ul className="py-2">
              {results.map((result, index) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => handleSelect(result)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${index === selectedIndex ? "bg-[hsl(var(--muted))]" : "hover:bg-[hsl(var(--muted)/0.5)]"}
                    `}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="text-lg">{typeIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[hsl(var(--foreground))] truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {result.type}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[hsl(var(--border))] px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] flex gap-4">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
