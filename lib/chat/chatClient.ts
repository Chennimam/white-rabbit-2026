import type { ChatMessage } from "./types";

// Replace only this adapter with POST /api/chat when a server is available.
// Never add model credentials or system instructions to this client module.
export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  if (!messages.some((message) => message.role === "user" && message.content.trim())) {
    throw new Error("A user message is required");
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 650));
  return "Ассистент скоро появится здесь.";
}
