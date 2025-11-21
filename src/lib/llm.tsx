import { pipeline } from '@huggingface/transformers';

export type ChatMessage = { role: string; content: string };

// Simple event system for status updates
type LlmEvent =
  | { type: 'loading-start'; model: string }
  | { type: 'loading-progress'; loaded: number; total?: number; file?: string; percent?: number; model: string }
  | { type: 'loading-complete'; model: string }
  | { type: 'generation-start' }
  | { type: 'generation-complete' }
  | { type: 'generation-error'; error: string };

const listeners: ((e: LlmEvent) => void)[] = [];

export function subscribeLlmStatus(fn: (e: LlmEvent) => void) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function emit(e: LlmEvent) {
  listeners.forEach(l => l(e));
}

let generatorPromise: Promise<any> | null = null;

export function getGenerator() {
  const modelName = 'onnx-community/Llama-3.2-1B-Instruct-q4f16';
  if (!generatorPromise) {
    console.log('[LLM] Initializing model pipeline...');
    emit({ type: 'loading-start', model: modelName });
    generatorPromise = pipeline(
      'text-generation',
      modelName,
      {
        device: 'webgpu',
        progress_callback: (p: any) => {
          // p.loaded (bytes), p.total (bytes), p.file (shard name)
          const loaded = p.loaded ?? 0;
          const total = p.total;
            // Percent (0-100)
          const percent = total ? +( (loaded / total) * 100 ).toFixed(2) : undefined;
          console.log('[LLM] Loading progress:', p);
          emit({
            type: 'loading-progress',
            loaded,
            total,
            file: p.file,
            percent,
            model: modelName
          });
        }
      }
    ).then(gen => {
      console.log('[LLM] Model ready.');
      emit({ type: 'loading-complete', model: modelName });
      return gen;
    });
  }
  return generatorPromise;
}

export const COMMAND_ROUTE_MAP: Record<string, string> = {
  dashboard: '/dashboard',
  'open store page': '/store_page',
  'view products': '/products',
  'show profile': '/profile',
  help: '/llm_tester',
  logout: '/'
};

// New: alias / synonym lists (lowercase)
export const COMMAND_ALIASES: Record<string, string[]> = {
  dashboard: ['dashboard', 'home', 'main screen', 'dashbord', 'go dashboard'],
  'open store page': ['store', 'stores', 'open store', 'store page', 'open store page'],
  'view products': [
    'products', 'product page', 'open products', 'open product page',
    'view products', 'show products', 'see products', 'product listing',
    'produts', 'product list'
  ],
  'show profile': ['profile', 'my profile', 'show profile', 'profil', 'account'],
  help: ['help', 'assist', 'support', 'commands', 'options'],
  logout: ['logout', 'log out', 'sign out', 'exit app', 'end session']
};

// Refined system prompt: tolerant to minor ASR errors & synonyms.
export const DEFAULT_SYSTEM_PROMPT = `You are an intent classifier.
Canonical COMMAND strings (must be returned exactly as below):
["dashboard","open store page","view products","show profile","help","logout"]

User input may contain:
- Minor spelling / ASR errors (e.g. "produts", "dashbord", "profil").
- Synonyms (e.g. "home" -> "dashboard", "product page" -> "view products").

Task:
1. If the user text clearly matches or refers to one of those commands (including obvious misspellings or synonyms), output:
{"type":"COMMAND","command":"<exact canonical command string>"}
2. If the user is describing a product to add (e.g. giving attributes, price, colors, sizes, or saying "add"/"new"/"create" without matching a navigation intent), output:
{"type":"ADD_PRODUCT"}
3. Otherwise, if ambiguous, default to ADD_PRODUCT.

Rules:
- Output ONLY valid JSON.
- No commentary, no markdown.
- Prefer the closest navigation intent if user asks to go/open/show/navigate to a page.
- Use "logout" only if user wants to end/leave/sign out.
- Do not invent new command strings.
Examples:
"Go to product page" => {"type":"COMMAND","command":"view products"}
"show me my profil" => {"type":"COMMAND","command":"show profile"}
"dashbord" => {"type":"COMMAND","command":"dashboard"}
"Add new red running shoes size 42" => {"type":"ADD_PRODUCT"}
"open store" => {"type":"COMMAND","command":"open store page"}
`;

