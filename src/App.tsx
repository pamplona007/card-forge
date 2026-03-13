import { Theme } from '@radix-ui/themes/components/index';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import ToastProvider from './components/ui/ToastProvider';
import { ThemeProvider, useAppTheme } from './contexts/ThemeContext';
import { FirebaseProvider } from './firebase/context';
import GameProjectsPage from './pages/GameProjectsPage';
import GameSelectionPage from './pages/GameSelectionPage';
import ProfilePage from './pages/ProfilePage';
import ProjectPage from './pages/ProjectPage';
import UserProfilePage from './pages/UserProfilePage';

function App() {
    return (
        <ThemeProvider>
            <ThemedApp />
        </ThemeProvider>
    );
}

function ThemedApp() {
    const { appearance } = useAppTheme();
    return (
        <Theme accentColor="orange" appearance={appearance} grayColor="sand">
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
            <Route element={<ProjectPage />} path="/project/:projectId" />
            <Route element={<UserProfilePage />} path="/user/:userId" />
            <Route element={<ProfilePage />} path="/profile" />
        </Routes>
    );
}

export default App;
