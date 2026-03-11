/**
 * PDF Generator Utility for Zombicide Cards
 *
 * Generates printable PDFs with:
 * - Standard poker card dimensions
 * - 3mm bleed on all sides
 * - Grid layout calculated dynamically based on card size
 *
 * Note: Cut lines are already drawn on the canvas, so no additional processing needed
 */

import { jsPDF } from 'jspdf';

import type { ZombicideCardData } from '../components/editors/zombicide/ZombicideCardEditor';

import { CARD_DIMENSIONS, type CardDimensions, SURVIVOR_CARD_DIMENSIONS } from '../types/zombicide-card';
import { captureSurvivorCard } from './captureSurvivorCard';

/**
 * Available paper sizes for PDF export
 */
export type PaperSize = 'a3' | 'a4' | 'a5' | 'legal' | 'letter';

/**
 * Paper size dimensions in mm (width, height)
 */
export const PAPER_SIZES: Record<PaperSize, { height: number; id: string; width: number; }> = {
    a3: { height: 420, id: 'a3', width: 297 },
    a4: { height: 297, id: 'a4', width: 210 },
    a5: { height: 210, id: 'a5', width: 148 },
    legal: { height: 355.6, id: 'legal', width: 215.9 },
    letter: { height: 279.4, id: 'letter', width: 215.9 },
};

const MARGIN = 5;

const MIN_SPACING = 3;

/**
 * Get card dimensions based on card type
 */
const getCardDimensions = (card: ZombicideCardData): CardDimensions => {
    switch (card.type) {
        case 'survivor':
            return SURVIVOR_CARD_DIMENSIONS;
        default:
            return CARD_DIMENSIONS;
    }
};

/**
 * Calculate how many cards fit per row based on card dimensions
 * Returns both horizontal and rotated options, picks the one that fits more cards
 */
const calculateGridConfig = (cardDims: CardDimensions, pageWidth: number, pageHeight: number): {
    cardsPerCol: number;
    cardsPerRow: number;
    rotated: boolean;
} => {
    const availableWidth = pageWidth - (2 * MARGIN);
    const availableHeight = pageHeight - (2 * MARGIN);

    const hCardWidth = cardDims.totalCanvasWidth + MIN_SPACING;
    const hCardHeight = cardDims.totalCanvasHeight + MIN_SPACING;
    const hCardsPerRow = Math.floor(availableWidth / hCardWidth);
    const hCardsPerCol = Math.floor(availableHeight / hCardHeight);
    const hTotal = hCardsPerRow * hCardsPerCol;

    const vCardWidth = cardDims.totalCanvasHeight + MIN_SPACING;
    const vCardHeight = cardDims.totalCanvasWidth + MIN_SPACING;
    const vCardsPerRow = Math.floor(availableWidth / vCardWidth);
    const vCardsPerCol = Math.floor(availableHeight / vCardHeight);
    const vTotal = vCardsPerRow * vCardsPerCol;

    console.log(`Grid config: horizontal=${hCardsPerRow}x${hCardsPerCol}=${hTotal}, vertical=${vCardsPerRow}x${vCardsPerCol}=${vTotal}`);

    if (vTotal > hTotal) {
        return { cardsPerCol: vCardsPerCol, cardsPerRow: vCardsPerRow, rotated: true };
    }
    return { cardsPerCol: hCardsPerCol, cardsPerRow: hCardsPerRow, rotated: false };
};

/**
 * Calculate grid layout for specific card dimensions
 */
const calculateGridLayout = (
    cardDims: CardDimensions,
    gridConfig: { cardsPerCol: number; cardsPerRow: number; rotated: boolean },
    pageWidth: number,
    pageHeight: number,
) => {
    const availableWidth = pageWidth - (2 * MARGIN);
    const availableHeight = pageHeight - (2 * MARGIN);

    const cardWidth = gridConfig.rotated ? cardDims.totalCanvasHeight : cardDims.totalCanvasWidth;
    const cardHeight = gridConfig.rotated ? cardDims.totalCanvasWidth : cardDims.totalCanvasHeight;

    const gridWidth = gridConfig.cardsPerRow * cardWidth;
    const gridHeight = gridConfig.cardsPerCol * cardHeight;

    const extraWidth = availableWidth - gridWidth;
    const extraHeight = availableHeight - gridHeight;

    const spacingX = extraWidth / (gridConfig.cardsPerRow + 1);
    const spacingY = extraHeight / (gridConfig.cardsPerCol + 1);

    return {
        ...gridConfig,
        cardHeight,
        cardWidth,
        spacingX,
        spacingY,
    };
};

/**
 * Get card position in the grid
 */
const getCardPosition = (
    index: number,
    layout: {
        cardHeight: number;
        cardsPerRow: number;
        cardWidth: number;
        rotated: boolean;
        spacingX: number;
        spacingY: number;
    },
    cardDims: CardDimensions,
    invertedRotation: boolean = false,
): { x: number; y: number } => {
    const {
        cardHeight,
        cardsPerRow,
        cardWidth,
        rotated,
        spacingX,
        spacingY,
    } = layout;
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;

    const baseX = MARGIN + spacingX + (col * (cardWidth + spacingX));
    const baseY = MARGIN + spacingY + (row * (cardHeight + spacingY));

    if (!rotated) {
        return {
            x: baseX,
            y: baseY,
        };
    }

    if (invertedRotation) {
        return {
            x: baseX - layout.cardHeight,
            y: baseY - layout.cardWidth + cardDims.totalCanvasWidth,
        };
    }

    return {
        x: baseX,
        y: baseY - cardDims.totalCanvasHeight,
    };
};

