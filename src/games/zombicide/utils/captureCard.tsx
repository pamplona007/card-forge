import type { ExportCard } from 'utils/pdfGenerator';

import { captureReactElement } from 'utils/captureElement';

import type { ZombicideCardData } from '../editors/ZombicideCardEditor';
import type { EquipmentCardData, SurvivorCardData } from '../types';

import EquipmentCardFront from '../cards/EquipmentCard';
import EquipmentCardBack from '../cards/EquipmentCardBack';
import SurvivorCardBack from '../cards/SurvivorCardBack';
import SurvivorCardFront from '../cards/SurvivorCardFront';
import { MINI_USA_CARD_DIMENSIONS, SURVIVOR_CARD_DIMENSIONS } from '../types';

export async function captureEquipmentCard(
    card: EquipmentCardData,
    side: 'back' | 'front' = 'front',
    showBleed = true,
): Promise<string> {
    const element =
        'front' === side
            ? (
                <EquipmentCardFront
                    bleed={showBleed}
                    card={card}
                    exportMode
                    showBleed={showBleed}
                />
            )
            : (
                <EquipmentCardBack
                    bleed={showBleed}
                    card={card}
                    exportMode
                    showBleed={showBleed}
                />
            );

    return captureReactElement(element);
}

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
        case 'equipment':
            return {
                capture: (side) => captureEquipmentCard(card as EquipmentCardData, side),
                dimensions: MINI_USA_CARD_DIMENSIONS,
                hasBothSides: true,
            };
        case 'survivor':
            return {
                capture: (side) => captureSurvivorCard(card as SurvivorCardData, side),
                dimensions: SURVIVOR_CARD_DIMENSIONS,
                hasBothSides: true,
            };
        default:
            throw new Error(`Card type "${card.type}" capture is not yet implemented`);
    }
}
