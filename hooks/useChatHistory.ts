import { useState, useEffect, useCallback } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { generateId } from '@/lib/utils';

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCalls?: FunctionCall[];
  isTyping?: boolean;
  error?: string;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  systemPrompt?: string;
}

export interface ChatHistoryState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  totalMessages: number;
  totalSessions: number;
}

const DEFAULT_STATE: ChatHistoryState = {
  sessions: [],
  currentSessionId: null,
  totalMessages: 0,
  totalSessions: 0,
};

export function useChatHistory() {
  const [state, setState] = useLocalStorageState<ChatHistoryState>('chatHistory', {
    defaultValue: DEFAULT_STATE,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Get current session
  const currentSession = state.sessions.find(
    session => session.id === state.currentSessionId
  );

  // Create new session
  const createSession = useCallback((name?: string, systemPrompt?: string) => {
    const newSession: ChatSession = {
      id: generateId(),
      name: name || `Chat ${state.sessions.length + 1}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      systemPrompt,
    };

    setState(prev => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      currentSessionId: newSession.id,
      totalSessions: prev.totalSessions + 1,
    }));

    return newSession.id;
  }, [state.sessions.length, setState]);

  // Switch to session
  const switchToSession = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      currentSessionId: sessionId,
    }));
  }, [setState]);

  // Delete session
  const deleteSession = useCallback((sessionId: string) => {
    setState(prev => {
      const sessionToDelete = prev.sessions.find(s => s.id === sessionId);
      const newSessions = prev.sessions.filter(s => s.id !== sessionId);
      const messageCount = sessionToDelete?.messages.length || 0;
      
      let newCurrentSessionId = prev.currentSessionId;
      if (prev.currentSessionId === sessionId) {
        newCurrentSessionId = newSessions.length > 0 ? newSessions[0].id : null;
      }

      return {
        ...prev,
        sessions: newSessions,
        currentSessionId: newCurrentSessionId,
        totalMessages: prev.totalMessages - messageCount,
        totalSessions: prev.totalSessions - 1,
      };
    });
  }, [setState]);

  // Rename session
  const renameSession = useCallback((sessionId: string, newName: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === sessionId
          ? { ...session, name: newName, updatedAt: new Date() }
          : session
      ),
    }));
  }, [setState]);

  // Add message to current session
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!state.currentSessionId) {
      const sessionId = createSession();
      setState(prev => ({
        ...prev,
        currentSessionId: sessionId,
      }));
    }

    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === prev.currentSessionId
          ? {
              ...session,
              messages: [...session.messages, newMessage],
              updatedAt: new Date(),
            }
          : session
      ),
      totalMessages: prev.totalMessages + 1,
    }));

    return newMessage.id;
  }, [state.currentSessionId, createSession, setState]);

  // Update message
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === prev.currentSessionId
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
              updatedAt: new Date(),
            }
          : session
      ),
    }));
  }, [setState]);

  // Delete message
  const deleteMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === prev.currentSessionId
          ? {
              ...session,
              messages: session.messages.filter(msg => msg.id !== messageId),
              updatedAt: new Date(),
            }
          : session
      ),
      totalMessages: prev.totalMessages - 1,
    }));
  }, [setState]);

  // Clear current session
  const clearCurrentSession = useCallback(() => {
    if (!state.currentSessionId) return;

    setState(prev => {
      const currentSession = prev.sessions.find(s => s.id === prev.currentSessionId);
      const messageCount = currentSession?.messages.length || 0;

      return {
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === prev.currentSessionId
            ? { ...session, messages: [], updatedAt: new Date() }
            : session
        ),
        totalMessages: prev.totalMessages - messageCount,
      };
    });
  }, [state.currentSessionId, setState]);

  // Clear all history
  const clearAllHistory = useCallback(() => {
    setState(DEFAULT_STATE);
  }, [setState]);

  // Export history
  const exportHistory = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      ...state,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [state]);

  // Import history
  const importHistory = useCallback((file: File) => {
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        // Validate imported data structure
        if (importedData.sessions && Array.isArray(importedData.sessions)) {
          setState(prev => ({
            sessions: [...importedData.sessions, ...prev.sessions],
            currentSessionId: importedData.currentSessionId || prev.currentSessionId,
            totalMessages: prev.totalMessages + (importedData.totalMessages || 0),
            totalSessions: prev.totalSessions + (importedData.totalSessions || 0),
          }));
        }
      } catch (error) {
        console.error('Failed to import chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsText(file);
  }, [setState]);

  // Search messages
  const searchMessages = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    const results: Array<{ session: ChatSession; message: ChatMessage }> = [];

    state.sessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.content.toLowerCase().includes(lowercaseQuery)) {
          results.push({ session, message });
        }
      });
    });

    return results;
  }, [state.sessions]);

  // Get statistics
  const getStatistics = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayMessages = 0;
    let weekMessages = 0;
    let monthMessages = 0;
    let totalWords = 0;

    state.sessions.forEach(session => {
      session.messages.forEach(message => {
        const messageDate = new Date(message.timestamp);
        
        if (messageDate >= today) todayMessages++;
        if (messageDate >= thisWeek) weekMessages++;
        if (messageDate >= thisMonth) monthMessages++;

        totalWords += message.content.split(/\s+/).length;
      });
    });

    return {
      totalSessions: state.totalSessions,
      totalMessages: state.totalMessages,
      todayMessages,
      weekMessages,
      monthMessages,
      totalWords,
      averageMessagesPerSession: state.totalSessions > 0 
        ? Math.round(state.totalMessages / state.totalSessions)
        : 0,
    };
  }, [state]);

  // Initialize with a default session if none exists
  useEffect(() => {
    if (state.sessions.length === 0 && !state.currentSessionId) {
      createSession('Welcome Chat');
    }
  }, [state.sessions.length, state.currentSessionId, createSession]);

  return {
    // State
    sessions: state.sessions,
    currentSession,
    currentSessionId: state.currentSessionId,
    isLoading,

    // Session management
    createSession,
    switchToSession,
    deleteSession,
    renameSession,

    // Message management
    addMessage,
    updateMessage,
    deleteMessage,
    clearCurrentSession,

    // History management
    clearAllHistory,
    exportHistory,
    importHistory,

    // Utility functions
    searchMessages,
    getStatistics,
  };
}