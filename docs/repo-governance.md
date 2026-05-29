# Repo Governance

This monorepo contains **only** the PRONUXFIN product:

| Path | Mode |
|------|------|
| `web/` | integrated |
| `backend/` | integrated |

## External projects

NEXUS-CENTURIAN, Grafyco, dashboard-planilha, projeto_ong, and similar tools live in **separate directories or repositories** on the developer machine. They must **not** be copied into `PronuxFin/` — root `.gitignore` blocks them.

## Rules

1. No nested `.git` directories under this repo (except the root).
2. Generated artifacts and runtime environments (`.venv`, `__pycache__`, mobile generated assets) must not be tracked.
3. Before architecture-sensitive PRs, run:
   - `npm run repo:hygiene`
   - `npm run repo:hygiene:strict` (CI)

Machine-readable config: `.repo-governance.json`.
