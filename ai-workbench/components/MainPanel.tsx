'use client';

import { useState } from 'react';
import RunHistory from './RunHistory';

interface MainPanelProps {
  onRunSelected: (runId: string) => void;
}

type Tab = 'chat' | 'flows' | 'history';

export default function MainPanel({ onRunSelected }: MainPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    setMessages([...messages, { role: 'user', content: inputMessage }]);
    setInputMessage('');

    // Simulate response (will be replaced with actual API call)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'This is a placeholder response.' }]);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex px-6 pt-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('flows')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
              activeTab === 'flows'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Flows
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Start a conversation to get started</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSend}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <RunHistory onSelectRun={onRunSelected} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">Flows</p>
              <p className="text-sm mt-1">Flow builder coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
