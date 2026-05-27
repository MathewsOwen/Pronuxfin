# Repo Governance

This document defines how top-level projects are managed to avoid architecture drift and "frankenstein" coupling.

## Project Modes

- `integrated`: source of truth is this monorepo.
- `external-mirror`: folder mirrors another repository and keeps its own Git history.
- `incubator`: experimental module not yet production-owned.

## Current Classification

- `web`: integrated
- `backend`: integrated
- `dashboard-planilha`: external-mirror
- `github-profile-MathewsOwen`: external-mirror
- `projeto_ong`: external-mirror

The machine-readable source of truth is `.repo-governance.json`.

## Rules

1. Any nested `.git` directory must be declared in `.repo-governance.json`.
2. Generated artifacts and runtime environments (`.venv`, `__pycache__`, mobile generated assets) must not be tracked in this repository.
3. Any new top-level folder must declare:
   - owner
   - mode
   - source repository (if external)
4. Architecture-sensitive changes should run:
   - `npm run repo:hygiene`
   - `npm run repo:hygiene:strict` (CI-safe mode)
