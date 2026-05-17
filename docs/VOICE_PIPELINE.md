# TinkerClaw Voice Pipeline (vmode=3)

Tab5 → Dragon → TinkerClaw routing for the channel-messaging path.

## Flow

1. Tab5 captures audio, streams PCM to Dragon (port 3502)
2. Dragon STT (Moonshine local OR OpenRouter cloud) produces text
3. If vmode=3, Dragon forwards the text to TinkerClaw gateway on
   localhost:18789 via ed25519-authenticated WS-RPC
4. TinkerClaw runs the agent loop with its own LLM choice (OpenRouter
   via tinkerclaw config), invokes tools, emits widget/state events
5. TinkerClaw replies back to Dragon → forwarded to Tab5 over WS
6. Dragon TTS (Piper local OR OpenRouter cloud) plays back through
   Tab5 speaker

## Latency budget (Q6A, observed)

- STT: 300-800 ms (Moonshine) / 1-2 s (cloud)
- Agent loop: 2-5 s (model + tool execution)
- TTS: 500 ms - 2 s
- End-to-end: 4-10 s typical

## RAM constraints on Q6A

- 12 GB total; Dragon services use ~6 GB resident
- llama-server resident must stay ≤6 GB to avoid swap
- See TinkerBox CLAUDE.md "Local-first Inference on Dragon"

## Streaming TTS chunking

- Dragon emits TTS chunks at 16 kHz mono int16
- Tab5 upsamples 1:3 to 48 kHz via cubic-Hermite (PR #569)
- Chunks pipelined through Tab5 audio playback drain task

## Wake-word pre-activation (roadmap)

- Today: Tab5 PTT triggers the pipeline
- In flight (TinkerTab PR #576): K144 always-on ASR detects "tinker"
  phrase → triggers LISTENING → existing pipeline resumes
- vmode=3 will benefit automatically — no TinkerClaw-side changes
