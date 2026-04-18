# CLAUDE.md — TinkerClaw Developer Guide

> TinkerClaw is the AI brain that lives on Dragon. It talks to Emile through Tab5's voice and Telegram's text. Both faces, one brain.

---

## Architecture at a Glance

```
Emile (voice) → Tab5 (ESP32-P4) → Dragon (brain)
                                         ├── ConvEngine (voice pipeline: STT→LLM→TTS)
                                         ├── TinkerClaw Gateway (agent pipeline: skills, memory, tools)
                                         └── Kimi Code CLI (coding agent: ACP server)

Emile (text) → Telegram → TinkerClaw Gateway (port 18789)
```

**Tab5** is the voice product. **TinkerClaw Gateway** is the AI layer. **Dragon** is the always-on server.

---

## READ FIRST: LEARNINGS.md

Every bug, every fix, every gotcha is in `LEARNINGS.md` on each repo. Read it before touching anything. Issue first, branch, commit with issue refs.

---

## Repo Map

| Repo | What it is | Key file |
|------|-----------|---------|
| TinkerTab | Tab5 firmware (C/ESP-IDF) | `main/voice.c` |
| TinkerBox | Dragon server (Python) | `dragon_voice/server.py` |
| TinkerClaw | Gateway agent (Node.js) | `~/.tinkerclaw/tinkerclaw.json` |

Protocol contract: `TinkerBox/docs/protocol.md`

---

## Dragon Access

```bash
ssh radxa@192.168.70.242
# password: radxa
```

**Critical: Dragon is on `192.168.70.242`, NOT `192.168.1.91` anymore. IP changed.**

**Tab5 is on a separate VLAN (`192.168.1.x`).** Dragon and DGX are on `192.168.70.x`. They're on different subnets.

**Services on Dragon:**
```bash
sudo systemctl status tinkerclaw-voice      # voice WS server (port 3502)
sudo systemctl status tinkerclaw-gateway    # agent gateway (port 18789)
sudo systemctl status tinkerclaw-dashboard  # web dashboard (port 3500)
journalctl -u tinkerclaw-voice --no-pager -n 50
```

**Config:**
```bash
cat ~/.tinkerclaw/tinkerclaw.json | python3 -m json.tool | less
```

**Logs:**
```bash
tail -f ~/.tinkerclaw/logs/*.log
```

---

## Service Map

| Tunnel | Remote URL | Local Port | Service |
|--------|-----------|-----------|---------|
| voice | `tinkerclaw-voice.ngrok.dev` | 3502 | Dragon voice WS |
| gateway | `tinkerclaw-gateway.ngrok.dev` | 18789 | TinkerClaw agent |
| dashboard | `tinkerclaw-dashboard.ngrok.dev` | 3500 | Web dashboard |

**Restart ngrok:**
```bash
ngrok start --all
```

---

## TinkerClaw Gateway (Agent Brain)

**Location:** Node.js process (`openclaw-gateway`)
**Config:** `~/.tinkerclaw/tinkerclaw.json`
**Skills:** `~/.tinkerclaw/skills/` + `~/.openclaw/workspace/skills/`

**Key settings:**
```json
{
  "agents.defaults.model": "MiniMax-M2.5",
  "agents.defaults.contextTokens": 160000,
  "session.historyLimit": 50
}
```

**Test the gateway:**
```bash
curl https://tinkerclaw-gateway.ngrok.dev/health
```

**Providers configured:**
- OpenRouter (`sk-or-v1-...`)
- MiniMax (`sk-cp-...`)
- Ollama (local, `localhost:11434`)
- Kimi Code CLI (ACP, needs OAuth auth)

**To restart gateway:**
```bash
sudo systemctl restart tinkerclaw-gateway
```

---

## Voice Server (Dragon ConvEngine)

**Location:** `/home/radxa/TinkerBox/dragon_voice/`
**Entry:** `server.py` (port 3502)

