# 03 — Features

## Feature Specifications

### F1: Real-Time Speech Recognition

**Description:** Lumen continuously listens to the microphone and produces a live transcript of the preacher's speech.

**User Stories:**
- As an operator, I want to see a live transcript of what the preacher is saying so I can verify the system is hearing correctly.
- As an operator, I want to select which microphone input to use.
- As an operator, I want to see a visual indicator that the microphone is active and picking up audio.

**Behavior:**
- Transcript appears in real-time in the operator panel
- Interim (partial) results shown in gray; final results in white
- Rolling buffer keeps the last 2 minutes of transcript visible
- Audio level meter shows input volume
- Microphone selection dropdown in settings

---

### F2: Bible Verse Reference Detection

**Description:** Lumen analyzes the live transcript and detects when the preacher references a Bible verse.

**User Stories:**
- As an operator, I want the system to detect verse references automatically so I don't have to search manually.
- As an operator, I want the system to understand different ways preachers say verse references.
- As an operator, I want to see how confident the system is about a detection.

**Detection Patterns:**

| Pattern | Example | Confidence |
|---------|---------|------------|
| `Book Chapter:Verse` | "John 3:16" | High |
| `Book Chapter:Verse-Verse` | "Romans 8:28-30" | High |
| "Book chapter X verse Y" | "John chapter 3 verse 16" | High |
| "turn to Book X:Y" | "turn to Matthew 5:3" | High |
| "in Book chapter X" | "in Genesis chapter 1" | Medium (whole chapter) |
| Ordinal numbers | "first Corinthians chapter 13" | Medium |
| Contextual | "as Paul wrote in Romans 8" | Low |

**Behavior:**
- Detection runs on every new transcript segment
- Detected verses are deduped (same verse within 30 seconds = one detection)
- Each detection includes a confidence score (0.0 – 1.0)
- Low-confidence detections are flagged for operator review

---

### F3: Translation Detection from Speech

**Description:** When the preacher specifies a Bible translation by name, Lumen automatically selects that translation for the verse display.

**User Stories:**
- As a preacher, I want to say "read that in the Amplified" and have the system display the Amplified version.
- As an operator, I want the system to fall back to the default translation when no translation is specified.

**Detection Window:** The system looks for translation keywords within **5 seconds before or after** a verse reference in the transcript.

**Supported Keywords:**

| Spoken Phrase | Maps To |
|---------------|---------|
| "King James", "KJV", "King James Version" | KJV |
| "New King James", "NKJV" | NKJV |
| "NIV", "New International", "New International Version" | NIV |
| "ESV", "English Standard", "English Standard Version" | ESV |
| "Amplified", "AMP", "Amplified Bible" | AMP |
| "New Living", "NLT", "New Living Translation" | NLT |
| "The Message", "MSG", "Message Bible" | MSG |
| "NASB", "New American Standard" | NASB |
| *(nothing detected)* | User's configured default |

---

### F4: Operator Control Panel

**Description:** A desktop window providing full control over what is displayed, with live monitoring of the system.

**User Stories:**
- As an operator, I want to approve a verse before it's displayed so I can catch errors.
- As an operator, I want to manually enter a verse reference when the auto-detection misses one.
- As an operator, I want to dismiss a verse from the display when it's no longer needed.
- As an operator, I want to re-display a previously shown verse.
- As an operator, I want to edit a detected verse before displaying it (e.g., fix the verse number).

**Panel Sections:**

1. **Status Bar** — Mic status, OBS connection status, current mode indicator
2. **Live Transcript** — Scrolling real-time transcript with highlighted detections
3. **Verse Preview** — Shows detected verse with Approve / Dismiss / Edit buttons
4. **Manual Entry** — Book, chapter, verse, translation fields with a Send button
5. **History** — List of all verses displayed during the session, with re-display option
6. **Settings** — Translation default, display mode, OBS connection, theme, font size

---

### F5: Verse Display Overlay (OBS Browser Source)

