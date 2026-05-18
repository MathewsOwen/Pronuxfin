import { cn } from "@/lib/utils";

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
      <span
        className="size-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-cognitive shadow-[0_0_12px_color-mix(in_oklch,var(--primary)_40%,transparent)]"
        aria-hidden
      />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <SectionEyebrow>
          {eyebrow}
        </SectionEyebrow>
      ) : null}
      <h2 className="font-heading mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-pretty text-muted-foreground leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
