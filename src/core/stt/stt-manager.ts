import { EventEmitter } from 'events';
import { DeepgramEngine, TranscriptResult } from './deepgram-engine';
import { WhisperEngine } from './whisper-engine';

export type STTEngineType = 'deepgram' | 'whisper' | 'none';

interface STTManagerOptions {
  deepgramApiKey: string;
  // How long with no transcript before we consider Deepgram stalled (ms)
  stallThresholdMs?: number;
  // How many consecutive errors before switching to fallback
  errorThreshold?: number;
}

/**
 * Manages primary (Deepgram) and fallback (Whisper.cpp) STT engines.
 * Switches automatically on connection loss, errors, or stalled transcripts.
 * Emits: 'transcript', 'engine-switch', 'status'
 */
export class STTManager extends EventEmitter {
  private deepgram: DeepgramEngine;
  private whisper: WhisperEngine;
  private activeEngine: STTEngineType = 'none';
  private consecutiveErrors = 0;
  private lastTranscriptAt: number = 0;
  private stallCheckTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  private readonly stallThresholdMs: number;
  private readonly errorThreshold: number;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly MAX_RECONNECT_ATTEMPTS = 10;
  private static readonly RECONNECT_BASE_MS = 3000;

  constructor(options: STTManagerOptions) {
    super();
    this.stallThresholdMs = options.stallThresholdMs ?? 4000;
    this.errorThreshold = options.errorThreshold ?? 3;

    this.deepgram = new DeepgramEngine(options.deepgramApiKey);
    this.whisper = new WhisperEngine();

    this.wireDeepgram();
    this.wireWhisper();
  }

  get engine(): STTEngineType {
    return this.activeEngine;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Always warm-start Whisper in the background so failover is instant
    if (WhisperEngine.isAvailable()) {
      this.whisper.start();
    } else {
      this.emit('status', { engine: 'whisper', state: 'unavailable' });
    }

    // Primary: connect Deepgram
    this.deepgram.connect();

    // Stall detector — checks every 2s if Deepgram has gone silent
    this.stallCheckTimer = setInterval(() => {
      if (
        this.activeEngine === 'deepgram' &&
        this.lastTranscriptAt > 0 &&
        Date.now() - this.lastTranscriptAt > this.stallThresholdMs
      ) {
        this.switchTo('whisper', 'stalled — no transcript received');
      }
    }, 2000);
  }

  stop() {
    this.isRunning = false;
    if (this.stallCheckTimer) clearInterval(this.stallCheckTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.deepgram.disconnect();
    this.whisper.stop();
    this.activeEngine = 'none';
  }

  sendAudio(chunk: Buffer) {
    if (!this.isRunning) return;

    // Always feed both engines — Whisper needs audio to stay warm
    this.deepgram.sendAudio(chunk);
    this.whisper.sendAudio(chunk);
  }

  private wireDeepgram() {
    this.deepgram.on('connected', () => {
      this.consecutiveErrors = 0;
      this.reconnectAttempts = 0; // reset backoff on successful connect
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.emit('status', { engine: 'deepgram', state: 'connected' });

      if (this.activeEngine === 'whisper') {
        this.switchTo('deepgram', 'connection restored');
      } else {
        this.activeEngine = 'deepgram';
      }
    });

    this.deepgram.on('transcript', (result: TranscriptResult) => {
      if (this.activeEngine !== 'deepgram') return;
      this.lastTranscriptAt = Date.now();
      this.consecutiveErrors = 0;
      this.emit('transcript', result);
    });

    this.deepgram.on('error', () => {
      this.consecutiveErrors++;
      if (this.consecutiveErrors >= this.errorThreshold) {
        this.switchTo('whisper', `${this.consecutiveErrors} consecutive errors`);
      }
    });

    this.deepgram.on('disconnected', (code?: number) => {
      this.emit('status', { engine: 'deepgram', state: 'disconnected' });

      // Auth failure (4xx close codes) — stop retrying immediately
      if (code && code >= 4000 && code < 5000) {
        this.emit('status', { engine: 'deepgram', state: 'auth-error', message: 'Invalid API key — check DEEPGRAM_API_KEY in .env' });
        console.error('[STTManager] Deepgram auth error — stopping reconnect attempts');
        return;
      }

      if (this.activeEngine === 'deepgram') {
        this.switchTo('whisper', 'connection dropped');
      }

      this.scheduleReconnect();
    });
  }

  private wireWhisper() {
    this.whisper.on('ready', () => {
      this.emit('status', { engine: 'whisper', state: 'ready' });
    });

    this.whisper.on('transcript', (result: TranscriptResult) => {
      if (this.activeEngine !== 'whisper') return;
      this.emit('transcript', result);
    });

    this.whisper.on('error', (err: Error) => {
      this.emit('status', { engine: 'whisper', state: 'error', message: err.message });
    });

    this.whisper.on('unavailable', (reason: string) => {
      this.emit('status', { engine: 'whisper', state: 'unavailable', message: reason });
    });
  }

  private scheduleReconnect() {
    if (!this.isRunning) return;
    if (this.reconnectAttempts >= STTManager.MAX_RECONNECT_ATTEMPTS) {
      console.error('[STTManager] Max reconnect attempts reached — staying on Whisper fallback');
      this.emit('status', { engine: 'deepgram', state: 'failed', message: 'Max reconnect attempts reached' });
      return;
    }

    // Exponential backoff: 3s, 6s, 12s, 24s ... capped at 60s
    const delay = Math.min(STTManager.RECONNECT_BASE_MS * 2 ** this.reconnectAttempts, 60000);
    this.reconnectAttempts++;

    console.log(`[STTManager] Reconnecting Deepgram in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${STTManager.MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.isRunning) this.deepgram.connect();
    }, delay);
  }

  private switchTo(engine: STTEngineType, reason: string) {
    if (this.activeEngine === engine) return;

    const previous = this.activeEngine;
    this.activeEngine = engine;

    this.emit('engine-switch', { from: previous, to: engine, reason });
    this.emit('status', { engine, state: 'active' });

    console.log(`[STTManager] Switched ${previous} → ${engine}: ${reason}`);
  }
}
