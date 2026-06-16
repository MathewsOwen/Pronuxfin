"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthUpstreamWarmup, warmAuthUpstreamFromBrowser } from "@/hooks/use-auth-upstream-warmup";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { isAuthApiCode } from "@/lib/auth/api-error-codes";
import { apiMutation } from "@/lib/http/api-mutation-fetch";
import { AUTH_CLIENT_TIMEOUT_MS } from "@/lib/http/auth-timeout";
import {
  createRegisterSchema,
  type RegisterValues,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const t = useTranslations("Register");
  const tVal = useTranslations("Auth.validation");
  const tApi = useTranslations("AuthErrors");
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const warmup = useAuthUpstreamWarmup();

  const registerSchema = useMemo(
    () =>
      createRegisterSchema({
        emailInvalid: tVal("emailInvalid"),
        passwordMin: tVal("passwordMin"),
        passwordWeak: tVal("passwordWeak"),
        passwordCommon: tVal("passwordCommon"),
        nameRequired: tVal("nameRequired"),
        nameMax: tVal("nameMax"),
        termsRequired: tVal("termsRequired"),
      }),
    [tVal],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "", acceptTerms: false },
  });

  const onSubmit = async (data: RegisterValues) => {
    setApiError(null);
    const payload = {
      email: data.email,
      password: data.password,
      name: data.name.trim(),
      acceptTerms: true as const,
    };

    const postRegister = () =>
      apiMutation("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(AUTH_CLIENT_TIMEOUT_MS),
      });

    let res: Response;
    try {
      res = await postRegister();
      let json = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      if (!res.ok && json.code === "UPSTREAM_TIMEOUT") {
        await warmAuthUpstreamFromBrowser();
        res = await postRegister();
        json = (await res.json().catch(() => ({}))) as {
          message?: string;
          code?: string;
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
    } catch {
      setApiError(t("errorTimeout"));
      return;
    }
    router.push("/login?registered=1");
    router.refresh();
  };

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
              disabled={isSubmitting || warmup === "warming"}
              className={cn(buttonVariants({ size: "lg" }), "glow-ring h-12 w-full text-base")}
            >
              {isSubmitting
                ? t("submitting")
                : warmup === "warming"
                  ? t("warmingSubmitWait")
                  : t("submit")}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              {t("loginLead")}{" "}
              <Link href="/login" className="text-primary hover:underline">
                {t("loginLink")}
              </Link>
            </p>
          </>
        }
      >
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
        <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Label htmlFor="name">
            {t("name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            autoComplete="name"
            required
            aria-required
            aria-invalid={!!errors.name}
            className="h-11 border-white/10 bg-black/30"
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
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
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            className="h-11 border-white/10 bg-black/30"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          )}
        </div>
        <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <input
            id="acceptTerms"
            type="checkbox"
            className="mt-1 size-4 shrink-0 rounded border-white/20 accent-primary"
            aria-invalid={!!errors.acceptTerms}
            aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
            {...register("acceptTerms", {
              setValueAs: (value) => value === true || value === "on",
            })}
          />
          <Label htmlFor="acceptTerms" className="text-sm leading-relaxed text-muted-foreground">
            {t.rich("termsLabel", {
              terms: (chunks) => (
                <Link href="/termos" className="text-primary hover:underline">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacidade" className="text-primary hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </Label>
        </div>
        {errors.acceptTerms ? (
          <p id="acceptTerms-error" className="text-xs text-destructive" role="alert">
            {errors.acceptTerms.message}
          </p>
        ) : null}
      </AuthFormShell>
    </form>
  );
}
