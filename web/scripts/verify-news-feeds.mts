import { fetchAggregatedNewsWithDiagnostics } from "@/lib/market/fetch-news";

const runs = Number(process.argv[2] ?? 5);
let allOk = true;

for (let i = 1; i <= runs; i++) {
  const diag = await fetchAggregatedNewsWithDiagnostics(10);
  const failed = diag.sources.filter((s) => !s.ok);
  console.log(
    `Run ${i}: ${diag.feedsSucceeded}/${diag.feedsAttempted} OK, ${diag.articles.length} articles`,
  );
  if (failed.length > 0) {
    allOk = false;
    for (const f of failed) {
      console.log(`  FAIL ${f.source}: ${f.error}`);
    }
  }
}

if (!allOk) process.exit(1);
