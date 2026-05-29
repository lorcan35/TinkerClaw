# TinkerClaw ⟷ OpenClaw — Upstream-Sync & Rebrand Strategy

- **Date:** 2026-05-29
- **Status:** Strategy (verified by audit; not yet executed)
- **Backup:** the 9 irreplaceable value files are copied to `~/projects/TinkerClaw-backups/value-2026-05-29/` (sha256 manifest there)

> Produced by a 5-agent audit of `main` vs a freshly-fetched `upstream/main`. Correction to prior notes: upstream is **NOT** stale at 2026.3.14 — that was only the local `~/Desktop/openclaw` mirror. Real `upstream/main` = **2026.5.28**, tip `4b6517d`, 2026-05-29.

## 1. TL;DR

- **Current state:** `main` is a 14-commit **copy-fork** frozen at `2026.3.14`. Root commit `c2585e1` is an **orphan** — `git merge-base main upstream/main` is empty. Rebrand is a shallow, incomplete string-swap.
- **The gap:** upstream is `2026.5.28` (today), ~2.5 months ahead, with real value (Gateway `/models` ~4100× speedup, **local-GGUF embedding sidecar + Ollama/LM Studio fixes that help Dragon Local mode**, Transcripts, realtime voice, TTS upgrade, security hardening) **plus breaking changes** (Node 22.16→22.19, pnpm 10→11, Pi internalized, WhatsApp/Slack/Bedrock/Vertex externalized, BlueBubbles + codex-cli removed).
- **Trap to avoid:** `git merge upstream/main` into `main` needs `--allow-unrelated-histories` → all ~19,741 files conflict. Unmergeable.
- **Recommendation:** adopt the existing **`sync/openclaw-v2026.5.5`** branch (real upstream ancestry, merge-base `46a04099`), bring it current to `2026.5.28`, **convert the rebrand to a thin compat shim** via the already-present `src/compat/legacy-names.ts`, and make it the new `main`.
- **Product surface = 9 files:** persona `SOUL/IDENTITY/USER/HEARTBEAT/MEMORY/TOOLS.md` (functional — loaded into the agent system prompt by `src/agents/workspace.ts`), `dragon-config.json`, `systemd/{tinkerclaw-gateway,kimi-acp}.service`. Everything else is replaceable rebranding.

## 2. Divergence picture

| Metric | Value |
|---|---|
| `main` HEAD | `f91d1a2` 2026-05-05, version `2026.3.14` |
| `main` total commits | 14 (root = orphan `c2585e1`, no parent) |
| `upstream/main` tip | `4b6517d` 2026-05-29, version `2026.5.28` |
| `git merge-base main upstream/main` | **EMPTY, exit 1** (no shared ancestor) |
| `git diff --name-only c2585e1 upstream/main` | **19,741 files differ** |
| Upstream tree growth | 9,230 → 19,109 files in ~2.5 months |

**Conflict surface** — of the 275 files `main` touched post-fork: **245 still exist upstream and differ** (175 `.ts` + 68 `package.json` + 2 `.md`, almost all pure `OPENCLAW_*→TINKERCLAW_*` rebrand collisions); **21 were deleted/renamed upstream** (stranded edits — `src/browser/*`, `src/infra/bonjour.ts`, `src/agents/pi-model-discovery.ts`, etc.); **9 are genuine TinkerClaw-new** (never conflict).

**Existing integration line:** `sync/openclaw-v2026.5.5` shares a real merge-base with upstream (`46a04099`, 2026-05-04) and carries 4 commits (rebase + rebrand sweep + plugin-loader fixup + contracts docs). It's the right base but is itself now ~12,800 commits behind (`2026.5.5` vs `2026.5.28`).

## 3. Merge strategy — REBASE-of-rebrand onto the `sync` line (not a merge into `main`)

```bash
cd ~/projects/TinkerClaw
git fetch upstream main
git checkout sync/openclaw-v2026.5.5
git checkout -b sync/openclaw-v2026.5.28
# Replay value commits; DROP the rebrand sweep (redone via shim, Section 4)
git rebase --onto upstream/main 46a04099 sync/openclaw-v2026.5.28
#   conflict rule: take UPSTREAM for rebrand-only collisions, OURS for the 9 value files
corepack prepare pnpm@11.2.2 --activate
rm -f pnpm-lock.yaml && pnpm install     # regenerate; never hand-merge the lock
pnpm test
```

**Cadence:** monthly rebase of `sync/openclaw-v<version>` onto the latest upstream tag. After the shim (Section 4) the conflict surface drops to ~0, so monthly syncs become routine.

