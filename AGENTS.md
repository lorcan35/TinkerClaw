# TinkerClaw — Agent Gateway for TinkerClaw Ecosystem

Forked from OpenClaw. Customized for Dragon Q6A deployment.

## Key Changes from OpenClaw
- Package name: tinkerclaw (was openclaw)
- Config path: ~/.tinkerclaw/ (was ~/.openclaw/)
- CORE_PACKAGE_NAMES includes both "openclaw" and "tinkerclaw" for backward compat
- Plugin SDK aliases registered for both openclaw/plugin-sdk and tinkerclaw/plugin-sdk

## Dragon Deployment
- Gateway runs as systemd service on port 18789
- Config at ~/.tinkerclaw/tinkerclaw.json
- MiniMax M2.5 as default model
- Ollama + OpenRouter providers configured
- Memory system uses Ollama nomic-embed-text

## Build
pnpm install && pnpm build
Note: A2UI bundle (src/canvas-host/a2ui/a2ui.bundle.js) is gitignored.
Copy from original OpenClaw if missing.
