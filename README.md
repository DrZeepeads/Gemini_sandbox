# AI Chatbot Pro

A professional-grade AI chatbot web application built with Next.js 14, featuring Google Gemini 1.5 Pro function calling, secure sandbox execution, and multiple AI provider support.

![AI Chatbot Pro](https://via.placeholder.com/800x400/0f172a/e2e8f0?text=AI+Chatbot+Pro)

## 🚀 Features

- **Advanced AI Integration**: Support for Google Gemini 1.5 Pro, OpenAI GPT-4, Claude, and Mistral
- **Function Calling**: Gemini's powerful function calling capabilities for tool use
- **Secure Sandbox**: E2B integration for safe code execution and system operations
- **Real-time Streaming**: Live streaming responses with typing indicators
- **Persistent Chat History**: IndexedDB storage for offline chat history access
- **Responsive Design**: Mobile-first UI with dark/light theme support
- **Professional UI**: Built with shadcn/ui components and Tailwind CSS
- **Rate Limiting**: Built-in security and rate limiting for API routes
- **TypeScript**: Full TypeScript support with strict type checking

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI SDK**: Vercel AI SDK (planned for streaming)
- **AI Providers**: Google Gemini, OpenAI, Anthropic, Mistral
- **Sandbox**: E2B SDK for secure code execution
- **Storage**: IndexedDB via use-local-storage-state
- **Markdown**: react-markdown with syntax highlighting
- **Icons**: Lucide React
- **Deployment**: Vercel with Edge Runtime

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm, yarn, or pnpm package manager
- API keys for your chosen AI providers
- E2B API key for sandbox functionality

## 🔑 API Keys Required

1. **Google AI API Key** (Primary)
   - Get it from: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Required for Gemini function calling

2. **E2B API Key** (Required for sandbox)
   - Get it from: [E2B Platform](https://e2b.dev/)
   - Required for secure code execution

3. **Optional AI Provider Keys**:
   - OpenAI: [OpenAI Platform](https://platform.openai.com/api-keys)
   - Anthropic: [Anthropic Console](https://console.anthropic.com/)
   - Mistral: [Mistral Platform](https://console.mistral.ai/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/DrZeepeads/Gemini_sandbox.git
cd Gemini_sandbox
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Copy the environment variables template:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Required
GOOGLE_AI_API_KEY=your_google_gemini_api_key_here
E2B_API_KEY=your_e2b_api_key_here

# Optional (for additional AI providers)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ai-chatbot-pro/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API routes
│   │   ├── chat/            # Chat API with function calling
│   │   └── sandbox/         # Sandbox execution API
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── chat/               # Chat-specific components
│   │   ├── Chat.tsx        # Main chat interface
│   │   ├── MessageBubble.tsx # Message display
│   │   ├── TypingIndicator.tsx # Loading states
│   │   └── SandboxConsole.tsx # Terminal interface
│   └── ui/                 # shadcn/ui components
├── config/                 # Configuration files
│   └── aiConfig.ts         # AI provider configurations
├── hooks/                  # Custom React hooks
│   └── useChatHistory.ts   # Chat history management
├── lib/                    # Utility functions
│   ├── utils.ts            # General utilities
│   ├── markdown.tsx        # Markdown rendering
│   └── sandbox.ts          # E2B sandbox integration
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vercel.json             # Vercel deployment config
```

## 🔧 Configuration

### AI Provider Configuration

Edit `config/aiConfig.ts` to customize:

- Default AI provider and model
- System prompts
- Function definitions
- Rate limiting settings
- Sandbox security rules

### Function Calling Setup

The app includes pre-configured functions for:

- `execute_command`: Run shell commands safely
- `create_file`: Create files with content
- `read_file`: Read file contents
- `list_directory`: List directory contents
- `install_package`: Install software packages

### Security Configuration

- Rate limiting: 100 requests per 15 minutes per IP
- Sandbox restrictions: Blocked dangerous commands
- CORS headers for API security (restrict via ALLOWED_ORIGINS)
- Environment variable validation

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Connect your GitHub repository to [Vercel](https://vercel.com)
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Environment Variables in Vercel**:
   ```
   GOOGLE_AI_API_KEY=your_key_here
   E2B_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here (optional)
   ANTHROPIC_API_KEY=your_key_here (optional)
   MISTRAL_API_KEY=your_key_here (optional)
   ```

### Alternative Deployment Options

- **Netlify**: Use `npm run build` and deploy the `out` folder
- **Railway**: Connect GitHub and deploy with automatic builds
- **Docker**: Build container with `docker build -t ai-chatbot-pro .`

## 📱 Usage

### Basic Chat

1. Type your message in the input field
2. Press Enter to send (Shift+Enter for new lines)
3. AI responds with streaming text
4. Chat history is automatically saved locally

### Sandbox Commands

1. Switch to "Sandbox" tab
2. Enter shell commands (e.g., `ls -la`, `python --version`)
3. Commands execute in secure isolated environment
4. View output with syntax highlighting

### Function Calling

The AI can automatically:
- Execute system commands when you ask for file operations
- Create and modify files
- Install software packages
- Analyze data and generate reports

### Advanced Features

- **Theme Switching**: Toggle between light/dark modes
- **Chat History**: Export/import chat sessions
- **Copy Messages**: Copy AI responses or code blocks
- **Search History**: Find previous conversations

## 🛡️ Security

### Sandbox Security

- All code execution happens in isolated E2B containers
- Dangerous commands are blocked (sudo, rm -rf, etc.)
- Network access is controlled and limited
- Containers are ephemeral and destroyed after use

### API Security

- Rate limiting prevents abuse
- CORS headers protect against cross-origin attacks
- Input validation on all API endpoints
- Environment variables for sensitive data

### Data Privacy

- Chat history stored locally in browser
- No server-side persistence of conversations
- API keys never exposed to client
- Optional data export for user control

## 🔍 Troubleshooting

### Common Issues

1. **API Key Errors**:
   - Verify API keys are correctly set in `.env.local`
   - Check API key permissions and quotas
   - Ensure keys are not exposed in client-side code

2. **Sandbox Connection Issues**:
   - Verify E2B API key is valid
   - Check E2B service status
   - Ensure network connectivity

3. **Build Errors**:
   - Run `npm run type-check` to identify TypeScript issues
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
ENABLE_DEBUG_LOGGING=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel](https://vercel.com) for the amazing AI SDK
- [Google](https://ai.google.dev) for Gemini API access
- [E2B](https://e2b.dev) for secure sandbox infrastructure
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [Tailwind CSS](https://tailwindcss.com) for styling system

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-chatbot-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-chatbot-pro/discussions)
- **Email**: support@yourapp.com

---

Built with ❤️ using Next.js 14 and modern web technologies.