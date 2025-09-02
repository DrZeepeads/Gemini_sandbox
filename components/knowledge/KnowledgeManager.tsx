"use client";
import { useState } from 'react';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function KnowledgeManager() {
  const { docs, addTextDocument, removeDoc, clearAll } = useKnowledgeBase();
  const [title, setTitle] = useState('Untitled');
  const [text, setText] = useState('');

  const handleUploadFile = async (file: File) => {
    const content = await file.text();
    await add(title || file.name, content);
  };

  const add = async (t: string, content: string) => {
    try {
      await addTextDocument(t, content);
      setText('');
      toast.success('Document added to knowledge base');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add document');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center gap-2">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-xs" />
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <Upload className="h-4 w-4" />
            <span className="text-sm">Upload .txt/.md</span>
            <input type="file" accept=".txt,.md" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUploadFile(f);
              e.currentTarget.value = '';
            }} />
          </label>
          <Button size="sm" variant="outline" onClick={() => add(title || 'Untitled', text)} disabled={!text.trim()}>Add from textarea</Button>
          <Button size="sm" variant="ghost" onClick={clearAll} disabled={docs.length === 0}><Trash2 className="h-4 w-4 mr-1" />Clear all</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <Card className="p-4">
          <div className="text-sm mb-2">Paste text</div>
          <textarea className="w-full h-60 rounded-md border p-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste content here..." />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm">Documents</div>
            <Badge variant="outline" className="text-xs">{docs.length} docs</Badge>
          </div>
          <div className="space-y-2 max-h-60 overflow-auto pr-1">
            {docs.map(d => (
              <div key={d.id} className="border rounded p-2 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="text-muted-foreground text-xs">{d.chunks.length} chunks</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeDoc(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {docs.length === 0 && <div className="text-sm text-muted-foreground">No documents yet</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
