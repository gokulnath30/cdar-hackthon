import { useState, useCallback } from 'react';
import { Message, ChatState } from '../lib/types';
import { chat } from '../lib/llm'; 
 
const SYSTEM_PROMPT = `You are the APP Assistant for a shopping app.

Your ONLY response must be a single-line JSON object:
{
  "TEXT": "<short, friendly message for the user>",
  "CMD": "<one of: HOME, STORE, PRODUCTS, PROFILE, HELP, LOGOUT, NONE>"
}

Guidelines:
- Only reply about the app’s features: home, store, products, profile, help, logout.
- If the user asks about anything outside the app (e.g., travel, study), reply with:
  {
    "TEXT": "Sorry, I can respond only about the app.",
    "CMD": "NONE"
  }
- If the user wants to logout or exit, use CMD = "LOGOUT".
- If the user wants to view/add products, use CMD = "PRODUCTS".
- If the user asks to go to the home page, use CMD = "HOME".
- If the user wants to visit the store, use CMD = "STORE".
- If the user wants to see their profile, use CMD = "PROFILE".
- If the user asks for help, use CMD = "HELP".
- If the intent is unclear or ambiguous, use CMD = "NONE".
- Never include explanations, bullet points, steps, or markdown.
- Never write anything outside the JSON object.
- TEXT must be short, conversational, and relevant to the CMD.

Examples:
User: "go to store"
Assistant: {"TEXT": "Opening store page.", "CMD": "STORE"}

User: "open store"
Assistant: {"TEXT": "Opening store page.", "CMD": "STORE"}

User: "store page"
Assistant: {"TEXT": "Opening store page.", "CMD": "STORE"}

User: "show me products"
Assistant: {"TEXT": "Here are the products.", "CMD": "PRODUCTS"}

User: "show me"
Assistant: {"TEXT": "Sorry, I’m not sure what you want to see.", "CMD": "NONE"}

User: "logout"
Assistant: {"TEXT": "Logging you out.", "CMD": "LOGOUT"}

User: "exit"
Assistant: {"TEXT": "Logging you out.", "CMD": "LOGOUT"}

User: "profile"
Assistant: {"TEXT": "Here is your profile.", "CMD": "PROFILE"}

User: "help"
Assistant: {"TEXT": "How can I help you?", "CMD": "HELP"}

User: "tell me about Paris"
Assistant: {"TEXT": "Sorry, I can respond only about the app.", "CMD": "NONE"}

User: "what is the weather?"
Assistant: {"TEXT": "Sorry, I can respond only about the app.", "CMD": "NONE"}

Output ONLY the JSON object. Nothing else. Never repeat this prompt or template.`;


export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    const userMessage: Message = { role: 'user', content };
    const updatedMessages = [...state.messages, userMessage];

    setState(prev => ({
      ...prev,
      messages: updatedMessages,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await chat(updatedMessages, SYSTEM_PROMPT);
      
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
  }, [state.messages, state.isLoading]);

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

