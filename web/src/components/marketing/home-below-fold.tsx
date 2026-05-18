"use client";

import dynamic from "next/dynamic";

function SectionPlaceholder() {
  return <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-hidden />;
}

const IaSection = dynamic(
  () => import("@/components/marketing/landing-sections").then((m) => ({ default: m.IaSection })),
  { loading: SectionPlaceholder },
);
const BenefitsSection = dynamic(
  () =>
    import("@/components/marketing/landing-sections").then((m) => ({
      default: m.BenefitsSection,
    })),
  { loading: SectionPlaceholder },
);
const FeaturesSection = dynamic(
  () =>
    import("@/components/marketing/landing-sections").then((m) => ({
      default: m.FeaturesSection,
    })),
  { loading: SectionPlaceholder },
);
const ToolsPreviewSection = dynamic(
  () =>
    import("@/components/marketing/tools-preview-section").then((m) => ({
      default: m.ToolsPreviewSection,
    })),
  { loading: SectionPlaceholder },
);
const DashboardMockSection = dynamic(
  () =>
    import("@/components/marketing/landing-sections").then((m) => ({
      default: m.DashboardMockSection,
    })),
  { loading: SectionPlaceholder },
);
const CtaSection = dynamic(
  () => import("@/components/marketing/landing-sections").then((m) => ({ default: m.CtaSection })),
  { loading: SectionPlaceholder },
);

export function HomeBelowFold() {
  return (
    <>
      <IaSection />
      <BenefitsSection />
      <FeaturesSection />
      <ToolsPreviewSection />
      <DashboardMockSection />
      <CtaSection />
    </>
  );
}
