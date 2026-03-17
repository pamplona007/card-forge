import CardCanvas, { type DrawParams } from 'components/canvas/CardCanvas';
import { ZOMBICIDE_FONTS } from 'components/canvas/cardUtils';
import { useImages } from 'hooks/useImages';
import React, { useCallback, useMemo } from 'react';

import {
    type CardProps,
    type EquipmentCardData,
    MINI_USA_CARD_DIMENSIONS,
} from '../types';

interface EquipmentCardProps extends CardProps {
    bleed?: boolean;
    card: EquipmentCardData;
    onChangeImagePosition?: (offsetX: number, offsetY: number) => void;
}

const EQUIPMENT_ASSET_URLS = {
    backBlue: '/zombicide-2nd/equipments/back-blue.svg',
    backGray: '/zombicide-2nd/equipments/back-gray.svg',
    backRed: '/zombicide-2nd/equipments/back-red.svg',
};

const getImage = (card: EquipmentCardData) => {
    switch (card.equipmentType) {
        case 'companion':
        case 'equipment':
            return EQUIPMENT_ASSET_URLS.backBlue;

        case 'pimp':
            return EQUIPMENT_ASSET_URLS.backRed;

        case 'starter':
            return EQUIPMENT_ASSET_URLS.backGray;

        default:
            return EQUIPMENT_ASSET_URLS.backGray;
    }
};

const EquipmentCardBack: React.FC<EquipmentCardProps> = ({ bleed, card, exportMode = false, onChangeImagePosition }) => {
    const imageUrls = useMemo(() => ({
        back: getImage(card),
    }), [card]);

    const { images, loaded: loadedImages } = useImages(imageUrls);

    const draw = useCallback(({ ctx, drawableHeight, drawableWidth, padding }: DrawParams) => {
        if (!loadedImages) {
            return;
        }

        ctx.drawImage(images.back, padding, padding, drawableWidth, drawableHeight);
    }, [loadedImages, images]);

    return (
        <CardCanvas
            bleed={bleed}
            cardDimensions={MINI_USA_CARD_DIMENSIONS}
            cursor={onChangeImagePosition ? 'move' : 'default'}
            draw={draw}
            exportMode={exportMode}
            fonts={ZOMBICIDE_FONTS}
            loading={!loadedImages}
        />
    );
};

export default EquipmentCardBack;
