export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface AiCompletion {
  text: string;
  model: string;
  usage: AiUsage | null;
}

export interface AiProvider {
  name: string;
  model: string;
  complete(messages: ChatMessage[], system: string): Promise<AiCompletion>;
}

export type CitationKind = "UNIVERSITY" | "PROGRAMME" | "SCHOLARSHIP";

export interface AssistantCitation {
  index: number;
  kind: CitationKind;
  id: string;
  title: string;
  url: string | null;
  verificationStatus: string;
  lastCheckedAt: string | null;
}
