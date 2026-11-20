import Image from "next/image";
import { getArt, isPersonArt, type ArtName } from "@/lib/sticker-art";
import { cn } from "@/lib/utils";

export function ArtImage({
  name,
  className,
  alt,
  priority = false,
}: {
  name: ArtName;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  const art = getArt(name);
  if (!art) return null;

  return (
    <Image
      src={art.src}
      alt={alt ?? ""}
      width={art.width}
      height={art.height}
      priority={priority}
      className={cn(
        "pointer-events-none h-auto max-w-full select-none object-contain",
        className,
      )}
    />
  );
}

const stickerSizes = {
  xs: "w-9 sm:w-10",
  sm: "w-12 sm:w-14",
  md: "w-16 sm:w-[4.5rem]",
  lg: "w-20 sm:w-24",
} as const;

const personStickerSizes = {
  xs: "w-14 sm:w-16",
  sm: "w-20 sm:w-24",
  md: "w-28 sm:w-32",
  lg: "w-36 sm:w-40",
} as const;

export function ArtSticker({
  name,
  className,
  size = "md",
}: {
  name: ArtName;
  className?: string;
  size?: keyof typeof stickerSizes;
}) {
  const art = getArt(name);
  if (!art) return null;

  const sizeClass = isPersonArt(name)
    ? personStickerSizes[size]
    : stickerSizes[size];

  return (
    <Image
      src={art.src}
      alt=""
      width={art.width}
      height={art.height}
      className={cn(
        "sticker-shadow pointer-events-none h-auto max-w-full select-none object-contain",
        sizeClass,
        className,
      )}
    />
  );
}
