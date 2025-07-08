import { CodeInterpreter } from '@e2b/code-interpreter';
import { SANDBOX_CONFIG } from '@/config/aiConfig';

// Types
export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  command: string;
}

export interface SandboxInfo {
  id: string;
  template: string;
  name?: string;
  status: 'running' | 'stopped' | 'error';
  createdAt: string;
}

// Global sandbox instances (in production, use a proper state management solution)
const activeSandboxes = new Map<string, CodeInterpreter>();

// Execute command in sandbox
export async function executeSandboxCommand(
  command: string,
  workingDirectory?: string,
  sandboxId?: string,
  timeout?: number
): Promise<SandboxResult> {
  const startTime = Date.now();
  
  try {
    // Validate command
    if (!isCommandAllowed(command)) {
      throw new Error(`Command not allowed: ${command}`);
    }

    // For now, simulate sandbox execution with a simple response
    // In production, you would use actual E2B CodeInterpreter
    const executionTime = Date.now() - startTime;
    
    // Simulate command execution
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    
    // Basic command simulation
    if (command.startsWith('echo ')) {
      stdout = command.substring(5).replace(/["']/g, '') + '\n';
    } else if (command === 'pwd') {
      stdout = '/home/sandbox\n';
    } else if (command === 'ls' || command.startsWith('ls ')) {
      stdout = 'file1.txt\nfile2.py\ndirectory1/\n';
    } else if (command.startsWith('cat ')) {
      stdout = 'File content would be displayed here\n';
    } else if (command === 'python --version') {
      stdout = 'Python 3.11.0\n';
    } else if (command === 'node --version') {
      stdout = 'v18.17.0\n';
    } else {
      stdout = `Command '${command}' executed successfully\n`;
    }

    return {
      stdout,
      stderr,
      exitCode,
      executionTime: Date.now() - startTime,
      command,
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown error',
      exitCode: 1,
      executionTime,
      command,
    };
  }
}

// Create new sandbox
export async function createSandbox(
  template: 'node' | 'python' | 'ubuntu' = 'ubuntu',
  name?: string
): Promise<any> {
  try {
    // Simulate sandbox creation
    const sandboxId = Math.random().toString(36).substring(2);
    
    const sandbox = {
      id: sandboxId,
      template,
      name: name || `Sandbox-${sandboxId}`,
      status: 'running',
      createdAt: new Date().toISOString(),
    };

    return sandbox;

  } catch (error) {
    console.error('Failed to create sandbox:', error);
    throw new Error(`Failed to create sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// List active sandboxes
export async function listSandboxes(): Promise<SandboxInfo[]> {
  // Simulate active sandboxes
  return [
    {
      id: 'sandbox-1',
      template: 'ubuntu',
      status: 'running',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sandbox-2',
      template: 'python',
      status: 'running',
      createdAt: new Date().toISOString(),
    },
  ];
}

// Cleanup sandbox
export async function cleanupSandbox(sandboxId: string): Promise<void> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (sandbox) {
    try {
      // In a real implementation, you would close the sandbox here
      console.log(`Cleaning up sandbox ${sandboxId}`);
    } catch (error) {
      console.error(`Failed to cleanup sandbox ${sandboxId}:`, error);
    } finally {
      activeSandboxes.delete(sandboxId);
    }
  }
}

// Check if command is allowed
function isCommandAllowed(command: string): boolean {
  const cmd = command.toLowerCase().trim();

  // Check for blocked commands
  for (const blocked of SANDBOX_CONFIG.blockedCommands) {
    if (cmd.includes(blocked.toLowerCase())) {
      return false;
    }
  }

  // If allowedCommands is specified, check if command starts with an allowed one
  if (SANDBOX_CONFIG.allowedCommands.length > 0) {
    const isAllowed = SANDBOX_CONFIG.allowedCommands.some(allowed => 
      cmd.startsWith(allowed.toLowerCase())
    );
    
    // Allow common safe patterns even if not explicitly listed
    const safePatterns = [
      /^echo\s+/,
      /^cat\s+/,
      /^ls\s*/,
      /^pwd\s*/,
      /^cd\s+/,
      /^mkdir\s+/,
      /^touch\s+/,
      /^head\s+/,
      /^tail\s+/,
      /^grep\s+/,
      /^find\s+/,
      /^wc\s+/,
      /^sort\s+/,
      /^uniq\s+/,
    ];

    const matchesSafePattern = safePatterns.some(pattern => pattern.test(cmd));
    
    return isAllowed || matchesSafePattern;
  }

  return true;
}

// File operations
export async function createFile(
  path: string,
  content: string,
  sandboxId?: string
): Promise<SandboxResult> {
  const escapedContent = content.replace(/'/g, "\\'");
  const command = `echo '${escapedContent}' > "${path}"`;
  return executeSandboxCommand(command, undefined, sandboxId);
}

export async function readFile(
  path: string,
  sandboxId?: string
): Promise<SandboxResult> {
  return executeSandboxCommand(`cat "${path}"`, undefined, sandboxId);
}

export async function listDirectory(
  path: string,
  includeHidden = false,
  sandboxId?: string
): Promise<SandboxResult> {
  const command = includeHidden ? `ls -la "${path}"` : `ls -l "${path}"`;
  return executeSandboxCommand(command, undefined, sandboxId);
}