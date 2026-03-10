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
  dimensions: CardDimensions;
  id: string;
  name: string;
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

const STANDARD_CARD_DIMENSIONS: CardDimensions = {
    height: 88.9,
    width: 63.5,
};

const zombicide2eCardTypes: CardType[] = [
    {
        dimensions: STANDARD_CARD_DIMENSIONS,
        id: 'survivor',
        name: 'Survivor',
    },
    {
        dimensions: STANDARD_CARD_DIMENSIONS,
        id: 'equipment',
        name: 'Equipment',
    },
    {
        dimensions: STANDARD_CARD_DIMENSIONS,
        id: 'pimp-weapon',
        name: 'Pimp Weapon',
    },
    {
        dimensions: STANDARD_CARD_DIMENSIONS,
        id: 'zombie-spawn',
        name: 'Zombie Spawn',
    },
    {
        dimensions: STANDARD_CARD_DIMENSIONS,
        id: 'abomination',
        name: 'Abomination',
    },
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
