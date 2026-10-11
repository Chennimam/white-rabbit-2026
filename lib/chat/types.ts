export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

export type ChatStatus = "idle" | "sending" | "typing" | "error";
export type ChatTransport = (messages: ChatMessage[]) => Promise<string>;
export interface ChatHistoryStore {
  load(): Promise<ChatMessage[]>;
  save(messages: ChatMessage[]): Promise<void>;
}

// Public wire contract: never accepts client system instructions.
export type ChatRequest = { messages: { role: "user" | "assistant"; content: string }[] };
export type ChatResponse = { reply: string };
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_HISTORY_MESSAGES = 100;

export const MAX_REQUEST_MESSAGES = 20;
export const MAX_REQUEST_CONTENT = 20_000;
