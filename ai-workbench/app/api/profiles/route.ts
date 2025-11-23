/**
 * Profiles API
 * GET: List all profiles
 * POST: Create new profile
 * DELETE: Delete profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, stringifyJson, parseJson } from '@/lib/db';
import { ModelSettings } from '@/types';

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const profilesWithSettings = profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      description: profile.description,
      modelId: profile.modelId,
      systemPrompt: profile.systemPrompt,
      settings: parseJson<ModelSettings>(profile.settings, {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1.0,
      }),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: profilesWithSettings,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profiles',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      modelId,
      systemPrompt,
      settings,
    } = await request.json();

    if (!name || !modelId) {
      return NextResponse.json(
        { success: false, error: 'Name and model ID are required' },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.create({
      data: {
        name,
        description: description || '',
        modelId,
        systemPrompt: systemPrompt || '',
        settings: stringifyJson(settings),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        modelId: profile.modelId,
        systemPrompt: profile.systemPrompt,
        settings: parseJson(profile.settings, settings),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create profile',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    await prisma.profile.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete profile',
      },
      { status: 500 }
    );
  }
}
