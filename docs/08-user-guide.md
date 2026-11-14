# 08 — User Guide

## Getting Started

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | Windows 10, macOS 10.14, Ubuntu 18.04 | Windows 11, macOS 13+, Ubuntu 22.04 |
| **RAM** | 4 GB | 8 GB |
| **Disk** | 200 MB (app) + 50 MB (Bible data) | 500 MB |
| **Microphone** | Any USB or built-in mic | Dedicated podium/lapel mic via audio interface |
| **OBS Studio** | Version 28+ | Latest stable version |
| **Internet** | Required for speech recognition (Phase 1) | Wired connection for reliability |

### Installation

#### Windows

1. Download `Lumen-Setup-x.x.x.exe` from the releases page
2. Run the installer
3. Follow the installation wizard
4. Launch Lumen from the Start Menu or Desktop shortcut

#### macOS

1. Download `Lumen-x.x.x.dmg` from the releases page
2. Open the DMG file
3. Drag Lumen to the Applications folder
4. Launch from Applications (you may need to allow it in System Preferences → Security)

#### Linux

1. Download `Lumen-x.x.x.AppImage` from the releases page
2. Make it executable: `chmod +x Lumen-x.x.x.AppImage`
3. Run: `./Lumen-x.x.x.AppImage`

---

## First-Time Setup

### Step 1: Configure Default Translation

When Lumen launches for the first time:

1. Select your church's preferred default Bible translation
2. This will be used when the preacher doesn't specify a translation
3. You can change this at any time in Settings

### Step 2: Select Microphone

1. Go to **Settings → Audio**
2. Select the microphone that picks up the preacher
3. Speak into the mic and verify the audio level meter responds
4. For best results, use a dedicated microphone (not a laptop mic)

### Step 3: Connect to OBS Studio

1. Open OBS Studio
2. Go to **Tools → WebSocket Server Settings**
3. Enable the WebSocket server and note the port (default: 4455) and password
4. In Lumen, go to **Settings → OBS Connection**
5. Enter the host (`localhost`), port, and password
6. Click **Connect** — status should show ✅ Connected

### Step 4: Add Browser Source in OBS

1. In your OBS scene, click **+ → Browser**
2. Name it **"Lumen Verse Overlay"**
3. Set URL to `http://localhost:3000/overlay`
4. Set Width: 1920, Height: 1080
5. Click OK
6. Position the source where you want verses to appear

### Step 5: Test

1. In Lumen, set mode to **Auto**
2. Say "John 3:16" near the microphone
3. The verse should appear in the operator panel and on the OBS overlay
4. If it works, switch to **Approve** mode for live services

---

## Using Lumen During a Service

### Pre-Service Checklist

- [ ] Lumen is running
- [ ] Microphone is selected and picking up audio
- [ ] OBS is connected (green status indicator)
- [ ] Browser Source is visible in the OBS scene
- [ ] Operating mode is set (Auto or Approve)
- [ ] Default translation is correct
- [ ] Do a test: say a verse and verify it displays

### Operator Workflow (Approve Mode)

```
1. Preacher says a verse reference
                ↓
2. Live transcript shows the words in real-time
                ↓
3. Detected verse appears in the "Verse Preview" section
   - Green border = high confidence
   - Yellow border = lower confidence, verify carefully
                ↓
4. Operator reviews the verse:
   - ✅ Click "Display" to send to screen
   - ❌ Click "Dismiss" to ignore
   - ✏️ Click "Edit" to correct the reference
                ↓
5. Verse appears on OBS overlay (projector + livestream)
                ↓
6. After the configured duration, verse auto-hides
   - Or click "Clear Display" to dismiss early
```

### Manual Verse Entry

If auto-detection misses a verse, or the preacher asks for a specific verse off-mic:

1. Go to the **Manual Entry** section
2. Type the book name (autocomplete helps)
3. Enter chapter and verse numbers
4. Select the translation
5. Click **Send to Display**

### Re-Displaying a Verse

If the preacher returns to a verse shown earlier:

1. Scroll through the **History** section
2. Find the verse
3. Click **Redisplay**

---

## Settings Reference

### Audio Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Microphone | Input device selection | System default |
| Speech Engine | Web Speech API or Deepgram | Web Speech API |
| Language | Speech recognition language | English (US) |

### Display Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Default Translation | Bible translation when none specified | KJV |
| Display Duration | How long a verse stays on screen (seconds) | 15 |
| Theme | Visual theme for the overlay | Dark |
| Font Size | Text size on the overlay | Auto |
| Animation | Transition style (fade, slide, instant) | Fade |

### OBS Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Host | OBS machine address | localhost |
| Port | OBS WebSocket port | 4455 |
| Password | OBS WebSocket password | — |
| Auto Show/Hide | Automatically toggle source visibility | On |
| Scene Switching | Switch OBS scenes on verse display | Off |
| Verse Source Name | Name of the Browser Source in OBS | Lumen Verse Overlay |

### Detection Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Mode | Auto / Approve / Manual | Approve |
| Confidence Threshold | Minimum confidence for auto-display | 0.80 |
| Dedup Window | Seconds before the same verse can re-trigger | 30 |
| Translation Detection Window | Seconds to look for translation keywords | 5 |

---

## Tips for Best Results

### Microphone Placement

- **Best:** A dedicated microphone on the podium or a lapel/headset mic on the preacher
- **Good:** A room microphone that clearly picks up the preacher
- **Avoid:** Laptop microphone at the tech booth (too far, too much ambient noise)

### Preacher Tips

The system works best when the preacher:
- Says the full book name (not just abbreviations)
- Pauses slightly before and after verse references
- Says "chapter" and "verse" explicitly when possible
- Names the translation clearly when requesting a specific one

### Audio Quality

- Reduce ambient noise (air conditioning, fans) if possible
- Use a directional microphone pointed at the preacher
- Audio interface with gain control is ideal
- Test the speech recognition in the actual room before the service

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Approve detected verse (when Verse Preview is focused) |
| `Escape` | Dismiss detected verse / Clear display |
| `Ctrl+M` | Toggle microphone on/off |
| `Ctrl+Enter` | Send manual entry to display |
| `Ctrl+H` | Toggle history panel |
| `Ctrl+,` | Open settings |
| `F11` | Toggle fullscreen (operator panel) |
