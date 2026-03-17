import type {
    AbominationCardData,
    EquipmentCardData,
    SurvivorCardData,
    ZombieSpawnCardData,
} from '../types';

export interface ZombicideCardBase {
  type: ZombicideCardType;
}

export type ZombicideCardData = (
  | AbominationCardData
  | EquipmentCardData
  | SurvivorCardData
  | ZombieSpawnCardData
) & ZombicideCardBase;

export type ZombicideCardType = 'abomination' | 'equipment' | 'survivor' | 'zombie-spawn';

export type { AbominationCardData, EquipmentCardData, SurvivorCardData, ZombieSpawnCardData };
