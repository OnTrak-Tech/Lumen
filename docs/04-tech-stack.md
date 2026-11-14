# 04 — Tech Stack

## Technology Choices

Each technology in Lumen's stack was chosen for a specific reason. This document explains the what, why, and alternatives considered for each layer.

---

## Desktop Application Framework

### ✅ Chosen: Electron

**What it is:** A framework for building cross-platform desktop apps using web technologies (HTML, CSS, JavaScript/TypeScript).

**Why Electron:**
- **Cross-platform** — Builds for Windows, macOS, and Linux from one codebase
- **Web Speech API** — Chromium (Electron's browser engine) has built-in speech recognition
- **Browser Source compatibility** — The overlay server runs natively in Node.js (Electron's backend)
- **Rich ecosystem** — Thousands of npm packages available
- **Multiple windows** — Easy to create the operator panel and separate display windows
- **Mature** — Used by VS Code, Slack, Discord — proven at scale

**Trade-offs:**
- Larger app size (~150 MB) due to bundled Chromium
- Higher memory usage than native apps
- Not ideal for resource-constrained machines

**Alternatives Considered:**
| Alternative | Why Not |
|-------------|---------|
| Tauri | Smaller size, but uses system WebView which lacks Web Speech API on some platforms |
| Native (C#/WPF) | Windows-only; would need separate Mac/Linux versions |
| Flutter Desktop | Less mature for desktop; harder to integrate with Node.js ecosystem |
| NW.js | Smaller community; Electron has better tooling and documentation |

---

## Frontend UI

### ✅ Chosen: React + TypeScript

**Why React + TypeScript:**
- **Component model** — Operator panel has distinct sections (transcript, verse preview, history, settings) that map well to React components
- **Real-time updates** — React's reactive state management handles the constant stream of transcript and verse updates
- **TypeScript** — Type safety for the complex data flowing through the system (transcript segments, detected verses, Bible data)
- **Ecosystem** — Rich set of UI component libraries (Radix, shadcn/ui)
- **Developer familiarity** — Most widely known frontend framework

---

## Overlay Server

### ✅ Chosen: Express.js + ws (WebSocket)

**What it does:** Serves the HTML overlay pages that OBS loads as Browser Sources and pushes real-time verse updates to them.

**Why Express + ws:**
- **Express** — Minimal HTTP server; serves static overlay HTML/CSS/JS files
- **ws** — Lightweight WebSocket library for pushing verse updates to overlay pages in real-time
- **Runs in Electron main process** — No separate server to manage
- **Simple** — The overlay server does very little; a full framework would be overkill

**Why not Socket.IO:** Socket.IO adds unnecessary overhead (fallback transports, rooms, namespaces). The overlay server has exactly one use case: push verse data to a Browser Source page. Raw WebSocket is perfect.

---

## OBS Integration

### ✅ Chosen: obs-websocket-js

**What it is:** The official JavaScript client library for OBS Studio's built-in WebSocket API (v5).

**Why obs-websocket-js:**
- **Official library** — Maintained by the OBS project
- **OBS 28+ built-in** — No plugin installation required; WebSocket server is bundled with OBS
- **Full control** — Can show/hide sources, switch scenes, control transitions
- **Event-driven** — Can react to OBS events (scene changes, stream status)

---

## Speech-to-Text

### Phase 1: Web Speech API (Built-in)

**What it is:** A browser-native API available in Chromium that provides free, real-time speech recognition.

**Why start here:**
- **Free** — No API keys, no costs, no accounts
- **Built into Electron** — Chromium includes the Web Speech API
- **Simple API** — Start/stop with a few lines of code
- **Good enough for MVP** — Handles clear speech in quiet environments well

**Limitations:**
- Requires internet (sends audio to Google's servers for processing)
- Less accurate in noisy environments (church reverb, music)
- Limited language support
- No speaker diarization
- May have usage limits

### Phase 2: Deepgram or Whisper

**Upgrade path for better accuracy:**

| Option | Pros | Cons |
|--------|------|------|
| **Deepgram** | Excellent accuracy, real-time streaming, custom vocabulary (Bible book names), punctuation | Costs money (~$0.0043/min), requires internet |
| **OpenAI Whisper (local)** | Free, runs offline, very accurate | Requires GPU for real-time; higher latency |
| **Google Cloud STT** | High accuracy, streaming support, word-level timestamps | Costs money, requires Google Cloud account |

**Recommendation:** Deepgram for churches with internet; local Whisper for offline-only setups.

---

## Bible Database

### ✅ Chosen: SQLite (via better-sqlite3)

**Why SQLite:**
- **Offline** — No server needed; the database is a single file bundled with the app
- **Fast** — Sub-millisecond lookups with proper indexing
- **Reliable** — The most widely deployed database engine in the world
- **Small** — Entire Bible database is ~30-50 MB across multiple translations
- **better-sqlite3** — Synchronous API that's faster and simpler than async alternatives in Node.js

**Why not:**
| Alternative | Why Not |
|-------------|---------|
| JSON files | Too slow for lookups across 31,000+ verses per translation |
| MongoDB | Overkill; requires a running server |
| LevelDB | Less query flexibility; harder to search by book+chapter+verse |
| API calls | Requires internet; adds latency; dependency on external service |

---

## Styling

### ✅ Chosen: Tailwind CSS (operator panel) + Custom CSS (overlays)

**Why Tailwind for the operator panel:**
- Rapid UI development with utility classes
- Consistent spacing, colors, typography
- Dark mode support built-in
- Works seamlessly with React

**Why custom CSS for overlays:**
- Overlay pages are simple (show one verse)
- No build step needed — OBS loads them as plain HTML
- Full control over animations (fade, slide)
- Minimal file size (fast load in OBS Browser Source)

---

## Build & Distribution

### ✅ Chosen: electron-builder

**What it does:** Packages the Electron app into installable distributables for Windows (.exe / .msi), macOS (.dmg), and Linux (.AppImage / .deb).

**Why electron-builder:**
- Most popular Electron packaging tool
- Auto-update support (for future use)
- Code signing support
- Handles native module compilation (better-sqlite3)
- NSIS installer for Windows (familiar install wizard)

---

## Development Tools

| Tool | Purpose |
|------|---------|
| **TypeScript** | Type safety across the entire codebase |
| **Vite** | Fast bundling for React renderer code |
| **ESLint + Prettier** | Code quality and formatting |
| **Vitest** | Unit testing for verse detection logic |
| **electron-reload** | Hot reload during development |

---

## Full Stack Summary

```
┌─────────────────────────────────────────────────────┐
│                    LUMEN TECH STACK                   │
├─────────────────────────────────────────────────────┤
│  Desktop Shell        │  Electron                    │
│  UI Framework         │  React + TypeScript          │
│  UI Styling           │  Tailwind CSS                │
│  Overlay Server       │  Express.js + ws             │
│  Overlay Styling      │  Custom HTML/CSS/JS          │
│  OBS Integration      │  obs-websocket-js            │
│  Speech (Phase 1)     │  Web Speech API              │
│  Speech (Phase 2)     │  Deepgram / Whisper          │
│  Bible Database       │  SQLite (better-sqlite3)     │
│  Bundler              │  Vite                        │
│  Testing              │  Vitest                      │
│  Packaging            │  electron-builder            │
│  Language              │  TypeScript (100%)           │
└─────────────────────────────────────────────────────┘
```
