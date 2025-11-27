import { pipeline, TextStreamer } from '@huggingface/transformers';

let generatorPromise: Promise<any> | null = null;

/**
 * Loads the model (WebGPU) once and returns a generator instance.
 */
export function getGenerator() {
  // const modelName = 'onnx-community/Llama-3.2-1B-Instruct-q4f16'; onnx-community/Qwen3-0.6B-ONNX
  
  // const modelName = 'onnx-community/SmolLM2-135M-ONNX';

  const modelName = 'onnx-community/Qwen3-0.6B-ONNX';

  if (!generatorPromise) {
    console.log('[LLM] Loading model...');
    generatorPromise = pipeline('text-generation', modelName, {
      device: 'webgpu',
      dtype: 'q4f16', // The console warning "VerifyEachNodeIsAssignedToAnEp" is normal for WebGPU and can be ignored.
      progress_callback: (p: any) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('llm-progress', { detail: p }));
        }
      }
    }).then((gen) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('llm-progress', { detail: { status: 'complete' } }));
      }
      return gen;
    }).catch((e) => {
      // If loading fails, reset the promise so we can try again later
      console.error("[LLM] Failed to load model:", e);
      generatorPromise = null;
      throw e;
    });
  }
  return generatorPromise;
}

/**
 * Generates text from a prompt.
 */
export async function generateFromPrompt(
  prompt: string,
  opts?: { max_new_tokens?: number }
): Promise<string> {
  let gen;
  try {
    gen = await getGenerator();
  } catch (e) {
    throw new Error("Model failed to load.");
  }

  // Reduced tokens since we want short responses
  const max_new_tokens = opts?.max_new_tokens ?? 128;

  try {
    // Wrap single prompt in user message for chat-tuned models
    const messages = [
      { role: "user", content: prompt },
    ];

    const out = await gen(messages, {
      max_new_tokens,
      do_sample: false, // Greedy decoding
    });
    
    let text = "";
    if (Array.isArray(out) && out.length && out[0].generated_text) {
      const lastMessage = out[0].generated_text.at(-1);
      text = lastMessage?.content || "";
    } else if (typeof out === "string") {
      text = out;
    } else {
      text = JSON.stringify(out);
    }
    
    console.log("[LLM] Raw generated text:", text);
    
    // ❗ Enhanced cleaning pipeline
    const cleaned = cleanLLMOutput(text);
    console.log("[LLM] Cleaned output:", cleaned);
    
    return cleaned;
  } catch (err: any) {
    console.error("[LLM] Generation error:", err);
    generatorPromise = null;
    throw err;
  }
}

/**
 * Enhanced cleaning for small model outputs
 */
function cleanLLMOutput(text: string): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // 0. Remove <think> blocks (common in reasoning models)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  
  // 1. Remove all ASSISTANT: repetitions
  cleaned = cleaned.replace(/ASSISTANT:\s*/g, '');
  
  // 2. Extract content before any repetition or new ASSISTANT
  const firstResponse = cleaned.split('ASSISTANT')[0].trim();
  
  // 3. Remove repeated lines (common in small models)
  const lines = firstResponse.split('\n').filter((line, index, arr) => {
    // Remove duplicate consecutive lines
    return index === 0 || line.trim() !== arr[index - 1].trim();
  });
  
  cleaned = lines[0] || ''; // Take only the first unique line
  
  // 4. Look for JSON structure first
  const jsonMatch = cleaned.match(/\{[^{}]*\}/);
  if (jsonMatch) {
    try {
      // Validate it's proper JSON
      JSON.parse(jsonMatch[0]);
      return jsonMatch[0];
    } catch (e) {
      // Not valid JSON, continue with other cleaning
    }
  }
  
  // 5. For ROUTER_PROMPT, extract only STORE or PAGE
  const singleWordMatch = cleaned.match(/\b(STORE|PAGE)\b/);
  if (singleWordMatch) {
    return singleWordMatch[0];
  }
  
  // 6. Final cleanup - remove any remaining conversational fluff
  cleaned = cleaned
    .replace(/^(Open|Show|Go to|Take me to|I'll|Let me)\s+/i, '')
    .replace(/\.$/, '') // Remove trailing period
    .trim();
    
  return cleaned || "NONE"; // Fallback
}

export async function chat(
  messages: { role: string; content: string }[],
  systemPrompt: string
) {
  let gen;
  try {
    gen = await getGenerator();
  } catch (e) {
    throw new Error("Model failed to load.");
  }

  // Construct messages array for the pipeline
  const conversation = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  try {
    const output = await gen(conversation, {
      max_new_tokens: 300,
      do_sample: false,
      streamer: new TextStreamer(gen.tokenizer, { skip_prompt: true, skip_special_tokens: true }),
    });

    const response = output[0].generated_text.at(-1).content;
    console.log("[LLM] Chat Raw:", response);
    
    const cleaned = cleanLLMOutput(response);
    return cleaned;
  } catch (err) {
    console.error("[LLM] Chat error:", err);
    throw err;
  }
}