import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

const MUTATING_TOOLS = new Set(["browser_click", "browser_type"]);

export class ApprovalDeniedError extends Error {
  constructor(message = "User denied tool execution") {
    super(message);
    this.name = "ApprovalDeniedError";
  }
}

export async function requireApproval(
  toolName: string,
  args: Record<string, unknown>,
): Promise<void> {
  if (!config.requireHumanApproval || !MUTATING_TOOLS.has(toolName)) return;

  // Fail closed in non-interactive environments.
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new ApprovalDeniedError("Approval requires an interactive terminal");
  }

  logger.warn(`Approval required for ${toolName}`, args);
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question("Allow this browser action? [y/N] "))
      .trim().toLowerCase();
    if (answer !== "y" && answer !== "yes") {
      throw new ApprovalDeniedError();
    }
  } finally {
    rl.close();
  }
}
