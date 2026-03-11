import { Theme } from '@radix-ui/themes/components/index';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import ToastProvider from './components/ToastProvider';
import { FirebaseProvider } from './contexts/FirebaseContext';
import CardEditorPage from './pages/CardEditorPage';
import GameProjectsPage from './pages/GameProjectsPage';
import GameSelectionPage from './pages/GameSelectionPage';
import LikedProjectsPage from './pages/LikedProjectsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
    return (
        <Theme>
            <FirebaseProvider>
                <BrowserRouter>
                    <ToastProvider />
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
            <Route element={<LikedProjectsPage />} path="/liked" />
            <Route element={<ProfilePage />} path="/profile" />
        </Routes>
    );
}

export default App;
