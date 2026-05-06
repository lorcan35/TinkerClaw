const COMMON_LIVE_ENV_NAMES = [
  "TINKERCLAW_AGENT_RUNTIME",
  "TINKERCLAW_CONFIG_PATH",
  "TINKERCLAW_GATEWAY_TOKEN",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "TINKERCLAW_SKIP_BROWSER_CONTROL_SERVER",
  "TINKERCLAW_SKIP_CANVAS_HOST",
  "TINKERCLAW_SKIP_CHANNELS",
  "TINKERCLAW_SKIP_CRON",
  "TINKERCLAW_SKIP_GMAIL_WATCHER",
  "TINKERCLAW_STATE_DIR",
] as const;

export type LiveEnvSnapshot = Record<string, string | undefined>;

export function snapshotLiveEnv(extraNames: readonly string[] = []): LiveEnvSnapshot {
  const snapshot: LiveEnvSnapshot = {};
  for (const name of [...COMMON_LIVE_ENV_NAMES, ...extraNames]) {
    snapshot[name] = process.env[name];
  }
  return snapshot;
}

export function restoreLiveEnv(snapshot: LiveEnvSnapshot): void {
  for (const [name, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}
