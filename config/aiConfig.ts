import { z } from 'zod';

// AI Provider Types
export type AIProvider = 'gemini' | 'openai' | 'mistral' | 'anthropic';

// Configuration schema
export const AIConfigSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'mistral', 'anthropic']),
  model: z.string(),
  maxTokens: z.number().min(1).max(4096),
  temperature: z.number().min(0).max(2),
  systemPrompt: z.string(),
  enableFunctionCalling: z.boolean(),
  enableStreaming: z.boolean(),
});

export type AIConfig = z.infer<typeof AIConfigSchema>;

// Default configurations for each provider
export const DEFAULT_CONFIGS: Record<AIProvider, AIConfig> = {
  gemini: {
    provider: 'gemini',
    model: 'gemini-1.5-pro-latest',
    maxTokens: 2048,
    temperature: 0.7,
    systemPrompt: `You are an advanced AI assistant with access to powerful tools and a secure sandbox environment. You can:

1. Execute shell commands safely in an isolated environment
2. Create, read, and modify files
3. Install software packages
4. Perform data analysis and visualization
5. Run code in multiple programming languages

When users request system operations, use the available tools to execute them safely. Always explain what you're doing and provide clear outputs. Be helpful, accurate, and security-conscious.

For coding tasks, prefer showing complete, working examples. For system tasks, always verify operations completed successfully.`,
    enableFunctionCalling: true,
    enableStreaming: true,
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4',
    maxTokens: 2048,
    temperature: 0.7,
    systemPrompt: `You are an advanced AI assistant with access to powerful tools and a secure sandbox environment. Help users with their requests while using available tools when appropriate.`,
    enableFunctionCalling: true,
    enableStreaming: true,
  },
  mistral: {
    provider: 'mistral',
    model: 'mistral-large',
    maxTokens: 2048,
    temperature: 0.7,
    systemPrompt: `You are an advanced AI assistant with access to tools and sandbox capabilities. Help users efficiently and accurately.`,
    enableFunctionCalling: true,
    enableStreaming: true,
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 2048,
    temperature: 0.7,
    systemPrompt: `You are Claude, an AI assistant with access to powerful tools and a secure sandbox environment. Help users with their requests thoughtfully and safely.`,
    enableFunctionCalling: true,
    enableStreaming: true,
  },
};

// Function definitions for Gemini function calling
export const FUNCTION_DEFINITIONS = [
  {
    name: 'execute_command',
    description: 'Execute a shell command in a secure sandbox environment',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
        },
        workingDirectory: {
          type: 'string',
          description: 'Working directory for command execution (optional)',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'create_file',
    description: 'Create a new file with specified content',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path to create',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
        encoding: {
          type: 'string',
          description: 'File encoding (default: utf-8)',
          default: 'utf-8',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read content from a file',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path to read',
        },
        encoding: {
          type: 'string',
          description: 'File encoding (default: utf-8)',
          default: 'utf-8',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_directory',
    description: 'List contents of a directory',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list',
        },
        includeHidden: {
          type: 'boolean',
          description: 'Include hidden files (default: false)',
          default: false,
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'install_package',
    description: 'Install a software package using the system package manager',
    parameters: {
      type: 'object',
      properties: {
        packageName: {
          type: 'string',
          description: 'Name of the package to install',
        },
        packageManager: {
          type: 'string',
          description: 'Package manager to use (npm, pip, apt, etc.)',
          enum: ['npm', 'pip', 'pip3', 'apt', 'apt-get', 'yarn', 'pnpm'],
        },
      },
      required: ['packageName', 'packageManager'],
    },
  },
];

// Rate limiting configuration
export const RATE_LIMITS = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
};

// Sandbox configuration
export const SANDBOX_CONFIG = {
  timeout: 30000, // 30 seconds
  memoryLimit: 512, // 512 MB
  enableNetworking: true,
  allowedCommands: [
    'ls', 'cat', 'echo', 'pwd', 'mkdir', 'touch', 'rm', 'cp', 'mv',
    'grep', 'find', 'head', 'tail', 'wc', 'sort', 'uniq',
    'python', 'python3', 'node', 'npm', 'pip', 'pip3',
    'git', 'curl', 'wget', 'tar', 'zip', 'unzip',
  ],
  blockedCommands: [
    'sudo', 'su', 'passwd', 'chmod +x', 'chown',
    'systemctl', 'service', 'mount', 'umount',
    'fdisk', 'mkfs', 'dd', 'rm -rf /', 'format',
  ],
};

// Get current configuration (can be extended to read from user preferences)
export function getCurrentConfig(): AIConfig {
  // Default to Gemini, but this could be made configurable
  return DEFAULT_CONFIGS.gemini;
}

// Validate AI configuration
export function validateConfig(config: unknown): AIConfig {
  return AIConfigSchema.parse(config);
}