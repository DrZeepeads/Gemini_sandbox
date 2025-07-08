'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Square, Trash2, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatExecutionTime, formatTimestamp, copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommandResult {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  timestamp: Date;
  isRunning?: boolean;
}

export function SandboxConsole() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new results arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [history]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || isRunning) return;

    const commandId = Date.now().toString();
    const commandToRun = cmd.trim();
    
    // Add to command history
    setCommandHistory(prev => {
      const newHistory = [commandToRun, ...prev.filter(c => c !== commandToRun)];
      return newHistory.slice(0, 50); // Keep last 50 commands
    });

    // Add running command to history
    const runningResult: CommandResult = {
      id: commandId,
      command: commandToRun,
      stdout: '',
      stderr: '',
      exitCode: 0,
      executionTime: 0,
      timestamp: new Date(),
      isRunning: true,
    };

    setHistory(prev => [...prev, runningResult]);
    setCommand('');
    setIsRunning(true);
    setHistoryIndex(-1);

    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: commandToRun,
        }),
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Update command result
      const result: CommandResult = {
        id: commandId,
        command: commandToRun,
        stdout: data.result.stdout || '',
        stderr: data.result.stderr || '',
        exitCode: data.result.exitCode || 0,
        executionTime: data.result.executionTime || executionTime,
        timestamp: new Date(),
        isRunning: false,
      };

      setHistory(prev => prev.map(item => 
        item.id === commandId ? result : item
      ));

      if (result.exitCode === 0) {
        toast.success(`Command executed successfully in ${formatExecutionTime(result.executionTime)}`);
      } else {
        toast.error(`Command failed with exit code ${result.exitCode}`);
      }

    } catch (error) {
      console.error('Command execution error:', error);
      
      // Update with error result
      const errorResult: CommandResult = {
        id: commandId,
        command: commandToRun,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        executionTime: Date.now() - Date.now(),
        timestamp: new Date(),
        isRunning: false,
      };

      setHistory(prev => prev.map(item => 
        item.id === commandId ? errorResult : item
      ));

      toast.error('Failed to execute command');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success('Console history cleared');
  };

  const stopExecution = () => {
    // In a real implementation, this would cancel the running command
    setIsRunning(false);
    toast.info('Execution stopped');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          <h2 className="font-semibold">Sandbox Console</h2>
          <Badge variant="outline" className="text-xs">
            {history.length} commands
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {isRunning && (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopExecution}
              disabled={!isRunning}
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Console Output */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Terminal className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Sandbox Console</h3>
              <p className="text-muted-foreground max-w-md">
                Execute shell commands in a secure sandbox environment. 
                All commands run in an isolated container with safety restrictions.
              </p>
            </div>
          ) : (
            history.map((result) => (
              <CommandResultCard 
                key={result.id} 
                result={result}
                onCopy={handleCopy}
                copied={copied === result.id}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Command Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  ref={inputRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter command... (↑/↓ for history)"
                  className="pl-8"
                  disabled={isRunning}
                />
              </div>
              <Button
                type="submit"
                disabled={!command.trim() || isRunning}
                className="px-6"
              >
                {isRunning ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Use ↑/↓ arrows to navigate command history
              </span>
              <span>
                Commands run in isolated sandbox environment
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface CommandResultCardProps {
  result: CommandResult;
  onCopy: (text: string, id: string) => void;
  copied: boolean;
}

function CommandResultCard({ result, onCopy, copied }: CommandResultCardProps) {
  const hasOutput = result.stdout || result.stderr;
  
  return (
    <Card className="overflow-hidden">
      {/* Command Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <code className="text-sm font-mono">{result.command}</code>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge
            variant={
              result.isRunning
                ? 'default'
                : result.exitCode === 0
                ? 'secondary'
                : 'destructive'
            }
            className="text-xs"
          >
            {result.isRunning
              ? 'Running...'
              : result.exitCode === 0
              ? 'Success'
              : `Exit ${result.exitCode}`}
          </Badge>
          
          {!result.isRunning && (
            <span className="text-xs text-muted-foreground">
              {formatExecutionTime(result.executionTime)}
            </span>
          )}
        </div>
      </div>

      {/* Command Output */}
      {hasOutput && (
        <div className="p-4 space-y-3">
          {result.stdout && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Output
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(result.stdout, `${result.id}-stdout`)}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-x-auto">
                <code>{result.stdout}</code>
              </pre>
            </div>
          )}

          {result.stderr && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(result.stderr, `${result.id}-stderr`)}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md overflow-x-auto border border-red-200 dark:border-red-800">
                <code className="text-red-800 dark:text-red-200">{result.stderr}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      <div className="px-4 py-2 bg-muted/30 border-t">
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(result.timestamp)}
        </span>
      </div>
    </Card>
  );
}