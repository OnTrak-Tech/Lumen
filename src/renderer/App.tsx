import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CheckCircle, XCircle, RotateCcw, Volume2, Clock, Image, Video, Sparkles, Trash2 } from 'lucide-react';
import { VerseDetector } from '../core/detector/verse-detector';
import { DetectedVerse } from '../core/detector/types';
import { fetchVerse, VerseData } from '../core/bible/provider';

interface HistoryItem extends VerseData {
  time: string;
}

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [finalizedSpeech, setFinalizedSpeech] = useState<string>('');
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [mode, setMode] = useState<'approve' | 'auto' | 'manual'>('approve');
  const [detectedVerse, setDetectedVerse] = useState<DetectedVerse | null>(null);
  const [versePreview, setVersePreview] = useState<VerseData | null>(null);

  // Active Stage LED Wall state
  const [activeStageVerse, setActiveStageVerse] = useState<VerseData | null>(null);
  const [stageElapsedSeconds, setStageElapsedSeconds] = useState(0);
  const [idleMode, setIdleMode] = useState<'graphic' | 'motion'>('graphic');
  const [sermonGraphicUrl, setSermonGraphicUrl] = useState('/images/default-sermon.svg');
  const [motionLoopUrl, setMotionLoopUrl] = useState('');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [testSpeechInput, setTestSpeechInput] = useState('');
  const [defaultTranslation, setDefaultTranslation] = useState('KJV');

  const detectorRef = useRef<VerseDetector>(new VerseDetector());
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const speechClearTimerRef = useRef<any>(null);

  const STAGE_MAX_SECONDS = 300; // 5 minutes max on LED wall
  const SPEECH_AUTO_CLEAR_MS = 20000; // 20 seconds auto-clear for speech monitor

  // Active timer ticker for Stage LED Wall
  useEffect(() => {
    if (activeStageVerse) {
      setStageElapsedSeconds(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = setInterval(() => {
        setStageElapsedSeconds((prev) => {
          if (prev >= STAGE_MAX_SECONDS) {
            clearStageDisplay();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setStageElapsedSeconds(0);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeStageVerse]);

  // Clean up speech clear timer on unmount
  useEffect(() => {
    return () => {
      if (speechClearTimerRef.current) {
        clearTimeout(speechClearTimerRef.current);
      }
    };
  }, []);

  const resetSpeechClearTimer = () => {
    if (speechClearTimerRef.current) {
      clearTimeout(speechClearTimerRef.current);
    }
    speechClearTimerRef.current = setTimeout(() => {
      setFinalizedSpeech('');
      setInterimSpeech('');
    }, SPEECH_AUTO_CLEAR_MS);
  };

  // Setup Web Speech API if supported in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        resetSpeechClearTimer();
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            const finalChunk = res[0].transcript.trim();
            if (finalChunk) {
              processSpeechChunk(finalChunk, true);
            }
          } else {
            currentInterim += res[0].transcript;
          }
        }

        // Update real-time interim speech without duplicating
        setInterimSpeech(currentInterim.trim());

        // Check interim text for instant detection before sentence ends
        if (currentInterim.trim()) {
          checkVerseDetection(currentInterim.trim());
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            // restarting
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, [isListening, mode, defaultTranslation]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not available on this browser. Use the speech simulator input below to test live phrases!');
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

  const processSpeechChunk = (text: string, isFinalChunk = true) => {
    resetSpeechClearTimer();

    if (isFinalChunk) {
      setFinalizedSpeech((prev) => {
        const combined = (prev ? prev + ' ' : '') + text;
        const words = combined.split(/\s+/).filter(Boolean);
        return words.slice(-25).join(' '); // Keep clean rolling window of last 25 words
      });
      setInterimSpeech('');
    }

    checkVerseDetection(text);
  };

  const checkVerseDetection = async (text: string) => {
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

        // In Auto mode, automatically send directly to Stage LED wall
        if (mode === 'auto') {
          sendToStage(verseData);
        }
      }
    }
  };

  const sendToStage = async (verse: VerseData) => {
    try {
      await fetch('http://localhost:3000/api/stage/display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: verse.reference,
          translation: verse.translation,
          text: verse.text,
          duration: STAGE_MAX_SECONDS * 1000
        })
      });

      // Also notify lower-third endpoint for backwards compatibility
      fetch('http://localhost:3000/api/display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: verse.reference,
          translation: verse.translation,
          text: verse.text
        })
      }).catch(() => {});

      setActiveStageVerse(verse);

      // Add to compact history with time
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory((prev) => [
        { ...verse, time: timeStr },
        ...prev.filter((v) => v.reference !== verse.reference).slice(0, 24)
      ]);
    } catch (err) {
      console.warn('Failed to reach local server:', err);
      setActiveStageVerse(verse);
    }
  };

  const clearStageDisplay = async () => {
    try {
      await fetch('http://localhost:3000/api/stage/clear', { method: 'POST' });
      await fetch('http://localhost:3000/api/clear', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setActiveStageVerse(null);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleUpdateConfig = async (newIdleMode?: 'graphic' | 'motion', newGraphicUrl?: string, newMotionUrl?: string) => {
    const updatedIdleMode = newIdleMode !== undefined ? newIdleMode : idleMode;
    const updatedGraphic = newGraphicUrl !== undefined ? newGraphicUrl : sermonGraphicUrl;
    const updatedMotion = newMotionUrl !== undefined ? newMotionUrl : motionLoopUrl;

    if (newIdleMode) setIdleMode(newIdleMode);
    if (newGraphicUrl !== undefined) setSermonGraphicUrl(newGraphicUrl);
    if (newMotionUrl !== undefined) setMotionLoopUrl(newMotionUrl);

    try {
      await fetch('http://localhost:3000/api/stage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idleMode: updatedIdleMode,
          idleGraphicUrl: updatedGraphic,
          motionLoopUrl: updatedMotion
        })
      });
    } catch (e) {
      console.warn('Failed to update stage config:', e);
    }
  };

  const handleSimulateSpeech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSpeechInput.trim()) return;
    processSpeechChunk(testSpeechInput.trim(), true);
    setTestSpeechInput('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Full clean speech display (finalized words + active interim words)
  const currentLiveSpeech = `${finalizedSpeech} ${interimSpeech}`.trim();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
              Lumen 
            </h1>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center gap-6 text-sm">
          {/* Mic Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                isListening
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              {isListening ? 'Listening Live' : 'Start Mic'}
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Mode:</span>
            <div className="inline-flex rounded-lg bg-slate-800/90 p-0.5 border border-slate-700/80 text-xs">
              {(['auto', 'manual'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-md capitalize transition ${
                    mode === m ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Default Translation */}
          {/* <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Default:</span>
            <select
              value={defaultTranslation}
              onChange={(e) => setDefaultTranslation(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              {['KJV', 'AMP', 'NIV', 'ESV', 'NKJV', 'NLT', 'MSG', 'NASB', 'CSB'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div> */}
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full items-start">
        {/* Left Column: Live Speech Monitor (Auto-clears after 20s of silence) */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Live Speech Monitor
              </h2>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
                <span className="text-[11px] text-slate-400">{isListening ? 'Live Stream' : 'Standby'}</span>
              </div>
            </div>

            {/* Speech Monitor Box */}
            <div className="min-h-[160px] max-h-[220px] overflow-hidden p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col justify-end">
              {currentLiveSpeech ? (
                <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                  <span className="text-slate-500 mr-2 text-xs">...</span>
                  {finalizedSpeech} {interimSpeech && <span className="text-amber-400/90">{interimSpeech}</span>}
                </p>
              ) : (
                <p className="text-slate-500 italic text-xs text-center py-8">
                  {isListening ? 'Listening to preacher in real-time...' : 'Microphone is standby. Click "Start Mic" or test below.'}
                </p>
              )}
            </div>

            {/* Speech Test Simulator */}
            <form onSubmit={handleSimulateSpeech} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder='Type to test: "Matthew 1:1 Amplified"'
                value={testSpeechInput}
                onChange={(e) => setTestSpeechInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="submit"
                className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                Speak
              </button>
            </form>
          </div>

          {/* Stage Media Canvas Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              Stage LED Canvas Mode
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1.5 text-[11px]">Idle Backdrop (When No Verse is Live):</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handleUpdateConfig('graphic')}
                    className={`py-1.5 px-2 rounded font-medium flex items-center justify-center gap-1.5 transition text-xs ${
                      idleMode === 'graphic' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Image className="w-3.5 h-3.5" /> Sermon Slide
                  </button>
                  <button
                    onClick={() => handleUpdateConfig('motion')}
                    className={`py-1.5 px-2 rounded font-medium flex items-center justify-center gap-1.5 transition text-xs ${
                      idleMode === 'motion' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Motion Loop
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Custom Video Motion Loop URL (Optional):</label>
                <input
                  type="text"
                  placeholder="URL to MP4 / WebM video loop"
                  value={motionLoopUrl}
                  onChange={(e) => handleUpdateConfig(undefined, undefined, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Center Column: Live Stage Card & Approval Queue */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* LIVE ON STAGE LED WALL CARD */}
          <div className={`border rounded-xl p-5 transition-all duration-300 ${
            activeStageVerse ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/20' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeStageVerse ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                {activeStageVerse ? (
                  <span className="text-emerald-400">Live on Stage LED Wall</span>
                ) : (
                  <span className="text-slate-400">Stage Wall Idle (Sermon Graphic)</span>
                )}
              </span>

              {activeStageVerse && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-mono text-xs text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimer(stageElapsedSeconds)}</span>
                    <span className="text-slate-500">/ 05:00 max</span>
                  </div>

                  <button
                    onClick={clearStageDisplay}
                    className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-2.5 py-1 rounded font-semibold transition"
                  >
                    Clear Stage
                  </button>
                </div>
              )}
            </div>

            {/* Progress bar towards 5-minute safety ceiling */}
            {activeStageVerse && (
              <div className="w-full bg-slate-800 h-1 rounded-full mb-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-1000"
                  style={{ width: `${(stageElapsedSeconds / STAGE_MAX_SECONDS) * 100}%` }}
                ></div>
              </div>
            )}

            {activeStageVerse ? (
              <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="font-black text-amber-400 text-lg tracking-wide uppercase">{activeStageVerse.reference}</span>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeStageVerse.translation}
                  </span>
                </div>
                <p className="text-slate-100 text-sm font-sans font-semibold leading-relaxed line-clamp-4">
                  "{activeStageVerse.text}"
                </p>
              </div>
            ) : (
              <div className="py-7 flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5">
                <Image className="w-6 h-6 text-slate-600 mb-1" />
                <span>LED wall is currently showing the Sermon Graphic</span>
                <span className="text-[11px] text-slate-600">Crossfades instantly to motion background when scripture is triggered</span>
              </div>
            )}
          </div>

          {/* Pending Detected Verse Card (Approval Queue) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Detected Verse (Approval Queue)</span>
              {mode === 'auto' && (
                <span className="text-emerald-400 text-[11px] font-normal lowercase">(Auto-broadcast active)</span>
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

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-sm font-medium text-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                  "{versePreview.text}"
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => sendToStage(versePreview)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition shadow-lg shadow-amber-500/10"
                  >
                    <CheckCircle className="w-4 h-4" /> Send to Stage LED Wall
                  </button>
                  <button
                    onClick={() => {
                      setVersePreview(null);
                      setDetectedVerse(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-3 rounded-lg flex items-center justify-center text-sm transition"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs italic">
                Waiting for preacher to mention scripture (e.g. "Romans 8:28, New International Version")...
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Compact Broadcast Log (Sermon History) */}
        <section className="lg:col-span-3 flex flex-col">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sermon Log
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {history.length}
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  title="Clear history"
                  className="text-slate-500 hover:text-red-400 transition p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Compact Fixed-Height Timeline */}
            <div className="overflow-y-auto max-h-[500px] space-y-1.5 pr-1 text-xs">
              {history.length === 0 ? (
                <p className="text-slate-500 italic text-xs py-8 text-center">No verses projected yet</p>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="group bg-slate-950/70 hover:bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.time}</span>
                      <span className="font-bold text-slate-200 truncate">{item.reference}</span>
                      <span className="text-[10px] font-bold text-amber-400/90 bg-amber-500/10 px-1 py-0.2 rounded shrink-0">
                        {item.translation}
                      </span>
                    </div>

                    <button
                      onClick={() => sendToStage(item)}
                      title="Re-project to Stage LED Wall"
                      className="p-1 rounded text-slate-500 group-hover:text-amber-400 hover:bg-slate-800 transition shrink-0 ml-2"
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
