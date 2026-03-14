import { CardDimensions } from 'types/card';
export { CardDimensions };

export const POKER_CARD_DIMENSIONS = new CardDimensions({
    bleed: 3,
    height: 88.9,
    width: 63.5,
});
export const SURVIVOR_CARD_DIMENSIONS = new CardDimensions({
    bleed: 3,
    borderRadius: 2,
    height: 76,
    width: 88,
});
export const MINI_USA_CARD_DIMENSIONS = new CardDimensions({
    bleed: 3,
    height: 63.5,
    width: 44.45,
});

export type AbilityColor = 'blue' | 'orange' | 'red' | 'yellow';

export interface CardProps {
  exportMode?: boolean;
  showBleed?: boolean;
}

export type DamageType = 'explosive' | 'fire' | 'melee' | 'ranged';

export type EquipmentSlot = 'any' | 'big' | 'body' | 'hand' | 'small';

export interface SurvivorAbility {
  color: AbilityColor;
  id: string;
  name: string;
}

export interface SurvivorCardData {
  defaultQuantity?: number;
  abilities: {
    blue?: SurvivorAbility;
    orange1?: SurvivorAbility;
    orange2?: SurvivorAbility;
    red1?: SurvivorAbility;
    red2?: SurvivorAbility;
    red3?: SurvivorAbility;
    yellow?: SurvivorAbility;
  };
  back?: {
    description: string;
    headline: string;
  }[];
  color: string;
  descriptions: {
    text: string;
    title: string;
  }[];
  health: number;
  id: string;
  image?: string;
  imageOffsetX?: number;
  imageOffsetXBack?: number;
  imageOffsetY?: number;
  imageOffsetYBack?: number;
  imageScale?: number;
  imageScaleBack?: number;
  name: string;
  showTagDescription?: boolean;
  tag: SurvivorTag;
}

export type SurvivorTag = 'holiday' | 'kids' | 'park' | 'police' | 'supes' | 'zombvivor' | null;

export type ZoneType = 'blue' | 'orange' | 'red' | 'yellow';

export const createDefaultSurvivorCard = (): SurvivorCardData => ({
    abilities: {
        blue: { color: 'blue', id: crypto.randomUUID(), name: 'Blue' },
        orange1: { color: 'orange', id: crypto.randomUUID(), name: 'Orange 1' },
        orange2: { color: 'orange', id: crypto.randomUUID(), name: 'Orange 2' },
        red1: { color: 'red', id: crypto.randomUUID(), name: 'Red 1' },
        red2: { color: 'red', id: crypto.randomUUID(), name: 'Red 2' },
        red3: { color: 'red', id: crypto.randomUUID(), name: 'Red 3' },
        yellow: { color: 'yellow', id: crypto.randomUUID(), name: '+1 Ação' },
    },
    color: '#3B82F6',
    descriptions: [
        { text: '', title: 'Habilidade 1' },
        { text: '', title: 'Habilidade 2' },
        { text: '', title: 'Habilidade 3' },
    ],
    health: 3,
    id: crypto.randomUUID(),
    name: 'New Survivor',
    tag: null,
});

export interface EquipmentCardData {
  defaultQuantity?: number;
  abilities?: SurvivorAbility[];
  copyright?: string;
  description: string;
  flavorText?: string;
  id: string;
  image?: string;
  isUnique?: boolean;
  name: string;
  rarity: number;
  slot: EquipmentSlot;
}

export const createDefaultEquipmentCard = (): EquipmentCardData => ({
    description: '',
    id: crypto.randomUUID(),
    name: 'New Equipment',
    rarity: 1,
    slot: 'hand',
});

export interface PimpWeaponAbility {
  description: string;
  id: string;
  name: string;
}

export interface PimpWeaponCardData {
  defaultQuantity?: number;
  abilities: PimpWeaponAbility[];
  copyright?: string;
  damage: number;
  damageType: DamageType;
  flavorText?: string;
  id: string;
  image?: string;
  isTwoHanded?: boolean;
  name: string;
  range: number;
}

export const createDefaultPimpWeaponCard = (): PimpWeaponCardData => ({
    abilities: [],
    damage: 1,
    damageType: 'melee',
    id: crypto.randomUUID(),
    name: 'New Weapon',
    range: 1,
});

export interface ZombieSpawnCardData {
  defaultQuantity?: number;
  abilities?: SurvivorAbility[];
  attack: number;
  copyright?: string;
  defense: number;
  flavorText?: string;
  id: string;
  image?: string;
  isElite?: boolean;
  isSpecial?: boolean;
  name: string;
  spawnZone: ZoneType;
  speed: number;
  xpValue?: number;
}

export const createDefaultZombieSpawnCard = (): ZombieSpawnCardData => ({
    attack: 1,
    defense: 0,
    id: crypto.randomUUID(),
    name: 'Walker',
    spawnZone: 'blue',
    speed: 1,
    xpValue: 1,
});

export interface AbominationCardData {
  defaultQuantity?: number;
  abilities: SurvivorAbility[];
  attack: number;
  copyright?: string;
  defense: number;
  flavorText?: string;
  health: number;
  id: string;
  image?: string;
  name: string;
  speed: number;
  xpValue: number;
}

export const createDefaultAbominationCard = (): AbominationCardData => ({
    abilities: [],
    attack: 3,
    defense: 2,
    health: 5,
    id: crypto.randomUUID(),
    name: 'Abomination',
    speed: 2,
    xpValue: 5,
});

export const ZONE_COLORS: Record<ZoneType, string> = {
    blue: '#3B82F6',
    orange: '#F97316',
    red: '#EF4444',
    yellow: '#EAB308',
};

export const ABILITY_COLORS: Record<AbilityColor, string> = {
    blue: '#3B82F6',
    orange: '#F97316',
    red: '#EF4444',
    yellow: '#EAB308',
};

export const SURVIVOR_TAGS: Record<Exclude<SurvivorTag, null>, string> = {
    holiday: '/zombicide-2nd/survivor/holiday-icon.png',
    kids: '/zombicide-2nd/survivor/kids-icon.png',
    park: '/zombicide-2nd/survivor/park-icon.png',
    police: '/zombicide-2nd/survivor/police-icon.png',
    supes: '/zombicide-2nd/survivor/supes-icon.png',
    zombvivor: '/zombicide-2nd/survivor/zombvivor-icon.png',
};

export const RARITY_COLORS: Record<number, string> = {
    1: '#9CA3AF',
    2: '#10B981',
    3: '#3B82F6',
    4: '#8B5CF6',
    5: '#F59E0B',
};
