# 05 — OBS Studio Integration

## Overview

Lumen integrates with OBS Studio using two complementary methods:

1. **Browser Source** — OBS loads Lumen's overlay page as a visual layer in the scene
2. **WebSocket API** — Lumen controls OBS programmatically (show/hide sources, switch scenes)

Together, these give Lumen full control over how verses appear in both the projector output and the livestream.

---

## Prerequisites

- **OBS Studio 28 or later** (WebSocket server is built-in)
- OBS WebSocket server enabled (it's on by default in OBS 28+)
- Lumen running on the same computer as OBS (or on the same local network)

---

## Setup Guide

### Step 1: Enable OBS WebSocket Server

1. Open OBS Studio
2. Go to **Tools → WebSocket Server Settings**
3. Ensure **Enable WebSocket Server** is checked
4. Note the **Server Port** (default: `4455`)
5. Set a **Server Password** (or note the auto-generated one)
6. Click **OK**

### Step 2: Add Lumen Browser Source in OBS

1. In your OBS scene, click **+** under Sources
2. Select **Browser**
3. Name it `Lumen Verse Overlay`
4. Configure:

```
URL:        http://localhost:3000/overlay
Width:      1920
Height:     1080
FPS:        30

☑ Shutdown source when not visible
☑ Refresh browser when scene becomes active
☐ Custom CSS (leave empty — Lumen handles styling)
```

5. Click **OK**
6. Position and resize the source in your scene as needed

### Step 3: Connect Lumen to OBS

1. Open Lumen's **Settings** panel
2. Under **OBS Connection**:
   - Host: `localhost` (or the OBS machine's IP if on a different computer)
   - Port: `4455`
   - Password: *(the password from Step 1)*
3. Click **Connect**
4. Status should show **Connected ✅**

---

## Overlay Endpoints

Lumen serves two overlay variants:

### `/overlay` — Lower-Third Style

Best for: overlaying on top of camera feeds during preaching.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              (camera feed visible)                │
│                                                  │
│                                                  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ ▌ John 3:16 (AMP)                         │  │
│  │                                            │  │
│  │  "For God so [greatly] loved and dearly    │  │
│  │  prized the world, that He [even] gave     │  │
│  │  His [One and] only begotten Son..."       │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Characteristics:**
- Positioned at the bottom of the screen
- Semi-transparent dark background
- White text, accent-colored verse reference
- Transparent everywhere else (composites over the scene)
- Fade-in / fade-out animations

### `/overlay-full` — Full-Screen Scripture Display

Best for: a dedicated "Scripture" scene where the verse is the focus.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│              John 3:16 (AMP)                     │
│                                                  │
│     "For God so [greatly] loved and dearly       │
│     prized the world, that He [even] gave        │
│     His [One and] only begotten Son, so that     │
│     whoever believes and trusts in Him [as       │
│     Savior] shall not perish, but have           │
│     eternal life."                               │
│                                                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Characteristics:**
- Centered vertically and horizontally
- Larger font size
- Styled background (gradient, image, or solid color based on theme)
- Text auto-scales to fit

---

## OBS WebSocket Capabilities

### Auto Show/Hide Verse Source

When a verse is approved (or auto-detected in Auto mode), Lumen sends:

```
SetSceneItemEnabled {
  sceneName: "Preaching",
  sceneItemId: <lumen-source-id>,
  sceneItemEnabled: true
}
```

When the verse is dismissed (or auto-dismissed after timeout), Lumen sends:

```
SetSceneItemEnabled {
  sceneName: "Preaching",
  sceneItemId: <lumen-source-id>,
  sceneItemEnabled: false
}
```

### Scene Switching (Optional)

If configured, Lumen can switch OBS scenes when a verse is displayed:

```
Verse detected → Switch to "Scripture" scene → Display verse → After timeout → Switch back to "Preaching" scene
```

OBS calls used:
- `SetCurrentProgramScene` — Switch the active scene
- `GetSceneList` — List available scenes for the settings dropdown
- `GetSceneItemList` — List sources in a scene to find the Lumen overlay

### Connection Management

- **Auto-reconnect** — If OBS disconnects (restart, crash), Lumen attempts to reconnect every 5 seconds
- **Graceful degradation** — If OBS is not connected, the overlay still works (Browser Source continues running)
- **Status display** — Connection status is shown in the operator panel header

---

## Recommended OBS Scene Layouts

### Basic Setup (One Scene)

```
📺 Scene: "Service"
├── 🎥 Camera (full screen)
├── 🌐 Lumen Verse Overlay (/overlay) — shown/hidden by Lumen
└── 🖼️ Church Logo (corner)
```

### Standard Setup (Two Scenes)

```
📺 Scene: "Preaching"
├── 🎥 Camera (full screen)
├── 🌐 Lumen Verse Overlay (/overlay) — lower-third
├── 🖼️ Church Logo
└── 🔤 Preacher Name Lower Third

📺 Scene: "Scripture"
├── 🖼️ Scripture Background
└── 🌐 Lumen Full Display (/overlay-full) — centered
```

### Advanced Setup (Multiple Scenes)

```
📺 Scene: "Preaching"
├── 🎥 Main Camera
├── 🌐 Lumen Overlay (/overlay)
├── 🖼️ Church Logo
└── 🔤 Lower Third

📺 Scene: "Scripture Focus"
├── 🖼️ Background
└── 🌐 Lumen Full (/overlay-full)

📺 Scene: "Worship"
├── 🎥 Wide Camera
├── 🔤 Lyrics (ProPresenter/EasyWorship source)
└── 🖼️ Church Logo

📺 Scene: "Announcements"
├── 🖼️ Announcement Slides
└── 🖼️ Church Logo
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Overlay not showing in OBS | Check that Lumen is running and the URL is `http://localhost:3000/overlay` |
| Verse text not updating | Check WebSocket connection — refresh the Browser Source in OBS |
| OBS shows "Connection Failed" in Lumen | Verify OBS WebSocket is enabled, check port and password |
| Overlay background not transparent | Ensure no Custom CSS is set in the OBS Browser Source properties |
| Text too small on projector | Adjust font size in Lumen settings, or resize the Browser Source in OBS |
| Port 3000 already in use | Change Lumen's overlay port in settings, update the OBS Browser Source URL |
| Verse appears on livestream but not projector | Check that the Browser Source is in the scene output to the projector (Fullscreen Projector) |
