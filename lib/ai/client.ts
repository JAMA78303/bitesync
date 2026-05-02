/**
 * Thin provider wrapper. Replace with Anthropic SDK call in production.
 * Keeping this isolated makes provider swaps and test stubs straightforward.
 */
export async function callClaudeJSON<T>(prompt: string): Promise<T> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  throw new Error(`Claude client not yet wired. Prompt preview:\n${prompt.slice(0, 400)}`);
}
