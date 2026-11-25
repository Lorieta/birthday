"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import {
  Archive,
  CalendarDays,
  Heart,
  Home,
  Images,
  NotebookPen,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArtImage } from "@/components/scrapbook/art";
import {
  HandUnderline,
  HeartDoodle,
  MatchaMark,
} from "@/components/scrapbook/decorative";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import { isArchivedMemory, isArchivedNote } from "@/lib/scrapbook-normalize";
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
  onOpenArchive,
  archivedCount,
  onNavigate,
}: {
  activeSection: string;
  onAdd: () => void;
  onOpenArchive?: () => void;
  archivedCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="text-center">
        <MatchaMark className="mx-auto w-14 sm:w-16" />
        <p className="mt-1 font-hand text-[2.1rem] leading-none font-semibold text-ink">
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
              onClick={onNavigate}
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

      {onOpenArchive ? (
        <Button
          type="button"
          variant="outline"
          onClick={onOpenArchive}
          className="mt-2 h-9 gap-2 rounded-full border-rose/25 px-4 text-xs text-ink-soft hover:text-rose-deep"
        >
          <Archive className="size-3.5" />
          Archive
          {archivedCount > 0 ? (
            <span className="ml-auto rounded-full bg-blush-soft px-2 py-0.5 text-[0.65rem] text-rose-deep">
              {archivedCount}
            </span>
          ) : null}
        </Button>
      ) : null}

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
  onOpenArchive,
}: {
  activeSection: string;
  onAdd: () => void;
  onOpenArchive?: () => void;
}) {
  const { state } = useScrapbook();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const archivedCount =
    state.notes.filter(isArchivedNote).length +
    state.memories.filter(isArchivedMemory).length;

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) {
        setDrawerOpen(false);
      }
    };

    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 col-span-full -mx-3 mb-1 flex items-center justify-between gap-3 border-b border-[rgba(107,69,60,0.12)] bg-paper/85 px-3 py-2.5 backdrop-blur-md sm:-mx-5 sm:px-5 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <MatchaMark className="w-7 shrink-0" />
          <p className="truncate font-hand text-xl leading-none text-ink">
            Scrapbook
          </p>
        </div>
      </header>

      <Drawer.Root
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        swipeDirection="left"
      >
        <Drawer.SwipeArea
          aria-hidden="true"
          className="fixed inset-y-0 left-0 z-30 w-6 touch-pan-y lg:hidden"
        />
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 z-40 min-h-dvh bg-black/25 opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[swiping]:duration-0 lg:hidden" />
          <Drawer.Viewport className="fixed inset-0 z-50 flex items-stretch justify-start lg:hidden">
            <Drawer.Popup className="h-full w-[min(20rem,86vw)] overflow-y-auto overscroll-contain border-r border-[rgba(107,69,60,0.14)] bg-paper-soft p-5 text-ink shadow-[18px_0_45px_-30px_rgba(107,69,60,0.65)] outline-none transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-[ending-style]:[transform:translateX(-100%)] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-[starting-style]:[transform:translateX(-100%)] data-[swiping]:duration-0">
              <Drawer.Content className="flex min-h-full flex-col">
                <Drawer.Title className="sr-only">
                  Scrapbook navigation
                </Drawer.Title>
                <Drawer.Description className="sr-only">
                  Swipe from the left edge to open this navigation panel.
                </Drawer.Description>
                <div className="mb-2 flex justify-end">
                  <Drawer.Close
                    type="button"
                    aria-label="Close navigation"
                    className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-blush-soft/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
                  >
                    <X className="size-4" />
                  </Drawer.Close>
                </div>
                <SidebarContent
                  activeSection={activeSection}
                  archivedCount={archivedCount}
                  onAdd={() => {
                    setDrawerOpen(false);
                    onAdd();
                  }}
                  onOpenArchive={
                    onOpenArchive
                      ? () => {
                          setDrawerOpen(false);
                          onOpenArchive();
                        }
                      : undefined
                  }
                  onNavigate={() => setDrawerOpen(false)}
                />
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[250px] shrink-0 self-start lg:block">
        <div className="paper-card flex h-full flex-col overflow-y-auto p-5">
          <SidebarContent
            activeSection={activeSection}
            archivedCount={archivedCount}
            onAdd={onAdd}
            onOpenArchive={onOpenArchive}
          />
        </div>
      </aside>
    </>
  );
}
