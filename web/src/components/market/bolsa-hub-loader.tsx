"use client";

import dynamic from "next/dynamic";
import { BolsaHubSkeleton } from "@/components/market/bolsa-hub-skeleton";

const BolsaLiveHub = dynamic(
  () => import("@/components/market/bolsa-live-hub").then((m) => ({ default: m.BolsaLiveHub })),
  { loading: () => <BolsaHubSkeleton /> },
);

export function BolsaHubLoader() {
  return <BolsaLiveHub />;
}
