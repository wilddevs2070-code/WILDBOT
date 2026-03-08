export type UserRole = 'admin' | 'developer' | 'user';

export interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  message_count: number;
  role: UserRole;
}

export interface Session {
  id: number;
  title: string;
  created_at: string;
  user_id: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type GameDevTask = 'brainstorm' | 'code' | 'debug' | 'level' | 'asset' | 'math' | 'planning' | 'marketing' | 'video';

export interface TaskConfig {
  id: GameDevTask;
  label: string;
  icon: string;
  prompt: string;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
