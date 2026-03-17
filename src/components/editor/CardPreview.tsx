import type { ZombicideCardData } from 'games/zombicide/editors/ZombicideCardEditor';
import type {
    AbominationCardData,
    EquipmentCardData,
    SurvivorCardData,
    ZombieSpawnCardData,
} from 'games/zombicide/types';

import AbominationCard from 'games/zombicide/cards/AbominationCard';
import EquipmentCard from 'games/zombicide/cards/EquipmentCard';
import SurvivorCardFront from 'games/zombicide/cards/SurvivorCardFront';
import ZombieSpawnCard from 'games/zombicide/cards/ZombieSpawnCard';

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
