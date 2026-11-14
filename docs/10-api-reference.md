# 10 — API Reference

## Internal APIs

Lumen's components communicate through several internal APIs: IPC messages (Electron), WebSocket messages (overlay), and HTTP endpoints (overlay server).

---

## Overlay HTTP Server

The overlay server runs on `localhost:3000` (configurable) and serves the HTML pages that OBS loads as Browser Sources.

### Endpoints

#### `GET /overlay`

Returns the lower-third overlay HTML page. This page:
- Has a transparent background
- Connects to the WebSocket server to receive verse updates
- Renders verses at the bottom of the screen with animations

**OBS Browser Source settings:**
```
URL: http://localhost:3000/overlay
Width: 1920
Height: 1080
```

#### `GET /overlay-full`

Returns the full-screen scripture display HTML page. This page:
- Has a themed background (gradient, image, or solid color)
- Centers the verse text vertically and horizontally
- Uses larger fonts for readability

**OBS Browser Source settings:**
```
URL: http://localhost:3000/overlay-full
Width: 1920
Height: 1080
```

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "connectedClients": 2
}
```

#### `GET /api/translations`

Returns the list of available Bible translations.

**Response:**
```json
{
  "translations": [
    { "id": "KJV", "name": "King James Version", "abbreviation": "KJV" },
    { "id": "NIV", "name": "New International Version", "abbreviation": "NIV" },
    { "id": "AMP", "name": "Amplified Bible", "abbreviation": "AMP" }
  ]
}
```

#### `GET /api/verse/:book/:chapter/:verse`

Fetch a specific verse. Useful for testing and debugging.

**Parameters:**
- `book` — Book name (e.g., `John`, `1+Corinthians`)
- `chapter` — Chapter number
- `verse` — Verse number or range (e.g., `16`, `28-30`)
- `?translation=KJV` — Query parameter for translation (defaults to configured default)

**Example:** `GET /api/verse/John/3/16?translation=AMP`

**Response:**
```json
{
  "reference": "John 3:16",
  "translation": "AMP",
  "verses": [
    {
      "book": "John",
      "chapter": 3,
      "verse": 16,
      "text": "For God so [greatly] loved and dearly prized the world, that He [even] gave His [One and] only begotten Son, so that whoever believes and trusts in Him [as Savior] shall not perish, but have eternal life."
    }
  ]
}
```

---

## Overlay WebSocket Protocol

The overlay pages connect to the WebSocket server at `ws://localhost:3001` (configurable) to receive real-time verse updates.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Server → Client Messages

#### `verse:show`

Sent when a verse should be displayed.

```json
{
  "type": "verse:show",
  "data": {
    "reference": "John 3:16",
    "translation": "AMP",
    "text": "For God so [greatly] loved and dearly prized the world...",
    "book": "John",
    "chapter": 3,
    "verseStart": 16,
    "verseEnd": null,
    "duration": 15000,
    "id": "v_1699900000_001"
  }
}
```

#### `verse:hide`

Sent when the current verse should be dismissed.

```json
{
  "type": "verse:hide",
  "data": {
    "id": "v_1699900000_001"
  }
}
```

#### `verse:clear`

Sent when all displayed content should be cleared immediately.

```json
{
  "type": "verse:clear"
}
```

#### `theme:update`

Sent when the operator changes the display theme.

```json
{
  "type": "theme:update",
  "data": {
    "theme": "dark",
    "fontSize": "auto",
    "fontFamily": "Georgia, serif",
    "accentColor": "#f0c040",
    "backgroundColor": "rgba(0, 0, 0, 0.85)",
    "textColor": "#ffffff",
    "animation": "fade"
  }
}
```

### Client → Server Messages

#### `client:ready`

Sent by the overlay page when it has loaded and is ready to receive verses.

```json
{
  "type": "client:ready",
  "data": {
    "variant": "lower-third",
    "width": 1920,
    "height": 1080
  }
}
```

---

## Electron IPC Messages

Communication between the Electron main process and the renderer process (operator panel).

### Renderer → Main

#### `speech:segment`

Sent when the Speech Engine produces a new transcript segment.

```typescript
ipcRenderer.send('speech:segment', {
  text: "turn to John chapter 3 verse 16",
  isFinal: true,
  confidence: 0.92,
  timestamp: Date.now()
});
```

#### `verse:approve`

Sent when the operator approves a detected verse for display.

```typescript
ipcRenderer.send('verse:approve', {
  id: "det_1699900000_001",
  book: "John",
  chapter: 3,
  verseStart: 16,
  verseEnd: null,
  translation: "AMP"
});
```

#### `verse:dismiss`

Sent when the operator dismisses a detected verse.

```typescript
ipcRenderer.send('verse:dismiss', {
  id: "det_1699900000_001"
});
```

#### `verse:manual`

Sent when the operator manually enters a verse.

```typescript
ipcRenderer.send('verse:manual', {
  book: "Romans",
  chapter: 8,
  verseStart: 28,
  verseEnd: 30,
  translation: "NIV"
});
```