export type LlmIntent =
  | { type: 'COMMAND'; command: string }
  | { type: 'ADD_PRODUCT' }
  | { type: 'UNKNOWN'; raw: string };

export function parseLlmIntent(raw: string): LlmIntent {
  try {
    const trimmed = raw.trim();
    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return fallbackClassify(trimmed);
    const obj = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
    if (obj.type === 'COMMAND' && typeof obj.command === 'string') {
      const cmd = obj.command.trim().toLowerCase();
      if (COMMAND_ROUTE_MAP[cmd]) return { type: 'COMMAND', command: cmd };
      return fallbackClassify(trimmed);
    }
    if (obj.type === 'ADD_PRODUCT') return { type: 'ADD_PRODUCT' };
    return fallbackClassify(trimmed);
  } catch {
    return fallbackClassify(raw);
  }
}

// Fallback classification if model output is not clean JSON or invalid command.
function fallbackClassify(text: string): LlmIntent {
  const lower = text.toLowerCase();
  // Simple heuristic: look for alias tokens.
  for (const canonical of Object.keys(COMMAND_ALIASES)) {
    const aliases = COMMAND_ALIASES[canonical];
    if (aliases.some(a => lower.includes(a))) {
      return { type: 'COMMAND', command: canonical };
    }
  }
  // If mentions navigation verbs + page nouns
  const navVerbs = /(go|open|show|view|navigate)/;
  const pageNouns = /(product|store|profil|profile|dashboard|help|logout|sign out|exit)/;
  if (navVerbs.test(lower) && pageNouns.test(lower)) {
    // Try fuzzy match by longest alias occurrence
    let best: { cmd: string; score: number } | null = null;
    for (const canonical of Object.keys(COMMAND_ALIASES)) {
      for (const alias of COMMAND_ALIASES[canonical]) {
        if (lower.includes(alias)) {
          const score = alias.length;
            if (!best || score > best.score) best = { cmd: canonical, score };
        }
      }
    }
    if (best) return { type: 'COMMAND', command: best.cmd };
  }
  // If text seems like product description (colors, sizes, prices)
  if (/(add|new|create|insert)/.test(lower) || /(size|color|price|\$|\d+)/.test(lower)) {
    return { type: 'ADD_PRODUCT' };
  }
  return { type: 'ADD_PRODUCT' };
}

// Augment chatReply to return intent.
export async function chatReply(history: ChatMessage[], userText: string, opts?: { max_new_tokens?: number }) {
  // Append new user message and get assistant reply
  const messages = [...history, { role: 'user', content: userText }];
  const assistantText = await generate(messages, opts);
  const intent = parseLlmIntent(assistantText);
  return {
    assistantText,
    intent,
    messages: [...messages, { role: 'assistant', content: assistantText }]
  };
}

export async function generate(messages: ChatMessage[], opts?: { max_new_tokens?: number }) {
  const gen = await getGenerator();
  const max_new_tokens = opts?.max_new_tokens ?? 64;

  // Build a simple prompt from the chat history.
  const prompt =
    messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`.trim())
      .join('\n') + '\nASSISTANT:';

  emit({ type: 'generation-start' });
  try {
    const out = await gen(prompt, {
      max_new_tokens,
      temperature: 0.2,
      return_full_text: true
    });

    // HF transformers JS pipeline usually returns an array.
    let full = '';
    if (Array.isArray(out) && out.length && out[0].generated_text) {
      full = out[0].generated_text;
    } else if (typeof out === 'string') {
      full = out;
    } else {
      full = JSON.stringify(out);
    }

    // Extract only the new assistant portion after the prompt.
    const newPart = full.startsWith(prompt) ? full.slice(prompt.length) : full;
    const cleaned = newPart.trim();

    emit({ type: 'generation-complete' });
    return cleaned;
  } catch (e: any) {
    emit({ type: 'generation-error', error: e?.message || String(e) });
    throw e;
  }
}
