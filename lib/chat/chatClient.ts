import { getScenarioReply } from "./scenarioEngine";
import { MAX_MESSAGE_LENGTH } from "./types";
import type { ChatMessage } from "./types";

// Local adapter preserves loading/error/retry UI without any network/model calls.
export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  const last = messages.at(-1);
  if (!last || last.role !== "user" || !last.content.trim() || last.content.length > MAX_MESSAGE_LENGTH)
    throw new Error("invalid_request");
  return getScenarioReply(messages).reply;
}
