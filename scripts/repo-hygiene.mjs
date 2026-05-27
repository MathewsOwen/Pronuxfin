#!/usr/bin/env node
/**
 * Repo hygiene guardrail for monorepo consistency.
 * Usage:
 *   node scripts/repo-hygiene.mjs
 *   node scripts/repo-hygiene.mjs --strict
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const isStrict = process.argv.includes("--strict");
const governancePath = path.join(root, ".repo-governance.json");

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".cursor",
]);

const FORBIDDEN_TRACKED_PATTERNS = [
  /(^|\/)\.venv\//,
  /(^|\/)venv\//,
  /(^|\/)__pycache__\//,
  /\.pyc$/,
  /(^|\/)android\/capacitor-cordova-android-plugins\//,
  /(^|\/)ios\/capacitor-cordova-ios-plugins\//,
  /(^|\/)android\/app\/src\/main\/assets\/public\/assets\//,
  /(^|\/)ios\/App\/App\/public\/assets\//,
];

function loadGovernanceConfig() {
  try {
    const parsed = JSON.parse(readFileSync(governancePath, "utf8"));
    const allowed = Array.isArray(parsed.allowedNestedGit)
      ? parsed.allowedNestedGit.map((item) => String(item).trim()).filter(Boolean)
      : [];
    return new Set(allowed);
  } catch {
    return new Set();
  }
}

function walkForNestedGit(dir, found = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const full = path.join(dir, entry.name);
    if (entry.name === ".git") {
      if (path.resolve(full) !== path.resolve(path.join(root, ".git"))) {
        found.push(path.relative(root, full).replaceAll("\\", "/"));
      }
      continue;
    }
    if (IGNORE_DIRS.has(entry.name)) continue;
    walkForNestedGit(full, found);
  }
  return found;
}

function getTrackedFiles() {
  const result = spawnSync("git", ["ls-files"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error("Unable to list tracked files with git ls-files.");
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function filterForbiddenTracked(files) {
  return files.filter((file) =>
    FORBIDDEN_TRACKED_PATTERNS.some((pattern) => pattern.test(file)),
  );
}

let warnings = 0;

const nestedGit = walkForNestedGit(root);
const allowlistedNestedGit = loadGovernanceConfig();
const unexpectedNestedGit = nestedGit.filter(
  (rel) => !allowlistedNestedGit.has(rel.replace(/\/\.git$/, "")),
);
if (nestedGit.length > 0) {
  if (unexpectedNestedGit.length === 0) {
    console.log("OK nested git repos are declared in .repo-governance.json.");
  } else {
    warnings += 1;
    console.warn("WARN nested git repositories detected:");
    for (const rel of nestedGit) console.warn(`  - ${rel}`);
  }
}
if (unexpectedNestedGit.length > 0) {
  console.warn("WARN undeclared nested git repositories detected:");
  for (const rel of unexpectedNestedGit) console.warn(`  - ${rel}`);
}

let forbiddenTracked = [];
try {
  forbiddenTracked = filterForbiddenTracked(getTrackedFiles());
} catch (error) {
  warnings += 1;
  console.warn(`WARN could not evaluate tracked files: ${error.message}`);
}

if (forbiddenTracked.length > 0) {
  warnings += 1;
  console.warn("WARN tracked generated/runtime artifacts detected:");
  for (const rel of forbiddenTracked.slice(0, 30)) console.warn(`  - ${rel}`);
  if (forbiddenTracked.length > 30) {
    console.warn(`  ... and ${forbiddenTracked.length - 30} more`);
  }
}

if (warnings === 0) {
  console.log("OK repo hygiene checks passed.");
  process.exit(0);
}

if (isStrict) {
  console.error("\nRepo hygiene checks failed in strict mode.");
  process.exit(1);
}

console.warn("\nRepo hygiene warnings found (non-strict mode).");
process.exit(0);
