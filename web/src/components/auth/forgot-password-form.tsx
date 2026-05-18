"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { isAuthApiCode } from "@/lib/auth/api-error-codes";
import {
  createForgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const t = useTranslations("ForgotPassword");
  const tVal = useTranslations("Auth.validation");
  const tApi = useTranslations("AuthErrors");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const forgotSchema = useMemo(
    () =>
      createForgotPasswordSchema({
        emailInvalid: tVal("emailInvalid"),
      }),
    [tVal],
  );
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });
  const email = useWatch({ control, name: "email" }) ?? "";

  const onSubmit = async (data: ForgotPasswordValues) => {
    setApiError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        locale,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
    };
    if (!res.ok) {
      if (json.code && isAuthApiCode(json.code)) {
        setApiError(tApi(json.code));
      } else {
        setApiError(json.message?.trim() || t("errorGeneric"));
      }
      return;
    }

    setSent(true);
  };

  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/20 bg-primary/10 text-status-warning">
            <MailCheck className="size-3" />
            {t("signalRecovery")}
          </Badge>
          <AuthPill>{t("signalToken")}</AuthPill>
          <AuthPill>{t("signalContinuity")}</AuthPill>
        </div>
        <CardTitle className="font-heading text-xl">{t("title")}</CardTitle>
        <CardDescription className="max-w-sm leading-relaxed">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          {apiError ? (
            <p
              role="alert"
              aria-live="assertive"
              className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {apiError}
            </p>
          ) : null}
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("tokenizedHint")}
              </span>
            </div>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-10 border-white/10 bg-black/25"
              disabled={sent}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          {sent ? (
            <p className="rounded-2xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
              {t("sentHint")}
            </p>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
                  <KeyRound className="size-4" />
                </div>
                <p className="leading-relaxed">{t("deliveryHint")}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/10 bg-transparent">
          <button
            type="submit"
            disabled={!email.trim() || sent || isSubmitting}
            className={cn(buttonVariants({ size: "lg" }), "glow-ring h-11 w-full")}
          >
            {sent ? t("sentState") : isSubmitting ? t("submitting") : t("submit")}
          </button>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("backLogin")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

function AuthPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}
