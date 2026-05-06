import { normalizeOptionalString } from "../shared/string-coerce.js";

export function resolveDaemonContainerContext(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return (
    normalizeOptionalString(env.TINKERCLAW_CONTAINER_HINT) ||
    normalizeOptionalString(env.TINKERCLAW_CONTAINER) ||
    null
  );
}
