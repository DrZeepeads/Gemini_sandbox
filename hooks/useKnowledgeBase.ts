import useLocalStorageState from 'use-local-storage-state';

export interface KBChunk {
  id: string;
  text: string;
  embedding: number[];
  source?: string;
}

export interface KBDoc {
  id: string;
  title: string;
  chunks: KBChunk[];
  createdAt: string;
}

interface KBState {
  docs: KBDoc[];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

function chunkText(text: string, size = 800, overlap = 100) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push(text.slice(i, end));
    i += size - overlap;
  }
  return chunks;
}

export function useKnowledgeBase() {
  const [state, setState] = useLocalStorageState<KBState>('kb', { defaultValue: { docs: [] } });

  const addTextDocument = async (title: string, text: string) => {
    const docId = uid();
    const pieces = chunkText(text);
    const res = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: pieces }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const chunks: KBChunk[] = pieces.map((p, idx) => ({ id: uid(), text: p, embedding: data.vectors[idx] || [] }));
    const doc: KBDoc = { id: docId, title, chunks, createdAt: new Date().toISOString() };
    setState(prev => ({ docs: [doc, ...prev.docs] }));
    return docId;
  };

  const removeDoc = (id: string) => {
    setState(prev => ({ docs: prev.docs.filter(d => d.id !== id) }));
  };

  const clearAll = () => setState({ docs: [] });

  const search = async (query: string, topK = 3) => {
    if (!query.trim()) return [] as Array<{ doc: KBDoc; chunk: KBChunk; score: number }>;
    const res = await fetch('/api/embeddings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts: [query] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const q = data.vectors[0] as number[];
    const scored: Array<{ doc: KBDoc; chunk: KBChunk; score: number }> = [];
    for (const doc of state.docs) {
      for (const chunk of doc.chunks) {
        const score = cosine(q, chunk.embedding);
        scored.push({ doc, chunk, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  };

  return {
    docs: state.docs,
    addTextDocument,
    removeDoc,
    clearAll,
    search,
  };
}
