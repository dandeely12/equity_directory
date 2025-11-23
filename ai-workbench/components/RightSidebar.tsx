'use client';

import { useState } from 'react';

export default function RightSidebar() {
  const [selectedCollection, setSelectedCollection] = useState('');

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Knowledge Base
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your vectorized documents
        </p>
      </div>

      {/* Collection Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Collection
        </label>
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">No collections yet</option>
        </select>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Upload Documents
        </h3>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Drag and drop files here
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            or click to browse
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Documents
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No documents uploaded yet
        </div>
      </div>

      {/* Stats */}
      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Collections</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
