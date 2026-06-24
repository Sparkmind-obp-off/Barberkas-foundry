// Multi-LLM abstraction — Groq primary, OpenRouter fallback.
// Truth-Lock: if no API key configured, agents return deterministic
// rule-based output (clearly labelled) rather than fake LLM text.

import type { Bindings } from '../types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResult {
  text: string
  provider: 'groq' | 'openrouter' | 'rule-based'
  cost_cents: number
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function llm(
  env: Bindings,
  messages: ChatMessage[],
  opts: { max_tokens?: number; temperature?: number } = {}
): Promise<LLMResult> {
  const body = {
    messages,
    max_tokens: opts.max_tokens ?? 512,
    temperature: opts.temperature ?? 0.7,
  }

  // 1) Try Groq
  if (env.GROQ_API_KEY) {
    try {
      const r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', ...body }),
      })
      if (r.ok) {
        const j = (await r.json()) as any
        return {
          text: j.choices?.[0]?.message?.content ?? '',
          provider: 'groq',
          cost_cents: 5,
        }
      }
    } catch {
      /* fall through */
    }
  }

  // 2) Fallback OpenRouter
  if (env.OPENROUTER_API_KEY) {
    try {
      const r = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct', ...body }),
      })
      if (r.ok) {
        const j = (await r.json()) as any
        return {
          text: j.choices?.[0]?.message?.content ?? '',
          provider: 'openrouter',
          cost_cents: 8,
        }
      }
    } catch {
      /* fall through */
    }
  }

  // 3) No key → deterministic flag (agents will build rule-based output)
  return { text: '', provider: 'rule-based', cost_cents: 0 }
}
