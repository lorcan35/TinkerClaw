export const PROJECT_NAME = "tinkerclaw" as const;

// Canonical name is tinkerclaw; keep openclaw (and its own legacy clawdbot) as
// legacy manifest keys so existing openclaw.plugin.json manifests still load.
const LEGACY_PROJECT_NAMES = ["openclaw", "clawdbot"] as const;

export const MANIFEST_KEY = PROJECT_NAME;

export const LEGACY_MANIFEST_KEYS = LEGACY_PROJECT_NAMES;

export const MACOS_APP_SOURCES_DIR = "apps/macos/Sources/OpenClaw" as const;
