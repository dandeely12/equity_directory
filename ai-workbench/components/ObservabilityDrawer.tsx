'use client';

interface ObservabilityDrawerProps {
  runId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ObservabilityDrawer({ runId, isOpen, onClose }: ObservabilityDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Run Inspector
          </h3>
          {runId && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Run ID: {runId}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="h-64 overflow-y-auto p-6">
        {runId ? (
          <div className="space-y-4">
            {/* Timeline Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Execution Timeline
              </h4>
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Start</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">0ms</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Model Call</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">125ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Metrics
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">125ms</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tokens</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">234</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cost</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">$0.002</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <p className="text-sm">Select a run to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
