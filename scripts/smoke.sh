#!/usr/bin/env bash
# Delegates to cross-platform runner (Node 20+)
exec node "$(dirname "$0")/smoke.mjs" "$@"
