'use client';

import { useState } from 'react';

export default function LeftSidebar() {
  const [selectedModel, setSelectedModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Model Configuration
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select and configure your AI model
        </p>
      </div>

      {/* Model Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select a model...</option>
          <option value="gpt-4">GPT-4 (OpenAI)</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet (Anthropic)</option>
          <option value="local">Local Model (LM Studio)</option>
        </select>
      </div>

      {/* Model Settings */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Temperature: {temperature}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Focused</span>
          <span>Creative</span>
        </div>
      </div>

      {/* System Prompt */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          System Prompt
        </label>
        <textarea
          rows={4}
          placeholder="Enter system prompt..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Profiles */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profiles
        </h3>
        <button className="w-full px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition">
          + Save Current as Profile
        </button>
      </div>
    </div>
  );
}
