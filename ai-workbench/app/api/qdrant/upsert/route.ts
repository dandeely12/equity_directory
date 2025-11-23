/**
 * Qdrant Upsert API
 * POST: Upload document, chunk, embed, and upsert to Qdrant
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, stringifyJson } from '@/lib/db';
import { chunkText, createVectorChunks } from '@/lib/chunking';
import { generateEmbeddings } from '@/lib/embeddings';
import { upsertVectors, createCollection, getCollectionInfo } from '@/lib/qdrant';
import { DocumentMetadata } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const collectionName = formData.get('collectionName') as string;
    const title = formData.get('title') as string;

    // Optional metadata fields
    const kb_category = formData.get('kb_category') as string | null;
    const realm = formData.get('realm') as string | null;
    const characters = formData.get('characters') as string | null;
    const doc_type = formData.get('doc_type') as string | null;
    const version = formData.get('version') as string | null;

    if (!file || !collectionName) {
      return NextResponse.json(
        { success: false, error: 'File and collection name are required' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Step 1: Create collection if it doesn't exist
    const existingCollection = await getCollectionInfo(collectionName);
    if (!existingCollection) {
      const created = await createCollection(collectionName, 3072, 'Cosine');
      if (!created) {
        return NextResponse.json(
          { success: false, error: 'Failed to create collection' },
          { status: 500 }
        );
      }
    }

    // Step 2: Chunk the document
    const textChunks = chunkText(content);

    // Step 3: Prepare metadata
    const metadata: DocumentMetadata = {
      title: title || file.name,
      fileName: file.name,
      uploadedAt: new Date(),
      kb_category: kb_category || undefined,
      realm: realm || undefined,
      characters: characters ? characters.split(',').map(c => c.trim()) : undefined,
      doc_type: doc_type || undefined,
      version: version || undefined,
    };

    // Step 4: Create document in database
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        title: metadata.title,
        collectionName,
        metadata: stringifyJson(metadata),
        totalChunks: textChunks.length,
      },
    });

    // Step 5: Create vector chunks
    const vectorChunks = createVectorChunks(
      document.id,
      collectionName,
      textChunks,
      metadata
    );

    // Step 6: Generate embeddings
    const embeddings = await generateEmbeddings(textChunks);

    // Attach embeddings to chunks
    vectorChunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });

    // Step 7: Upsert to Qdrant
    const success = await upsertVectors(collectionName, vectorChunks);

    if (!success) {
      // Rollback: delete document from database
      await prisma.document.delete({ where: { id: document.id } });

      return NextResponse.json(
        { success: false, error: 'Failed to upsert vectors to Qdrant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: document.id,
        fileName: file.name,
        title: metadata.title,
        collectionName,
        totalChunks: textChunks.length,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document',
      },
      { status: 500 }
    );
  }
}
