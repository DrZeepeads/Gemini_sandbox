import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { executeSandboxCommand, createSandbox, listSandboxes } from '@/lib/sandbox';
import { RATE_LIMITS } from '@/config/aiConfig';

// Configure edge runtime
export const runtime = 'edge';
export const maxDuration = 60;

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  points: RATE_LIMITS.max,
  duration: RATE_LIMITS.windowMs / 1000,
});

// Request schemas
const ExecuteCommandSchema = z.object({
  command: z.string(),
  sandboxId: z.string().optional(),
  workingDirectory: z.string().optional(),
  timeout: z.number().min(1000).max(60000).optional(),
});

const CreateSandboxSchema = z.object({
  template: z.enum(['node', 'python', 'ubuntu']).optional().default('ubuntu'),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    try {
      await rateLimiter.consume(req.ip || 'unknown');
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'execute';

    switch (action) {
      case 'execute':
        return await handleExecuteCommand(req);
      case 'create':
        return await handleCreateSandbox(req);
      case 'list':
        return await handleListSandboxes();
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Sandbox API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleExecuteCommand(req: NextRequest) {
  try {
    const body = await req.json();
    const { command, sandboxId, workingDirectory, timeout } = ExecuteCommandSchema.parse(body);

    const result = await executeSandboxCommand(command, workingDirectory, sandboxId, timeout);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Command execution failed',
        success: false,
      },
      { status: 500 }
    );
  }
}

async function handleCreateSandbox(req: NextRequest) {
  try {
    const body = await req.json();
    const { template, name } = CreateSandboxSchema.parse(body);

    const sandbox = await createSandbox(template, name);

    return NextResponse.json({
      success: true,
      sandbox: {
        id: sandbox.id,
        template: sandbox.template,
        name: sandbox.name,
        status: sandbox.status,
        createdAt: sandbox.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Sandbox creation failed',
        success: false,
      },
      { status: 500 }
    );
  }
}

async function handleListSandboxes() {
  try {
    const sandboxes = await listSandboxes();

    return NextResponse.json({
      success: true,
      sandboxes: sandboxes.map(sb => ({
        id: sb.id,
        template: sb.template,
        name: sb.name,
        status: sb.status,
        createdAt: sb.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to list sandboxes',
        success: false,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
