/**
 * Qdrant Collections API
 * GET: List all collections
 * POST: Create a new collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { listCollections, createCollection, getCollectionInfo } from '@/lib/qdrant';
import { getDefaultEmbeddingConfig } from '@/lib/embeddings';

export async function GET() {
  try {
    const collections = await listCollections();

    // Get detailed info for each collection
    const collectionsWithInfo = await Promise.all(
      collections.map(async (col) => {
        const info = await getCollectionInfo(col.name);
        return info || col;
      })
    );

    return NextResponse.json({
      success: true,
      data: collectionsWithInfo,
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch collections',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, distance } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
      );
    }

    // Use default embedding config for vector size
    const embeddingConfig = getDefaultEmbeddingConfig();

    const success = await createCollection(
      name,
      embeddingConfig.dimensions,
      distance || 'Cosine'
    );

    if (success) {
      return NextResponse.json({
        success: true,
        data: { name, vectorSize: embeddingConfig.dimensions },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create collection' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create collection',
      },
      { status: 500 }
    );
  }
}