**Preserve value-add:** back up the 6 persona files out-of-band first (done); carry the 9 net-new files verbatim; reconcile `dragon-config.json` (git seed says `qwen3:1.7b`, live default is **MiniMax-M2.5**) against the live `~/.tinkerclaw/tinkerclaw.json`; decide `tinkerclaw-telegram.service` deliberately (sync branch deleted it).

## 4. Rebrand-completion — drive from the seam, not a tree-wide sed

The fork already ships `src/compat/legacy-names.ts` for exactly this but never used it (`PROJECT_NAME` is still `"openclaw"`).

```ts
// src/compat/legacy-names.ts
export const PROJECT_NAME = "tinkerclaw";
export const LEGACY_PROJECT_NAMES = ["openclaw"];
export const MANIFEST_KEY = PROJECT_NAME;
export const LEGACY_MANIFEST_KEYS = LEGACY_PROJECT_NAMES;
export const LEGACY_PLUGIN_MANIFEST_FILENAMES = ["openclaw.plugin.json"];
```
```ts
// src/plugins/manifest.ts — derive, don't hardcode
export const PLUGIN_MANIFEST_FILENAME = `${PROJECT_NAME}.plugin.json`;
export const PLUGIN_MANIFEST_FILENAMES = [PLUGIN_MANIFEST_FILENAME, ...LEGACY_PLUGIN_MANIFEST_FILENAMES];
```
This flips canonical identity while keeping every existing/3rd-party `openclaw.plugin.json` loadable (342 manifests, 34 static imports unchanged).

**Do-NOT-rename:** `.git/config` upstream remote URL (breaks `git fetch upstream`); `LICENSE` lines 1-3 (MIT — preserve `Copyright (c) 2025 Peter Steinberger`; add a NOTICE, never alter attribution); external URLs `openclaw.ai`/`docs.openclaw.ai`/`github.com/openclaw` (dead links unless real TinkerClaw infra exists); build/generated trees (`apps/android/**/build`, `dist`, `node_modules`, lockfiles); native-app identity (`ai.openclaw.app`, bundle IDs — a separate release-store workstream); real npm/ClawHub package names.

**Safe-rename:** `__OPENCLAW_VERSION__`/`CORE_PACKAGE_NAME='openclaw'` in `src/version.ts`; `openclaw.mjs` bin target; `OPENCLAW_*` in tests (~315); `@openclaw/*` consumer refs (787); docs body (10,992 lines — lazy/last). Case-aware (PascalCase/UPPER/`ai.openclaw` handled separately); idempotent if generated dirs excluded; verify with `pnpm test` + plugin-load smoke, not grep counts. Effort ≈ 1 engineer-week if docs deferred.

## 5. Sync workflow — `scripts/sync-upstream.sh`

A single committed script (monthly via GitHub Action `cron: '0 6 1 * *'`), assuming the shim is in place so rebrand is a no-op verification: **fetch upstream → back up value files → rebase sync line onto upstream → verify value files survived → bump toolchain + regenerate lock → rebrand-consistency check (`grep -L OPENCLAW_ src --include=*.ts | grep -v .test` must be 0) → `pnpm test` + gateway `/health` smoke → report + open PR.** (Full script in the audit output; commit alongside a `scripts/rebrand-verify.mjs`.)

## 6. Risks & ordered next actions

1. **Back up the 6 persona files + `dragon-config.json`** — DONE (`~/projects/TinkerClaw-backups/value-2026-05-29/`). They share filenames with upstream blank templates; a workspace-reset would silently blank them.
2. **Land the compat-shim rebrand on `sync/openclaw-v2026.5.5`** (`PROJECT_NAME="tinkerclaw"` + legacy alias + derive manifest filename). Do this *before* catching up so the catch-up rebase benefits.
3. **Bump toolchain** (Node 22.19, pnpm 11.2.2) on Dragon + dev host; regenerate `pnpm-lock.yaml`.
4. **Rebase `sync` 2026.5.5 → 2026.5.28**; relocate the 21 stranded edits onto upstream's new file locations (re-apply intent, not diff).
5. **Reconcile `dragon-config.json`** vs live; decide the Telegram unit.
6. **Make `sync/openclaw-v2026.5.28` the new `main`** once it builds + passes gateway `/health` + chat round-trip; commit `scripts/sync-upstream.sh` + the Action; start the monthly cadence.
7. **Defer:** docs rebrand (10,992 lines) + native-app identity (release-store decision).

**Risk callouts:** silent persona-file overwrite (mitigated by backup + script diff-guard); runtime breaking changes (Node/pnpm floor, Pi internalization, channel externalizations, model-catalog pruning — validate post-merge not just post-build); drift compounds (monthly cadence is the structural fix); don't trust the stale `~/Desktop/openclaw` mirror.
