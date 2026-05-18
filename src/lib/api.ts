import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';
import type { BeatPattern } from '@/types/beat';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
// Updated: llama-3.1-8b:free was removed from OpenRouter. Use a current free model.
// Check https://openrouter.ai/models?supported_parameters=free for the latest free options.
const OPENROUTER_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getCurrentUserId(): string | null {
  return getAuth().currentUser?.uid ?? null;
}

/**
 * Ask OpenRouter (free Llama model) to convert a text prompt into a beat pattern.
 * Returns a structured BeatPattern object.
 */
export async function generateBeatWithAI(prompt: string): Promise<BeatPattern> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY is not set in your .env file');

  const systemPrompt = `You are a beat pattern generator for a music production app.
Given a text description, return ONLY a valid JSON object (no markdown, no explanation) with this exact shape:
{
  "name": "string (short beat name)",
  "genre": "string",
  "bpm": number (60-180),
  "patterns": {
    "kick":       [16 values, each 0 or 1],
    "snare":      [16 values, each 0 or 1],
    "hihat":      [16 values, each 0 or 1],
    "percussion": [16 values, each 0 or 1]
  }
}
Rules:
- kick and snare should never both be 1 on the same step
- hihat can be frequent (every 1-2 steps)
- percussion adds variation
- match the genre and energy of the prompt
Return ONLY the JSON, nothing else.`;

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Mazer Beat App',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown fences if model wraps in ```json
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    id: `gen-${Date.now()}`,
    name: parsed.name || prompt.slice(0, 30),
    genre: parsed.genre || 'Unknown',
    bpm: Number(parsed.bpm) || 120,
    patterns: {
      kick:        ensurePattern(parsed.patterns?.kick),
      snare:       ensurePattern(parsed.patterns?.snare),
      hihat:       ensurePattern(parsed.patterns?.hihat),
      percussion:  ensurePattern(parsed.patterns?.percussion),
    },
    createdAt: new Date().toISOString(),
    userId: getCurrentUserId() ?? undefined,
  };
}

function ensurePattern(arr: unknown): number[] {
  if (Array.isArray(arr) && arr.length === 16) return arr.map(v => (v ? 1 : 0));
  return Array(16).fill(0);
}

// ── Firestore CRUD ─────────────────────────────────────────────────────────────

export const api = {
  generateBeat: async (prompt: string): Promise<BeatPattern> => {
    try {
      return await generateBeatWithAI(prompt);
    } catch (err) {
      console.error('AI generation failed, using fallback:', err);
      toast.error('AI generation failed — using a default pattern.');
      return getFallbackBeat(prompt);
    }
  },

  saveBeat: async (beat: BeatPattern): Promise<BeatPattern> => {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');

    const payload = {
      ...beat,
      userId: uid,
      updatedAt: serverTimestamp(),
      createdAt: beat.createdAt || new Date().toISOString(),
    };

    console.log('Saving beat to Firebase:', { uid, beatId: beat.id, payload });

    if (beat.id && !beat.id.startsWith('gen-')) {
      // Update existing
      const ref = doc(db, 'users', uid, 'beats', beat.id);
      await updateDoc(ref, payload);
      console.log('Beat updated successfully:', ref.id);
      return { ...beat, updatedAt: new Date().toISOString() };
    } else {
      // Create new
      const ref = await addDoc(collection(db, 'users', uid, 'beats'), payload);
      console.log('Beat created successfully:', ref.id);
      return { ...beat, id: ref.id, updatedAt: new Date().toISOString() };
    }
  },

  getUserBeats: async (): Promise<BeatPattern[]> => {
    const uid = getCurrentUserId();
    if (!uid) return [];
    const q = query(collection(db, 'users', uid, 'beats'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    console.log('Retrieved beats from Firebase:', snap.docs.length, 'beats for uid:', uid);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BeatPattern));
  },

  deleteBeat: async (beatId: string): Promise<{ success: boolean }> => {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'users', uid, 'beats', beatId));
    return { success: true };
  },

  // Recordings (instrument and voice)
  getRecordings: async () => {
    const uid = getCurrentUserId();
    if (!uid) return [];
    const q = query(collection(db, 'users', uid, 'recordings'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    console.log('Retrieved recordings from Firebase:', snap.docs.length, 'recordings for uid:', uid);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  },

  deleteRecording: async (recordingId: string): Promise<{ success: boolean }> => {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'users', uid, 'recordings', recordingId));
    return { success: true };
  },
};

// ── Fallback patterns (offline / API failure) ──────────────────────────────────

function getFallbackBeat(prompt: string): BeatPattern {
  const lp = prompt.toLowerCase();
  let template = FALLBACK_BEATS[0];
  if (lp.includes('trap') || lp.includes('808')) template = FALLBACK_BEATS[1];
  else if (lp.includes('house') || lp.includes('four')) template = FALLBACK_BEATS[2];
  else if (lp.includes('reggae') || lp.includes('reggaeton')) template = FALLBACK_BEATS[3];
  return {
    ...template,
    id: `gen-${Date.now()}`,
    name: prompt.slice(0, 30),
    createdAt: new Date().toISOString(),
  };
}

const FALLBACK_BEATS: BeatPattern[] = [
  {
    id: 'f1', name: 'Boom Bap', genre: 'Hip-Hop', bpm: 90,
    patterns: {
      kick:       [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],
      snare:      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      percussion: [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f2', name: 'Trap 808', genre: 'Trap', bpm: 140,
    patterns: {
      kick:       [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
      snare:      [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      percussion: [0,0,1,0,0,0,0,1,0,0,1,0,0,0,1,0],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f3', name: 'House', genre: 'House', bpm: 128,
    patterns: {
      kick:       [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:      [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      percussion: [0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f4', name: 'Reggaeton', genre: 'Reggaeton', bpm: 95,
    patterns: {
      kick:       [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],
      snare:      [0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0],
      hihat:      [1,1,0,1,1,0,1,1,1,1,0,1,1,0,1,1],
      percussion: [0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1],
    },
    createdAt: new Date().toISOString(),
  },
];
