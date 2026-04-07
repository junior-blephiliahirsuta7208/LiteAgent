import { createToolRegistry } from "./registry";
import { createAskUserTool } from "./ask-user";
import { createGrepFilesTool } from "./grep-files";
import { createListFilesTool } from "./list-files";
import { createLoadSkillTool } from "./load-skill";
import { createPatchFileTool } from "./patch-file";
import { createReadFileTool } from "./read-file";
import { createRunCommandTool } from "./run-command";

type DefaultToolRegistryOptions = {
  cwd: string;
  timeoutMs: number;
  maxOutput: number;
  confirm: (input: string | { path: string; diff: string }) => Promise<boolean>;
  ask: (question: string) => Promise<string>;
};

export function createDefaultToolRegistry(options: DefaultToolRegistryOptions) {
  const registry = createToolRegistry();

  registry.register(createListFilesTool(options.cwd));
  registry.register(createGrepFilesTool(options.cwd));
  registry.register(createReadFileTool(options.cwd));
  registry.register(createLoadSkillTool(options.cwd));
  registry.register(
    createRunCommandTool({
      cwd: options.cwd,
      timeoutMs: options.timeoutMs,
      maxOutput: options.maxOutput,
      confirm: async (command) => options.confirm(command),
    }),
  );
  registry.register(
    createPatchFileTool({
      cwd: options.cwd,
      confirm: async (input) => options.confirm(input),
    }),
  );
  registry.register(
    createAskUserTool({
      ask: options.ask,
    }),
  );

  return registry;
}
