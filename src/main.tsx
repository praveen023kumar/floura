// File Path: /src/main.tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== "undefined") {
  (window as any).handleOpenURL = (url: string) => {
    setTimeout(() => {
      const event = new CustomEvent("handleOpenURL", { detail: url });
      window.dispatchEvent(event);
    }, 0);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
