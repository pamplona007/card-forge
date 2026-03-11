import type React from 'react';

import type { ZombicideCardData } from './zombicide/ZombicideCardEditor';

import AbominationCardEditor from './zombicide/AbominationCardEditor';
import EquipmentCardEditor from './zombicide/EquipmentCardEditor';
import PimpWeaponCardEditor from './zombicide/PimpWeaponCardEditor';
import SurvivorCardEditor from './zombicide/SurvivorCardEditor';
import ZombieSpawnCardEditor from './zombicide/ZombieSpawnCardEditor';

type CardEditorProps = {
    card: ZombicideCardData;
    onChange: (updatedCard: ZombicideCardData) => void;
    onImageUpload?: (file: File) => Promise<string>;
};

/**
 * Registry mapping card type IDs to their editor components for each game
 */

const EDITOR_REGISTRY: Record<string, Record<string, React.ComponentType<any>>> = {
    'zombicide-2e': {
        'abomination': AbominationCardEditor,
        'equipment': EquipmentCardEditor,
        'pimp-weapon': PimpWeaponCardEditor,
        'survivor': SurvivorCardEditor,
        'zombie-spawn': ZombieSpawnCardEditor,
    },
};

/**
 * Get all available card type IDs for a specific game
 * @param gameId - The game ID
 * @returns Array of card type IDs or empty array if game not found
 */
export function getCardTypeIdsForGame(gameId: string): string[] {
    const gameEditors = EDITOR_REGISTRY[gameId];
    if (!gameEditors) {
        return [];
    }
    return Object.keys(gameEditors);
}

/**
 * Get an editor component for a specific game and card type
 * @param gameId - The game ID
 * @param cardTypeId - The card type ID
 * @returns The editor component or null if not found
 */
export function getEditor(gameId: string, cardTypeId: string): null | React.ComponentType<CardEditorProps> {
    const gameEditors = EDITOR_REGISTRY[gameId];
    if (!gameEditors) {
        return null;
    }
    return gameEditors[cardTypeId] || null;
}

/**
 * Check if an editor exists for a specific game and card type
 * @param gameId - The game ID
 * @param cardTypeId - The card type ID
 * @returns true if an editor exists, false otherwise
 */
export function hasEditor(gameId: string, cardTypeId: string): boolean {
    return null !== getEditor(gameId, cardTypeId);
}
