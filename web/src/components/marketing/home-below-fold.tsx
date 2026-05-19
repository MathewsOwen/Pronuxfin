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
const ProductDeskPreviewSection = dynamic(
  () =>
    import("@/components/marketing/product-desk-preview-section").then((m) => ({
      default: m.ProductDeskPreviewSection,
    })),
  { loading: SectionPlaceholder },
);
const HomeFaqSection = dynamic(
  () =>
    import("@/components/marketing/home-faq-section").then((m) => ({
      default: m.HomeFaqSection,
    })),
  { loading: SectionPlaceholder },
);
const CtaSection = dynamic(
  () => import("@/components/marketing/landing-sections").then((m) => ({ default: m.CtaSection })),
  { loading: SectionPlaceholder },
);

export function HomeBelowFold() {
  return (
    <div className="below-fold-stack">
      <IaSection />
      <BenefitsSection />
      <FeaturesSection />
      <ToolsPreviewSection />
      <ProductDeskPreviewSection />
      <HomeFaqSection />
      <CtaSection />
    </div>
  );
}
