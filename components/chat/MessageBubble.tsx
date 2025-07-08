'use client';

import { Bot, User, Copy, Check, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/lib/markdown';
import { TypingIndicator } from './TypingIndicator';
import { formatTimestamp, copyToClipboard } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useChatHistory';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [functionCallsExpanded, setFunctionCallsExpanded] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <Badge variant="outline" className="text-xs">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex gap-3 group',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        'max-w-[80%] space-y-2',
        isUser && 'order-1'
      )}>
        {/* Message Card */}
        <Card className={cn(
          'p-4',
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted/50',
          message.error && 'border-destructive/50 bg-destructive/5'
        )}>
          {/* Error indicator */}
          {message.error && (
            <div className="flex items-center gap-2 text-destructive text-sm mb-2">
              <AlertCircle className="h-4 w-4" />
              <span>Error occurred</span>
            </div>
          )}

          {/* Message content */}
          {message.isTyping ? (
            <TypingIndicator />
          ) : (
            <div className={cn(
              'chat-message',
              isUser && 'text-primary-foreground [&_.chat-message]:text-primary-foreground'
            )}>
              {isUser ? (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          )}

          {/* Function calls */}
          {message.functionCalls && message.functionCalls.length > 0 && (
            <div className="mt-3 space-y-2">
              <Collapsible
                open={functionCallsExpanded}
                onOpenChange={setFunctionCallsExpanded}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <span className="text-xs">
                      {message.functionCalls.length} function call{message.functionCalls.length > 1 ? 's' : ''}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  {message.functionCalls.map((call, index) => (
                    <div
                      key={index}
                      className="text-xs bg-background/50 rounded p-2 space-y-1"
                    >
                      <div className="font-medium">🛠️ {call.name}</div>
                      {call.arguments && (
                        <div className="text-muted-foreground">
                          <strong>Args:</strong> {JSON.stringify(call.arguments, null, 2)}
                        </div>
                      )}
                      {call.result && (
                        <div className="text-muted-foreground">
                          <strong>Result:</strong> {JSON.stringify(call.result, null, 2)}
                        </div>
                      )}
                      {call.error && (
                        <div className="text-destructive">
                          <strong>Error:</strong> {call.error}
                        </div>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </Card>

        {/* Message actions and timestamp */}
        <div className={cn(
          'flex items-center gap-2 text-xs text-muted-foreground',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTimestamp(message.timestamp)}</span>
          </div>
          
          {!message.isTyping && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 order-2">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-4 w-4 text-secondary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}