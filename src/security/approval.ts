import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

type ApprovalQuestion = (prompt: string) => Promise<string>;
let sharedQuestion: ApprovalQuestion | undefined;
export function setApprovalQuestion(question?: ApprovalQuestion): void {
  sharedQuestion = question;
}

const APPROVAL_TOOLS = new Set([
  "playwright__browser_click",
  "playwright__browser_type",
  "filesystem__write_file",
]);

export async function requireApproval(
  name: string,
  args: Record<string, unknown>,
): Promise<void> {
  if (!config.requireHumanApproval || !APPROVAL_TOOLS.has(name)) return;
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error("Human approval needs an interactive terminal");
  logger.warn(`Approval requested for ${name}`, args);
  const rl = sharedQuestion
    ? undefined
    : createInterface({ input: stdin, output: stdout });
  try {
    const answer = (
      await (sharedQuestion ?? ((q: string) => rl!.question(q)))(
        `Approve ${name}? [y/N] `,
      )
    )
      .trim()
      .toLowerCase();
    if (answer !== "y" && answer !== "yes")
      throw new Error("User denied tool execution");
  } finally {
    rl?.close();
  }
}
