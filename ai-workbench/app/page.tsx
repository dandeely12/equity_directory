'use client';

import { useState } from 'react';
import LeftSidebar from '@/components/LeftSidebar';
import MainPanel from '@/components/MainPanel';
import RightSidebar from '@/components/RightSidebar';
import ObservabilityDrawer from '@/components/ObservabilityDrawer';
import { ModelSettings, DEFAULT_MODEL_SETTINGS } from '@/types';

export default function Home() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Shared model configuration state
  const [selectedModel, setSelectedModel] = useState('');
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleRunSelected = (runId: string) => {
    setSelectedRunId(runId);
    setDrawerOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - Model Configuration */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <LeftSidebar
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          settings={modelSettings}
          onSettingsChange={setModelSettings}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
        />
      </div>

      {/* Main Panel - Chat & Flows */}
      <div className="flex-1 flex flex-col">
        <MainPanel
          onRunSelected={handleRunSelected}
          selectedModel={selectedModel}
          modelSettings={modelSettings}
          systemPrompt={systemPrompt}
        />

        {/* Bottom Drawer - Observability */}
        <ObservabilityDrawer
          runId={selectedRunId}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      {/* Right Sidebar - Knowledge Base */}
      <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <RightSidebar />
      </div>
    </div>
  );
}
