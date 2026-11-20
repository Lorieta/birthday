import type { ArtName } from "@/lib/sticker-art";
import { cn } from "@/lib/utils";

export function ArtImage({
  className,
}: {
  name: ArtName;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return <span aria-hidden="true" className={cn("hidden", className)} />;
}

export function ArtSticker({
  className,
  size = "md",
}: {
  name: ArtName;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "hidden",
        size === "sm" && "size-12",
        size === "md" && "size-16",
        size === "lg" && "size-20",
        className,
      )}
    />
  );
}
