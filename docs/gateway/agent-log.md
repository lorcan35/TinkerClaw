# agent_log Push Contract

Dragon's `/api/v1/agent_log` endpoint accepts pushes from TinkerClaw
when the gateway runs agent turns on Dragon's behalf.

## Envelope

```json
{
  "ts": "<ISO-8601>",
  "session_id": "<dragon session uuid>",
  "device_id": "<tab5 device uuid>",
  "bucket": "dragon" | "gateway" | "channel_push" | "user_reply",
  "kind": "tool_call" | "tool_result" | "llm_chunk" | "wake" | "user_text",
  "payload": <kind-specific>
}
```

## Buckets (W7-A.3)

- `dragon` — events from Dragon's own ConversationEngine
- `gateway` — events from TinkerClaw's agent loop (vmode=3)
- `channel_push` — incoming third-party channel messages
- `user_reply` — outbound replies the user sent via voice

## Push frequency

- Per-event push; no batching
- Dragon retries 3× with exponential backoff on 5xx
- Drop-on-floor after retries (Tab5 UI is the source of truth for
  user-facing state)

## Storage

- Dragon persists to SQLite `agent_log` table
- Default retention: ≈30 days, configurable in TinkerBox config.yaml
- Tab5 reads via `GET /api/v1/agent_log?limit=N` (rendered in
  `ui_agents.c`)