/**
 * Options for PDF generation
 */
export interface PDFGeneratorOptions {
    /** File name for the downloaded PDF */
    fileName?: string;
    /** Include backs in a second page */
    includeBacks?: boolean;
    /** Paper size for the PDF */
    paperSize?: PaperSize;
}

/**
 * Capture a card as an image data URL
 */
async function captureCard(
    card: ZombicideCardData,
    side: 'back' | 'front' = 'front',
): Promise<string> {
    if ('survivor' === card.type) {
        return captureSurvivorCard(card, { showBleed: true, side });
    }

    throw new Error(`Card type "${card.type}" capture not yet implemented`);
}

/**
 * Generates a PDF from card elements by capturing them
 *
 * Groups cards by type (dimensions) and creates interleaved front/back pages:
 * - Page 1: Fronts (type A)
 * - Page 2: Backs (type A)
 * - Page 3: Fronts (type B)
 * - Page 4: Backs (type B)
 * etc.
 */
export const generatePDFFromElements = async (
    cards: ZombicideCardData[],
    options: PDFGeneratorOptions = {},
): Promise<void> => {
    const {
        fileName = 'zombicide-cards.pdf',
        includeBacks = true,
        paperSize = 'a4',
    } = options;

    if (0 === cards.length) {
        console.warn('No cards to export');
        return;
    }

    const pageWidth = PAPER_SIZES[paperSize].width;
    const pageHeight = PAPER_SIZES[paperSize].height;

    const pdf = new jsPDF({
        format: paperSize,
        orientation: 'portrait',
        unit: 'mm',
    });

    const cardsByType = new Map<string, ZombicideCardData[]>();
    for (const card of cards) {
        const existing = cardsByType.get(card.type) || [];
        existing.push(card);
        cardsByType.set(card.type, existing);
    }

    console.log(`Card types: ${Array.from(cardsByType.keys()).join(', ')}`);

    for (const [cardType, typeCards] of cardsByType) {
        console.log(`Processing ${typeCards.length} ${cardType} cards`);

        const cardDims = getCardDimensions(typeCards[0]);
        const gridConfig = calculateGridConfig(cardDims, pageWidth, pageHeight);
        const gridLayout = calculateGridLayout(cardDims, gridConfig, pageWidth, pageHeight);

        console.log(`Grid layout for ${cardType}: ${gridConfig.cardsPerRow}x${gridConfig.cardsPerCol}, rotated=${gridConfig.rotated}`);

        const cardsPerPage = gridLayout.cardsPerRow * gridLayout.cardsPerCol;
        const numPages = Math.ceil(typeCards.length / cardsPerPage);

        for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
            const startIdx = pageIdx * cardsPerPage;
            const endIdx = Math.min(startIdx + cardsPerPage, typeCards.length);
            const pageCards = typeCards.slice(startIdx, endIdx);

            const frontImages = await Promise.all(
                pageCards.map((card, i) => captureCard(card, 'front').catch((error) => {
                    console.error(`Error processing ${cardType} front card ${startIdx + i}:`, error);
                    return null;
                })),
            );

            for (let i = 0; i < pageCards.length; i++) {
                const imageData = frontImages[i];
                if (!imageData) {
                    continue;
                }
                const pos = getCardPosition(i, gridLayout, cardDims);
                pdf.addImage(
                    imageData,
                    'PNG',
                    pos.x,
                    pos.y,
                    cardDims.totalCanvasWidth,
                    cardDims.totalCanvasHeight,
                    undefined,
                    undefined,
                    gridLayout.rotated ? -90 : 0,
                );
            }

            if (includeBacks) {
                pdf.addPage();

                const backImages = await Promise.all(
                    pageCards.map((card, i) => captureCard(card, 'back').catch((error) => {
                        console.error(`Error processing ${cardType} back card ${startIdx + i}:`, error);
                        return null;
                    })),
                );

                for (let i = 0; i < pageCards.length; i++) {
                    const imageData = backImages[i];
                    if (!imageData) {
                        continue;
                    }
                    const pos = getCardPosition(i, gridLayout, cardDims, true);
                    const mirroredX = pageWidth - pos.x - cardDims.totalCanvasWidth;
                    pdf.addImage(
                        imageData,
                        'PNG',
                        mirroredX,
                        pos.y,
                        cardDims.totalCanvasWidth,
                        cardDims.totalCanvasHeight,
                        undefined,
                        undefined,
                        gridLayout.rotated ? 90 : 0,
                    );
                }
            }

            if (pageIdx < numPages - 1 || Array.from(cardsByType.keys()).indexOf(cardType) < cardsByType.size - 1) {
                pdf.addPage();
            }
        }
    }

    pdf.save(fileName);
    console.log(`PDF generated: ${fileName}`);
};
