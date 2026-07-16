import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const uniqueKey = Date.now().toString();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App key={uniqueKey} />
  </StrictMode>,
);
