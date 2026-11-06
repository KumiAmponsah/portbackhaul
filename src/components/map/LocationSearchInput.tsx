import { Loader2, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useGeocode, type GeocodeResult } from "@/hooks/use-geocode";
import { cn } from "@/lib/utils";

export interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function LocationSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Search a place, port or address",
  id,
  className,
  disabled = false,
}: LocationSearchInputProps) {
  const [debounced, setDebounced] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), 400);
    return () => window.clearTimeout(t);
  }, [value]);

  const { data: results, isFetching } = useGeocode(debounced, { enabled: open && !disabled });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [results]);

  function pick(result: GeocodeResult) {
    onChange(result.placeName);
    onSelect(result);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !results || results.length === 0) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && !disabled && debounced.trim().length >= 3;
  const noResults = showDropdown && !isFetching && (results ?? []).length === 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          className="pl-9 pr-9"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              onChange("");
              onSelect({ id: "", name: "", placeName: "", lat: 0, lng: 0 });
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {isFetching ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : noResults ? (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">
              No matches. Try a city, port, town or region name.
            </div>
          ) : (
            (results ?? []).map((r, idx) => (
              <button
                key={r.id}
                type="button"
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => pick(r)}
                className={cn(
                  "block w-full px-3 py-2.5 text-left text-sm transition-colors",
                  idx === highlight ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span className="block font-semibold text-foreground">{r.name}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {r.placeName}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}