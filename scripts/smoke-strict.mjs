#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync(process.execPath, [resolve(import.meta.dirname, "smoke.mjs")], {
  env: { ...process.env, SMOKE_STRICT: "1" },
  stdio: "inherit",
});

process.exit(result.status ?? 1);
