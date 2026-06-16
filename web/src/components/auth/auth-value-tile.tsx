import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string;
  className?: string;
};

export function AuthValueTile({ title, value, className }: Props) {
  return (
    <li
      className={cn(
        "group/tile list-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5",
        "shadow-[inset_0_1px_0_oklch(1_0_0/0.06),0_8px_32px_oklch(0_0_0/0.2)]",
        "backdrop-blur-sm transition-all duration-300",
        "hover:border-primary/25 hover:bg-white/[0.06] hover:shadow-[0_12px_40px_color-mix(in_oklch,var(--primary)_12%,transparent)]",
        className,
      )}
    >
      <div
        className="pointer-events-none mb-2 h-px w-8 bg-gradient-to-r from-primary/70 to-transparent opacity-60 transition-all duration-300 group-hover/tile:w-12 group-hover/tile:opacity-100"
        aria-hidden
      />
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary/80">{title}</p>
      <p className="mt-1.5 text-sm font-medium leading-snug text-foreground">{value}</p>
    </li>
  );
}
