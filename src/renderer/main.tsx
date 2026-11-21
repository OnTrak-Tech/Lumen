import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Setup from './Setup';
import './index.css';

function Root() {
  const stored = localStorage.getItem('lumen_setup');
  const [setupDone, setSetupDone] = useState(!!stored);
  const [config, setConfig] = useState(stored ? JSON.parse(stored) : null);

  if (!setupDone) {
    return (
      <Setup onComplete={(data) => {
        setConfig(data);
        setSetupDone(true);
      }} />
    );
  }

  return <App defaultTranslation={config?.defaultTranslation ?? 'KJV'} churchName={config?.churchName ?? ''} />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
