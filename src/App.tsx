import { Theme, type ThemeProps } from '@radix-ui/themes/components/index';
import { ThemeContext } from 'contexts/ThemeContext';
import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import ToastProvider from './components/ui/ToastProvider';
import { FirebaseProvider } from './firebase/context';
import GameProjectsPage from './pages/GameProjectsPage';
import GameSelectionPage from './pages/GameSelectionPage';
import ProfilePage from './pages/ProfilePage';
import ProjectPage from './pages/ProjectPage';
import UserProfilePage from './pages/UserProfilePage';

function App() {
    const [appearance, setAppearance] = useState<ThemeProps['appearance']>('light');

    const toggle = () => {
        setAppearance((prev) => ('light' === prev ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ appearance, toggle }}>
            <Theme accentColor="orange" appearance={appearance} grayColor="sand">
                <FirebaseProvider>
                    <BrowserRouter>
                        <ToastProvider />
                        <AppContent />
                    </BrowserRouter>
                </FirebaseProvider>
            </Theme>
        </ThemeContext.Provider>
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
