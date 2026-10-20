/** Stores the response chain for a single in-process conversation.
 * This is not persistent storage and does not preserve browser state after exit.
 */
export class ConversationSession {
  private lastResponseId: string | undefined;

  get previousResponseId(): string | undefined {
    return this.lastResponseId;
  }

  remember(id: string): void {
    this.lastResponseId = id;
  }

  reset(): void {
    this.lastResponseId = undefined;
  }
}
