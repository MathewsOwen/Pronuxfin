import { Suspense } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout>
      <Suspense
        fallback={
          <div className="skeleton-shimmer h-96 rounded-xl bg-muted/25 ring-1 ring-white/10" />
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthPageLayout>
  );
}
