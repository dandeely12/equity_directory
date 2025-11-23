/**
 * Qdrant Documents API
 * GET: List documents in a collection
 * DELETE: Delete documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/db';
import { deletePoints } from '@/lib/qdrant';

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
