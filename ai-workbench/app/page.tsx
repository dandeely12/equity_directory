'use client';

import { useState } from 'react';
import LeftSidebar from '@/components/LeftSidebar';
import MainPanel from '@/components/MainPanel';
import RightSidebar from '@/components/RightSidebar';
import ObservabilityDrawer from '@/components/ObservabilityDrawer';

export default function Home() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRunSelected = (runId: string) => {
    setSelectedRunId(runId);
    setDrawerOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - Model Configuration */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <LeftSidebar />
      </div>

      {/* Main Panel - Chat & Flows */}
      <div className="flex-1 flex flex-col">
        <MainPanel onRunSelected={handleRunSelected} />

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