#### `display:clear`

Sent when the operator clears the current display.

```typescript
ipcRenderer.send('display:clear');
```

#### `settings:update`

Sent when the operator changes a setting.

```typescript
ipcRenderer.send('settings:update', {
  key: "defaultTranslation",
  value: "NIV"
});
```

### Main → Renderer

#### `transcript:update`

Sent to update the transcript view in the operator panel.

```typescript
ipcMain.on('transcript:update', (event, data) => {
  // data: { text: string, isFinal: boolean, timestamp: number }
});
```

#### `verse:detected`

Sent when the Verse Detector identifies a verse reference.

```typescript
ipcMain.on('verse:detected', (event, data) => {
  // data: DetectedVerse (see architecture doc)
  // {
  //   id: "det_1699900000_001",
  //   book: "John",
  //   chapter: 3,
  //   verseStart: 16,
  //   verseEnd: null,
  //   translation: "AMP",
  //   confidence: 0.93,
  //   rawText: "turn to John chapter 3 verse 16 amplified",
  //   text: "For God so [greatly] loved..."   // looked up from DB
  // }
});
```

#### `verse:displayed`

Sent when a verse has been sent to the overlay display.

```typescript
ipcMain.on('verse:displayed', (event, data) => {
  // data: { id: string, reference: string, translation: string, timestamp: number }
});
```

#### `obs:status`

Sent when the OBS connection status changes.

```typescript
ipcMain.on('obs:status', (event, data) => {
  // data: { connected: boolean, error?: string }
});
```

#### `speech:status`

Sent when the speech engine status changes.

```typescript
ipcMain.on('speech:status', (event, data) => {
  // data: { active: boolean, micLevel: number, error?: string }
});
```

---

## OBS WebSocket API (obs-websocket-js)

Lumen uses these OBS WebSocket requests:

### Requests Used

| Request | Purpose |
|---------|---------|
| `GetSceneList` | List available scenes (for settings dropdown) |
| `GetSceneItemList` | List sources in a scene (find the Lumen overlay) |
| `SetSceneItemEnabled` | Show/hide the Lumen overlay source |
| `SetCurrentProgramScene` | Switch the active scene (optional) |
| `GetCurrentProgramScene` | Get the current active scene |

### Events Listened To

| Event | Purpose |
|-------|---------|
| `CurrentProgramSceneChanged` | Track which scene is active |
| `SceneItemEnableStateChanged` | Track if operator manually toggled the source in OBS |
| `ConnectionClosed` | Trigger reconnection logic |

### Connection Example

```typescript
import OBSWebSocket from 'obs-websocket-js';

const obs = new OBSWebSocket();

async function connectToOBS(host: string, port: number, password: string) {
  try {
    await obs.connect(`ws://${host}:${port}`, password);
    console.log('Connected to OBS');
    
    // List scenes
    const { scenes } = await obs.call('GetSceneList');
    
    // Find Lumen source in the current scene
    const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
    const { sceneItems } = await obs.call('GetSceneItemList', {
      sceneName: currentProgramSceneName
    });
    
    const lumenSource = sceneItems.find(
      item => item.sourceName === 'Lumen Verse Overlay'
    );
    
    if (lumenSource) {
      // Show the overlay
      await obs.call('SetSceneItemEnabled', {
        sceneName: currentProgramSceneName,
        sceneItemId: lumenSource.sceneItemId,
        sceneItemEnabled: true
      });
    }
  } catch (error) {
    console.error('OBS connection failed:', error);
  }
}
```

---

## Data Types Summary

```typescript
// Core data types used across all APIs

interface TranscriptSegment {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

interface DetectedVerse {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  translation?: string;
  confidence: number;
  rawText: string;
  timestamp: number;
}

interface VerseResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

interface DisplayVerse {
  id: string;
  reference: string;      // "John 3:16"
  translation: string;    // "AMP"
  text: string;            // Full verse text
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  duration: number;        // Display duration in ms
}

interface ThemeConfig {
  theme: 'dark' | 'light' | 'custom';
  fontSize: 'auto' | number;
  fontFamily: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  animation: 'fade' | 'slide' | 'instant';
  backgroundImage?: string;
  churchLogo?: string;
}

interface AppSettings {
  defaultTranslation: string;
  displayDuration: number;
  mode: 'auto' | 'approve' | 'manual';
  confidenceThreshold: number;
  dedupWindowSeconds: number;
  translationDetectionWindowSeconds: number;
  theme: ThemeConfig;
  obs: {
    host: string;
    port: number;
    password: string;
    autoShowHide: boolean;
    sceneSwitching: boolean;
    verseSourceName: string;
    scriptureSceneName?: string;
  };
  audio: {
    deviceId?: string;
    speechEngine: 'web-speech-api' | 'deepgram';
    language: string;
    deepgramApiKey?: string;
  };
  overlay: {
    httpPort: number;
    wsPort: number;
  };
}
```
