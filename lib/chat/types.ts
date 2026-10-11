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

// Contract for a FUTURE server implementation; no route is installed today.
export type ChatRequest = { messages: ChatMessage[] };
export type ChatResponse = { reply: string };
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_HISTORY_MESSAGES = 100;
