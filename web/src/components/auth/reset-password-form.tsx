"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { apiMutation } from "@/lib/http/api-mutation-fetch";
import {
  createResetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const tVal = useTranslations("Auth.validation");
  const tApi = useTranslations("AuthErrors");
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [apiError, setApiError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const resetSchema = useMemo(
    () =>
      createResetPasswordSchema({
        tokenRequired: tVal("tokenRequired"),
        passwordMin: tVal("passwordMin"),
        passwordLetters: tVal("passwordLetters"),
        passwordDigits: tVal("passwordDigits"),
        passwordMismatch: tVal("passwordMismatch"),
      }),
    [tVal],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    setApiError(null);
    const res = await apiMutation("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: data.token,
        password: data.password,
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

    setCompleted(true);
  };

  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/20 bg-primary/10 text-status-warning">
            <KeyRound className="size-3" />
            {t("signalReset")}
          </Badge>
          <AuthPill>{t("signalExpiry")}</AuthPill>
          <AuthPill>{t("signalSecurity")}</AuthPill>
        </div>
        <CardTitle className="font-heading text-xl">{t("title")}</CardTitle>
        <CardDescription className="max-w-sm leading-relaxed">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          {!token ? (
            <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t("missingToken")}
            </p>
          ) : null}
          {apiError ? (
            <p
              role="alert"
              aria-live="assertive"
              className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {apiError}
            </p>
          ) : null}
          {completed ? (
            <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-4 text-sm text-primary">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-primary/25 bg-primary/10 p-2">
                  <ShieldCheck className="size-4" />
                </div>
                <p className="leading-relaxed">{t("successHint")}</p>
              </div>
            </div>
          ) : (
            <>
              <input type="hidden" value={token} {...register("token")} />
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="h-10 border-white/10 bg-black/25"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
                )}
              </div>
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="h-10 border-white/10 bg-black/25"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword ? (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/10 bg-transparent">
          {completed ? (
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "glow-ring h-11 w-full")}>
              {t("backToLogin")}
            </Link>
          ) : (
            <button
              type="submit"
              disabled={!token || isSubmitting}
              className={cn(buttonVariants({ size: "lg" }), "glow-ring h-11 w-full")}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </button>
          )}
          <Link
            href="/forgot-password"
            className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("requestNewLink")}
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
