import { pipeline } from '@huggingface/transformers';

let generatorPromise: Promise<any> | null = null;

/**
 * Loads the model (WebGPU) once and returns a generator instance.
 */
export function getGenerator() {
  const modelName = 'onnx-community/Llama-3.2-1B-Instruct-q4f16';
  if (!generatorPromise) {
    console.log('[LLM] Loading model...');
    generatorPromise = pipeline('text-generation', modelName, {
      device: 'webgpu',
      dtype: 'q4f16', // The console warning "VerifyEachNodeIsAssignedToAnEp" is normal for WebGPU and can be ignored.
      // progress_callback: p => {
      //   console.log('[LLM] Loading progress:', p);
      // }
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

  // ❗ Increased limit to ensure JSON responses aren't cut off
  const max_new_tokens = opts?.max_new_tokens ?? 128;

  try {
    const out = await gen(prompt, {
      max_new_tokens,
      temperature: 0.2,
      return_full_text: false, // ❗ prevents the model from echoing prompt
      stop: ["USER:", "SYSTEM:", "ASSISTANT:"], // ❗ stops after first assistant reply
    });
    // console.log("[LLM] Raw output:", out);
    let text = "";
    if (Array.isArray(out) && out.length && out[0].generated_text) {
      text = out[0].generated_text;
    } else if (typeof out === "string") {
      text = out;
    } else {
      text = JSON.stringify(out);
    }

    // Extract JSON object if found, to ignore any conversational filler
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return text.trim();
  } catch (err: any) {
    // Handle WebGPU device loss or other errors
    console.error("[LLM] Generation error:", err);
    generatorPromise = null; // Reset so next call re-initializes
    throw err;
  }
}


export async function chat(
  messages: { role: string; content: string }[],
  systemPrompt: string
) {
  // ❗ Fix: Only use the latest user message.
  // Previous logic stacked multiple USER messages without ASSISTANT replies, confusing the model.
  // For voice commands, we usually only care about the immediate request.
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();

  if (!lastUserMsg) return "";

  const prompt =
    `SYSTEM: ${systemPrompt}\n` +
    `USER: ${lastUserMsg.content}\n` +
    'ASSISTANT:';

  return await generateFromPrompt(prompt);
}
