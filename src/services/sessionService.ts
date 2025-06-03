import { Session } from '../types';

class SessionService {
  private readonly STORAGE_KEY = 'tibia_sessions';

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getAllSessions(): Session[] {
    const sessions = localStorage.getItem(this.STORAGE_KEY);
    return sessions ? JSON.parse(sessions) : [];
  }

  getSessionsByDate(date: Date): Session[] {
    const sessions = this.getAllSessions();
    return sessions.filter(session => {
      const sessionDate = new Date(session.start_datetime);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    });
  }

  addSession(sessionData: Omit<Session, 'id' | 'user_id' | 'created_at'>): Session {
    const sessions = this.getAllSessions();
    const newSession: Session = {
      ...sessionData,
      id: this.generateId(),
      user_id: '1', // Por enquanto, vamos usar um ID fixo
      created_at: new Date(),
    };

    sessions.push(newSession);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    return newSession;
  }

  getSessionById(id: string): Session | null {
    const sessions = this.getAllSessions();
    return sessions.find(session => session.id === id) || null;
  }

  deleteSession(id: string): boolean {
    const sessions = this.getAllSessions();
    const filteredSessions = sessions.filter(session => session.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions));
    return filteredSessions.length < sessions.length;
  }
}

export const sessionService = new SessionService(); 