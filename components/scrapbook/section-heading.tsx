import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeartDoodle } from "@/components/scrapbook/decorative";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  href,
  action,
  actionLabel = "View all",
  className,
}: {
  title: string;
  href?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-3 sm:gap-4", className)}>
      <div className="flex items-center gap-2.5">
        <HeartDoodle className="size-5 -rotate-6 text-rose/80" filled />
        <h2 className="font-hand text-3xl leading-none font-semibold tracking-wide text-ink sm:text-[2.1rem]">
          {title}
        </h2>
        <HeartDoodle className="size-3.5 translate-y-1 text-rose/60" />
      </div>
      <div className="dotted-divider mb-1.5 h-2 flex-1 opacity-50" />
      {action ? (
        <div className="mb-0.5 shrink-0">{action}</div>
      ) : href ? (
        <Link
          href={href}
          className="group mb-1 inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-rose-deep"
        >
          {actionLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
