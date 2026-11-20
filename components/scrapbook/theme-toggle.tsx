"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-9 w-[74px] items-center rounded-full border border-[rgba(107,69,60,0.16)] bg-paper-soft/90 p-1 shadow-sm backdrop-blur transition-colors",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-1 flex size-7 items-center justify-center rounded-full shadow-sm transition-transform duration-300",
          isDark
            ? "translate-x-[36px] bg-[#d4a574] text-[#1c1411]"
            : "translate-x-0 bg-[#fdf1d9] text-[#b8843d]",
        )}
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </span>
      <span className="pointer-events-none ml-auto flex w-[30px] justify-center text-ink-soft/80">
        <Moon className={cn("size-3.5 transition-opacity", isDark && "opacity-30")} />
      </span>
      <span className="pointer-events-none absolute left-2.5 flex w-[30px] justify-center text-ink-soft/80">
        <Sun className={cn("size-3.5 transition-opacity", !isDark && "opacity-30")} />
      </span>
    </button>
  );
}
