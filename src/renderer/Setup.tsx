import React, { useState } from 'react';
import { BookOpen, Monitor, Mic, Wifi, ChevronRight, Check } from 'lucide-react';

const TRANSLATIONS = ['KJV', 'NKJV', 'NIV', 'ESV', 'AMP', 'NLT', 'MSG', 'NASB', 'CSB'];

interface SetupData {
  churchName: string;
  defaultTranslation: string;
}

interface Props {
  onComplete: (data: SetupData) => void;
}

export default function Setup({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [churchName, setChurchName] = useState('');
  const [translation, setTranslation] = useState('KJV');

  const totalSteps = 3;

  const handleFinish = () => {
    const data: SetupData = { churchName: churchName.trim() || 'My Church', defaultTranslation: translation };
    localStorage.setItem('lumen_setup', JSON.stringify(data));
    onComplete(data);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-sans">

      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Lumen</h1>
        <p className="text-gray-500 text-sm mt-1">Stage LED Engine — First-time Setup</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <React.Fragment key={i}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i + 1 < step ? 'bg-black text-white' :
              i + 1 === step ? 'bg-black text-white ring-4 ring-black/20' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-12 h-0.5 transition-all ${i + 1 < step ? 'bg-black' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step card */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to Lumen</h2>
              <p className="text-gray-500 text-sm">Let's get your church set up in 3 quick steps.</p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Mic, label: 'Listens to the preacher in real-time' },
                { icon: BookOpen, label: 'Detects Bible verse references automatically' },
                { icon: Monitor, label: 'Displays verses on your stage LED wall via OBS' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{label}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Church Name (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Grace Community Church"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-black transition"
              />
            </div>
          </div>
        )}

        {/* Step 2 — Default Translation */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Default Translation</h2>
              <p className="text-gray-500 text-sm">Choose the Bible translation your church uses most. You can change this anytime.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {TRANSLATIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTranslation(t)}
                  className={`py-2.5 rounded-lg text-sm font-bold border transition ${
                    translation === t
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <strong className="text-gray-700">Note:</strong> Verses are fetched live from bible-api.com. An internet connection is required during service.
            </div>
          </div>
        )}

        {/* Step 3 — OBS Setup */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Connect OBS Studio</h2>
              <p className="text-gray-500 text-sm">Add a Browser Source in OBS to display verses on your stage LED wall.</p>
            </div>

            <div className="space-y-3">
              {[
                { step: '1', text: 'Open OBS Studio' },
                { step: '2', text: 'Add a Browser Source to your scene' },
                { step: '3', text: 'Set the URL to http://localhost:3000/stage' },
                { step: '4', text: 'Set size to 1920 × 1080' },
                { step: '5', text: 'Click OK — you\'re ready!' },
              ].map(({ step: s, text }) => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {s}
                  </div>
                  <span className="text-sm text-gray-700">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Wifi className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500">
                Stage URL: <strong className="text-gray-900 font-mono">http://localhost:3000/stage</strong>
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="text-sm text-gray-500 hover:text-gray-900 transition font-medium"
            >
              Back
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
            >
              <Check className="w-4 h-4" /> Launch Lumen
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">You can revisit these settings anytime from the app.</p>
    </div>
  );
}
