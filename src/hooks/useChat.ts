import { useState, useCallback } from 'react';
import { Message, ChatState } from '../lib/types';
import { chat } from '../lib/llm'; 
import { useLocalStorageDB } from '../lib/useLocalStorageDB';
import { PAGE_PROMPT, ROUTER_PROMPT, STORE_PROMPT_TEMPLATE } from '../lib/prompts';

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  // Access DB to get stores for the prompt
  const { getStoresByUserId, getCurrentUserId } = useLocalStorageDB();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    const userMessage: Message = { role: 'user', content };
    // We keep the history for the UI, but for this specific logic, 
    // we might want to send just the current message or a small window to the router.
    const updatedMessages = [...state.messages, userMessage];

    setState(prev => ({
      ...prev,
      messages: updatedMessages,
      isLoading: true,
      error: null,
    }));

    try {
      // --- STEP 1: ROUTING ---
      // Ask LLM to decide the intent based on the *latest* message content
      // We wrap it in a temporary message structure for the LLM call
      const routerMessages: Message[] = [{ role: 'user', content }];
      const intentResponse = await chat(routerMessages, ROUTER_PROMPT);
      const intent = intentResponse.trim().toUpperCase().includes("STORE") ? "STORE" : "PAGE";

      console.log("Detected Intent:", intent);

      let selectedSystemPrompt = PAGE_PROMPT;

      // --- STEP 2: CONTEXT PREPARATION ---
      if (intent === "STORE") {
        // Fetch stores dynamically
        const userId = getCurrentUserId() ?? 0;
        const stores = getStoresByUserId(userId);
        const simpleStoreList = stores.map(s => ({ id: s.id, name: s.storeName }));
        
        // Inject into template
        selectedSystemPrompt = STORE_PROMPT_TEMPLATE.replace(
          "{{STORE_LIST}}", 
          JSON.stringify(simpleStoreList, null, 2)
        );
      }

      // --- STEP 3: FINAL RESPONSE ---
      // Now call LLM again with the specific prompt and the conversation history
      const response = await chat(updatedMessages, selectedSystemPrompt);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
      };

      setState(prev => ({
        ...prev,
        messages: [...updatedMessages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Chat error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  }, [state.messages, state.isLoading, getStoresByUserId, getCurrentUserId]);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearChat,
  };
}

