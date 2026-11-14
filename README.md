# 📖 Lumen

**Real-time Bible verse display for live sermons — powered by speech recognition, integrated with OBS Studio.**

Lumen listens to a preacher in real-time and automatically displays Bible verses on screen when they're referenced. It integrates directly into your church's existing OBS Studio setup, showing verses on both the projector and livestream simultaneously.

---

## ✨ Key Features

- 🎤 **Real-time speech recognition** — Listens to the preacher and detects Bible verse references
- 🧠 **Smart detection** — Understands natural speech patterns ("turn to John chapter 3 verse 16", "Romans 8:28", "read that in the Amplified")
- 📺 **OBS Studio integration** — Displays verses as an overlay in your existing OBS scenes
- 📚 **Multiple translations** — KJV, NKJV, NIV, ESV, AMP, NLT, MSG — auto-detected from speech
- 🎛️ **Operator control panel** — Approve, dismiss, edit, or manually enter verses
- 🌐 **Works offline** — Bible database is stored locally, no internet needed during service
- 🎨 **Customizable themes** — Dark, light, or custom church branding

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Lumen
npm start
```

Then in OBS Studio:
1. Add a **Browser Source**
2. Set URL to `http://localhost:3000/overlay`
3. Set size to 1920×1080
4. Start listening in Lumen — you're ready!

## 📖 Documentation

Full documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|---|---|
| [Overview](docs/01-overview.md) | Vision, problem statement, target audience |
| [Architecture](docs/02-architecture.md) | System design, components, data flow |
| [Features](docs/03-features.md) | Detailed feature specifications |
| [Tech Stack](docs/04-tech-stack.md) | Technology choices and rationale |
| [OBS Integration](docs/05-obs-integration.md) | Complete OBS Studio setup guide |
| [Verse Detection](docs/06-verse-detection.md) | How the detection engine works |
| [Bible Database](docs/07-bible-database.md) | Database schema, translations, data sources |
| [User Guide](docs/08-user-guide.md) | Installation, setup, and usage |
| [Roadmap](docs/09-roadmap.md) | MVP scope, phases, future plans |
| [API Reference](docs/10-api-reference.md) | WebSocket, overlay endpoints, IPC |

## 🛠️ Tech Stack

- **Electron** — Desktop application framework
- **React + TypeScript** — Operator panel UI
- **Express + WebSocket** — Overlay server for OBS
- **obs-websocket-js** — OBS Studio control
- **SQLite** — Local Bible database
- **Web Speech API / Deepgram** — Speech-to-text

## 📄 License

MIT
