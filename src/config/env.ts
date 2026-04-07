import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadDotenv, type DotenvConfigOutput } from "dotenv";

export type ProjectEnvOptions = {
  cwd?: string;
  fileName?: string;
};

const DEFAULT_ENV_FILE = ".env";

export function loadProjectEnv(
  options: ProjectEnvOptions = {},
): DotenvConfigOutput {
  const cwd = options.cwd ?? process.cwd();
  const fileName = options.fileName ?? DEFAULT_ENV_FILE;
  const envPath = resolve(cwd, fileName);

  if (!existsSync(envPath)) {
    return { parsed: {} };
  }

  return loadDotenv({
    override: false,
    path: envPath,
    quiet: true,
  });
}

export const bootstrapEnv = loadProjectEnv;
