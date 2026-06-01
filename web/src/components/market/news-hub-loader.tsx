"use client";

import dynamic from "next/dynamic";
import { DeskPageSkeleton } from "@/components/marketing/desk-page-skeleton";
import type { NewsDesk, NewsWorldRegion } from "@/lib/market/news-feeds-config";

const NewsLiveHub = dynamic(
  () =>
    import("@/components/market/news-live-hub").then((m) => ({
      default: m.NewsLiveHub,
    })),
  { loading: () => <DeskPageSkeleton /> },
);

type NewsHubLoaderProps = {
  initialDesk?: NewsDesk | null;
  initialChannel?: string | null;
  initialRegion?: NewsWorldRegion | null;
};

export function NewsHubLoader({
  initialDesk = null,
  initialChannel = null,
  initialRegion = null,
}: NewsHubLoaderProps) {
  return (
    <NewsLiveHub
      initialDesk={initialDesk}
      initialChannel={initialChannel}
      initialRegion={initialRegion}
    />
  );
}
