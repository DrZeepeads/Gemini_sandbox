import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const Schema = z.object({
  texts: z.array(z.string().min(1)).min(1),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texts, model } = Schema.parse(body);

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const embeddingModel = genAI.getGenerativeModel({ model: model || 'text-embedding-004' });

    const vectors: number[][] = [];
    for (const text of texts) {
      const res = await embeddingModel.embedContent(text);
      // @ts-ignore
      const values: number[] = res?.embedding?.values || res?.data?.[0]?.embedding || [];
      vectors.push(values);
    }

    return NextResponse.json({ vectors });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
