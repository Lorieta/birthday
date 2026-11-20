"use client";

import { Coffee } from "lucide-react";
import { useTheme } from "next-themes";
import { ArtImage } from "@/components/scrapbook/art";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-9 w-9 items-center rounded-full border border-[rgba(107,69,60,0.16)] bg-paper-soft/90 p-1 shadow-sm backdrop-blur transition-colors sm:w-[74px]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-1 flex size-7 items-center justify-center rounded-full shadow-sm transition-transform duration-300",
          isDark
            ? "translate-x-0 bg-[#f0dcc4] text-[#8b5a3c] sm:translate-x-[36px]"
            : "translate-x-0 bg-[#e6efd6] text-[#718a4d]",
        )}
      >
        {isDark ? (
          <Coffee className="size-4" />
        ) : (
          <ArtImage name="matcha" className="size-5 object-contain" />
        )}
      </span>
      <span className="pointer-events-none ml-auto hidden w-[30px] justify-center text-ink-soft/80 sm:flex">
        <Coffee
          className={cn("size-3.5 transition-opacity", isDark && "opacity-30")}
        />
      </span>
      <span className="pointer-events-none absolute left-2.5 hidden w-[30px] justify-center text-ink-soft/80 sm:flex">
        <ArtImage
          name="matcha"
          className={cn(
            "size-5 object-contain transition-opacity",
            !isDark && "opacity-30",
          )}
        />
      </span>
    </button>
  );
}
