import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Suppress Google Maps Deprecation Warnings to clean up console
const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args) => {
  if (args[0]?.includes?.('google.maps.Marker is deprecated')) return;
  if (args[0]?.includes?.('google.maps.places.Autocomplete')) return;
  originalWarn(...args);
};
console.error = (...args) => {
  if (args[0]?.includes?.('google.maps.Marker is deprecated')) return;
  if (args[0]?.includes?.('google.maps.places.Autocomplete')) return;
  originalError(...args);
};

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
