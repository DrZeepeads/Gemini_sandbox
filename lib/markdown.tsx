import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { cn } from './utils';
import { Button } from '@/components/ui/button';
import { Copy, Check, Play } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from './utils';
import { toast } from 'sonner';

// CSS imports for syntax highlighting and math
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

function CodeBlock({ children, className, inline, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [runStdout, setRunStdout] = useState<string | null>(null);
  const [runStderr, setRunStderr] = useState<string | null>(null);
  
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = async () => {
    const success = await copyToClipboard(children);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    setRunStdout(null);
    setRunStderr(null);

    try {
      let cmd = '';
      const code = children;
      if (language === 'bash' || language === 'sh' || language === 'zsh') {
        cmd = String(code);
      } else if (language === 'python' || language === 'py') {
        cmd = `python - << 'PY'\n${code}\nPY`;
      } else if (language === 'javascript' || language === 'js' || language === 'ts' || language === 'typescript') {
        cmd = `node - << 'JS'\n${code}\nJS`;
      } else {
        cmd = String(code);
      }

      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setRunStdout(data.result?.stdout || '');
      setRunStderr(data.result?.stderr || '');
      if ((data.result?.exitCode ?? 0) === 0) {
        toast.success('Code executed');
      } else {
        toast.error(`Exit ${data.result?.exitCode}`);
      }
    } catch (err) {
      setRunStdout('');
      setRunStderr(err instanceof Error ? err.message : 'Unknown error');
      toast.error('Execution failed');
    } finally {
      setRunning(false);
    }
  };

  if (inline) {
    return (
      <code
        className={cn(
          'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-t-lg border-b">
        <span className="text-xs font-medium text-muted-foreground">
          {language || 'code'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={running}
            title="Run in sandbox"
          >
            <Play className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      <pre
        className={cn(
          'overflow-x-auto p-4 rounded-b-lg bg-muted/30 border-l-4 border-primary/50',
          className
        )}
      >
        <code className="font-mono text-sm">{children}</code>
      </pre>
      {(runStdout || runStderr) && (
        <div className="mt-2 text-xs">
          {runStdout && (
            <div className="mb-1">
              <div className="text-green-600 dark:text-green-400 font-medium">Output</div>
              <pre className="bg-muted/30 p-2 rounded"><code>{runStdout}</code></pre>
            </div>
          )}
          {runStderr && (
            <div>
              <div className="text-red-600 dark:text-red-400 font-medium">Error</div>
              <pre className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800"><code className="text-red-800 dark:text-red-200">{runStderr}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-neutral dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // Custom code block component
          code: ({ inline, className, children, ...props }) => {
            const childrenString = String(children).replace(/\n$/, '');
            return (
              <CodeBlock
                inline={inline}
                className={className}
                {...props}
              >
                {childrenString}
              </CodeBlock>
            );
          },
          
          // Custom table styling
          table: ({ children, ...props }) => (
            <div className="my-6 w-full overflow-y-auto">
              <table className="w-full" {...props}>
                {children}
              </table>
            </div>
          ),
          
          // Custom list styling
          ul: ({ children, ...props }) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
              {children}
            </ul>
          ),
          
          ol: ({ children, ...props }) => (
            <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
              {children}
            </ol>
          ),
          
          // Custom blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="mt-6 border-l-2 border-primary/20 pl-6 italic text-muted-foreground"
              {...props}
            >
              {children}
            </blockquote>
          ),
          
          // Custom heading styling
          h1: ({ children, ...props }) => (
            <h1
              className="font-heading mt-2 scroll-m-20 text-4xl font-bold tracking-tight"
              {...props}
            >
              {children}
            </h1>
          ),
          
          h2: ({ children, ...props }) => (
            <h2
              className="font-heading mt-10 scroll-m-20 border-b border-border pb-2 text-3xl font-semibold tracking-tight first:mt-0"
              {...props}
            >
              {children}
            </h2>
          ),
          
          h3: ({ children, ...props }) => (
            <h3
              className="font-heading mt-8 scroll-m-20 text-2xl font-semibold tracking-tight"
              {...props}
            >
              {children}
            </h3>
          ),
          
          h4: ({ children, ...props }) => (
            <h4
              className="font-heading mt-8 scroll-m-20 text-xl font-semibold tracking-tight"
              {...props}
            >
              {children}
            </h4>
          ),
          
          // Custom link styling
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
          // Custom image styling
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-lg border shadow-sm"
              loading="lazy"
              {...props}
            />
          ),
          
          // Custom horizontal rule
          hr: ({ ...props }) => (
            <hr className="my-4 border-border" {...props} />
          ),
          
          // Custom paragraph spacing
          p: ({ children, ...props }) => (
            <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
              {children}
            </p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Utility function to extract code blocks from markdown
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return blocks;
}

// Utility function to count words in markdown
export function countWordsInMarkdown(markdown: string): number {
  // Remove markdown syntax and count words
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .replace(/[#*_~`]/g, '') // Remove markdown formatting
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  return plainText ? plainText.split(/\s+/).length : 0;
}

// Utility function to estimate reading time
export function estimateReadingTime(markdown: string): number {
  const wordCount = countWordsInMarkdown(markdown);
  const averageWordsPerMinute = 200;
  return Math.ceil(wordCount / averageWordsPerMinute);
}

// Utility function to truncate markdown content
export function truncateMarkdown(markdown: string, maxLength: number): string {
  if (markdown.length <= maxLength) return markdown;
  
  const truncated = markdown.slice(0, maxLength);
  const lastNewline = truncated.lastIndexOf('\n');
  
  // Try to break at a sensible point
  if (lastNewline > maxLength * 0.8) {
    return truncated.slice(0, lastNewline) + '\n\n...';
  }
  
  return truncated + '...';
}