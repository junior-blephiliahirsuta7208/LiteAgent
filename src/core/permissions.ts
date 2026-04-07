const SAFE_COMMANDS = [/^git status$/, /^npm test$/, /^npm run test$/];

export function shouldRequireApproval(command: string): boolean {
  const normalizedCommand = command.trim();

  return !SAFE_COMMANDS.some((pattern) => pattern.test(normalizedCommand));
}
