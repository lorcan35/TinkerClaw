# TOOLS.md — TinkerClaw on Dragon

> Last updated: 2026-04-19

---

## Access

| Method | Command | Notes |
|--------|---------|-------|
| SSH | `ssh radxa@192.168.70.242` | Password: `radxa` |
| Web dashboard | `https://tinkerclaw-dashboard.ngrok.dev` | 11-tab management UI |
| Voice server | `https://tinkerclaw-voice.ngrok.dev` | WebSocket for Tab5 |
| Gateway API | `https://tinkerclaw-gateway.ngrok.dev` | TinkerClaw agent gateway |

---

## Running Services

| Service | Port | Unit | Status |
|---------|------|------|--------|
| tinkerclaw-voice | 3502 | dragon_voice server.py | ✅ active |
| tinkerclaw-dashboard | 3500 | dashboard.py (Flask SPA) | ✅ active |
| tinkerclaw-gateway | 18789 | openclaw-gateway (Node.js) | ✅ active |
| tinkerclaw-ngrok | 4040 | ngrok process | ✅ active |
| searxng | 8888 | SearXNG metasearch | ✅ active |
| ollama | 11434 | Ollama LLM server | ⏸️ masked |

---

## SSH Access Details

```bash
ssh radxa@192.168.70.242
password: radxa

# After SSH:
export PATH="/home/radxa/.local/bin:$PATH"  # for kimi CLI
```

**SystemD service management:**
```bash
sudo systemctl status tinkerclaw-voice
sudo systemctl status tinkerclaw-gateway
sudo systemctl status tinkerclaw-dashboard
sudo journalctl -u tinkerclaw-voice --no-pager -n 50
```

**Restart services:**
```bash
sudo systemctl restart tinkerclaw-voice
sudo systemctl restart tinkerclaw-gateway
```

---

## Gateway Config

- **Config path:** `~/.tinkerclaw/tinkerclaw.json`
- **Skills path:** `/home/radxa/.tinkerclaw/skills/`
- **Logs:** `/home/radxa/.tinkerclaw/logs/`
- **Memory DB:** `~/.tinkerclaw/sessions/` (SQLite)

**Key config values:**
```json
{
  "agents.defaults.model": "MiniMax-M2.5",
  "agents.defaults.contextTokens": 160000,
  "session.historyLimit": 50
}
```

---

## Voice Server (dragon_voice)

**Location:** `/home/radxa/TinkerBox/dragon_voice/`
**Entry:** `server.py` (port 3502)

**Key modules:**
- `server.py` — WebSocket handler, session management, mode routing
- `conversation.py` — ConvEngine, session resume, tool execution
- `tools/` — Skill implementations (timesense, web_search, notes, etc.)
- `llm/` — LLM backends: Ollama, OpenRouter, TinkerClaw
- `stt/` — Moonshine, Whisper (OpenRouter fallback)
- `tts/` — Piper (local), Kokoro, OpenRouter

**Test voice pipeline:**
```bash
curl -s -X POST http://localhost:3502/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","device_id":"test"}'
```

---

## Kimi Code CLI (ACP Agent)

**Installed:** `kimi` CLI at `/home/radxa/.local/bin/kimi`
**Version:** 1.36.0
**Config:** `~/.kimi/config.toml`

**Auth status:** OAuth device flow required (run `kimi login` with browser)
**ACP server:** `kimi acp` (starts on port 8888)

**If authenticated, use as ACP agent:**
- Agent name: `kimi`
- Backend: `acp`
- Port: 8888

---

## Dashboard Tabs (port 3500)

Overview | Conversations | Chat | Devices | Notes | Memory | Documents | Tools | Logs | OTA | Debug

**Log location:** `~/.tinkerclaw/logs/`
**Session DB:** `~/.tinkerclaw/sessions/sessions.db`

---

## Network Tunnels (ngrok)

Configured in `~/.config/ngrok/ngrok.yml`:
```yaml
tunnels:
  dashboard:  addr: 127.0.0.1:3500  → tinkerclaw-dashboard.ngrok.dev
  voice:       addr: 127.0.0.1:3502  → tinkerclaw-voice.ngrok.dev
  gateway:     addr: 127.0.0.1:18789 → tinkerclaw-gateway.ngrok.dev
```

**Reconnect ngrok:**
```bash
ngrok start --all
```

---

## Tab5 Connection

Tab5 connects via WebSocket to `tinkerclaw-voice.ngrok.dev` (port 443, TLS).
Dragon receives on `localhost:3502`.

**Protocol docs:** `TinkerBox/docs/protocol.md` (defines all WS message types)

**Tab5 mode 3 (TinkerClaw):** Routes LLM through TinkerClaw gateway instead of Dragon's native LLM. STT stays local (Moonshine) or cloud. TTS stays Piper or cloud.

---

## Skills System

Skills live in `dragon_voice/tools/` as Python files.

**Existing skills:**
- `timesense_tool.py` — Pomodoro timer (emits widget state)
- `web_search` — SearXNG backend
- `notes_tool.py` — Session notes CRUD
- `rag_tools.py` — Memory/RAG

**Skill pattern:**
```python
async def execute(self, args: dict, context: dict) -> dict:
    # Do the thing
    return {"success": True, "result": ...}
```

Skills emit `widget_*` events to push UI to Tab5 over WebSocket.

---

## Agent System

**Two agent layers:**

1. **Python agent** (ConvEngine in dragon_voice) — native tools, session management
2. **TinkerClaw gateway agent** — OpenClaw agent pipeline, OpenRouter/MiniMax models

**TinkerClaw gateway** (port 18789) is the full OpenClaw agent system. Skills, memory, cron, tool calling — all available.

**OpenClaw skills (196 installed):** `~/.openclaw/skills/` — run via TinkerClaw gateway only.

---

## Environment Variables

```bash
MINIMAX_API_KEY=sk-cp-...
MOONSHOT_API_KEY=           # not set
OLLAMA_HOST=http://localhost:11434
SEARXNG_URL=http://localhost:8888
```

---

## Key Files

```
~/.tinkerclaw/tinkerclaw.json       # Gateway config
~/.kimi/config.toml                # Kimi CLI config
~/.tinkerclaw/sessions/sessions.db  # Session history
~/.tinkerclaw/logs/                 # Log files
/home/radxa/TinkerBox/dragon_voice/server.py  # Voice server
/home/radxa/TinkerBox/docs/protocol.md  # WS protocol spec
```

---

## Quick Diagnostics

```bash
# Is Dragon alive?
ping 192.168.70.242

# Gateway health
curl https://tinkerclaw-gateway.ngrok.dev/health

# Voice server
curl http://localhost:3502/api/health 2>/dev/null

# Tab5 connected?
grep "tab5\|esp32\|connected" ~/.tinkerclaw/logs/*.log | tail -20

# Active sessions
sqlite3 ~/.tinkerclaw/sessions/sessions.db "SELECT COUNT(*) FROM sessions WHERE updated_at > datetime('now','-1 hour')"

# ngrok tunnels
curl http://localhost:4040/api/tunnels 2>/dev/null | python3 -m json.tool | grep public_url
```