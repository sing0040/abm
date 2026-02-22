
import { MathSolution, UserStats, StudentRecord } from '../types';
import { DAILY_LIMIT } from '../constants';

const DB_KEY = 'lumenmath_solutions';
const STATS_KEY = 'lumenmath_stats';
const STUDENTS_KEY = 'lumenmath_roster';

export const dbService = {
  getStoredSolution(question: string): MathSolution | null {
    const solutions = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    return solutions.find((s: MathSolution) => s.question.toLowerCase().trim() === question.toLowerCase().trim()) || null;
  },

  storeSolution(solution: MathSolution): void {
    const solutions = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    solutions.push(solution);
    localStorage.setItem(DB_KEY, JSON.stringify(solutions));
  },

  getUserStats(): UserStats {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (!stats || (now - stats.lastReset > dayInMs && !stats.isPremium)) {
      const newStats = { dailyCount: 0, lastReset: now, isPremium: false, isVerified: false };
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      return newStats;
    }
    return stats;
  },

  upgradeToPremium(): void {
    const stats = this.getUserStats();
    stats.isPremium = true;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    
    // Update current auth session too
    const auth = JSON.parse(localStorage.getItem('lumenmath_auth') || '{}');
    if (auth.user) {
      auth.user.status = 'Pro';
      localStorage.setItem('lumenmath_auth', JSON.stringify(auth));
    }
  },

  setVerified(status: boolean): void {
    const stats = this.getUserStats();
    stats.isVerified = status;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    
    const auth = JSON.parse(localStorage.getItem('lumenmath_auth') || '{}');
    if (auth.user) {
      auth.user.isVerified = status;
      localStorage.setItem('lumenmath_auth', JSON.stringify(auth));
    }
  },

  incrementUsage(): void {
    const stats = this.getUserStats();
    stats.dailyCount += 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  },

  hasRemainingLimit(): boolean {
    const stats = this.getUserStats();
    if (stats.isPremium) return true;
    return stats.dailyCount < DAILY_LIMIT;
  },

  getHistory(): MathSolution[] {
    return JSON.parse(localStorage.getItem(DB_KEY) || '[]').reverse();
  },

  getStudentRoster(): StudentRecord[] {
    let roster = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
    if (roster.length === 0) {
      // Seed initial mock data
      roster = [
        { id: '1', name: 'Alice Johnson', email: 'alice@mit.edu', status: 'Pro', verified: true, lastActive: Date.now() - 100000 },
        { id: '2', name: 'Bob Smith', email: 'bob@stanford.edu', status: 'Basic', verified: true, lastActive: Date.now() - 500000 },
        { id: '3', name: 'Charlie Davis', email: 'charlie@oxford.ac.uk', status: 'Pro', verified: false, lastActive: Date.now() - 1000000 },
        { id: '4', name: 'Diana Prince', email: 'diana@themyscira.com', status: 'Basic', verified: false, lastActive: Date.now() - 2000000 },
      ];
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(roster));
    }
    return roster;
  }
};
