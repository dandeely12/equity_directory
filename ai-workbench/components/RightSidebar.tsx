'use client';

import { useState, useEffect, useRef } from 'react';

interface Collection {
  name: string;
  pointsCount: number;
  status: string;
}

interface Document {
  id: string;
  fileName: string;
  title: string;
  totalChunks: number;
  uploadedAt: string;
  metadata: any;
}

export default function RightSidebar() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata form state
  const [metadata, setMetadata] = useState({
    title: '',
    kb_category: '',
    realm: '',
    characters: '',
    doc_type: '',
    version: '',
  });

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, []);

  // Fetch documents when collection changes
  useEffect(() => {
    if (selectedCollection) {
      fetchDocuments();
    }
  }, [selectedCollection]);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/qdrant/collections');
      const data = await response.json();
      if (data.success) {
        setCollections(data.data);
        // Select first collection if none selected
        if (!selectedCollection && data.data.length > 0) {
          setSelectedCollection(data.data[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!selectedCollection) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/qdrant/documents?collection=${selectedCollection}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      const response = await fetch('/api/qdrant/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName }),
      });

      const data = await response.json();
      if (data.success) {
        setNewCollectionName('');
        setShowNewCollection(false);
        await fetchCollections();
        setSelectedCollection(newCollectionName);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMetadata({ ...metadata, title: file.name });
      setShowMetadataForm(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMetadata({ ...metadata, title: file.name });
      setShowMetadataForm(true);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !selectedCollection) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('collectionName', selectedCollection);
      formData.append('title', metadata.title);
      if (metadata.kb_category) formData.append('kb_category', metadata.kb_category);
      if (metadata.realm) formData.append('realm', metadata.realm);
      if (metadata.characters) formData.append('characters', metadata.characters);
      if (metadata.doc_type) formData.append('doc_type', metadata.doc_type);
      if (metadata.version) formData.append('version', metadata.version);

      const response = await fetch('/api/qdrant/upsert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setShowMetadataForm(false);
        setSelectedFile(null);
        setMetadata({
          title: '',
          kb_category: '',
          realm: '',
          characters: '',
          doc_type: '',
          version: '',
        });
        await fetchDocuments();
        await fetchCollections(); // Refresh to update point counts
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const totalDocuments = documents.length;
  const selectedCollectionData = collections.find(c => c.name === selectedCollection);

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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Collection
          </label>
          <button
            onClick={() => setShowNewCollection(!showNewCollection)}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            + New
          </button>
        </div>

        {showNewCollection ? (
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && createCollection()}
            />
            <button
              onClick={createCollection}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create
            </button>
          </div>
        ) : null}

        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {collections.length === 0 ? (
            <option value="">No collections yet</option>
          ) : (
            collections.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.pointsCount} chunks)
              </option>
            ))
          )}
        </select>
      </div>

      {/* Upload Section */}
      {selectedCollection && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Upload Documents
          </h3>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer"
          >
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
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".txt,.md,.json,.csv"
            className="hidden"
          />
        </div>
      )}

      {/* Documents List */}
      <div className="mb-6 flex-1">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Documents
        </h3>
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Loading...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No documents uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {doc.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {doc.totalChunks} chunks • {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
                {doc.metadata?.kb_category && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {doc.metadata.kb_category}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Collections</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{collections.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalDocuments}</p>
          </div>
        </div>
        {selectedCollectionData && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Chunks (Vectors)</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedCollectionData.pointsCount}
            </p>
          </div>
        )}
      </div>

      {/* Metadata Form Modal */}
      {showMetadataForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Document Metadata
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={metadata.kb_category}
                  onChange={(e) => setMetadata({ ...metadata, kb_category: e.target.value })}
                  placeholder="e.g., lore, rules, character"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Realm
                </label>
                <input
                  type="text"
                  value={metadata.realm}
                  onChange={(e) => setMetadata({ ...metadata, realm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Characters (comma-separated)
                </label>
                <input
                  type="text"
                  value={metadata.characters}
                  onChange={(e) => setMetadata({ ...metadata, characters: e.target.value })}
                  placeholder="e.g., Alice, Bob"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <input
                    type="text"
                    value={metadata.doc_type}
                    onChange={(e) => setMetadata({ ...metadata, doc_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={metadata.version}
                    onChange={(e) => setMetadata({ ...metadata, version: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMetadataForm(false);
                  setSelectedFile(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={uploadDocument}
                disabled={uploading || !metadata.title}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
