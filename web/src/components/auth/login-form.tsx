"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthUpstreamWarmup } from "@/hooks/use-auth-upstream-warmup";
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
  createLoginSchema,
  type LoginValues,
} from "@/lib/validations/auth";
import { LoginWebAuthnStep } from "@/components/auth/login-webauthn-step";
import { apiMutation } from "@/lib/http/api-mutation-fetch";
import { AUTH_CLIENT_TIMEOUT_MS } from "@/lib/http/auth-timeout";
import { safeInternalRedirectPath } from "@/lib/http/safe-redirect-path";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const t = useTranslations("Login");
  const tVal = useTranslations("Auth.validation");
  const tApi = useTranslations("AuthErrors");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);
  const [webauthnChallengeId, setWebauthnChallengeId] = useState<string | null>(null);
  const warmup = useAuthUpstreamWarmup();
  const justRegistered = searchParams.get("registered") === "1";

  const loginSchema = useMemo(
    () =>
      createLoginSchema({
        emailInvalid: tVal("emailInvalid"),
        passwordRequired: tVal("passwordRequired"),
      }),
    [tVal],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginValues) => {
    setApiError(null);
    let res: Response;
    try {
      res = await apiMutation("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          locale: locale === "en" ? "en" : "pt-BR",
        }),
        signal: AbortSignal.timeout(AUTH_CLIENT_TIMEOUT_MS),
      });
    } catch {
      setApiError(t("errorTimeout"));
      return;
    }
    const json = (await res.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
      webauthnRequired?: boolean;
      challengeId?: string;
    };
    if (!res.ok) {
      if (json.code && isAuthApiCode(json.code)) {
        const base = tApi(json.code);
        const detail = json.message?.trim();
        if (json.code === "VALIDATION_FAILED" && detail) {
          setApiError(`${base} — ${detail}`);
        } else {
          setApiError(base);
        }
      } else {
        setApiError(json.message?.trim() || t("errorGeneric"));
      }
      return;
    }
    if (json.webauthnRequired && json.challengeId) {
      setWebauthnChallengeId(json.challengeId);
      return;
    }
    const dest = safeInternalRedirectPath(searchParams.get("from"));
    router.push(dest);
    router.refresh();
  };

  function finishLogin() {
    const dest = safeInternalRedirectPath(searchParams.get("from"));
    router.push(dest);
    router.refresh();
  }

  return (
    <Card className="glass-panel card-shine border-white/10 shadow-none ring-0">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/20 bg-primary/10 text-status-warning">
            <ShieldCheck className="size-3" />
            {t("signalAccess")}
          </Badge>
          <AuthPill>{t("signalValidation")}</AuthPill>
          <AuthPill>{t("signalSession")}</AuthPill>
        </div>
        <CardTitle className="font-heading text-xl">{t("title")}</CardTitle>
        <CardDescription className="max-w-sm leading-relaxed">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          {justRegistered && !apiError ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground"
            >
              {t("registeredNotice")}
            </p>
          ) : null}
          {warmup === "warming" ? (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-muted-foreground">
              {t("warmingHint")}
            </p>
          ) : null}
          {apiError ? (
            <p
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {apiError}
            </p>
          ) : null}
          {webauthnChallengeId ? (
            <LoginWebAuthnStep
              challengeId={webauthnChallengeId}
              locale={locale}
              onCancel={() => setWebauthnChallengeId(null)}
              onSuccess={finishLogin}
            />
          ) : null}
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className="h-10 border-white/10 bg-black/25"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                {t("forgotLink")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="h-10 border-white/10 bg-black/25"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/10 bg-transparent">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(buttonVariants({ size: "lg" }), "glow-ring h-11 w-full")}
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {t("registerLead")}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {t("registerLink")}
            </Link>
          </p>
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
