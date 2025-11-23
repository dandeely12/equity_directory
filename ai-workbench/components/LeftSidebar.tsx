'use client';

import { useState, useEffect } from 'react';
import { ModelDefinition, ModelSettings, DEFAULT_MODEL_SETTINGS } from '@/types';

export default function LeftSidebar() {
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSaveProfile, setShowSaveProfile] = useState(false);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    fetchModels();
    fetchProfiles();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models/list');
      const data = await response.json();
      if (data.success) {
        setModels(data.data.all);
        if (data.data.all.length > 0 && !selectedModel) {
          setSelectedModel(data.data.all[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      const data = await response.json();
      if (data.success) {
        setProfiles(data.data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const saveProfile = async () => {
    if (!profileName.trim()) return;

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          modelId: selectedModel,
          systemPrompt,
          settings,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProfileName('');
        setShowSaveProfile(false);
        await fetchProfiles();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const loadProfile = async (profile: any) => {
    setSelectedModel(profile.modelId);
    setSystemPrompt(profile.systemPrompt);
    setSettings(profile.settings);
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('Delete this profile?')) return;

    try {
      await fetch('/api/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Select a model...</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
        {selectedModel && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {models.find(m => m.id === selectedModel)?.contextWindow.toLocaleString()} context window
          </p>
        )}
      </div>

      {/* Model Settings */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Temperature: {settings.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Focused</span>
          <span>Creative</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Tokens: {settings.maxTokens}
        </label>
        <input
          type="number"
          value={settings.maxTokens}
          onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
          min="100"
          max="8192"
          step="100"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      </div>

      {/* System Prompt */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          System Prompt
        </label>
        <textarea
          rows={4}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Enter system prompt..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      </div>

      {/* Profiles */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profiles
        </h3>

        {showSaveProfile ? (
          <div className="space-y-2 mb-2">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Profile name"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && saveProfile()}
            />
            <div className="flex space-x-2">
              <button
                onClick={saveProfile}
                className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveProfile(false)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveProfile(true)}
            className="w-full px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition mb-2"
          >
            + Save Current as Profile
          </button>
        )}

        {profiles.length > 0 && (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => loadProfile(profile)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {models.find(m => m.id === profile.modelId)?.name || profile.modelId}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
