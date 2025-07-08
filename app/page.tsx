'use client';

import { useState } from 'react';
import { Chat } from '@/components/chat/Chat';
import { SandboxConsole } from '@/components/chat/SandboxConsole';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="font-semibold text-lg">AI Chatbot Pro</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b border-border bg-muted/30">
            <div className="container px-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="sandbox" className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Sandbox
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <TabsContent value="chat" className="h-full mt-0">
            <Chat />
          </TabsContent>
          
          <TabsContent value="sandbox" className="h-full mt-0">
            <SandboxConsole />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}