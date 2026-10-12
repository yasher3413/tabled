import { describe, expect, it } from "vitest"
import { pickModel, pickProvider } from "./llm"

describe("pickProvider", () => {
  it("prefers a valid Anthropic key", () => {
    expect(pickProvider({ ANTHROPIC_API_KEY: "sk-ant-abc", OPENAI_API_KEY: "sk-proj-abc" })).toEqual({ provider: "anthropic" })
  })
  it("falls back to OpenAI when the Anthropic key is a placeholder", () => {
    expect(pickProvider({ ANTHROPIC_API_KEY: "placeholder-key-1", OPENAI_API_KEY: "sk-proj-abc" })).toEqual({ provider: "openai" })
  })
  it("honours SUMMARY_PROVIDER", () => {
    expect(pickProvider({ SUMMARY_PROVIDER: "openai", ANTHROPIC_API_KEY: "sk-ant-abc", OPENAI_API_KEY: "sk-abc" })).toEqual({ provider: "openai" })
    expect(pickProvider({ SUMMARY_PROVIDER: "openai", ANTHROPIC_API_KEY: "sk-ant-abc" })).toHaveProperty("reason")
    expect(pickProvider({ SUMMARY_PROVIDER: "gemini" })).toHaveProperty("reason")
  })
  it("never treats an Anthropic key as an OpenAI key", () => {
    expect(pickProvider({ OPENAI_API_KEY: "sk-ant-abc" })).toHaveProperty("reason")
  })
  it("explains when no key is set", () => {
    expect(pickProvider({})).toEqual({ reason: "neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is set" })
  })
})

describe("pickModel", () => {
  it("uses each provider's default", () => {
    expect(pickModel("anthropic", undefined)).toBe("claude-haiku-4-5")
    expect(pickModel("openai", undefined)).toBe("gpt-5.4-mini")
  })
  it("applies SUMMARY_MODEL only to its own provider", () => {
    expect(pickModel("openai", "claude-haiku-4-5")).toBe("gpt-5.4-mini")
    expect(pickModel("openai", "gpt-5.5")).toBe("gpt-5.5")
    expect(pickModel("anthropic", "gpt-5.5")).toBe("claude-haiku-4-5")
  })
})
