"use client";

import dynamic from "next/dynamic";
import { DeskPageSkeleton } from "@/components/marketing/desk-page-skeleton";

const ProjecaoHub = dynamic(
  () =>
    import("@/components/market/projecao-hub").then((m) => ({
      default: m.ProjecaoHub,
    })),
  { loading: () => <DeskPageSkeleton /> },
);

export function ProjecaoHubLoader({ loggedIn }: { loggedIn: boolean }) {
  return <ProjecaoHub loggedIn={loggedIn} />;
}
