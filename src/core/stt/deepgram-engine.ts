import { EventEmitter } from 'events';

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

/**
 * Deepgram Nova-2 real-time streaming engine.
 * Emits: 'transcript', 'error', 'connected', 'disconnected'
 */
export class DeepgramEngine extends EventEmitter {
  private ws: any = null;
  private apiKey: string;
  private isConnected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  get connected() {
    return this.isConnected;
  }

  connect() {
    if (this.isConnected) return;

    const url =
      'wss://api.deepgram.com/v1/listen?' +
      'model=nova-2-general' +
      '&language=en-US' +
      '&punctuate=true' +
      '&interim_results=true' +
      '&utterance_end_ms=1000' +
      '&smart_format=true';

    // Use native WebSocket (available in Node 22+ and Electron)
    const socket = new WebSocket(url, {
      headers: { Authorization: `Token ${this.apiKey}` },
    } as any);

    socket.onopen = () => {
      this.isConnected = true;
      this.ws = socket;
      this.emit('connected');
    };

    socket.onmessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        const transcript = data?.channel?.alternatives?.[0]?.transcript;
        if (transcript) {
          this.emit('transcript', {
            text: transcript,
            isFinal: data.is_final ?? false,
            timestamp: Date.now(),
          } as TranscriptResult);
        }
      } catch {
        // malformed frame — ignore
      }
    };

    socket.onerror = (err: any) => {
      this.emit('error', err);
    };

    socket.onclose = () => {
      this.isConnected = false;
      this.ws = null;
      this.emit('disconnected');
    };
  }

  sendAudio(chunk: Buffer) {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }
}
