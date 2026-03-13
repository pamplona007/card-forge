import type { ThemeProps } from '@radix-ui/themes';

import { createContext } from 'react';

interface ThemeContextValue {
    appearance: ThemeProps['appearance'];
    toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({ appearance: 'light', toggle: () => {} });
