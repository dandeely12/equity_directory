'use client';

import { useState } from 'react';
import RunHistory from './RunHistory';
import ChatInterface from './ChatInterface';
import { ModelSettings } from '@/types';

interface MainPanelProps {
  onRunSelected: (runId: string) => void;
  selectedModel: string;
  modelSettings: ModelSettings;
  systemPrompt: string;
}

type Tab = 'chat' | 'flows' | 'history';

export default function MainPanel({
  onRunSelected,
  selectedModel,
  modelSettings,
  systemPrompt,
}: MainPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

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
          <ChatInterface
            selectedModel={selectedModel}
            modelSettings={modelSettings}
            systemPrompt={systemPrompt}
            onRunSelected={onRunSelected}
          />
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
