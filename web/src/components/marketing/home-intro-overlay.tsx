"use client";

import dynamic from "next/dynamic";

const PronuxIntroOverlay = dynamic(
  () =>
    import("@/components/marketing/pronux-intro-overlay").then((mod) => ({
      default: mod.PronuxIntroOverlay,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 z-[200] bg-[#010103]"
        data-pronux-intro-root
        aria-hidden
      />
    ),
  },
);

export function HomeIntroOverlay() {
  return <PronuxIntroOverlay />;
}
