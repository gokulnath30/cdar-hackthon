import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { Message } from '../lib/types';

export const LlmTester: React.FC = () => {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessage = (message: Message) => {
    return message.content.split('\n').map((line, index) => (
      <div key={index}>
        {line}
        {index < message.content.split('\n').length - 1 && <br />}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">AI Chat</h2>
        <button 
          onClick={clearChat} 
          disabled={isLoading}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Clear Chat
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 px-6 py-3 border-b border-red-200 text-sm">
          Error: {error}
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {messages.filter(m => m.role !== 'system').map((message, index) => (
          <div
            key={index}
            className={`flex flex-col mb-6 animate-fade-in ${
              message.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className={`text-sm font-medium mb-1 ${
              message.role === 'user' ? 'text-blue-600' : 'text-green-600'
            }`}>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {formatMessage(message)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col mb-6 items-start animate-fade-in">
            <div className="text-sm font-medium mb-1 text-green-600">
              Assistant
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            rows={3}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium self-end"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};