import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
//import FlashlightPanel from './FlashlightPanel.tsx'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/*<FlashlightPanel />*/}
  </StrictMode>,
)
