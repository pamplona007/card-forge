import { POKER_CARD_DIMENSIONS, SURVIVOR_CARD_DIMENSIONS } from 'games/zombicide/types';

/**
 * Card type dimensions in millimeters
 */
export interface CardDimensions {
  height: number;
  width: number;
}

/**
 * Defines a type of card used in a game
 */
export interface CardType {
  background: { color: string; image?: string };
  descriptionKey?: string;
  dimensions: CardDimensions;
  id: string;
  name: string;
  nameKey?: string;
}

/**
 * Represents a board game with its card type definitions
 */
export interface Game {
  cardTypes: CardType[];
  description: string;
  id: string;
  imageUrl: string;
  name: string;
  publisher: string;
}

const zombicide2eCardTypes: CardType[] = [
    {
        background: { color: '#1a2e1a', image: '/zombicide-2nd/survivor/bg-front.svg' },
        descriptionKey: 'zombicide.cardTypeDescription.survivor',
        dimensions: SURVIVOR_CARD_DIMENSIONS,
        id: 'survivor',
        name: 'Survivor',
        nameKey: 'zombicide.card.type.survivor',
    },
    {
        background: { color: '#1e3a5f' },
        descriptionKey: 'zombicide.cardTypeDescription.equipment',
        dimensions: POKER_CARD_DIMENSIONS,
        id: 'equipment',
        name: 'Equipment',
        nameKey: 'zombicide.card.type.equipment',
    },
    {
        background: { color: '#1f2d1a' },
        descriptionKey: 'zombicide.cardTypeDescription.zombieSpawn',
        dimensions: POKER_CARD_DIMENSIONS,
        id: 'zombie-spawn',
        name: 'Zombie Spawn',
        nameKey: 'zombicide.card.type.zombieSpawn',
    },
    {
        background: { color: '#7c2d12' },
        descriptionKey: 'zombicide.cardTypeDescription.abomination',
        dimensions: POKER_CARD_DIMENSIONS,
        id: 'abomination',
        name: 'Abomination',
        nameKey: 'zombicide.card.type.abomination',
    },
];

/**
 * Games planned for future support
 */
export const COMING_SOON_GAMES: string[] = [
    'Zombicide: Black Plague',
    'Zombicide: Invader',
    'Zombicide: Undead or Alive',
    'Rallyman GT',
    'Sky Team',
    'Not Enough Mana',
    'Munchkin',
    'Unmatched',
];

/**
 * Predefined list of supported games
 */
export const SUPPORTED_GAMES: Game[] = [
    {
        cardTypes: zombicide2eCardTypes,
        description: 'Zombicide 2nd Edition is a cooperative board game where players take on the role of survivors in a zombie apocalypse.',
        id: 'zombicide-2e',
        imageUrl: '/assets/games/zombicide-2e.jpg',
        name: 'Zombicide 2nd Edition',
        publisher: 'Guillotine Games',
    },
];

/**
 * Get all card types for a specific game
 * @param gameId - The game ID
 * @returns Array of card types for the game
 */
export function getCardType(gameId: string, cardTypeId: string): CardType | undefined {
    return getCardTypesForGame(gameId).find((ct) => ct.id === cardTypeId);
}

export function getCardTypesForGame(gameId: string): CardType[] {
    const game = getGameById(gameId);
    return game?.cardTypes ?? [];
}

/**
 * Get a game by its ID
 * @param id - The game ID to search for
 * @returns The game if found, undefined otherwise
 */
export function getGameById(id: string): Game | undefined {
    return SUPPORTED_GAMES.find((game) => game.id === id);
}
