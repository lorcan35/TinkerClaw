export const TINKERCLAW_OWNER_ONLY_CORE_TOOL_NAMES = ["cron", "gateway", "nodes"] as const;

const TINKERCLAW_OWNER_ONLY_CORE_TOOL_NAME_SET: ReadonlySet<string> = new Set(
  TINKERCLAW_OWNER_ONLY_CORE_TOOL_NAMES,
);

export function isOpenClawOwnerOnlyCoreToolName(toolName: string): boolean {
  return TINKERCLAW_OWNER_ONLY_CORE_TOOL_NAME_SET.has(toolName);
}
