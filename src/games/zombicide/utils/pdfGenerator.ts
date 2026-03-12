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

/**
 * Convenience wrapper that accepts raw Zombicide card data and generates a PDF.
 *
 * Internally converts each card to an {@link ExportCard} (via {@link toExportCard})
 * and delegates to the generic {@link generatePDF} engine.
 */
export async function generatePDFFromElements(
    cards: ZombicideCardData[],
    options: PDFGeneratorOptions = {},
): Promise<void> {
    const exportCards = cards
        .map((card) => {
            try {
                return toExportCard(card);
            } catch {
                console.warn(`Skipping unsupported card type: ${card.type}`);
                return null;
            }
        })
        .filter((c) => null !== c);

    return _generatePDF(exportCards, {
        fileName: 'zombicide-cards.pdf',
        ...options,
    });
}
