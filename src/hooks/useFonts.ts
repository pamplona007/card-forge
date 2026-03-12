import { useEffect, useState } from 'react';

import type { FontSpec } from '../components/canvas/cardUtils';

// Module-level cache: font key → promise of success boolean.
// Shared across all component instances so the same font is never loaded twice.
const fontCache = new Map<string, Promise<boolean>>();

const fontKey = (spec: FontSpec) => `${spec.family}::${spec.url}::${spec.weight}::${spec.style ?? 'normal'}`;

const loadFont = (spec: FontSpec): Promise<boolean> => {
    const key = fontKey(spec);

    const cached = fontCache.get(key);
    if (cached) {
        return cached;
    }

    const promise = (async () => {
        let loaded = false;

        try {
            const face = new FontFace(spec.family, `url(${spec.url})`, {
                display: 'block',
                style: spec.style ?? 'normal',
                weight: spec.weight,
            });
            await face.load();
            document.fonts.add(face);
            loaded = true;
        } catch (err) {
            console.warn(`Failed to load font "${spec.family}" from ${spec.url}`, err);
        }

        try {
            await document.fonts.ready;
            await document.fonts.load(spec.weightCheck);
        } catch (err) {
            console.warn(`Font ready check failed for "${spec.family}"`, err);
        }

        const check =
            document.fonts.check(spec.weightCheck) ||
            document.fonts.check(`1em "${spec.family}"`);

        return loaded || check;
    })();

    fontCache.set(key, promise);
    return promise;
};

/**
 * Loads a list of fonts (deduplicated via a module-level cache) and returns
 * `true` once all of them have settled.  Components that share the same font
 * specs will reuse the already-running or already-resolved promise.
 */
const useFonts = (fonts: FontSpec[]): boolean => {
    const [loaded, setLoaded] = useState(() => {
        // Synchronously resolve if every font is already in the cache
        // and its promise has already settled — avoids a flash for cards
        // that have been rendered before on the same page.
        return fonts.every((spec) => {
            const cached = fontCache.get(fontKey(spec));
            if (!cached) {
                return false;
            }
            // Inspect promise state — will be synchronously true only if
            // we stored the resolved value alongside the promise.
            return resolvedCache.has(fontKey(spec));
        });
    });

    useEffect(() => {
        if (loaded) {
            return;
        }

        let cancelled = false;

        Promise.all(fonts.map(loadFont)).then((results) => {
            // Record which ones resolved successfully for sync initialisation
            fonts.forEach((spec, i) => {
                if (results[i]) {
                    resolvedCache.add(fontKey(spec));
                }
            });

            if (!cancelled) {
                setLoaded(true);
            }
        });

        return () => {
            cancelled = true;
        };
        // Font specs are module-level constants — safe to run once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return loaded;
};

// Tracks which font keys have already resolved, for sync initialisation.
const resolvedCache = new Set<string>();

export default useFonts;
