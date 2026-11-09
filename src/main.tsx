import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isFirebaseConfigured } from './lib/firebase'
import { SetupNeeded } from './pages/SetupNeeded'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isFirebaseConfigured ? <App /> : <SetupNeeded />}</StrictMode>,
)
