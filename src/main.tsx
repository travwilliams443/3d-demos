import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FlashlightPanel from './FlashlightPanel.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*<App />*/}
    <FlashlightPanel />
  </StrictMode>,
)
