"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { About } from "@/components/scrapbook/about";
import { AddMemoryDialog } from "@/components/scrapbook/add-memory-dialog";
import { CoverDialog } from "@/components/scrapbook/cover-dialog";
import { DeleteMemoryDialog } from "@/components/scrapbook/delete-dialog";
import { HeartDoodle } from "@/components/scrapbook/decorative";
import { Gallery } from "@/components/scrapbook/gallery";
import { Hero } from "@/components/scrapbook/hero";
import { MediaViewer } from "@/components/scrapbook/media-viewer";
import { NoteBoard } from "@/components/scrapbook/note-card";
import { Polaroid } from "@/components/scrapbook/polaroid";
import { Sidebar } from "@/components/scrapbook/sidebar";
import { Stats } from "@/components/scrapbook/stats";
import { Timeline } from "@/components/scrapbook/timeline";
import { useScrapbook } from "@/components/scrapbook/scrapbook-provider";
import type { Memory, NewMemory } from "@/lib/scrapbook-types";

const sectionIds = ["home", "timeline", "gallery", "notes", "about"];

export function ScrapbookHome() {
  const { state, addMemory, updateMemory, deleteMemory, setCover } =
    useScrapbook();

  const [activeSection, setActiveSection] = useState("home");
  const [addOpen, setAddOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0.05, 0.2, 0.5] },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const openAdd = () => {
    setEditingMemory(null);
    setAddOpen(true);
  };

  const openEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setAddOpen(true);
  };

  const openViewer = (memory: Memory) => {
    setSelectedMemory(memory);
    setViewerOpen(true);
  };

  const openDelete = (memory: Memory) => {
    setDeleteTarget(memory);
    setDeleteOpen(true);
  };

  const handleSubmit = (memory: NewMemory, id?: string) => {
    if (id) {
      updateMemory(id, memory);
      toast.success("Memory updated");
    } else {
      addMemory(memory);
      toast.success("A new memory, saved");
    }
    setEditingMemory(null);
  };

  const handleDelete = (memory: Memory) => {
    deleteMemory(memory.id);
    if (selectedMemory?.id === memory.id) {
      setSelectedMemory(null);
      setViewerOpen(false);
    }
    toast.success("Memory removed");
  };

  const latestMedia =
    [...state.memories].sort((a, b) => b.date.localeCompare(a.date))[0]?.media ??
    state.cover;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="gingham absolute -top-16 -left-20 size-64 rotate-12 rounded-[2rem] opacity-[0.22] blur-[0.5px] sm:size-80" />
        <div className="gingham-sage absolute top-24 -right-24 size-72 -rotate-12 rounded-[2rem] opacity-[0.2] sm:size-96" />
        <div className="gingham absolute bottom-8 left-1/3 size-80 rotate-6 rounded-full opacity-[0.08]" />
        <div className="absolute top-1/2 right-10 size-40 rounded-full bg-blush-soft/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1540px] grid-cols-1 gap-5 px-3 py-4 sm:px-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6 lg:px-6">
        <Sidebar activeSection={activeSection} onAdd={openAdd} />

        <main className="min-w-0 space-y-8 pb-10 sm:space-y-9">
          <Hero
            cover={state.cover}
            since={state.since}
            onChangeCover={() => setCoverOpen(true)}
          />

          <Stats />

          <Timeline
            onAdd={openAdd}
            onEdit={openEdit}
            onView={openViewer}
            onDelete={openDelete}
          />

          <Gallery
            onAdd={openAdd}
            onEdit={openEdit}
            onView={openViewer}
            onDelete={openDelete}
          />

          <section
            id="notes"
            className="grid scroll-mt-8 items-center gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6"
          >
            <NoteBoard />
            <Polaroid media={latestMedia} />
          </section>

          <About />

          <footer className="flex flex-col items-center gap-2 pt-4 pb-2 text-center">
            <HeartDoodle className="size-4 text-rose/60" filled />
            <p className="font-hand text-xl text-ink-soft">
              Good moments, kept close.
            </p>
            <p className="text-[0.65rem] tracking-[0.2em] text-ink-soft/60 uppercase">
              Our Digital Scrapbook
            </p>
          </footer>
        </main>
      </div>

      {addOpen ? (
        <AddMemoryDialog
          key={editingMemory?.id ?? "new"}
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) setEditingMemory(null);
          }}
          memory={editingMemory}
          onSubmit={handleSubmit}
        />
      ) : null}

      <CoverDialog
        open={coverOpen}
        onOpenChange={setCoverOpen}
        cover={state.cover}
        onSelected={async (media) => {
          const saved = await setCover(media);
          if (saved) toast.success("Cover updated and synced");
          else toast.error("Cover updated locally only");
        }}
      />

      <MediaViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        memory={selectedMemory}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <DeleteMemoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        memory={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
