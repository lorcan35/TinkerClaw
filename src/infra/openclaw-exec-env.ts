export const TINKERCLAW_CLI_ENV_VAR = "TINKERCLAW_CLI";
export const TINKERCLAW_CLI_ENV_VALUE = "1";

export function markOpenClawExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [TINKERCLAW_CLI_ENV_VAR]: TINKERCLAW_CLI_ENV_VALUE,
  };
}

export function ensureOpenClawExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[TINKERCLAW_CLI_ENV_VAR] = TINKERCLAW_CLI_ENV_VALUE;
  return env;
}
