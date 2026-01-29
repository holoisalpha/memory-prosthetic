import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './styles.css'
import App from './App'

const CLERK_PUBLISHABLE_KEY = 'pk_test_bW9yZS1wZW5ndWluLTY0LmNsZXJrLmFjY291bnRzLmRldiQ'

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
    serviceWorkerParam: { scope: '/' },
    notifyButton: { enable: false },
  });
  console.log('OneSignal initialized');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