**Native tools (ConvEngine):**
- `timesense_tool.py` — Pomodoro timer, emits widget state to Tab5
- `notes_tool.py` — Session notes CRUD
- `web_search` — SearXNG metasearch (Google+Bing+DDG, 44 results)
- `rag_tools.py` — Memory/RAG with Ollama embeddings

**STT backends:** Moonshine (local), Whisper (OpenRouter fallback)
**TTS backends:** Piper (local), Kokoro, OpenRouter
**LLM backends:** Ollama (local), OpenRouter, MiniMax, TinkerClaw gateway

**Test voice pipeline:**
```bash
curl -s -X POST http://localhost:3502/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","device_id":"test"}'
```

---

## Tab5 Voice Mode (TinkerClaw Mode 3)

Settings → Voice mode → **TinkerClaw**

Routes LLM requests through TinkerClaw Gateway instead of Dragon's native LLM.

- STT: local (Moonshine) or OpenRouter
- LLM: TinkerClaw Gateway → OpenRouter/MiniMax/Kimi Code CLI
- TTS: local (Piper) or OpenRouter

**Protocol:** See `TinkerBox/docs/protocol.md`

**Tab5 debug server:** `http://Tab5_IP:8080` (port 8080)

---

## Kimi Code CLI (Coding Agent)

**Installed at:** `/home/radxa/.local/bin/kimi`
**Version:** 1.36.0
**ACP server:** `kimi acp` (port 8888 — CONFLICTS with SearXNG)
**Auth:** OAuth device flow required — open browser to authorize

**Authenticate:**
```bash
ssh radxa@192.168.70.242
kimi login   # opens browser OAuth
kimi acp     # starts ACP server
```

**Use as agent in TinkerClaw:**
```json
{
  "agentId": "kimi",
  "runtime": "acp"
}
```

**Port conflict:** SearXNG uses port 8888. Move Kimi ACP to 9090 or reconfigure SearXNG.

---

## Database & Sessions

**Session DB:** `~/.tinkerclaw/sessions/sessions.db` (SQLite)

```bash
sqlite3 ~/.tinkerclaw/sessions/sessions.db "
  SELECT * FROM sessions
  WHERE updated_at > datetime('now','-1 hour')
  ORDER BY updated_at DESC
  LIMIT 20;
"
```

**Widget state:** In-memory on Dragon, pushed to Tab5 via WebSocket `widget_*` messages.

---

## Dashboard (port 3500)

11-tab SPA served by `dashboard.py`:
Overview | Conversations | Chat | Devices | Notes | Memory | Documents | Tools | Logs | OTA | Debug

---

## Key Development Rules

1. **Tab5 is the face. Dragon is the brain.** Don't put AI logic on Tab5. Don't put UI logic on Dragon.
2. **ConvEngine routes to TinkerClaw for complex tasks.** Use Layer 1 for fast voice, Layer 2 for agentic work.
3. **Skills emit widget state.** Tab5 renders. Skills don't touch C code.
4. **Hide overlays, don't destroy them.** ESP32-P4 SRAM fragmentation is real.
5. **Voice responses max 30s of audio.** TTS is not for reading essays.
6. **Test the protocol, not the implementation.** `docs/protocol.md` is the contract.
7. **Issue before branch.** Every change has a GitHub issue ref.

---

## Troubleshooting

**Tab5 won't connect:**
1. Check Dragon voice server: `curl http://localhost:3502/api/health`
2. Check ngrok tunnel: `curl https://tinkerclaw-voice.ngrok.dev/health`
3. Check Tab5 debug server: `curl http://Tab5_IP:8080/info`
4. Check Dragon logs: `journalctl -u tinkerclaw-voice --no-pager -n 30`

**TinkerClaw gateway slow:**
1. Check model response times in gateway logs
2. Check MiniMax/OpenRouter API status
3. Check Dragon resources: `htop` (SSH in)

**Widget not showing on Tab5:**
1. Check Dragon→Tab5 WebSocket is connected
2. Check widget message format matches `docs/protocol.md`
3. Check Tab5 debug server for widget events: `curl http://Tab5_IP:8080/voice`
