# vmode=3 Message Routing Contract

## Tab5 → Dragon → TinkerClaw flow

### config_update from Tab5

```json
{ "type": "config_update", "voice_mode": 3, "llm_model": "<optional override>" }
```

Dragon stores `voice_mode=3` per-session. Subsequent text/voice
turns route the LLM step through TinkerClaw.

### text turn routing

- Tab5 sends `{"type":"text","content":"<user text>"}` to Dragon
- Dragon STT-bypasses (text is pre-transcribed); ConversationEngine
  formats history + tools
- If vmode=3: route the prompt to TinkerClaw via
  `GatewayConnector.send_prompt(text, history, tools)`
- TinkerClaw runs agent loop, emits one or more LLM chunks + tool
  events back to Dragon
- Dragon forwards each chunk to Tab5 as `{"type":"llm","text":"<chunk>"}`
  with the same envelope as vmode=0/1/2

### Tool events

- TinkerClaw emits `tool_call` and `tool_result` events to Dragon
- Dragon forwards verbatim to Tab5; Tab5's chat renderer treats
  these identically to local-mode tool events
- Tool-call dialect: TinkerClaw emits Dragon's standard dialect 1
  (`<tool>NAME</tool><args>{...}</args>`); Tab5's `voice_ws_proto.c`
  dispatcher already handles this

### Widget state push

- TinkerClaw can emit `widget_live` / `widget_card` / `widget_prompt`
  frames same as Dragon-native tools
- Goes through Dragon → Tab5 unchanged
- See TinkerTab `docs/WIDGETS.md` for the widget vocabulary

### Backpressure on long LLM responses

- TinkerClaw streams chunks at ≤ 100 ms granularity
- Dragon forwards immediately (no buffering)
- Tab5 displays chunks live in the chat overlay
