import OpenAI from "openai";

/** OpenAI SDK reads OPENAI_API_KEY from the environment. */
export function createOpenAIClient(): OpenAI {
  return new OpenAI();
}
