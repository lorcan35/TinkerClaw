# MEMORY.md — TinkerClaw Long-Term Memory

> Last updated: 2026-04-19

---

## Current Setup

- **Dragon:** Radxa Q6A at 192.168.70.242 (static IP on LAN)
- **TinkerClaw gateway:** Port 18789, `tinkerclaw-gateway.ngrok.dev`
- **Voice server:** Port 3502, `tinkerclaw-voice.ngrok.dev`
- **Dashboard:** Port 3500, `tinkerclaw-dashboard.ngrok.dev`
- **SearXNG:** Port 8888 (conflicts with Kimi Code CLI ACP port)
- **Tab5:** ESP32-P4 at 192.168.1.90 (separate VLAN from Dragon's 192.168.70.x)

---

## Key Lessons

**Never block the voice WebSocket.** Dragon's ConvEngine must stay responsive to Tab5. Long agent tasks go through TinkerClaw gateway async.

**Tab5 is the voice product. TinkerClaw is the brain.** The Tab5 screen is nice but the mic is the real interface. Skills must earn their voice slot.

**Hide/show overlays, don't create/destroy.** ESP32-P4 internal SRAM fragments when LVGL overlays are repeatedly created and destroyed. Use `lv_obj_add_flag(LV_OBJ_FLAG_HIDDEN)` instead.

**SearXNG and Kimi Code ACP share port 8888.** If using both, need to resolve port conflict (move Kimi ACP to 9090 or reconfigure SearXNG).

**Kimi Code CLI requires browser OAuth.** Can't auth via SSH alone. Use `kimi login` from an interactive terminal, then `kimi acp` to start the ACP server.

**TinkerClaw gateway is the command/debug face.** Telegram connects to the gateway (port 18789). Tab5 voice connects to voice server (port 3502). Both reach the same brain.

---

## Emile's Preferences

- Voice-first on Tab5 — responses short, confirmations audio
- Skills that surface on Tab5 without prompting
- Local-first (Ollama) before cloud (OpenRouter/MiniMax)
- No markdown in voice responses — "Timer set" not "✓ Timer created"
- Debug via Telegram when at desk, voice when mobile
- Kimi Code CLI for coding tasks (needs OAuth auth first)

---

## Known Issues

- **Kimi ACP server:** `kimi acp` exits immediately (needs TTY/daemonization fix — systemd unit written to /tmp/kimi-acp.service but not yet installed)
- **Tab5 separate VLAN:** Can't ping Dragon directly from DGX. Tab5 on 192.168.1.x, Dragon on 192.168.70.x
- **Memory fragmentation watchdog:** Tab5 reboots if largest SRAM block stays below 30KB for 3 minutes

---

## Session Management

Dragon keeps session history in `~/.tinkerclaw/sessions/sessions.db`. Sessions persist across Tab5 reconnects.

- Session resume: Tab5 sends `session_id` on registration, Dragon continues the conversation.
- History limit: 50 messages per session (TinkerClaw config: `historyLimit: 50`)
- Context window: 160K tokens (TinkerClaw config: `contextTokens: 160000`)

---

## Skills Installed on Dragon

**dragon_voice native tools:**
- `timesense_tool.py` — Pomodoro timer, emits widget state
- `notes_tool.py` — Session notes CRUD
- `web_search` — SearXNG metasearch (Google+Bing+DDG)
- `rag_tools.py` — Memory/RAG with Ollama embeddings

**TinkerClaw gateway skills:**
- 196 skills in `~/.openclaw/workspace/skills/`
- Available via Telegram commands
- Some can emit widget state for Tab5 display

---

## Model Stack

| Model | Use | Cost |
|-------|-----|------|
| MiniMax-M2.5 | Default LLM (fast) | ~$0.005/1K tokens |
| OpenRouter Claude/GPT | Fallback reasoning | varies |
| Ollama Qwen3 1.7B | Local/offline LLM | free |
| Moonshine | Local STT | free |
| Piper | Local TTS | free |
| Kimi Code CLI | Coding (needs auth) | 15x credits (Allegro plan) |

---

## Network Map

```
Internet
  └── ngrok (cloud relay)
        ├── tinkerclaw-gateway.ngrok.dev → Dragon:18789 (TinkerClaw gateway)
        ├── tinkerclaw-voice.ngrok.dev   → Dragon:3502 (voice server)
        └── tinkerclaw-dashboard.ngrok.dev → Dragon:3500 (dashboard)

DGX (192.168.70.x)
  └── Dragon (192.168.70.242) — TinkerClaw brain

Tab5 VLAN (192.168.1.x)
  └── Tab5 (192.168.1.90) — Voice client
      └── WiFi → Dragon via ngrok relay
```