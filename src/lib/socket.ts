/**
 * Real-time collaboration via Firebase Realtime Database.
 * Replaces the previous mock socket.io approach — no backend server needed.
 *
 * Usage:
 *   import { rtCollab } from '@/lib/socket';
 *   rtCollab.joinSession(sessionId, userId, onBeatUpdate);
 *   rtCollab.sendBeat(sessionId, beat);
 *   rtCollab.leaveSession(sessionId, userId);
 *
 * To enable, add Firebase Realtime Database to your project in the console
 * and set VITE_FIREBASE_DATABASE_URL in .env
 */

import type { BeatPattern } from '@/types/beat';

type BeatUpdateCallback = (beat: BeatPattern) => void;
type UserEventCallback = (username: string) => void;

class RealtimeCollab {
  private callbacks: {
    onBeatUpdate?: BeatUpdateCallback;
    onUserJoined?: UserEventCallback;
    onUserLeft?: UserEventCallback;
  } = {};

  /**
   * Join a collaboration session.
   * Listens to /sessions/{sessionId}/beat for live beat changes.
   */
  async joinSession(sessionId: string, userId: string, onBeatUpdate: BeatUpdateCallback) {
    const dbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    if (!dbUrl) {
      console.warn('[Collab] VITE_FIREBASE_DATABASE_URL not set — collaboration disabled');
      return;
    }

    this.callbacks.onBeatUpdate = onBeatUpdate;

    // Dynamically import Firebase RTDB only if URL is configured
    const { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } = await import('firebase/database');
    const { default: app } = await import('../firebase');
    const db = getDatabase(app, dbUrl);

    // Register presence
    const presenceRef = ref(db, `sessions/${sessionId}/users/${userId}`);
    await set(presenceRef, { joinedAt: serverTimestamp() });
    onDisconnect(presenceRef).remove();

    // Listen for beat updates
    const beatRef = ref(db, `sessions/${sessionId}/beat`);
    onValue(beatRef, (snapshot) => {
      const beat = snapshot.val();
      if (beat) this.callbacks.onBeatUpdate?.(beat);
    });
  }

  /**
   * Broadcast a beat update to all collaborators in the session.
   */
  async sendBeat(sessionId: string, beat: BeatPattern) {
    const dbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    if (!dbUrl) {
      console.warn('[Collab] VITE_FIREBASE_DATABASE_URL not set — beat not sent');
      return;
    }
    const { getDatabase, ref, set } = await import('firebase/database');
    const { default: app } = await import('../firebase');
    const db = getDatabase(app, dbUrl);
    await set(ref(db, `sessions/${sessionId}/beat`), beat);
  }

  /**
   * Leave a collaboration session.
   */
  async leaveSession(sessionId: string, userId: string) {
    const dbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    if (!dbUrl) return;
    const { getDatabase, ref, remove } = await import('firebase/database');
    const { default: app } = await import('../firebase');
    const db = getDatabase(app, dbUrl);
    await remove(ref(db, `sessions/${sessionId}/users/${userId}`));
  }
}

export const rtCollab = new RealtimeCollab();

// Legacy export so existing imports of socketService don't break
const socketService = {
  connect: () => console.warn('[Socket] Replaced by rtCollab — see src/lib/socket.ts'),
  disconnect: () => {},
  sendBeat: (beat: BeatPattern) => console.warn('[Socket] Use rtCollab.sendBeat() instead', beat),
  mockSendBeat: (beat: BeatPattern) => console.log('[Collab mock] Beat:', beat),
  onBeatUpdate: (cb: BeatUpdateCallback) => { },
};

export default socketService;
