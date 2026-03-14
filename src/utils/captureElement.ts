import { type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

export interface CaptureOptions {
    /** Extra ms to wait after mounting before polling for canvas content */
    mountDelay?: number;
    /** Max ms to poll for a non-empty canvas before rejecting */
    timeout?: number;
}

/**
 * Poll a container for a canvas element that has been drawn into.
 * Returns the first canvas whose pixel data contains at least one non-zero byte.
 */
const waitForCanvasContent = (
    container: HTMLDivElement,
    timeout: number,
): Promise<HTMLCanvasElement> => new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
        const canvas = container.querySelector('canvas');

        if (!canvas) {
            setTimeout(check, 100);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        const hasContent = ctx
            .getImageData(0, 0, canvas.width, canvas.height)
            .data.some((byte) => 0 !== byte);

        const hasLoaded = 'false' === canvas.dataset.loading;

        if (hasContent && hasLoaded) {
            resolve(canvas);
            return;
        }

        if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for canvas content'));
            return;
        }

        setTimeout(check, 100);
    };

    setTimeout(check, 100);
});

/**
 * Render a React element off-screen, wait for its canvas to be drawn, and
 * return the canvas as a PNG data URL.
 *
 * Works with any component that renders a `<canvas>` — no game-specific
 * knowledge required.
 */
export async function captureReactElement(
    element: ReactElement,
    options: CaptureOptions = {},
): Promise<string> {
    const { mountDelay = 100, timeout = 10000 } = options;

    const container = document.createElement('div');
    container.style.cssText =
        'position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden';
    document.body.appendChild(container);

    let root: Root | undefined;
    try {
        root = createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(element);
            setTimeout(resolve, mountDelay);
        });

        const canvas = await waitForCanvasContent(container, timeout);
        return canvas.toDataURL('image/png');
    } finally {
        root?.unmount();
        container.parentNode?.removeChild(container);
    }
}
