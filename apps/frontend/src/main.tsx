import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import { ConnectKitProvider } from 'connectkit';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          mode="dark"
          theme="midnight"
          customTheme={{
            '--ck-accent-color': '#f97316',
            '--ck-accent-text-color': '#ffffff',
            '--ck-body-background': 'rgba(10,10,10,0.92)',
            '--ck-body-color': '#e5e7eb',
            '--ck-border-color': 'rgba(249,115,22,0.35)',
            '--ck-border-radius': '16px',
            '--ck-overlay-background': 'rgba(0,0,0,0.7)',
            '--ck-shadow': '0 0 45px rgba(249,115,22,0.6)',
            '--ck-primary-button-background': '#0f0f0f',
            '--ck-primary-button-hover-background': '#141414',
            '--ck-primary-button-color': '#ffffff',
            '--ck-secondary-button-background': '#111827',
            '--ck-secondary-button-hover-background': '#1f2937',
            '--ck-secondary-button-color': '#e5e7eb',
            '--ck-danger-button-background': '#f97316',
            '--ck-danger-button-hover-background': '#fb923c',
            '--ck-danger-button-color': '#0a0a0a'
          }}
        >
          <App />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
