import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import App from './App.tsx';
import '@radix-ui/themes/styles.css';

import './index.css';
import i18n from './i18n';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 1000 * 60 * 5,
        },
    },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
                <App />
            </I18nextProvider>
        </QueryClientProvider>
    </StrictMode>,
);
