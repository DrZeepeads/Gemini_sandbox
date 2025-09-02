'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Square, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { useChatHistory } from '@/hooks/useChatHistory';
import { toast } from 'sonner';

export function Chat() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    currentSession,
    addMessage,
    updateMessage,
    createSession,
  } = useChatHistory();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [currentSession?.messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setIsLoading(true);
    let assistantMessageId: string | null = null;

    try {
      if (!currentSession) {
        createSession();
      }

      addMessage({ role: 'user', content: userMessage });

      assistantMessageId = addMessage({
        role: 'assistant',
        content: '',
        isTyping: true,
      });

      const ac = new AbortController();
      abortRef.current = ac;

      const response = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...(currentSession?.messages || []).map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage },
          ],
        }),
        signal: ac.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        if (assistantMessageId) {
          updateMessage(assistantMessageId, { content: fullText, isTyping: true });
        }
      }

      if (assistantMessageId) {
        updateMessage(assistantMessageId, { isTyping: false });
      }

    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        // Stopped by user
        if (assistantMessageId) {
          updateMessage(assistantMessageId, { isTyping: false });
        }
        toast.message('Generation stopped');
      } else {
        console.error('Chat error:', error);
        if (assistantMessageId) {
          updateMessage(assistantMessageId, {
            content: 'Sorry, I encountered an error while processing your request. Please try again.',
            isTyping: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        toast.error('Failed to send message');
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as any);
    }
  };

  const handleStop = () => {
    if (isLoading && abortRef.current) {
      abortRef.current.abort();
    }
  };

  const handleRegenerate = async () => {
    if (isLoading) return;
    const lastUser = [...(currentSession?.messages || [])].reverse().find(m => m.role === 'user');
    if (lastUser?.content) {
      await sendMessage(lastUser.content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {currentSession?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Welcome to AI Chatbot Pro</h3>
              <p className="text-muted-foreground max-w-md">
                Start a conversation with our advanced AI assistant. I can help you with coding,
                analysis, file operations, and system tasks using a secure sandbox environment.
              </p>
            </div>
          ) : (
            currentSession.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  className="min-h-[60px] max-h-[200px] resize-none pr-24"
                  disabled={isLoading}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                  {isLoading ? (
                    <Button type="button" size="sm" variant="destructive" onClick={handleStop}>
                      <Square className="h-4 w-4 mr-1" /> Stop
                    </Button>
                  ) : (
                    <>
                      <Button type="button" size="sm" variant="ghost" onClick={handleRegenerate} disabled={!(currentSession?.messages?.length)}>
                        <RotateCw className="h-4 w-4 mr-1" /> Regenerate
                      </Button>
                      <Button type="submit" size="sm" disabled={!input.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {currentSession?.messages.length || 0} messages in this session
              </span>
              <span>
                Press Shift+Enter for new line, Enter to send
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
