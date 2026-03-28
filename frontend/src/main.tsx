import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import { AuthProvider } from './store/AuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
                <Toaster
                    position="top-center"
                    toastOptions={{
                        style: {
                            background: '#1a1d28',
                            color: '#f0f2ff',
                            border: '1px solid #2a2d3e',
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
