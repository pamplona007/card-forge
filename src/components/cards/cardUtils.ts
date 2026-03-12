/** Describes a single font face to be loaded via the FontFace API. */
export interface FontSpec {
    family: string;
    /** @default 'normal' */
    style?: string;
    /** Font URL, absolute or relative to the public root. */
    url: string;
    weight: string;
    /** CSS font string used to verify the font is ready, e.g. `'900 1em "My Font"'` */
    weightCheck: string;
}

// ---------------------------------------------------------------------------
// Zombicide font specs — shared by all Zombicide card types
// ---------------------------------------------------------------------------

export const FONT_PIKLET_CAPS: FontSpec = {
    family: 'Piklet Caps',
    style: 'normal',
    url: '/fonts/piklet-caps-clean.otf',
    weight: '900',
    weightCheck: '900 270px "Piklet Caps"',
};

export const FONT_TITLING_GOTHIC: FontSpec = {
    family: 'Titling Gothic',
    style: 'normal',
    url: '/fonts/TITLINGGOTHICFBCOMP-MEDIUM.TTF',
    weight: '500',
    weightCheck: '500 38px "Titling Gothic"',
};

export const ZOMBICIDE_FONTS: FontSpec[] = [FONT_PIKLET_CAPS, FONT_TITLING_GOTHIC];

export const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
