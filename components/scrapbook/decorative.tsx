import { ArtImage } from "@/components/scrapbook/art";
import { WASHI_ART } from "@/lib/sticker-art";
import { cn } from "@/lib/utils";

export function Bow({ className }: { className?: string }) {
  return <ArtImage name="bow-large" className={cn("object-contain", className)} />;
}

export function WashiTape({
  className,
  tone = "pink",
}: {
  className?: string;
  tone?: "pink" | "sage";
}) {
  return (
    <ArtImage
      name={WASHI_ART[tone]}
      className={cn("washi-tape object-fill", className)}
    />
  );
}

export function HeartDoodle({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  if (filled) {
    return <ArtImage name="heart" className={cn("size-4", className)} />;
  }

  return (
    <svg
      viewBox="0 0 32 30"
      aria-hidden="true"
      className={cn("size-4", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 27S3.5 19.4 3.5 10.8C3.5 6.4 6.9 3 11.1 3c2.5 0 4.1 1.3 4.9 2.6C16.8 4.3 18.4 3 20.9 3c4.2 0 7.6 3.4 7.6 7.8C28.5 19.4 16 27 16 27z" />
    </svg>
  );
}

export function LaceCorner({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={cn(className, flip && "-scale-x-100")}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" opacity=".45">
        <path d="M2 118C2 68 28 24 78 4" />
        <path d="M10 118c0-44 20-80 62-100" opacity=".6" />
        <path d="M2 100c12-10 24-10 36 0s24 10 36 0 24-10 36 0" opacity=".4" />
        <circle cx="18" cy="94" r="4" />
        <circle cx="40" cy="81" r="4" />
        <circle cx="63" cy="65" r="4" />
        <circle cx="82" cy="45" r="4" />
        <circle cx="98" cy="23" r="4" />
      </g>
    </svg>
  );
}

export function HandUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 18"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-3 w-full text-rose/70", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M3 12c52-7 111-9 168-6 44 2 88 4 126 1" />
      <path d="M20 16c63-5 126-5 190-2" opacity=".55" />
    </svg>
  );
}

export function LittleHearts({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute flex items-center gap-3 text-rose/60",
        className,
      )}
    >
      <HeartDoodle className="size-5 rotate-[-10deg]" />
      <HeartDoodle className="size-3 translate-y-2 rotate-[8deg]" />
      <HeartDoodle className="size-4 -translate-y-1 rotate-[-4deg]" />
    </span>
  );
}

export function SparkleDoodle({
  className,
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("sticker-shadow", className)}
      fill="currentColor"
    >
      <path d="M12 1.8c.6 5 2.4 7.9 8.2 9.2-5.8 1.4-7.6 4.2-8.2 9.2-.6-5-2.4-7.8-8.2-9.2C9.6 9.7 11.4 6.8 12 1.8z" />
    </svg>
  );
}

export function ScallopEdge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 16"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-4 w-full", className)}
    >
      <path
        d="M0 0h200v2c-10 0-10 12-20 12S170 2 160 2s-10 12-20 12S130 2 120 2s-10 12-20 12S90 2 80 2 70 14 60 14 50 2 40 2 30 14 20 14 10 2 0 2z"
        fill="currentColor"
        opacity=".12"
      />
    </svg>
  );
}
