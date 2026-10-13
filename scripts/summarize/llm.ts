// One structured-output call, behind either Anthropic or OpenAI. The provider is picked from the environment:
//   SUMMARY_PROVIDER=anthropic|openai forces one; otherwise a valid ANTHROPIC_API_KEY wins, then OPENAI_API_KEY.
//   SUMMARY_MODEL overrides the default model when it belongs to the chosen provider.
import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"
import type { z } from "zod"

export type Provider = "anthropic" | "openai"

const DEFAULT_MODEL: Record<Provider, string> = { anthropic: "claude-haiku-4-5", openai: "gpt-5.4-mini" }

export interface Usage {
  input: number
  output: number
  calls: number
}

export interface Llm {
  provider: Provider
  model: string
  usage: Usage
  callStructured<T extends z.ZodType>(schema: T, name: string, system: string, user: string, maxTokens: number): Promise<z.infer<T> | null>
  isAuthError(err: unknown): boolean
  describeError(err: unknown): string
}

const looksLikeAnthropicKey = (k: string) => k.startsWith("sk-ant-")
const looksLikeOpenAiKey = (k: string) => k.startsWith("sk-") && !k.startsWith("sk-ant-")

/** Which provider to use, or why none can be used. */
export function pickProvider(env: Record<string, string | undefined> = process.env): { provider: Provider } | { reason: string } {
  const anthropicKey = env.ANTHROPIC_API_KEY ?? ""
  const openaiKey = env.OPENAI_API_KEY ?? ""
  const forced = env.SUMMARY_PROVIDER?.toLowerCase()
  if (forced === "anthropic") {
    return looksLikeAnthropicKey(anthropicKey) ? { provider: "anthropic" } : { reason: "SUMMARY_PROVIDER is anthropic but ANTHROPIC_API_KEY is missing or not an sk-ant- key" }
  }
  if (forced === "openai") {
    return looksLikeOpenAiKey(openaiKey) ? { provider: "openai" } : { reason: "SUMMARY_PROVIDER is openai but OPENAI_API_KEY is missing or not an sk- key" }
  }
  if (forced) return { reason: `SUMMARY_PROVIDER must be anthropic or openai, not ${forced}` }
  if (looksLikeAnthropicKey(anthropicKey)) return { provider: "anthropic" }
  if (looksLikeOpenAiKey(openaiKey)) return { provider: "openai" }
  return { reason: anthropicKey || openaiKey ? "no API key looks valid (expected sk-ant-... or an OpenAI sk-... key)" : "neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is set" }
}

/** SUMMARY_MODEL applies only when it names a model from the chosen provider. */
export function pickModel(provider: Provider, requested: string | undefined): string {
  if (!requested) return DEFAULT_MODEL[provider]
  const isClaude = requested.startsWith("claude")
  return isClaude === (provider === "anthropic") ? requested : DEFAULT_MODEL[provider]
}

export function createLlm(provider: Provider, model: string): Llm {
  const usage: Usage = { input: 0, output: 0, calls: 0 }

  if (provider === "anthropic") {
    const client = new Anthropic()
    return {
      provider,
      model,
      usage,
      async callStructured(schema, _name, system, user, maxTokens) {
        const response = await client.messages.parse({
          model,
          max_tokens: maxTokens,
          system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: user }],
          output_config: { format: zodOutputFormat(schema) },
        })
        usage.calls++
        usage.input += response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0)
        usage.output += response.usage.output_tokens
        if (response.stop_reason === "max_tokens") throw new Error("response hit max_tokens")
        return response.parsed_output ?? null
      },
      isAuthError: (err) => err instanceof Anthropic.AuthenticationError,
      describeError: (err) => (err instanceof Anthropic.APIError ? `API error ${err.status}: ${err.message}` : String(err)),
    }
  }

  const client = new OpenAI()
  return {
    provider,
    model,
    usage,
    async callStructured<T extends z.ZodType>(schema: T, name: string, system: string, user: string, maxTokens: number) {
      const response = await client.responses.parse({
        model,
        instructions: system,
        input: user,
        // GPT-5 models spend output tokens on reasoning before answering, so give them headroom.
        max_output_tokens: maxTokens * 4,
        reasoning: { effort: "medium" },
        text: { format: zodTextFormat(schema, name) },
      })
      usage.calls++
      usage.input += response.usage?.input_tokens ?? 0
      usage.output += response.usage?.output_tokens ?? 0
      if (response.status === "incomplete") throw new Error(`response incomplete: ${response.incomplete_details?.reason ?? "unknown"}`)
      // The SDK's inferred type differs from zod's output type; the schema itself parsed this value.
      return (response.output_parsed ?? null) as z.infer<T> | null
    },
    isAuthError: (err) => err instanceof OpenAI.AuthenticationError,
    describeError: (err) => (err instanceof OpenAI.APIError ? `API error ${err.status}: ${err.message}` : String(err)),
  }
}
