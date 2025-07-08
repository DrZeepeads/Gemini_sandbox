'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <span className="text-sm text-muted-foreground">AI is thinking</span>
      <div className="flex space-x-1">
        <div className="loading-dots"></div>
        <div className="loading-dots"></div>
        <div className="loading-dots"></div>
      </div>
    </div>
  );
}

// Alternative typing indicator with animated dots
export function AnimatedTypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className="text-sm text-muted-foreground">Generating response</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}

// Pulse typing indicator
export function PulseTypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex space-x-1">
        <div className="w-3 h-3 bg-primary/60 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-primary/40 rounded-full animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-3 h-3 bg-primary/20 rounded-full animate-pulse [animation-delay:0.4s]"></div>
      </div>
      <span className="text-sm text-muted-foreground">Processing...</span>
    </div>
  );
}

// Text-based typing simulation
export function TextTypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('text-sm text-muted-foreground', className)}>
      <span className="inline-block">
        Thinking
        <span className="animate-blink">|</span>
      </span>
    </div>
  );
}

// Progress bar typing indicator
export function ProgressTypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-xs text-muted-foreground">Generating response...</div>
      <div className="w-full bg-muted rounded-full h-1">
        <div className="bg-primary h-1 rounded-full animate-pulse w-3/4"></div>
      </div>
    </div>
  );
}