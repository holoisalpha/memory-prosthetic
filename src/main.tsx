import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

// Initialize OneSignal
declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: any) => void>;
  }
}

window.OneSignalDeferred = window.OneSignalDeferred || [];
window.OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "8e471fe8-3a06-487d-9e90-e705c12f034a",
    allowLocalhostAsSecureOrigin: true,
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