**Description:** A styled HTML page served locally that OBS loads as a Browser Source, displaying verses on screen.

**User Stories:**
- As a viewer (in church or on livestream), I want to see the Bible verse clearly on screen.
- As a tech operator, I want the verse to appear and disappear with smooth animations.
- As a pastor, I want the displayed verse to include the reference and translation name.

**Overlay Variants:**

| Endpoint | Style | Use Case |
|----------|-------|----------|
| `/overlay` | Lower-third, semi-transparent background | Over camera feed during preaching |
| `/overlay-full` | Centered, full-screen, opaque background | Dedicated scripture display scene |

**Display Layout:**
```
┌──────────────────────────────────────────────┐
│                                              │
│   (camera feed or background visible here)   │
│                                              │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  John 3:16 (AMP)                      │  │
│  │                                        │  │
│  │  "For God so [greatly] loved and       │  │
│  │  dearly prized the world, that He      │  │
│  │  [even] gave His [One and] only        │  │
│  │  begotten Son, so that whoever          │  │
│  │  believes and trusts in Him [as         │  │
│  │  Savior] shall not perish, but have     │  │
│  │  eternal life."                         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Behavior:**
- Fade-in animation when a new verse is sent
- Auto-dismiss after configurable duration (default: 15 seconds)
- Manual dismiss via operator panel
- Text auto-sizes to fit the overlay area
- Transparent background (composites over OBS scene)

---

### F6: OBS Studio Integration

**Description:** Lumen connects to OBS Studio to control sources and scenes programmatically.

**User Stories:**
- As an operator, I want Lumen to automatically show/hide the verse overlay in OBS when a verse is approved or dismissed.
- As an operator, I want to see the OBS connection status in Lumen.
- As a tech lead, I want Lumen to optionally switch OBS scenes when displaying a verse.

**Capabilities:**
- Connect to OBS WebSocket server (auto-reconnect on disconnect)
- Show/hide the verse Browser Source in the active scene
- Optionally switch to a "Scripture" scene and back
- Display OBS connection status (connected / disconnected / error)

See [OBS Integration Guide](05-obs-integration.md) for full setup instructions.

---

### F7: Offline Bible Database

**Description:** All Bible translations are stored locally in a SQLite database, enabling fully offline operation.

**User Stories:**
- As a church with unreliable internet, I want Lumen to work without an internet connection.
- As an operator, I want instant verse lookups with no loading delay.

**Specifications:**
- SQLite database bundled with the application installer
- Contains 5+ translations at launch (KJV, NKJV, NIV, ESV, AMP)
- Indexed by book + chapter + verse for sub-millisecond lookups
- Supports verse ranges
- ~50 MB total database size

See [Bible Database](07-bible-database.md) for schema details.

---

### F8: Operating Modes

**Description:** Three modes of operation to fit different church needs.

| Mode | Behavior | Best For |
|------|----------|----------|
| **Auto** | Verses are detected and displayed immediately without operator approval | Small groups, Bible studies, or when no operator is available |
| **Approve** | Verses are detected and shown to the operator for approval before display | Sunday services, conferences — accuracy matters |
| **Manual** | Speech detection is disabled; operator types verse references manually | Fallback when mic isn't available, or pre-planned services |

**Behavior:**
- Mode is selectable in the operator panel settings
- Mode can be changed during a live session
- Auto mode has a configurable confidence threshold (verses below the threshold still require approval)

---

### F9: Session History

**Description:** Lumen maintains a log of all verses displayed during a session.

**User Stories:**
- As an operator, I want to re-display a verse that was shown earlier.
- As a pastor, I want a record of all verses referenced during my sermon.
- As a church administrator, I want to export the verse history for sermon archives.

**Behavior:**
- Each displayed verse is logged with timestamp, reference, translation, and display duration
- History is shown in the operator panel with a "re-display" button
- History can be exported as a text file or JSON at the end of a session
- Session history is saved to disk and can be reviewed later
