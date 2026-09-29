# Base44 Setup Notes

## Project Overview
OdontoClínica — a dental clinic management app for dental students (Portuguese language).
Single-process Vite + React + Express app.

## Architecture
- **server.ts**: Express server on port 3000 that runs Vite in middleware mode (dev) — serves both the React frontend and API endpoints.
- **Package manager**: Bun (`bun.lock` present). Dependencies installed via `bun install`; server run via `npx tsx server.ts` (tsx requires Node.js).
- **Frontend**: React 19 + Tailwind CSS 4 + Vite 6, entry at `src/main.tsx`.
- **Data persistence**: IndexedDB (client-side) + optional Supabase + Firebase Firestore (both have hardcoded defaults, so the app works out of the box).
- **Real-time sync**: Server-Sent Events (SSE) via `/api/sync/events` + BroadcastChannel for multi-tab sync.

## External Services
- **Gemini AI** (`GEMINI_API_KEY`): Powers the "OdontoMentor IA" dental tutor chat. The app boots without it, but AI chat will return errors. Get a key from Google AI Studio.
- **Supabase**: Has hardcoded default URL + anon key in code (`src/utils/supabase.ts` and `server.ts`). Optional — works out of the box.
- **Firebase**: Config hardcoded in `firebase-applet-config.json`. Works out of the box.

## Running
```
docker compose -f docker-compose.base44.yml up -d --build
```
Health check: `GET /api/health` → `{"status":"ok"}`

## Key API Endpoints
- `GET /api/health` — health check
- `POST /api/gemini/dental-tutor/stream` — streaming AI chat (SSE)
- `POST /api/gemini/dental-tutor` — non-streaming AI chat
- `GET /api/sync/events` — SSE real-time sync
- `GET/POST /api/sync/state` — get/push sync state
- `GET /api/supabase/status` — check Supabase connection
