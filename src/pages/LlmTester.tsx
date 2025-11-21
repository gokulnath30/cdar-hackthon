import React, { useState, useEffect } from 'react';
import { generate, ChatMessage, subscribeLlmStatus, parseLlmIntent, COMMAND_ROUTE_MAP } from '../lib/llm';

const LlmTester: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful assistant.' }
  ]);
  const [status, setStatus] = useState<string>('Idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadPct, setLoadPct] = useState<number | null>(null);
  const [currentShard, setCurrentShard] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');

  // Subscribe to model status events
  useEffect(() => {
    const unsub = subscribeLlmStatus(e => {
      switch (e.type) {
        case 'loading-start':
          setStatus('Loading model...');
          setModelName(e.model);
          setLoadPct(0);
          setCurrentShard(null);
          break;
        case 'loading-progress':
          setStatus('Loading model...');
          setModelName(e.model);
          if (e.percent !== undefined) setLoadPct(e.percent);
          if (e.file) setCurrentShard(e.file);
          break;
        case 'loading-complete':
          setStatus('Model loaded.');
          setLoadPct(null);
          setCurrentShard(null);
          break;
        case 'generation-start':
          setStatus('Generating response...');
          break;
        case 'generation-complete':
        case 'generation-error':
          setStatus('Idle');
          break;
      }
    });
    return unsub;
  }, []);

  async function sendMessage() {
    if (!input.trim()) return;
    setError(null);
    setLoading(true);
    const baseMessages = messages.length && messages[0].role === 'system'
      ? [{ role: 'system', content: systemPrompt }, ...messages.slice(1)]
      : [{ role: 'system', content: systemPrompt }, ...messages];
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...baseMessages, userMsg];
    setMessages(newMessages);
    setInput('');
    try {
      const answer = await generate(newMessages, { max_new_tokens: 64 });
      const intent = parseLlmIntent(answer);
      const assistantMsg: ChatMessage = { role: 'assistant', content: answer };
      setMessages(m => [...m, assistantMsg]);

      if (intent.type === 'COMMAND') {
        const route = COMMAND_ROUTE_MAP[intent.command];
        if (route) {
          // Optional: show a transient message before navigation
          console.log('[INTENT] Navigating to', intent.command, '->', route);
          window.navigate?.(route);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Error generating text');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, fontFamily: 'sans-serif', margin: '0 auto' }}>
      <h2>LLM Chat Tester</h2>
      <div style={{ marginBottom: 8, fontSize: 12, color: '#555' }}>
        Status: {status}
        {loadPct !== null && (
          <div style={{ marginTop: 4 }}>
            <div style={{
              position: 'relative',
              height: 8,
              background: '#eee',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${loadPct}%`,
                background: '#4b8ef7',
                transition: 'width 0.25s'
              }} />
            </div>
            <div style={{ marginTop: 4 }}>
              {modelName} {loadPct.toFixed(2)}% {currentShard ? `(${currentShard})` : ''}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          border: '1px solid #ddd',
          padding: 12,
          borderRadius: 6,
          background: '#fafafa',
          maxHeight: 360,
          overflowY: 'auto',
          marginBottom: 12
        }}
      >
        {messages
          .filter(m => m.role !== 'system')
          .map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: 10,
                padding: '6px 8px',
                borderRadius: 4,
                background: m.role === 'user' ? '#e8f3ff' : '#e9ffe8'
              }}
            >
              <strong>{m.role === 'user' ? 'User' : 'Assistant'}:</strong>{' '}
              <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
            </div>
          ))}
        {loading && (
          <div style={{ fontStyle: 'italic', color: '#666' }}>Thinking...</div>
        )}
      </div>
      <label style={{ display: 'block', marginBottom: 4 }}>
        Your message:
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={3}
          style={{ width: '100%', marginTop: 4 }}
          placeholder="Ask something..."
        />
      </label>
      <button
        onClick={sendMessage}
        disabled={loading || !input.trim()}
        style={{ padding: '6px 14px', marginRight: 8 }}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
      <button
        onClick={() => {
          setMessages([{ role: 'system', content: systemPrompt }]);
          setError(null);
        }}
        disabled={loading}
        style={{ padding: '6px 14px' }}
      >
        Clear
      </button>
      <label style={{ display: 'block', marginBottom: 8 }}>
        System prompt:
        <input
          type="text"
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          style={{ width: '100%', marginTop: 4 }}
          placeholder="Enter system instructions..."
        />
      </label>
      {error && (
        <div style={{ color: 'red', marginTop: 12 }}>Error: {error}</div>
      )}
      <div style={{ marginTop: 16, fontSize: 12, color: '#777' }}>
        Open DevTools (F12) to see detailed console logs for model download and
        generation steps.
      </div>
    </div>
  );
};

export default LlmTester;