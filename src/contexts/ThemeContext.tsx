import { createContext, useContext, useState, type ReactNode } from 'react';

type Appearance = 'light' | 'dark';

interface ThemeContextValue {
    appearance: Appearance;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ appearance: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [appearance, setAppearance] = useState<Appearance>('light');
    const toggle = () => setAppearance((a) => (a === 'light' ? 'dark' : 'light'));

    return <ThemeContext.Provider value={{ appearance, toggle }}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);
