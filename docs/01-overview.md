# 01 — Overview

## Vision

Lumen is a real-time Bible verse display system designed for churches. When a preacher references a Bible verse during a sermon, Lumen automatically detects the reference through speech recognition and displays the full verse text on screen — on the projector, the livestream, or both.

## The Problem

During a typical church service, displaying Bible verses on screen involves:

1. **A dedicated operator** who listens carefully to the preacher
2. **Manually searching** for each verse in presentation software (ProPresenter, PowerPoint, EasyWorship)
3. **Typing or clicking** to display the verse
4. **Hoping they heard correctly** and found the right verse in time

This process is:
- **Slow** — The congregation is often waiting for the verse to appear
- **Error-prone** — The operator may mishear or look up the wrong verse
- **Labor-intensive** — Requires a trained volunteer every service
- **Stressful** — The operator is under constant pressure to keep up

## The Solution

Lumen automates this entire workflow:

1. **Microphone captures** the preacher's voice
2. **Speech-to-text engine** transcribes in real-time
3. **Verse detector** identifies Bible references in the transcript
4. **Bible database** retrieves the full verse text in the correct translation
5. **Display system** renders the verse on screen via OBS Studio

The system is smart enough to understand:
- Direct references: *"John 3:16"*
- Natural speech: *"turn to the third chapter of John, verse 16"*
- Translation requests: *"read that in the Amplified version"*
- Verse ranges: *"Romans 8:28 through 30"*

## Target Audience

### Primary Users
- **Churches with livestreams** — Already using OBS Studio, want automated verse display
- **Church tech teams** — Volunteers who operate audio/visual during services
- **Pastors and preachers** — Benefit from verses appearing on screen without coordinating with a tech team

### Church Size
- **Small churches (50–200)** — May not have a dedicated tech volunteer; auto mode is ideal
- **Medium churches (200–1000)** — Have a tech team; approve mode with an operator
- **Large churches (1000+)** — Full operator control with scene switching

## Product Principles

1. **Reliability over speed** — Better to show the right verse a second late than the wrong verse instantly
2. **Operator-friendly** — The control panel should be usable by a non-technical volunteer
3. **Church-first design** — Every decision should consider the context of a live worship service
4. **Works offline** — A church's internet may be unreliable; core features must work without it
5. **Non-intrusive** — If something goes wrong, the system should quietly stop rather than display errors on the projector
