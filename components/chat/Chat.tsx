'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
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

  const {
    currentSession,
    addMessage,
    updateMessage,
    createSession,
  } = useChatHistory();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        (scrollContainer as HTMLDivElement).scrollTop = (scrollContainer as HTMLDivElement).scrollHeight;
      }
    }
  }, [currentSession?.messages]);

  // Focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    let assistantMessageId: string | null = null;

    try {
      // Create session if none exists
      if (!currentSession) {
        createSession();
      }

      // Add user message
      addMessage({
        role: 'user',
        content: userMessage,
      });

      // Add temporary assistant message with typing indicator
      assistantMessageId = addMessage({
        role: 'assistant',
        content: '',
        isTyping: true,
      });

      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...(currentSession?.messages || []).map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Update assistant message with response
      if (assistantMessageId) {
        updateMessage(assistantMessageId, {
          content: data.message,
          isTyping: false,
          functionCalls: data.functionCalls,
        });
      }

      toast.success('Message sent successfully');

    } catch (error) {
      console.error('Chat error:', error);
      
      // Update assistant message with error
      if (assistantMessageId) {
        updateMessage(assistantMessageId, {
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          isTyping: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
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

      {/* Chat Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="min-h-[60px] max-h-[200px] resize-none pr-12"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
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
