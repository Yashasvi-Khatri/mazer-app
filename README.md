# Mazer — AI Beat Maker

A browser-based AI beat generation studio built with React, Firebase, and Web Audio API.

## Features

- **AI Beat Generation** — Describe any beat in plain English; OpenRouter (free Llama model) generates a full 16-step pattern
- **Live Step Sequencer** — Edit patterns with a lookahead-scheduled Web Audio engine, swing control, per-instrument volume
- **Synthesized Drums** — No sample files needed; kick, snare, hihat, and percussion are synthesized in real time with proper DSP
- **Live Instruments** — Synthesized piano (C4–C5), drums, bass, and synth pads with recording
- **Mixer Controls** — BPM presets, master volume, JSON export
- **Firebase Auth** — Email/password login and signup
- **Firestore Library** — All beats saved to your account, accessible from the dashboard

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Yashasvi-Khatri/mazer-app
cd mazer-app
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in:

```env
# Required — get free key at https://openrouter.ai/keys
VITE_OPENROUTER_API_KEY=your_key_here

# Firebase (already set to the mazer-8a9c6 project, change if using your own)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Optional — for real-time collaboration
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### 3. Firebase Firestore rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/beats/{beatId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Run

```bash
npm run dev
```

## AI Model

Uses `meta-llama/llama-3.1-8b-instruct:free` via OpenRouter — completely free, no credit card.
To use a smarter model (better patterns), change `OPENROUTER_MODEL` in `src/lib/api.ts` to e.g. `openai/gpt-4o-mini`.

## Tech Stack

- React 18 + TypeScript + Vite
- Firebase Auth + Firestore
- Web Audio API (no Tone.js dependency)
- OpenRouter API (AI generation)
- Tailwind CSS + shadcn/ui
- React Router v6
