"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthUpstreamWarmup, warmAuthUpstreamFromBrowser } from "@/hooks/use-auth-upstream-warmup";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { buttonVariants } from "@/components/ui/button";
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

    const postLogin = () =>
      apiMutation("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          locale: locale === "en" ? "en" : "pt-BR",
        }),
        signal: AbortSignal.timeout(AUTH_CLIENT_TIMEOUT_MS),
      });

    try {
      let res = await postLogin();
      let json = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
        webauthnRequired?: boolean;
        challengeId?: string;
      };

      if (!res.ok && json.code === "UPSTREAM_TIMEOUT") {
        await warmAuthUpstreamFromBrowser();
        res = await postLogin();
        json = (await res.json().catch(() => ({}))) as {
          message?: string;
          code?: string;
          webauthnRequired?: boolean;
          challengeId?: string;
        };
      }

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
    } catch {
      setApiError(t("errorTimeout"));
    }
  };

  function finishLogin() {
    const dest = safeInternalRedirectPath(searchParams.get("from"));
    router.push(dest);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <AuthFormShell
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        footer={
          <>
            <button
              type="submit"
              disabled={isSubmitting || warmup === "warming" || !!webauthnChallengeId}
              className={cn(buttonVariants({ size: "lg" }), "glow-ring h-12 w-full text-base")}
            >
              {isSubmitting
                ? t("submitting")
                : warmup === "warming"
                  ? t("warmingSubmitWait")
                  : t("submit")}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              {t("registerLead")}{" "}
              <Link href="/register" className="text-primary hover:underline">
                {t("registerLink")}
              </Link>
            </p>
          </>
        }
      >
        {justRegistered && !apiError ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"
          >
            {t("registeredNotice")}
          </p>
        ) : null}
        {warmup === "warming" ? (
          <p className="rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-muted-foreground">
            {t("warmingHint")}
          </p>
        ) : null}
        {apiError ? (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
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
        <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className="h-11 border-white/10 bg-black/30"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              {t("forgotLink")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className="h-11 border-white/10 bg-black/30"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
      </AuthFormShell>
    </form>
  );
}
