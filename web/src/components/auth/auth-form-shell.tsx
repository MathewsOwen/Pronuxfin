"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Cartão premium partilhado — login, registo, recuperação de senha. */
export function AuthFormShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: Props) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-white/12 bg-[oklch(0.11_0.025_262/0.92)] shadow-[0_32px_100px_oklch(0_0_0/0.45)] ring-1 ring-white/[0.06] backdrop-blur-2xl",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-40 motion-safe:animate-[spin_14s_linear_infinite] motion-reduce:hidden"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, color-mix(in oklch, var(--primary) 50%, transparent), color-mix(in oklch, var(--cognitive) 40%, transparent), transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-40 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <CardHeader className="relative gap-3 pb-2">
        {eyebrow ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            {eyebrow}
          </p>
        ) : null}
        <CardTitle className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
          {title}
        </CardTitle>
        <CardDescription className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative grid gap-4 pb-2">{children}</CardContent>
      {footer ? (
        <CardFooter className="relative flex flex-col gap-4 border-t border-white/10 bg-transparent pt-6">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
