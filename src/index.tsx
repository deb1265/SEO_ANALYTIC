import '@fortawesome/fontawesome-free/css/all.min.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import LegacyAudit from './LegacyAudit';
const EntryApp = import.meta.env.MODE === 'static' ? LegacyAudit : App;

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <EntryApp />
    </React.StrictMode>
  );
}
