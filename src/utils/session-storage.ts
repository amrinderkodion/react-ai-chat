// utils/session-storage.ts
import { Session, Msg } from '../types.ts'; // You'll need to define these types in a `types.ts` file

const STORAGE_KEY = 'manager_chat_sessions_v1';

export function loadSessions(): Session[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Session[];
    } catch {
        return [];
    }
}

export function saveSessions(sessions: Session[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch { }
}

export function newSessionTemplate(): Session {
    const now = Date.now();
    return {
        id: String(now) + '-' + Math.random().toString(36).slice(2, 8),
        title: `Session ${new Date(now).toLocaleString()}`,
        createdAt: now,
        messages: [
            {
                sender: 'assistant',
                text: "Welcome, Manager — I'm here to help you practice leadership scenarios, 1:1s, feedback, interviewing, or give tips. What would you like to try?",
                t: now,
            },
        ],
        notes: '',
    };
}

export function exportSession(s: Session) {
    const data = JSON.stringify(s, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.title.replace(/[^\w-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}