'use client';

import { useState, useEffect } from 'react';

interface Run {
  id: string;
  type: 'chat' | 'flow';
  name: string;
  mode?: string;
  status: string;
  startTime: string;
  durationMs: number;
  totalTokens: number;
  totalCost: number;
  error?: string;
}

interface RunHistoryProps {
  onSelectRun: (runId: string) => void;
}

export default function RunHistory({ onSelectRun }: RunHistoryProps) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'chat' | 'flow'>('all');

  useEffect(() => {
    fetchRuns();
  }, [filter]);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? '/api/logs/recent?limit=50'
        : `/api/logs/recent?limit=50&type=${filter}`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setRuns(data.data);
      }
    } catch (error) {
      console.error('Error fetching runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, error?: string) => {
    if (error) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (status === 'completed') return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (status === 'running') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Run History
        </h2>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md transition ${
              filter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('chat')}
            className={`px-3 py-1 text-sm rounded-md transition ${
              filter === 'chat'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setFilter('flow')}
            className={`px-3 py-1 text-sm rounded-md transition ${
              filter === 'flow'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            Flows
          </button>
        </div>
      </div>

      {/* Runs List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">No runs yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Chat interactions will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => onSelectRun(run.id)}
                className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        run.type === 'chat'
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                          : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                      }`}>
                        {run.type}
                      </span>
                      {run.mode && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {run.mode}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(run.status, run.error)}`}>
                        {run.error ? 'failed' : run.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {run.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(run.startTime).toLocaleString()} • {run.durationMs}ms
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {run.totalTokens} tokens
                    </p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white mt-1">
                      ${run.totalCost.toFixed(4)}
                    </p>
                  </div>
                </div>
                {run.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 truncate">
                    Error: {run.error}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
