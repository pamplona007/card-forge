import type { ZombicideCardData } from 'components/editors/zombicide/ZombicideCardEditor';
import type { SurvivorCardData } from 'types/zombicide-card';

import SurvivorCardBack from 'components/cards/zombicide/SurvivorCardBack';
import SurvivorCardFront from 'components/cards/zombicide/SurvivorCardFront';
import { createRoot, type Root } from 'react-dom/client';

interface CardCaptureOptions {
    scale?: number;
    showBleed?: boolean;
    side?: 'back' | 'front';
}

/**
 * Wait for images to be loaded by checking if the canvas has content
 */
const waitForCanvasContent = (
    canvas: HTMLCanvasElement,
    timeout: number = 10000,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkContent = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasContent = imageData.data.some((pixel) => 0 !== pixel);

            if (hasContent) {
                resolve();
                return;
            }

            if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout waiting for canvas content'));
                return;
            }

            setTimeout(checkContent, 100);
        };

        checkContent();
    });
};

/**
 * Capture a canvas-based survivor card (front or back)
 */
export async function captureSurvivorCard(
    card: ZombicideCardData,
    options: CardCaptureOptions = {},
): Promise<string> {
    const { showBleed = true, side = 'front' } = options;

    const isBack = 'back' === side;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    let root: Root | undefined;
    let cleanup: (() => void) | undefined;

    try {
        root = createRoot(container);
        const promise = new Promise<void>((resolve) => {
            if (root) {
                root.render(
                    isBack
                        ? (
                            <SurvivorCardBack
                                bleed={showBleed}
                                card={card as SurvivorCardData}
                                exportMode
                                showBleed={showBleed}
                            />
                        )
                        : (
                            <SurvivorCardFront
                                bleed={showBleed}
                                card={card as SurvivorCardData}
                                exportMode
                                showBleed={showBleed}
                            />
                        ),
                );
            }

            setTimeout(resolve, 100);
        });

        await promise;

        const canvas = container.querySelector('canvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        await waitForCanvasContent(canvas);

        const dataUrl = canvas.toDataURL('image/png');

        cleanup = () => {
            if (root) {
                root.unmount();
            }
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        };

        return dataUrl;
    } catch (error) {
        if (root) {
            root.unmount();
        }
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        throw error;
    } finally {
        if (cleanup) {
            cleanup();
        }
    }
}
