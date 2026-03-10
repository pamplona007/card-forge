import { Theme } from '@radix-ui/themes/components/index';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { FirebaseProvider } from './contexts/FirebaseContext';
import CardEditorPage from './pages/CardEditorPage';
import GameProjectsPage from './pages/GameProjectsPage';
import GameSelectionPage from './pages/GameSelectionPage';

function App() {
    return (
        <Theme>
            <FirebaseProvider>
                <BrowserRouter>
                    <AppContent />
                </BrowserRouter>
            </FirebaseProvider>
        </Theme>
    );
}

function AppContent() {
    return (
        <Routes>
            <Route element={<GameSelectionPage />} path="/" />
            <Route element={<GameProjectsPage />} path="/game/:gameId" />
            <Route element={<CardEditorPage />} path="/project/:projectId" />
        </Routes>
    );
}

export default App;
