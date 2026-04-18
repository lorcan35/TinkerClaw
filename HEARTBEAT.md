# HEARTBEAT.md — TinkerClaw's Idle Check

## Quick Checks (every heartbeat)

1. Is Dragon reachable? (ping 192.168.70.242)
2. Is voice WebSocket connected? (Tab5 status via debug server)
3. Any failed agent tasks in last 30 min?

## Rules

- NO long polls. NO sleep commands.
- Check Dragon health, relay status, stay responsive.
- If something needs attention: speak up. If nothing: `HEARTBEAT_OK`.

## Supervisor Sweep

1. Check `~/.tinkerclaw/logs/` for error patterns
2. Check sessions DB for stuck sessions
3. Check ngrok tunnel status (all three live?)
4. If agent failed and Emile hasn't been told: alert him.

## Dragon Health Quick Status

```bash
# Services running?
systemctl is-active tinkerclaw-voice
systemctl is-active tinkerclaw-gateway

# Voice pipeline?
curl -s http://localhost:3502/api/health

# TinkerClaw gateway?
curl -s --max-time 3 https://tinkerclaw-gateway.ngrok.dev/health

# Tab5 connected?
grep "connected\|register\|session" ~/.tinkerclaw/logs/*.log | tail -5
```

## When to Reach Out

- TinkerClaw gateway down → alert immediately
- Voice server unreachable → alert immediately
- Tab5 disconnected for >5 min → mention it
- Kimi Code CLI auth completed → tell Emile
- ngrok tunnel dropped → attempt restart