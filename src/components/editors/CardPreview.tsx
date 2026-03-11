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
import { CARD_DIMENSIONS, SURVIVOR_CARD_DIMENSIONS } from 'types/zombicide-card';

interface CardPreviewProps {
    card: ZombicideCardData;
    /** Display width in pixels — the card scales to fit */
    displayWidth?: number;
}

export default function CardPreview({ card, displayWidth = 240 }: CardPreviewProps) {
    const isSurvivor = 'survivor' === card.type;
    const dims = isSurvivor ? SURVIVOR_CARD_DIMENSIONS : CARD_DIMENSIONS;
    const scale = displayWidth / dims.width;

    const containerStyle = {
        height: Math.round(dims.height * scale),
        overflow: 'hidden',
        width: displayWidth,
    };

    const innerStyle = {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
    };

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
        <div style={containerStyle}>
            <div style={innerStyle}>
                {cardNode}
            </div>
        </div>
    );
}
