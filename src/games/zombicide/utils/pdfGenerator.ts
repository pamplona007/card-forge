/**
 * Zombicide PDF adapter.
 *
 * Translates Zombicide-specific card data into the game-agnostic
 * {@link ExportCard} shape expected by the generic PDF engine, then
 * delegates all layout work to it.
 *
 * To add export support for another card type, add a branch to
 * {@link toExportCard} in `captureCard.tsx`.
 */

import { generatePDF as _generatePDF, type PDFGeneratorOptions } from 'utils/pdfGenerator';

import type { ZombicideCardData } from '../editors/ZombicideCardEditor';

import { toExportCard } from './captureCard';

// Re-export the public surface that callers (ExportOptionsModal, etc.) depend on
export type { PaperSize, PDFGeneratorOptions } from 'utils/pdfGenerator';
export { generatePDF, PAPER_SIZES } from 'utils/pdfGenerator';

export interface ZombicidePDFOptions extends PDFGeneratorOptions {
    /** Per-card copy counts forwarded to the generic PDF engine as `quantity`. */
    cardQuantities?: Record<string, number>;
}

/**
 * Convenience wrapper that accepts raw Zombicide card data and generates a PDF.
 *
 * Internally converts each card to an {@link ExportCard} (via {@link toExportCard}),
 * attaches the requested quantity, and delegates to the generic engine which
 * captures each unique card only once regardless of how many copies are requested.
 */
export async function generatePDFFromElements(
    cards: ZombicideCardData[],
    options: ZombicidePDFOptions = {},
): Promise<void> {
    const { cardQuantities, ...pdfOptions } = options;
    const exportCards = cards
        .map((card) => {
            try {
                const exportCard = toExportCard(card);
                exportCard.quantity = cardQuantities ? (cardQuantities[card.id] ?? 1) : 1;
                return exportCard;
            } catch {
                console.warn(`Skipping unsupported card type: ${card.type}`);
                return null;
            }
        })
        .filter((c) => null !== c);

    return _generatePDF(exportCards, {
        fileName: 'zombicide-cards.pdf',
        ...pdfOptions,
    });
}
