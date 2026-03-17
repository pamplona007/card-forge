/**
 * Generic PDF layout engine for printable card games.
 *
 * The engine knows nothing about specific games or card formats.  Callers
 * supply an array of {@link ExportCard} objects, each of which carries its own
 * physical dimensions and a `capture` callback that returns a PNG data URL for
 * a given side.  The engine handles page layout, grid calculation, rotation,
 * and back-page mirroring.
 */

import type { CardDimensions } from 'types/card';

import { jsPDF } from 'jspdf';

export type PaperSize = 'a3' | 'a4' | 'a5' | 'legal' | 'letter';

/** Standard paper dimensions in millimetres (portrait orientation). */
export const PAPER_SIZES: Record<PaperSize, { height: number; id: string; width: number }> = {
    a3: { height: 420, id: 'a3', width: 297 },
    a4: { height: 297, id: 'a4', width: 210 },
    a5: { height: 210, id: 'a5', width: 148 },
    legal: { height: 355.6, id: 'legal', width: 215.9 },
    letter: { height: 279.4, id: 'letter', width: 215.9 },
};

/**
 * A card ready for PDF export.
 *
 * Callers build these from their game-specific card data. The PDF engine only
 * cares about physical dimensions and how to capture each side as an image.
 */
export interface ExportCard {
    /** Capture this card's given side as a PNG data URL. */
    capture: (side: 'back' | 'front') => Promise<string>;
    /** Physical dimensions of the card canvas in mm. */
    dimensions: CardDimensions;
    /**
     * Whether the card has a distinct back side.
     *
     * When `false` the PDF engine omits the back page for this card.
     * Defaults to `true`.
     */
    hasBothSides?: boolean;
    /**
     * Number of copies to include in the PDF.
     *
     * The engine expands each card by this count internally and captures
     * each unique card only once, reusing the image for every copy.
     * Defaults to `1`.
     */
    quantity?: number;
}

export interface PDFGeneratorOptions {
    /** File name for the downloaded PDF (default: `'cards.pdf'`). */
    fileName?: string;
    /** Include a mirrored back page for each front page (default: `true`). */
    includeBacks?: boolean;
    /** Paper size (default: `'a4'`). */
    paperSize?: PaperSize;
}

const MARGIN = 5;
const MIN_SPACING = -5;

interface GridConfig {
    cardsPerCol: number;
    cardsPerRow: number;
    rotated: boolean;
}

interface GridLayout extends GridConfig {
    cardHeight: number;
    cardWidth: number;
    spacingX: number;
    spacingY: number;
}

/**
 * Pick between landscape and portrait card orientation to maximise cards per
 * page.
 */
const calculateGridConfig = (
    dims: CardDimensions,
    pageWidth: number,
    pageHeight: number,
): GridConfig => {
    const aw = pageWidth - (2 * MARGIN);
    const ah = pageHeight - (2 * MARGIN);

    const hPerRow = Math.floor(aw / (dims.totalCanvasWidth + MIN_SPACING));
    const hPerCol = Math.floor(ah / (dims.totalCanvasHeight + MIN_SPACING));

    const vPerRow = Math.floor(aw / (dims.totalCanvasHeight + MIN_SPACING));
    const vPerCol = Math.floor(ah / (dims.totalCanvasWidth + MIN_SPACING));

    return vPerRow * vPerCol > hPerRow * hPerCol
        ? { cardsPerCol: vPerCol, cardsPerRow: vPerRow, rotated: true }
        : { cardsPerCol: hPerCol, cardsPerRow: hPerRow, rotated: false };
};

const calculateGridLayout = (
    dims: CardDimensions,
    config: GridConfig,
    pageWidth: number,
    pageHeight: number,
): GridLayout => {
    const aw = pageWidth - (2 * MARGIN);
    const ah = pageHeight - (2 * MARGIN);

    const cardWidth = config.rotated ? dims.totalCanvasHeight : dims.totalCanvasWidth;
    const cardHeight = config.rotated ? dims.totalCanvasWidth : dims.totalCanvasHeight;

    const spacingX = (aw - (config.cardsPerRow * cardWidth)) / (config.cardsPerRow + 1);
    const spacingY = (ah - (config.cardsPerCol * cardHeight)) / (config.cardsPerCol + 1);

    return { ...config, cardHeight, cardWidth, spacingX, spacingY };
};

