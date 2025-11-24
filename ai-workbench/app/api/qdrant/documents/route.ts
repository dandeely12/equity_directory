/**
 * Qdrant Documents API
 * GET: List documents in a collection
 * POST: Upload document content (JSON format)
 * DELETE: Delete documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson, stringifyJson } from '@/lib/db';
import { deletePoints, createCollection, getCollectionInfo, upsertVectors } from '@/lib/qdrant';
import { chunkText, createVectorChunks } from '@/lib/chunking';
import { generateEmbeddings } from '@/lib/embeddings';
import { DocumentMetadata } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('collection');

    if (!collectionName) {
      return NextResponse.json(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
      );
    }

    // Fetch documents from our database (metadata only)
    const documents = await prisma.document.findMany({
      where: { collectionName },
      orderBy: { uploadedAt: 'desc' },
    });

    // Parse metadata
    const documentsWithMetadata = documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      title: doc.title,
      collectionName: doc.collectionName,
      metadata: parseJson(doc.metadata, {}),
      totalChunks: doc.totalChunks,
      uploadedAt: doc.uploadedAt,
      updatedAt: doc.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: documentsWithMetadata,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch documents',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, collection, collectionName, chunkSize = 1000, title, metadata = {} } = body;

    const finalCollection = collection || collectionName;

    if (!content || !finalCollection) {
      return NextResponse.json(
        { success: false, error: 'Content and collection name are required' },
        { status: 400 }
      );
    }

    // Step 1: Create collection if it doesn't exist
    const existingCollection = await getCollectionInfo(finalCollection);
    if (!existingCollection) {
      const created = await createCollection(finalCollection, 3072, 'Cosine');
      if (!created) {
        return NextResponse.json(
          { success: false, error: 'Failed to create collection' },
          { status: 500 }
        );
      }
    }

    // Step 2: Chunk the document
    const textChunks = chunkText(content, chunkSize);

    // Step 3: Prepare metadata
    const docMetadata: DocumentMetadata = {
      title: title || 'Untitled Document',
      fileName: `document-${Date.now()}.txt`,
      uploadedAt: new Date(),
      ...metadata,
    };

    // Step 4: Create document in database
    const document = await prisma.document.create({
      data: {
        fileName: docMetadata.fileName,
        title: docMetadata.title,
        collectionName: finalCollection,
        metadata: stringifyJson(docMetadata),
        totalChunks: textChunks.length,
      },
    });

    // Step 5: Create vector chunks
    const vectorChunks = createVectorChunks(
      document.id,
      finalCollection,
      textChunks,
      docMetadata
    );

    // Step 6: Generate embeddings
    const embeddings = await generateEmbeddings(textChunks);

    // Attach embeddings to chunks
    vectorChunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });

    // Step 7: Upsert to Qdrant
    const success = await upsertVectors(finalCollection, vectorChunks);

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
      id: document.id,
      documentId: document.id,
      fileName: docMetadata.fileName,
      title: docMetadata.title,
      collectionName: finalCollection,
      chunksCreated: textChunks.length,
      totalChunks: textChunks.length,
      uploadedAt: document.uploadedAt,
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

export async function DELETE(request: NextRequest) {
  try {
    const { documentId, collectionName } = await request.json();

    if (!documentId || !collectionName) {
      return NextResponse.json(
        { success: false, error: 'Document ID and collection name are required' },
        { status: 400 }
      );
    }

    // Get document to find all its chunks
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate chunk IDs (we'll need to query Qdrant for actual IDs)
    // For now, we'll use the document ID to filter
    // TODO: Implement getPointsByDocumentId to get exact point IDs

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document',
      },
      { status: 500 }
    );
  }
}
