'use client';

import { useState, useRef, useEffect } from 'react';
import { ModelSettings } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  runId?: string;
}

interface ChatInterfaceProps {
  selectedModel: string;
  modelSettings: ModelSettings;
  systemPrompt: string;
  onRunSelected: (runId: string) => void;
}

export default function ChatInterface({
  selectedModel,
  modelSettings,
  systemPrompt,
  onRunSelected,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragMode, setRagMode] = useState(false);
  const [streamMode, setStreamMode] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/qdrant/collections');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setCollections(data.data);
        setSelectedCollection(data.data[0].name);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleSendStreaming = async (userMessage: string) => {
    setLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          modelId: selectedModel,
          systemPrompt,
          mode: ragMode ? 'vector_rag' : 'direct',
          collectionName: ragMode ? selectedCollection : undefined,
          settings: modelSettings,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let runId: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk') {
                accumulatedContent += data.content;
                setStreamingContent(accumulatedContent);
              } else if (data.type === 'done') {
                runId = data.data.runId;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      // Add final message
      if (accumulatedContent) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: accumulatedContent,
            runId,
          },
        ]);
      }
      setStreamingContent('');
    } catch (error) {
      console.error('Error streaming message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
      setStreamingContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRegular = async (userMessage: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/chat/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          modelId: selectedModel,
          systemPrompt,
          mode: ragMode ? 'vector_rag' : 'direct',
          collectionName: ragMode ? selectedCollection : undefined,
          settings: modelSettings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.data.message,
            runId: data.data.runId,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${data.error}`,
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || !selectedModel) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    if (streamMode) {
      await handleSendStreaming(userMessage);
    } else {
      await handleSendRegular(userMessage);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-4 flex-wrap gap-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={streamMode}
              onChange={(e) => setStreamMode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Streaming
            </span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ragMode}
              onChange={(e) => setRagMode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              RAG Mode (Vector Search)
            </span>
          </label>

          {ragMode && collections.length > 0 && (
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {collections.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.pointsCount} chunks)
                </option>
              ))}
            </select>
          )}

          {!selectedModel && (
            <span className="text-sm text-red-600 dark:text-red-400">
              Please select a model first
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm mt-1">
                {selectedModel
                  ? 'Start a conversation to get started'
                  : 'Select a model in the left sidebar first'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-3xl">
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.runId && (
                    <button
                      onClick={() => onRunSelected(msg.runId!)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                      View run details →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-3xl">
                  <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <p className="whitespace-pre-wrap">{streamingContent}</p>
                    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={selectedModel ? "Type your message..." : "Select a model first..."}
            disabled={!selectedModel || loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!selectedModel || !inputMessage.trim() || loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
