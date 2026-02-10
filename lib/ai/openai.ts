import OpenAI from "openai";
import type { AIGenerateOptions, AIMessage, AIProvider } from "./provider";
import { AIProviderError } from "./provider";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AIProviderError("OPENAI_API_KEY is not configured", "openai");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export const openaiProvider: AIProvider = {
  async generateText(messages: AIMessage[], options?: AIGenerateOptions): Promise<string> {
    try {
      const client = getClient();
      const response = await client.chat.completions.create({
        model: options?.model ?? DEFAULT_MODEL,
        temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
        max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIProviderError("Empty response from OpenAI", "openai");
      }
      return content;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError("Failed to generate text", "openai", error);
    }
  },

  async generateJSON<T>(messages: AIMessage[], options?: AIGenerateOptions): Promise<T> {
    try {
      const client = getClient();
      const response = await client.chat.completions.create({
        model: options?.model ?? DEFAULT_MODEL,
        temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
        max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIProviderError("Empty response from OpenAI", "openai");
      }
      return JSON.parse(content) as T;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof SyntaxError) {
        throw new AIProviderError("Invalid JSON in OpenAI response", "openai", error);
      }
      throw new AIProviderError("Failed to generate JSON", "openai", error);
    }
  },
};
