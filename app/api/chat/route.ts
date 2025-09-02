import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getCurrentConfig, FUNCTION_DEFINITIONS, RATE_LIMITS } from '@/config/aiConfig';
import { executeSandboxCommand } from '@/lib/sandbox';

// Configure edge runtime
export const runtime = 'edge';
export const maxDuration = 30;

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  points: RATE_LIMITS.max,
  duration: RATE_LIMITS.windowMs / 1000,
});

// Request schema
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    try {
      await rateLimiter.consume(req.ip || 'unknown');
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate request
    const body = await req.json();
    const { messages, model, temperature, maxTokens } = ChatRequestSchema.parse(body);

    // Get AI configuration
    const config = getCurrentConfig();
    
    // Validate API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ 
      model: model || config.model,
      generationConfig: {
        temperature: temperature || config.temperature,
        maxOutputTokens: maxTokens || config.maxTokens,
      },
    });

    // Convert messages to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Add system prompt if provided
    if (config.systemPrompt) {
      geminiMessages.unshift({
        role: 'model',
        parts: [{ text: config.systemPrompt }],
      });
    }

    // Function calling tools
    const tools = config.enableFunctionCalling ? [{
      functionDeclarations: FUNCTION_DEFINITIONS,
    }] : undefined;

    // Generate response with function calling
    if (config.enableFunctionCalling) {
      const result = await geminiModel.generateContent({
        contents: geminiMessages,
        tools,
      });

      const response = result.response;
      const functionCalls = response.functionCalls();

      // Handle function calls
      if (functionCalls && functionCalls.length > 0) {
        const functionResults = [] as Array<{ name: string; response: any }>;

        for (const functionCall of functionCalls) {
          try {
            const result = await handleFunctionCall(functionCall);
            functionResults.push({
              name: functionCall.name,
              response: result,
            });
          } catch (error) {
            functionResults.push({
              name: functionCall.name,
              response: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
          }
        }

        // Generate final response with function results
        const finalMessages = [
          ...geminiMessages,
          {
            role: 'model',
            parts: [{ text: response.text() }],
          },
          {
            role: 'user',
            parts: functionResults.map(result => ({
              text: `Function ${result.name} result: ${JSON.stringify(result.response)}`,
            })),
          },
        ];

        const finalResult = await geminiModel.generateContent({
          contents: finalMessages,
        });

        return NextResponse.json({
          message: finalResult.response.text(),
          functionCalls: functionResults,
          usage: {
            promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
            completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
          },
        });
      }

      return NextResponse.json({
        message: response.text(),
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        },
      });
    }

    // Standard text generation (no function calling)
    const result = await geminiModel.generateContent({
      contents: geminiMessages,
    });

    return NextResponse.json({
      message: result.response.text(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle function calls
async function handleFunctionCall(functionCall: any) {
  const { name, args } = functionCall;

  switch (name) {
    case 'execute_command':
      return await executeSandboxCommand(args.command, args.workingDirectory);

    case 'create_file':
      return await executeSandboxCommand(
        `echo '${args.content.replace(/'/g, "\\'")}' > "${args.path}"`,
        args.workingDirectory
      );

    case 'read_file':
      return await executeSandboxCommand(`cat "${args.path}"`);

    case 'list_directory':
      const lsCommand = args.includeHidden ? 'ls -la' : 'ls -l';
      return await executeSandboxCommand(`${lsCommand} "${args.path}"`);

    case 'install_package':
      const installCommand = getInstallCommand(args.packageManager, args.packageName);
      return await executeSandboxCommand(installCommand);

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// Generate install command based on package manager
function getInstallCommand(packageManager: string, packageName: string): string {
  const commands: Record<string, string> = {
    npm: `npm install ${packageName}`,
    yarn: `yarn add ${packageName}`,
    pnpm: `pnpm add ${packageName}`,
    pip: `pip install ${packageName}`,
    pip3: `pip3 install ${packageName}`,
    apt: `apt-get update && apt-get install -y ${packageName}`,
    'apt-get': `apt-get update && apt-get install -y ${packageName}`,
  };

  const command = commands[packageManager];
  if (!command) {
    throw new Error(`Unsupported package manager: ${packageManager}`);
  }

  return command;
}
