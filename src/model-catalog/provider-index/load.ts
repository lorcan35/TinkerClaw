import { normalizeOpenClawProviderIndex } from "./normalize.js";
import { TINKERCLAW_PROVIDER_INDEX } from "./openclaw-provider-index.js";
import type { OpenClawProviderIndex } from "./types.js";

export function loadOpenClawProviderIndex(
  source: unknown = TINKERCLAW_PROVIDER_INDEX,
): OpenClawProviderIndex {
  return normalizeOpenClawProviderIndex(source) ?? { version: 1, providers: {} };
}
