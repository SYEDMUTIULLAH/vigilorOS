import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HospitalProvider } from './context/HospitalContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HospitalProvider>
      <App />
    </HospitalProvider>
  </StrictMode>,
);

