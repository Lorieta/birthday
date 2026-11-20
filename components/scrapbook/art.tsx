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
      className={cn("pointer-events-none select-none", className)}
    />
  );
}

export function ArtSticker({
  name,
  className,
  size = "md",
}: {
  name: ArtName;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const art = getArt(name);
  if (!art) return null;

  const person = isPersonArt(name);
  const regularSize =
    size === "sm" ? "size-12" : size === "md" ? "size-16" : "size-20";
  const personSize =
    size === "sm" ? "size-20" : size === "md" ? "size-32" : "size-40";

  return (
    <Image
      src={art.src}
      alt=""
      width={art.width}
      height={art.height}
      className={cn(
        "sticker-shadow pointer-events-none select-none object-contain",
        person ? personSize : regularSize,
        className,
        person && personSize,
      )}
    />
  );
}
