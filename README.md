# TinkerClaw

Agent gateway for the TinkerClaw ecosystem. Forked from [OpenClaw](https://github.com/peterSteinberger/openclaw).

## What is TinkerClaw?

TinkerClaw is a full-featured AI agent gateway that runs as an optional sidecar alongside the Dragon voice server. It provides:

- **50+ skills** — web search, memory, browser automation, and more
- **Multi-provider LLM** — Ollama (local), OpenRouter, Anthropic, OpenAI, Google
- **Channel routing** — Telegram, WhatsApp, Discord, Slack, Signal, and more
- **Hybrid memory** — sqlite-vec vector search + BM25 keyword search
- **Plugin system** — 30+ extensions, custom skills

## Dragon Deployment

TinkerClaw runs on the Dragon Q6A board (ARM64) as a systemd service alongside the voice server.

### Install

```bash
# Install Node.js 22+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm

# Clone and install
cd /home/radxa
git clone https://github.com/lorcan35/TinkerClaw.git tinkerclaw
cd tinkerclaw
pnpm install

# Configure
mkdir -p ~/.tinkerclaw
cp dragon-config.json ~/.tinkerclaw/tinkerclaw.json

# Install service
sudo cp systemd/tinkerclaw-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tinkerclaw-gateway
```

### Configuration

Edit `~/.tinkerclaw/tinkerclaw.json`:

- `gateway.bind`: `"loopback"` (Dragon only) or `"lan"` (allow remote)
- `gateway.auth.token`: Auto-generated on first run
- `models.providers.ollama.baseUrl`: Ollama endpoint (default `http://localhost:11434`)
- `models.default`: Default model (e.g., `"ollama/qwen3:1.7b"`)
- `memory.provider`: Embedding provider (`"ollama"` uses nomic-embed-text locally)

### Integration with Dragon Voice Server

Dragon's voice server (port 3502) routes to TinkerClaw in voice mode 3:

| Mode | STT | LLM | TTS |
|------|-----|-----|-----|
| 0 Local | Moonshine | Ollama | Piper |
| 1 Hybrid | OpenRouter | Ollama | OpenRouter |
| 2 Cloud | OpenRouter | OpenRouter | OpenRouter |
| **3 TinkerClaw** | Moonshine/OpenRouter | **TinkerClaw Gateway** | Piper/OpenRouter |

In mode 3, Dragon handles STT/TTS only. TinkerClaw owns the conversation — skills, memory, model selection, personality.

### Service Map

| Service | Port | Description |
|---------|------|-------------|
| Dragon Voice | 3502 | STT/TTS pipeline + Tab5 WebSocket |
| TinkerClaw | 18789 | Agent gateway (localhost only) |
| Ollama | 11434 | Local LLM inference |
| SearXNG | 8888 | Web search backend |

## License

MIT (same as OpenClaw)
