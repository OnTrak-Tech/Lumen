# 09 — Roadmap

## Development Phases

### Phase 1: MVP — Core Functionality
**Goal:** A working end-to-end system that can detect verse references and display them in OBS.

**Timeline:** 4–6 weeks

#### Milestones

##### M1: Project Foundation (Week 1)
- [ ] Electron project setup with TypeScript, React, Vite
- [ ] Project structure (main process, renderer, overlay, core)
- [ ] Development tooling (ESLint, Prettier, hot reload)
- [ ] Basic window management (operator panel)

##### M2: Bible Database (Week 1–2)
- [ ] SQLite schema creation and initialization
- [ ] KJV data import (public domain)
- [ ] Book aliases table population
- [ ] Data access layer (getVerse, getVerseRange, resolveBookName)
- [ ] Unit tests for database queries

##### M3: Speech Recognition (Week 2)
- [ ] Web Speech API integration in renderer process
- [ ] Microphone selection
- [ ] Real-time transcript streaming via IPC to main process
- [ ] Audio level indicator
- [ ] Start/stop controls

##### M4: Verse Detection Engine (Week 2–3)
- [ ] Text buffer (rolling 30-second window)
- [ ] Text normalizer (lowercase, number words, filler removal)
- [ ] Regex-based reference matcher (patterns A–D)
- [ ] Book name resolver with alias lookup
- [ ] Translation keyword detector
- [ ] Deduplicator
- [ ] Confidence scoring
- [ ] Unit tests for all detection patterns

##### M5: Operator Panel UI (Week 3–4)
- [ ] Live transcript view
- [ ] Verse preview with Approve / Dismiss / Edit buttons
- [ ] Manual verse entry form
- [ ] Session history with re-display
- [ ] Settings panel
- [ ] Status bar (mic, OBS connection)

##### M6: OBS Integration (Week 4–5)
- [ ] Overlay server (Express + WebSocket on localhost:3000)
- [ ] Lower-third overlay page (`/overlay`)
- [ ] Full-screen overlay page (`/overlay-full`)
- [ ] OBS WebSocket connection (obs-websocket-js)
- [ ] Auto show/hide verse source
- [ ] Connection status display

##### M7: Polish & Testing (Week 5–6)
- [ ] End-to-end testing with real speech
- [ ] Overlay animations (fade in/out)
- [ ] Theme support (dark, light)
- [ ] Error handling and graceful degradation
- [ ] Packaging with electron-builder (Windows, macOS, Linux)
- [ ] README and basic user documentation

**MVP Deliverable:** A downloadable desktop app that listens to a microphone, detects Bible verse references, and displays them in OBS via Browser Source.

---

### Phase 2: Accuracy & Polish
**Goal:** Improve detection accuracy, add more translations, and enhance the user experience.

**Timeline:** 4–6 weeks after MVP

#### Features

- [ ] **Deepgram / Whisper integration** — Upgrade speech-to-text for better accuracy in noisy church environments
- [ ] **Additional translations** — NKJV, NIV, ESV, AMP, NLT, MSG, NASB
- [ ] **Custom themes** — Upload church logo, set custom colors and background images
- [ ] **Font customization** — Font family, size, weight, color selection
- [ ] **Verse comparison view** — Show same verse in two translations side by side on the overlay
- [ ] **Auto-text sizing** — Dynamically scale text to fit overlay area based on verse length
- [ ] **Settings persistence** — Save/load all settings between sessions
- [ ] **Session export** — Export verse history as a text file, JSON, or CSV

---

### Phase 3: Advanced Features
**Goal:** Add intelligent features, remote control, and integrations.

**Timeline:** Ongoing

#### Planned Features

- [ ] **AI-powered detection** — Use a local LLM (or API) to understand contextual verse references ("as Paul wrote about love" → 1 Corinthians 13)
- [ ] **Sermon prep mode** — Pre-load expected verses from sermon notes; system prioritizes matching these
- [ ] **Remote operator control** — Phone/tablet browser connects to Lumen for remote control
- [ ] **Scene auto-switching** — Automatically switch between "Preaching" and "Scripture" OBS scenes
- [ ] **Multi-language** — Bible text and detection in Spanish, Portuguese, French, etc.
- [ ] **Recording & playback** — Record the session (transcript + verses + timestamps) for sermon archives
- [ ] **ProPresenter integration** — Send verses to ProPresenter in addition to or instead of OBS
- [ ] **EasyWorship integration** — Support for EasyWorship display software
- [ ] **NDI output** — Send verse display as an NDI source for advanced AV setups
- [ ] **Cloud sync** — Sync settings, themes, and preferences across multiple church computers
- [ ] **Analytics** — Track most-referenced verses, sermon duration, and verse frequency

---

## Version Plan

| Version | Codename | Focus | Key Feature |
|---------|----------|-------|-------------|
| 0.1.0 | — | MVP | End-to-end verse detection and OBS display |
| 0.2.0 | — | Accuracy | Deepgram integration, more translations |
| 0.3.0 | — | Customization | Themes, fonts, verse comparison |
| 0.4.0 | — | Remote | Phone/tablet operator control |
| 0.5.0 | — | Intelligence | AI-powered verse detection |
| 1.0.0 | — | Stable | Production-ready release |

---

## Success Metrics

### MVP Success Criteria
- ✅ Detects ≥ 80% of clearly spoken verse references (direct format)
- ✅ Displays verse on OBS within 3 seconds of detection
- ✅ False positive rate < 10%
- ✅ Works for a full 60-minute sermon without crashes
- ✅ Operator can approve/dismiss/manually enter verses

### Phase 2 Success Criteria
- ✅ Detection rate ≥ 90% (including natural speech patterns)
- ✅ Works in typical church audio environments (reverb, background noise)
- ✅ Supports 5+ translations with speech-based switching
- ✅ Used successfully in 3+ real church services

### Phase 3 Success Criteria
- ✅ Detection rate ≥ 95% with AI-powered detection
- ✅ Remote control working reliably over WiFi
- ✅ Positive feedback from non-technical church volunteers