const getCardPosition = (
    index: number,
    layout: GridLayout,
    dims: CardDimensions,
    invertedRotation = false,
): { x: number; y: number } => {
    const { cardHeight, cardsPerRow, cardWidth, rotated, spacingX, spacingY } = layout;
    const col = index % cardsPerRow;
    const row = Math.floor(index / cardsPerRow);

    const baseX = MARGIN + spacingX + (col * (cardWidth + spacingX));
    const baseY = MARGIN + spacingY + (row * (cardHeight + spacingY));

    if (!rotated) {
        return { x: baseX, y: baseY };
    }

    return invertedRotation
        ? { x: baseX - layout.cardHeight, y: baseY - layout.cardWidth + dims.totalCanvasWidth }
        : { x: baseX, y: baseY - dims.totalCanvasHeight };
};

/**
 * Render `cards` into a print-ready PDF and trigger a browser download.
 *
 * Cards are grouped by their `dimensions` key so that different card sizes each
 * get their own optimised page layout.  For every group the engine emits:
 *   - one or more front pages
 *   - one mirrored back page per front page (when `includeBacks` is `true`)
 */
export const generatePDF = async (
    cards: ExportCard[],
    options: PDFGeneratorOptions = {},
): Promise<void> => {
    const {
        fileName = 'cards.pdf',
        includeBacks = true,
        paperSize = 'a4',
    } = options;

    if (0 === cards.length) {
        return;
    }

    // Expand each card into a flat slot list honouring its quantity.
    const slotList: ExportCard[] = [];
    for (const card of cards) {
        const qty = card.quantity ?? 1;
        for (let i = 0; i < qty; i++) {
            slotList.push(card);
        }
    }

    if (0 === slotList.length) {
        return;
    }

    // Pre-capture each unique card exactly once so duplicated slots reuse the
    // same image rather than re-rendering the same canvas multiple times.
    const uniqueCards = [...new Set(slotList)];
    const frontCache = new Map<ExportCard, Promise<null | string>>();
    const backCache = new Map<ExportCard, Promise<null | string>>();

    for (const card of uniqueCards) {
        frontCache.set(card, card.capture('front').catch((err) => {
            console.error('Error capturing front:', err);
            return null;
        }));
        if (false !== card.hasBothSides) {
            backCache.set(card, card.capture('back').catch((err) => {
                console.error('Error capturing back:', err);
                return null;
            }));
        }
    }

    const { height: pageHeight, width: pageWidth } = PAPER_SIZES[paperSize];

    const pdf = new jsPDF({ format: paperSize, orientation: 'portrait', unit: 'mm' });

    const groups = new Map<string, ExportCard[]>();
    for (const card of slotList) {
        const key = `${card.dimensions.totalCanvasWidth}x${card.dimensions.totalCanvasHeight}`;
        const bucket = groups.get(key) ?? [];
        bucket.push(card);
        groups.set(key, bucket);
    }

    let firstPage = true;
    for (const groupCards of groups.values()) {
        const dims = groupCards[0].dimensions;
        const gridConfig = calculateGridConfig(dims, pageWidth, pageHeight);
        const gridLayout = calculateGridLayout(dims, gridConfig, pageWidth, pageHeight);
        const perPage = gridLayout.cardsPerRow * gridLayout.cardsPerCol;
        const numPages = Math.ceil(groupCards.length / perPage);

        for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
            const slice = groupCards.slice(pageIdx * perPage, (pageIdx + 1) * perPage);

            if (!firstPage) {
                pdf.addPage();
            }
            firstPage = false;

            const frontImages = await Promise.all(
                slice.map((card) => frontCache.get(card) ?? Promise.resolve(null)),
            );

            for (let i = 0; i < slice.length; i++) {
                const img = frontImages[i];
                if (!img) {
                    continue;
                }
                const { x, y } = getCardPosition(i, gridLayout, dims);
                pdf.addImage(img, 'PNG', x, y, dims.totalCanvasWidth, dims.totalCanvasHeight, undefined, undefined, gridLayout.rotated ? -90 : 0);
            }

            const wantsBacks = includeBacks && slice.some((c) => false !== c.hasBothSides);
            if (wantsBacks) {
                pdf.addPage();

                const backImages = await Promise.all(
                    slice.map((card) => false !== card.hasBothSides
                        ? (backCache.get(card) ?? Promise.resolve(null))
                        : Promise.resolve(null)),
                );

                for (let i = 0; i < slice.length; i++) {
                    const img = backImages[i];
                    if (!img) {
                        continue;
                    }
                    const { x, y } = getCardPosition(i, gridLayout, dims, true);
                    const mirroredX = pageWidth - x - dims.totalCanvasWidth;
                    pdf.addImage(img, 'PNG', mirroredX, y, dims.totalCanvasWidth, dims.totalCanvasHeight, undefined, undefined, gridLayout.rotated ? 90 : 0);
                }
            }
        }
    }

    pdf.save(fileName);
};
