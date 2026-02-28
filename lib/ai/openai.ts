import OpenAI from "openai";
import { AIProviderError, type AIGenerateOptions, type AIMessage, type AIProvider } from "./provider";
import type { ActorIdentity } from "@/lib/auth/actor";
import { getUserAIConfig } from "@/lib/services/ai-settings";
import { AITokenLimitExceededError, enforceDailyTokenCap, recordDailyTokenUsage } from "@/lib/services/ai-usage";

const DEFAULT_MODEL = "gpt-5-mini";

let systemClient: OpenAI | null = null;

function getSystemClient(): OpenAI {
  if (!systemClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AIProviderError("OPENAI_API_KEY is not configured", "openai");
    }
    systemClient = new OpenAI({ apiKey });
  }
  return systemClient;
}

function createClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

function getEffectiveModel(defaultModel: string, options?: AIGenerateOptions): string {
  return options?.model ?? defaultModel;
}

function toTokenUsage(response: OpenAI.Chat.Completions.ChatCompletion): {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
} {
  return {
    totalTokens: response.usage?.total_tokens ?? 0,
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0
  };
}

function buildProvider(getClient: () => OpenAI, defaultModel: string, actor?: ActorIdentity): AIProvider {
  return {
    async generateText(messages: AIMessage[], options?: AIGenerateOptions): Promise<string> {
      const model = getEffectiveModel(defaultModel, options);
      try {
        await enforceDailyTokenCap(actor, model);

        const client = getClient();
        const response = await client.chat.completions.create({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
        await recordDailyTokenUsage(actor, model, toTokenUsage(response));

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new AIProviderError("Empty response from OpenAI", "openai");
        }
        return content;
      } catch (error) {
        if (error instanceof AITokenLimitExceededError) {
          throw new AIProviderError(error.message, "openai", error);
        }
        if (error instanceof AIProviderError) throw error;
        throw new AIProviderError("Failed to generate text", "openai", error);
      }
    },

    async generateJSON<T>(messages: AIMessage[], options?: AIGenerateOptions): Promise<T> {
      const model = getEffectiveModel(defaultModel, options);
      try {
        await enforceDailyTokenCap(actor, model);

        const client = getClient();
        const response = await client.chat.completions.create({
          model,
          response_format: { type: "json_object" },
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
        await recordDailyTokenUsage(actor, model, toTokenUsage(response));

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new AIProviderError("Empty response from OpenAI", "openai");
        }
        return JSON.parse(content) as T;
      } catch (error) {
        if (error instanceof AITokenLimitExceededError) {
          throw new AIProviderError(error.message, "openai", error);
        }
        if (error instanceof AIProviderError) throw error;
        if (error instanceof SyntaxError) {
          throw new AIProviderError("Invalid JSON in OpenAI response", "openai", error);
        }
        throw new AIProviderError("Failed to generate JSON", "openai", error);
      }
    },
  };
}

/** System-level provider using OPENAI_API_KEY from env. */
export const openaiProvider: AIProvider = buildProvider(getSystemClient, DEFAULT_MODEL);

/**
 * Create an AI provider that uses the actor's personal API key and model preference.
 * Falls back to the system-level OPENAI_API_KEY if no user key is set.
 */
export async function createUserAwareProvider(actor?: ActorIdentity): Promise<AIProvider> {
  if (!actor?.email) {
    return openaiProvider;
  }

  try {
    const config = await getUserAIConfig(actor);

    if (!config.apiKey) {
      throw new AIProviderError("No AI API key configured. Add one in Settings → AI Configuration.", "openai");
    }

    const model = config.model || DEFAULT_MODEL;

    // If the key matches the system key, reuse the system client
    if (config.apiKey === process.env.OPENAI_API_KEY) {
      return buildProvider(getSystemClient, model, actor);
    }

    const userClient = createClient(config.apiKey);
    return buildProvider(() => userClient, model, actor);
  } catch (error) {
    if (error instanceof AIProviderError) throw error;
    // Fallback to system provider if anything goes wrong
    return openaiProvider;
  }
}
