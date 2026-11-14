# 02 — Architecture

## System Architecture

Lumen is an Electron desktop application with an embedded web server. It consists of five core components that work together in a real-time pipeline.

```
┌─────────────────────────────────────────────────────────────────┐
│                        LUMEN APPLICATION                        │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Speech   │───▶│ Verse        │───▶│ Bible Database       │  │
│  │ Engine   │    │ Detector     │    │ (SQLite)             │  │
│  └──────────┘    └──────┬───────┘    └──────────┬───────────┘  │
│       ▲                 │                       │              │
│       │                 ▼                       ▼              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Micro-   │    │ Operator     │───▶│ Overlay Server       │  │
│  │ phone    │    │ Panel (React)│    │ (Express + WebSocket) │  │
│  └──────────┘    └──────┬───────┘    └──────────┬───────────┘  │
│                         │                       │              │
│                         ▼                       ▼              │
│                  ┌──────────────┐    ┌──────────────────────┐  │
│                  │ OBS          │───▶│ OBS Studio           │  │
│                  │ Connector    │    │ (External)           │  │
│                  └──────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Overview

### 1. Speech Engine
**Responsibility:** Capture audio from the microphone and produce a real-time text transcript.

- Runs in the Electron renderer process (needs DOM access for Web Speech API)
- Outputs a stream of transcript segments with timestamps
- Handles interim (partial) and final (confirmed) results
- Adapters for different backends (Web Speech API, Deepgram)

**Interfaces:**
```typescript
interface TranscriptSegment {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

interface SpeechEngine {
  start(): void;
  stop(): void;
  onSegment(callback: (segment: TranscriptSegment) => void): void;
}
```

### 2. Verse Detector
**Responsibility:** Analyze transcript segments and identify Bible verse references.

- Receives transcript segments from the Speech Engine
- Maintains a rolling text buffer (last ~30 seconds of transcript)
- Runs regex patterns and NLP rules against the buffer
- Detects both verse references and translation preferences
- Emits detected verse events

**Interfaces:**
```typescript
interface DetectedVerse {
  book: string;           // "John"
  chapter: number;        // 3
  verseStart: number;     // 16
  verseEnd?: number;      // undefined or 18 (for ranges)
  translation?: string;   // "AMP" or undefined (use default)
  confidence: number;     // 0.0 to 1.0
  rawText: string;        // The original spoken text that triggered detection
  timestamp: number;
}

interface VerseDetector {
  feed(segment: TranscriptSegment): void;
  onDetection(callback: (verse: DetectedVerse) => void): void;
}
```

### 3. Bible Database
**Responsibility:** Store and retrieve Bible verse text across multiple translations.

- SQLite database bundled with the application
- Provides fast lookups by book + chapter + verse + translation
- Supports verse ranges
- Contains metadata (book names, chapter counts, verse counts)

**Interfaces:**
```typescript
interface VerseResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

interface BibleDatabase {
  getVerse(book: string, chapter: number, verse: number, translation: string): VerseResult;
  getVerseRange(book: string, chapter: number, startVerse: number, endVerse: number, translation: string): VerseResult[];
  getTranslations(): string[];
  getBooks(): BookInfo[];
}
```

### 4. Operator Panel
**Responsibility:** Provide a control interface for the church tech operator.

- Electron renderer window (React application)
- Displays live transcript, detected verses, and system status
- Allows approve/dismiss/edit/manual-entry actions
- Controls settings (default translation, mode, themes)
- Shows connection status to OBS

### 5. Overlay Server
**Responsibility:** Serve HTML overlay pages and push verse updates to OBS Browser Sources.

- Express.js HTTP server on `localhost:3000`
- WebSocket server for real-time verse updates to overlay pages
- Serves two overlay variants:
  - `/overlay` — Lower-third style (transparent background, for camera scenes)
  - `/overlay-full` — Full-screen verse display (for scripture-focused scenes)
- Overlay pages are pure HTML/CSS/JS (no framework needed)

### 6. OBS Connector
**Responsibility:** Connect to OBS Studio via WebSocket and control sources/scenes.

- Uses `obs-websocket-js` library
- Connects to OBS WebSocket server (default port 4455)
- Can show/hide overlay sources programmatically
- Can trigger scene transitions
- Reports OBS connection status to the operator panel

## Data Flow

### Real-time Pipeline

```
Microphone Audio
    │
    ▼
Speech Engine (Web Speech API)
    │
    │  TranscriptSegment { text, isFinal, confidence, timestamp }
    ▼
Verse Detector
    │
    │  DetectedVerse { book, chapter, verse, translation, confidence }
    ▼
┌───────────────┐
│ Mode Router   │
├───────────────┤
│ Auto Mode:    │──▶ Display immediately
│ Approve Mode: │──▶ Show in Operator Panel ──▶ Operator clicks Approve ──▶ Display
│ Manual Mode:  │──▶ Ignore (operator types manually)
└───────────────┘
    │
    ▼
Bible Database Lookup
    │
    │  VerseResult { book, chapter, verse, text, translation }
    ▼
┌─────────────────────────┐
│ Broadcast to:           │
│  • Overlay Server (WS)  │──▶ OBS Browser Source renders verse
│  • OBS Connector        │──▶ Show/hide source, switch scene
│  • History Log          │──▶ Record in session history
└─────────────────────────┘
```

## Process Architecture (Electron)

```
┌─────────────────────────────────────────┐
│           Electron Main Process          │
│                                          │
│  • Window management                     │
│  • IPC message routing                   │
│  • Overlay Express server                │
│  • OBS WebSocket connector               │
│  • Bible SQLite database                 │
│  • Verse detector logic                  │
└────────────────┬────────────────────────┘
                 │ IPC
                 ▼
┌─────────────────────────────────────────┐
│        Electron Renderer Process         │
│                                          │
│  • React Operator Panel UI               │
│  • Web Speech API (needs DOM)            │
│  • Sends transcript to main via IPC      │
│  • Receives detected verses via IPC      │
│  • Displays controls and status          │
└─────────────────────────────────────────┘
```

## Port Usage

| Port | Purpose | Configurable |
|------|---------|--------------|
| 3000 | Overlay HTTP server (serves overlay pages) | Yes |
| 3001 | Overlay WebSocket server (pushes verse updates) | Yes |
| 4455 | OBS WebSocket server (OBS's default) | Yes (in settings) |

## Error Handling Strategy

| Failure | Behavior |
|---------|----------|
| Microphone unavailable | Show warning in operator panel; allow manual mode |
| Speech API fails | Fall back to manual mode; show notification |
| OBS not connected | Overlay still works (Browser Source polls); show status |
| Verse not found in database | Show "verse not found" in operator panel; do not display |
| Overlay server fails to start | Show error; suggest checking port conflicts |
| Database corrupted | Show error; offer to reinitialize from bundled data |
