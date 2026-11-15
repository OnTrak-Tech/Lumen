import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { TranscriptResult } from './deepgram-engine';

/**
 * Whisper.cpp local fallback engine.
 * Expects whisper-cpp to be installed and accessible via the WHISPER_BIN path.
 * Emits: 'transcript', 'error', 'ready', 'unavailable'
 */
export class WhisperEngine extends EventEmitter {
  private process: ChildProcess | null = null;
  private isReady = false;
  private audioBuffer: Buffer[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  // Common install locations for whisper.cpp binary
  private static readonly WHISPER_BIN_CANDIDATES = [
    process.env.WHISPER_BIN,
    '/usr/local/bin/whisper-cpp',
    '/usr/bin/whisper-cpp',
    './whisper.cpp/main',
  ].filter(Boolean) as string[];

  private static readonly MODEL_CANDIDATES = [
    process.env.WHISPER_MODEL,
    './whisper.cpp/models/ggml-small.en.bin',
    './whisper.cpp/models/ggml-base.en.bin',
    '/usr/local/share/whisper/ggml-small.en.bin',
  ].filter(Boolean) as string[];

  get ready() {
    return this.isReady;
  }

  /**
   * Check if whisper.cpp binary and model are available on this machine.
   */
  static isAvailable(): boolean {
    return WhisperEngine.WHISPER_BIN_CANDIDATES.some(existsSync) &&
           WhisperEngine.MODEL_CANDIDATES.some(existsSync);
  }

  start() {
    const bin = WhisperEngine.WHISPER_BIN_CANDIDATES.find(existsSync);
    const model = WhisperEngine.MODEL_CANDIDATES.find(existsSync);

    if (!bin || !model) {
      this.emit('unavailable', 'whisper.cpp binary or model not found — offline fallback unavailable');
      return;
    }

    // Run whisper in streaming mode: reads raw 16kHz mono PCM from stdin
    this.process = spawn(bin, [
      '--model', model,
      '--language', 'en',
      '--no-timestamps',
      '--stream',
      '-',           // read audio from stdin
    ]);

    this.process.stdout?.on('data', (data: Buffer) => {
      const text = data.toString().trim();
      if (text) {
        this.emit('transcript', {
          text,
          isFinal: true,
          timestamp: Date.now(),
        } as TranscriptResult);
      }
    });

    this.process.stderr?.on('data', () => {
      // whisper.cpp writes progress to stderr — suppress
    });

    this.process.on('spawn', () => {
      this.isReady = true;
      this.emit('ready');
    });

    this.process.on('error', (err) => {
      this.isReady = false;
      this.emit('error', err);
    });

    this.process.on('close', () => {
      this.isReady = false;
    });
  }

  sendAudio(chunk: Buffer) {
    if (!this.isReady || !this.process?.stdin) return;

    // Buffer chunks and flush every 2s to give whisper enough audio context
    this.audioBuffer.push(chunk);

    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      if (this.audioBuffer.length > 0 && this.process?.stdin) {
        this.process.stdin.write(Buffer.concat(this.audioBuffer));
        this.audioBuffer = [];
      }
    }, 2000);
  }

  stop() {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.process?.kill();
    this.process = null;
    this.isReady = false;
  }
}
