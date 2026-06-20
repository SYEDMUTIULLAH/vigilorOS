import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { HospitalProvider } from './context/HospitalContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <HospitalProvider>
        <App />
      </HospitalProvider>
    </AuthProvider>
  </StrictMode>,
);

