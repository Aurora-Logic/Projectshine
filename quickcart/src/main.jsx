import { createRoot } from 'react-dom/client'
import '@radix-ui/themes/styles.css'
import './index.css'
import App from './App.jsx'

// StrictMode intentionally off: its dev-only double-rendering halves perceived
// performance in demos. Re-enable when hardening for production.
createRoot(document.getElementById('root')).render(<App />)
