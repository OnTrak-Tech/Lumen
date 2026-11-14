import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Tv, CheckCircle, XCircle, Send, Play, RotateCcw, Settings, Volume2 } from 'lucide-react';
import { VerseDetector } from '../core/detector/verse-detector';
import { DetectedVerse } from '../core/detector/types';
import { fetchVerse, VerseData } from '../core/bible/provider';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [mode, setMode] = useState<'approve' | 'auto' | 'manual'>('approve');
  const [detectedVerse, setDetectedVerse] = useState<DetectedVerse | null>(null);
  const [versePreview, setVersePreview] = useState<VerseData | null>(null);
  const [activeOnDisplay, setActiveOnDisplay] = useState<VerseData | null>(null);
  const [history, setHistory] = useState<VerseData[]>([]);
  const [testSpeechInput, setTestSpeechInput] = useState('');
  const [defaultTranslation, setDefaultTranslation] = useState('KJV');

  // Manual entry fields
  const [manualBook, setManualBook] = useState('John');
  const [manualChapter, setManualChapter] = useState('3');
  const [manualVerse, setManualVerse] = useState('16');
  const [manualTranslation, setManualTranslation] = useState('KJV');

  const detectorRef = useRef<VerseDetector>(new VerseDetector());
  const recognitionRef = useRef<any>(null);

  // Setup Web Speech API if supported in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript;
          }
        }

        const fullText = (finalText || interimText).trim();
        if (fullText) {
          handleIncomingTranscript(fullText);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
      };

      recognition.onend = () => {
        // Auto-restart if still marked as listening
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or restarting
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, [isListening, mode, defaultTranslation]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not available on this browser. You can use the speech simulator below to test!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleIncomingTranscript = async (text: string) => {
    setTranscript((prev) => [...prev.slice(-15), text]);

    // Feed text into verse detector
    const detected = detectorRef.current.detectInText(text);
    if (detected) {
      setDetectedVerse(detected);
      const chosenTrans = detected.translation || defaultTranslation;
      const verseData = await fetchVerse(
        detected.book,
        detected.chapter,
        detected.verseStart,
        detected.verseEnd,
        chosenTrans
      );

      if (verseData) {
        setVersePreview(verseData);

        // In Auto mode, automatically send to display without operator click
        if (mode === 'auto') {
          sendToDisplay(verseData);
        }
      }
    }
  };

  const sendToDisplay = async (verse: VerseData) => {
    try {
      await fetch('http://localhost:3000/api/display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: verse.reference,
          translation: verse.translation,
          text: verse.text,
          duration: 15000
        })
      });

      setActiveOnDisplay(verse);
      setHistory((prev) => [verse, ...prev.filter((v) => v.reference !== verse.reference).slice(0, 19)]);
    } catch (err) {
      console.warn('Failed to reach local overlay server:', err);
      setActiveOnDisplay(verse); // Update UI state regardless
    }
  };

  const clearDisplay = async () => {
    try {
      await fetch('http://localhost:3000/api/clear', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setActiveOnDisplay(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ch = parseInt(manualChapter, 10);
    const v = parseInt(manualVerse, 10);
    if (!manualBook || isNaN(ch) || isNaN(v)) return;

    const data = await fetchVerse(manualBook, ch, v, undefined, manualTranslation);
    if (data) {
      sendToDisplay(data);
    }
  };

  const handleSimulateSpeech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSpeechInput.trim()) return;
    handleIncomingTranscript(testSpeechInput);
    setTestSpeechInput('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400">
            L
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
              Lumen <span className="text-xs font-normal px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">Live Verse System</span>
            </h1>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Mic:</span>
            <button
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                isListening
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              {isListening ? 'Listening' : 'Start Mic'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Mode:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
              {(['approve', 'auto', 'manual'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-md capitalize transition ${
                    mode === m ? 'bg-amber-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Default:</span>
            <select
              value={defaultTranslation}
              onChange={(e) => setDefaultTranslation(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              {['KJV', 'AMP', 'NIV', 'ESV', 'NKJV', 'NLT', 'MSG'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Speech Transcript & Simulator */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" /> Live Transcript
              </h2>
              {isListening && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
            </div>

            <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[360px] space-y-2 text-sm text-slate-300 font-mono pr-2">
              {transcript.length === 0 ? (
                <p className="text-slate-500 italic text-xs py-4">No speech detected yet. Turn on the mic or test below...</p>
              ) : (
                transcript.map((line, i) => (
                  <div key={i} className="bg-slate-800/50 p-2 rounded border border-slate-800/80 text-xs">
                    {line}
                  </div>
                ))
              )}
            </div>

            {/* Speech Test Simulator Input */}
            <form onSubmit={handleSimulateSpeech} className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder='Try: "Turn to Matthew 1:1 give amplified"'
                value={testSpeechInput}
                onChange={(e) => setTestSpeechInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                Speak
              </button>
            </form>
          </div>

          {/* OBS Browser Source Guide Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
            <h3 className="font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Tv className="w-3.5 h-3.5 text-amber-400" /> OBS Browser Source URL
            </h3>
            <p className="mb-2">In OBS Studio, add a Browser Source with this URL:</p>
            <div className="bg-slate-950 border border-slate-800 p-2 rounded font-mono text-amber-300 select-all break-all">
              http://localhost:3000/overlay
            </div>
          </div>
        </section>

        {/* Center Column: Detected Verse & Manual Control */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Active on Screen Banner */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Live On Display
              </span>
              {activeOnDisplay && (
                <button
                  onClick={clearDisplay}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline"
                >
                  Clear Screen
                </button>
              )}
            </div>

            {activeOnDisplay ? (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-amber-400 text-base">{activeOnDisplay.reference}</span>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {activeOnDisplay.translation}
                  </span>
                </div>
                <p className="text-slate-200 text-sm italic font-serif leading-relaxed line-clamp-3">
                  "{activeOnDisplay.text}"
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs italic">
                Display is currently clear.
              </div>
            )}
          </div>

          {/* Pending / Detected Verse Approval Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Detected Verse (Review)</span>
              {mode === 'auto' && (
                <span className="text-emerald-400 text-xs font-normal lowercase">(Auto-display enabled)</span>
              )}
            </h2>

            {versePreview ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-100">{versePreview.reference}</span>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-2 py-0.5 rounded">
                      {versePreview.translation}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-serif text-sm text-slate-200 leading-relaxed max-h-40 overflow-y-auto">
                  "{versePreview.text}"
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => sendToDisplay(versePreview)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition shadow-lg shadow-amber-500/10"
                  >
                    <CheckCircle className="w-4 h-4" /> Send to Display
                  </button>
                  <button
                    onClick={() => {
                      setVersePreview(null);
                      setDetectedVerse(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 px-3 rounded-lg flex items-center justify-center text-sm transition"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                Waiting for preacher to mention a Scripture reference...
              </div>
            )}
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleManualSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Manual Quick Entry
            </h2>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Book (e.g. Romans)"
                  value={manualBook}
                  onChange={(e) => setManualBook(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Ch"
                  value={manualChapter}
                  onChange={(e) => setManualChapter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="V"
                  value={manualVerse}
                  onChange={(e) => setManualVerse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={manualTranslation}
                onChange={(e) => setManualTranslation(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                {['KJV', 'AMP', 'NIV', 'ESV', 'NKJV', 'NLT', 'MSG'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                type="submit"
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" /> Display Manual Verse
              </button>
            </div>
          </form>
        </section>

        {/* Right Column: History Timeline */}
        <section className="lg:col-span-3 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Sermon History</span>
              <span className="text-xs text-slate-500 font-normal">{history.length} verses</span>
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-1">
              {history.length === 0 ? (
                <p className="text-slate-500 italic text-xs py-4 text-center">No verses shown yet</p>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{item.reference}</div>
                      <div className="text-[10px] text-amber-400">{item.translation}</div>
                    </div>
                    <button
                      onClick={() => sendToDisplay(item)}
                      title="Redisplay on screen"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
