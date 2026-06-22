"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  useAuthUpstreamWarmup,
  warmAuthUpstreamFromBrowser,
} from "@/hooks/use-auth-upstream-warmup";
import { isAuthApiCode } from "@/lib/auth/api-error-codes";
import { apiMutation } from "@/lib/http/api-mutation-fetch";
import { AUTH_CLIENT_TIMEOUT_MS } from "@/lib/http/auth-timeout";
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
  const warmup = useAuthUpstreamWarmup();

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

    const postForgot = () =>
      apiMutation("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
        signal: AbortSignal.timeout(AUTH_CLIENT_TIMEOUT_MS),
      });

    try {
      if (warmup !== "ready") {
        await warmAuthUpstreamFromBrowser();
      }

      let res = await postForgot();
      let json = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };

      if (!res.ok && json.code === "UPSTREAM_TIMEOUT") {
        await warmAuthUpstreamFromBrowser();
        res = await postForgot();
        json = (await res.json().catch(() => ({}))) as {
          message?: string;
          code?: string;
        };
      }

      if (!res.ok) {
        if (json.code && isAuthApiCode(json.code)) {
          setApiError(tApi(json.code));
        } else {
          setApiError(json.message?.trim() || t("errorGeneric"));
        }
        return;
      }

      setSent(true);
    } catch {
      setApiError(t("errorTimeout"));
    }
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
              disabled={!email.trim() || sent || isSubmitting || warmup === "warming"}
              className={cn(buttonVariants({ size: "lg" }), "glow-ring h-12 w-full text-base")}
            >
              {sent
                ? t("sentState")
                : isSubmitting
                  ? t("submitting")
                  : warmup === "warming"
                    ? t("warmingSubmitWait")
                    : t("submit")}
            </button>
            <Link
              href="/login"
              className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("backLogin")}
            </Link>
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
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className="h-11 border-white/10 bg-black/30"
            disabled={sent}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        {sent ? (
          <p className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            {t("sentHint")}
          </p>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
                <KeyRound className="size-4" aria-hidden />
              </div>
              <p className="leading-relaxed">{t("deliveryHint")}</p>
            </div>
          </div>
        )}
      </AuthFormShell>
    </form>
  );
}
