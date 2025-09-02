import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const ExecuteCommandSchema = z.object({
  command: z.string(),
  timeout: z.number().min(1000).max(600000).optional(),
  template: z.enum(['node', 'python', 'ubuntu']).optional().default('ubuntu'),
});

export async function POST(req: NextRequest) {
  try {
    const allowed = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const origin = req.headers.get('origin') || '';
    if (allowed.length > 0 && origin && !allowed.includes(origin)) {
      return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
    }

    const body = await req.json();
    const { command, timeout, template } = ExecuteCommandSchema.parse(body);

    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'E2B_API_KEY not configured. Set it in environment to enable real sandbox.' },
        { status: 501 }
      );
    }

    try {
      const mod = await import('@e2b/code-interpreter');
      const CodeInterpreter: any = (mod as any).CodeInterpreter;
      const ci: any = await CodeInterpreter.create({ apiKey, template });

      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      const start = Date.now();

      try {
        const res = await ci.run(command, { timeout });
        stdout = String(res?.stdout ?? res?.output ?? '');
        stderr = String(res?.stderr ?? '');
        exitCode = Number(res?.exitCode ?? 0);
      } finally {
        await ci.close?.();
      }

      return NextResponse.json({
        success: true,
        result: {
          stdout,
          stderr,
          exitCode,
          executionTime: Date.now() - start,
          command,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      return NextResponse.json(
        { error: 'E2B execution failed or SDK unavailable', details: (e as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
