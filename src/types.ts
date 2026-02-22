
export interface MathSolution {
  id: string;
  question: string;
  solution: string;
  explanation: string;
  timestamp: number;
}

export interface UserStats {
  dailyCount: number;
  lastReset: number;
  isPremium: boolean;
  isVerified: boolean;
  phoneNumber?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    photoUrl: string;
    status: 'Pro' | 'Basic';
    isVerified: boolean;
  } | null;
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  status: 'Pro' | 'Basic';
  verified: boolean;
  lastActive: number;
}

export interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of options
  explanation: string;
}

export interface MockTest {
  id: string;
  title: string;
  level: string;
  questions: MockQuestion[];
}
