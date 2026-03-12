import type { ExportCard } from 'utils/pdfGenerator';

import { captureReactElement } from 'utils/captureElement';

import type { ZombicideCardData } from '../editors/ZombicideCardEditor';
import type { SurvivorCardData } from '../types';

import SurvivorCardBack from '../cards/SurvivorCardBack';
import SurvivorCardFront from '../cards/SurvivorCardFront';
import { POKER_CARD_DIMENSIONS, SURVIVOR_CARD_DIMENSIONS } from '../types';

/**
 * Capture a Zombicide survivor card as a PNG data URL.
 *
 * Wraps the generic {@link captureReactElement} utility with the correct
 * React component for each side.
 */
export async function captureSurvivorCard(
    card: SurvivorCardData,
    side: 'back' | 'front' = 'front',
    showBleed = true,
): Promise<string> {
    const element =
        'back' === side
            ? (
                <SurvivorCardBack
                    bleed={showBleed}
                    card={card}
                    exportMode
                    showBleed={showBleed}
                />
            )
            : (
                <SurvivorCardFront
                    bleed={showBleed}
                    card={card}
                    exportMode
                    showBleed={showBleed}
                />
            );

    return captureReactElement(element);
}

/**
 * Build an {@link ExportCard} from any Zombicide card data.
 *
 * The returned object is consumed directly by the generic PDF generator —
 * no Zombicide-specific knowledge leaks into the layout engine.
 *
 * Extend the `switch` as new card types gain canvas-based rendering.
 */
export function toExportCard(card: ZombicideCardData): ExportCard {
    switch (card.type) {
        case 'survivor':
            return {
                capture: (side) => captureSurvivorCard(card as SurvivorCardData, side),
                dimensions: getZombicideDimensions(card),
                hasBothSides: true,
            };
        default:
            throw new Error(`Card type "${card.type}" capture is not yet implemented`);
    }
}

/**
 * Map a Zombicide card to its physical dimensions.
 */
function getZombicideDimensions(card: ZombicideCardData) {
    switch (card.type) {
        case 'survivor':
            return SURVIVOR_CARD_DIMENSIONS;
        default:
            return POKER_CARD_DIMENSIONS;
    }
}
