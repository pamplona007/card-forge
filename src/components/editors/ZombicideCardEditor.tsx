import type {
    AbominationCardData,
    EquipmentCardData,
    PimpWeaponCardData,
    SurvivorCardData,
    ZombieSpawnCardData,
} from '../../types/zombicide-card';

export interface ZombicideCardBase {
  type: ZombicideCardType;
}

export type ZombicideCardData = (
  | AbominationCardData
  | EquipmentCardData
  | PimpWeaponCardData
  | SurvivorCardData
  | ZombieSpawnCardData
) & ZombicideCardBase;

export type ZombicideCardType = 'abomination' | 'equipment' | 'pimp-weapon' | 'survivor' | 'zombie-spawn';

export type { AbominationCardData, EquipmentCardData, PimpWeaponCardData, SurvivorCardData, ZombieSpawnCardData };
