"use client";

import {
  CalendarDays,
  Heart,
  Home,
  Images,
  Menu,
  NotebookPen,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArtImage } from "@/components/scrapbook/art";
import { Bow, HandUnderline, HeartDoodle } from "@/components/scrapbook/decorative";
import { ThemeToggle } from "@/components/scrapbook/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "home", label: "Home", Icon: Home },
  { id: "timeline", label: "Timeline", Icon: CalendarDays },
  { id: "gallery", label: "Gallery", Icon: Images },
  { id: "notes", label: "Notes", Icon: NotebookPen },
  { id: "about", label: "About", Icon: Heart },
] as const;

function SidebarContent({
  activeSection,
  onAdd,
  onNavigate,
}: {
  activeSection: string;
  onAdd: () => void;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="text-center">
        <Bow className="mx-auto size-16" />
        <p className="mt-1 font-hand text-[2.05rem] leading-[0.98] font-semibold text-ink">
          Our
          <br />
          Digital
          <br />
          Scrapbook{" "}
          <HeartDoodle
            className="inline size-4 -translate-y-0.5 text-rose-deep"
            filled
          />
        </p>
      </div>

      <div className="dotted-divider my-5 h-2 opacity-50" />

      <nav className="space-y-1.5" aria-label="Scrapbook sections">
        {navItems.map(({ id, label, Icon }) => {
          const active = activeSection === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[#f7c6d2]/75 font-semibold text-[#8f3d57]"
                  : "text-ink-soft hover:bg-blush-soft/50 hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full ring-1 transition-colors",
                  active
                    ? "bg-white/60 ring-[#d96a88]/25"
                    : "bg-paper-deep/60 ring-[#6b453c]/8 group-hover:bg-white/60",
                )}
              >
                <Icon className="size-4" strokeWidth={active ? 2.4 : 1.9} />
              </span>
              {label}
              {active ? (
                <HeartDoodle
                  className="ml-auto size-3.5 text-rose-deep/70"
                  filled
                />
              ) : null}
            </a>
          );
        })}
      </nav>

      <Button
        type="button"
        onClick={onAdd}
        className="mt-4 h-10 gap-2 rounded-full bg-primary px-4 text-sm text-primary-foreground shadow-[0_10px_22px_-14px_rgba(184,75,105,0.9)] hover:bg-rose-deep"
      >
        <Plus className="size-4" />
        Add a memory
      </Button>

      <div className="mt-auto pt-8">
        <div className="relative rounded-2xl border border-[rgba(107,69,60,0.1)] bg-blush-soft/35 px-3 py-4 text-center">
          <p className="font-hand text-[1.7rem] leading-tight text-ink">
            Good times
            <br />
            Kept close
            <HeartDoodle
              className="ml-1 inline size-4 -translate-y-0.5 text-rose-deep"
              filled
            />
          </p>
          <HandUnderline className="mx-auto mt-1 w-24 text-rose/60" />
          <div className="mt-3 flex items-center justify-center gap-2">
            <ArtImage name="matcha" className="size-10 object-contain" />
            <ArtImage name="strawberry" className="size-9 object-contain" />
          </div>
        </div>
        <p className="mt-3 text-center text-[0.6rem] tracking-[0.18em] text-ink-soft/70 uppercase">
          saved in this browser
        </p>
      </div>
    </div>
  );
}

export function Sidebar({
  activeSection,
  onAdd,
}: {
  activeSection: string;
  onAdd: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 col-span-full -mx-3 mb-1 flex items-center justify-between gap-3 border-b border-[rgba(107,69,60,0.12)] bg-paper/85 px-3 py-2.5 backdrop-blur-md sm:-mx-5 sm:px-5 lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="rounded-full border-rose/25 bg-paper-soft/80 text-ink"
        >
          <Menu className="size-4" />
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <Bow className="size-7 shrink-0" />
          <p className="truncate font-hand text-xl leading-none text-ink">
            Our Digital Scrapbook
          </p>
        </div>
        <ThemeToggle className="h-8 w-[64px] shrink-0" />
      </header>

      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[250px] shrink-0 self-start lg:block">
        <div className="paper-card flex h-full flex-col overflow-y-auto p-5">
          <SidebarContent
            activeSection={activeSection}
            onAdd={onAdd}
            onNavigate={handleNavigate}
          />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[86vw] max-w-[320px] border-r border-[rgba(107,69,60,0.12)] bg-paper p-5"
        >
          <SheetTitle className="sr-only">Scrapbook navigation</SheetTitle>
          <SidebarContent
            activeSection={activeSection}
            onAdd={() => {
              setMobileOpen(false);
              onAdd();
            }}
            onNavigate={handleNavigate}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
