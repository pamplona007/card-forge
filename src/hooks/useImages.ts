import { useCallback, useEffect, useState } from 'react';

export const useImages = <T extends Record<string, string>>(images: T) => {
    const [loaded, setLoaded] = useState(false);
    const [loadedImages, setLoadedImages] = useState<Record<keyof T, HTMLImageElement>>({} as Record<keyof T, HTMLImageElement>);

    const loadImages = useCallback(() => new Promise<Record<keyof T, HTMLImageElement>>((resolve) => {
        const loadedImages = {} as Record<keyof T, HTMLImageElement>;
        let loadedCount = 0;
        const totalImages = Object.keys(images).length;

        for (const [key, src] of Object.entries(images)) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedImages[key as keyof T] = img;
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve(loadedImages);
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load image ${key} from ${src}`);
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve(loadedImages);
                }
            };
        }
    }), [images]);

    useEffect(() => {
        loadImages().then((loaded) => {
            setLoadedImages(loaded);
            setLoaded(true);
        });
    }, [loadImages]);

    return { images: loadedImages, loaded };
};
