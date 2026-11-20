import {
  CakeSlice,
  Camera,
  Cat,
  Cherry,
  Coffee,
  FerrisWheel,
  Flower2,
  Gamepad2,
  Heart,
  Ribbon,
  Sparkles,
} from "lucide-react";
import type { ComponentType } from "react";
import { ArtSticker } from "@/components/scrapbook/art";
import { STICKER_ART, type ArtName } from "@/lib/sticker-art";
import { cn } from "@/lib/utils";
import type { StickerName } from "@/lib/scrapbook-types";

type IconComponent = ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

export const stickerOptions: {
  name: StickerName;
  label: string;
  Icon: IconComponent;
  className: string;
  art?: ArtName;
}[] = [
  {
    name: "heart",
    label: "Heart",
    Icon: Heart,
    className: "bg-[#ffe3ea] text-[#d95b7c]",
    art: "heart",
  },
  {
    name: "matcha",
    label: "Matcha",
    Icon: Coffee,
    className: "bg-[#e6efd6] text-[#718a4d]",
    art: "matcha",
  },
  {
    name: "strawberry",
    label: "Strawberry",
    Icon: Cherry,
    className: "bg-[#ffe0e2] text-[#d2475e]",
    art: "strawberry",
  },
  {
    name: "gamepad",
    label: "Game",
    Icon: Gamepad2,
    className: "bg-[#e9e2f7] text-[#7b5ea7]",
  },
  {
    name: "ferris",
    label: "Ferris",
    Icon: FerrisWheel,
    className: "bg-[#fdeed8] text-[#c27b3a]",
  },
  {
    name: "cake",
    label: "Cake",
    Icon: CakeSlice,
    className: "bg-[#fbe7e4] text-[#c26d76]",
  },
  {
    name: "flower",
    label: "Flower",
    Icon: Flower2,
    className: "bg-[#e9f0df] text-[#7e9661]",
    art: "flower",
  },
  {
    name: "camera",
    label: "Camera",
    Icon: Camera,
    className: "bg-[#e4edf5] text-[#5f7f9b]",
    art: "camera",
  },
  {
    name: "cat",
    label: "Cat",
    Icon: Cat,
    className: "bg-[#f6eadf] text-[#8f6651]",
    art: "cat-sleep",
  },
  {
    name: "bow",
    label: "Bow",
    Icon: Ribbon,
    className: "bg-[#fbd9e3] text-[#c05470]",
    art: "bow-small",
  },
  {
    name: "sparkle",
    label: "Sparkle",
    Icon: Sparkles,
    className: "bg-[#f8efcf] text-[#b08a3c]",
    art: "sparkle",
  },
];

export function getSticker(name: StickerName) {
  return stickerOptions.find((sticker) => sticker.name === name) ?? stickerOptions[0];
}

export function Sticker({
  name,
  className,
  size = "md",
}: {
  name: StickerName;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const art = STICKER_ART[name];

  if (art) {
    return <ArtSticker name={art} className={className} size={size} />;
  }

  const sticker = getSticker(name);
  const Icon = sticker.Icon;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "sticker-shadow inline-flex items-center justify-center rounded-full ring-2 ring-white/80",
        sticker.className,
        size === "sm" && "size-12",
        size === "md" && "size-16",
        size === "lg" && "size-20",
        className,
      )}
    >
      <Icon
        className={cn(
          size === "sm" && "size-6",
          size === "md" && "size-8",
          size === "lg" && "size-10",
        )}
        strokeWidth={2.2}
      />
    </span>
  );
}
