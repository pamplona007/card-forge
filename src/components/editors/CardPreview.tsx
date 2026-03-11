import type { ZombicideCardData } from 'components/editors/zombicide/ZombicideCardEditor';
import type {
    AbominationCardData,
    EquipmentCardData,
    PimpWeaponCardData,
    SurvivorCardData,
    ZombieSpawnCardData,
} from 'types/zombicide-card';

import AbominationCard from 'components/cards/zombicide/AbominationCard';
import EquipmentCard from 'components/cards/zombicide/EquipmentCard';
import PimpWeaponCard from 'components/cards/zombicide/PimpWeaponCard';
import SurvivorCardFront from 'components/cards/zombicide/SurvivorCardFront';
import ZombieSpawnCard from 'components/cards/zombicide/ZombieSpawnCard';

interface CardPreviewProps {
    card: ZombicideCardData;
}

export default function CardPreview({ card }: CardPreviewProps) {
    const cardNode = (() => {
        switch (card.type) {
            case 'abomination':
                return <AbominationCard card={card as AbominationCardData} />;
            case 'equipment':
                return <EquipmentCard card={card as EquipmentCardData} />;
            case 'pimp-weapon':
                return <PimpWeaponCard card={card as PimpWeaponCardData} />;
            case 'survivor':
                return <SurvivorCardFront card={card as SurvivorCardData} />;
            case 'zombie-spawn':
                return <ZombieSpawnCard card={card as ZombieSpawnCardData} />;
            default:
                return null;
        }
    })();

    return (
        <div>
            {cardNode}
        </div>
    );
}
