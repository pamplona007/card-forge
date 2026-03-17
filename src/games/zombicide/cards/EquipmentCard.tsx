import CardCanvas, { type CardCanvasMouseHandler, type DrawParams } from 'components/canvas/CardCanvas';
import { ZOMBICIDE_FONTS } from 'components/canvas/cardUtils';
import { useImages } from 'hooks/useImages';
import React, { useCallback, useMemo, useState } from 'react';

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
    ammoRed: '/zombicide-2nd/equipments/ammo-red.svg',
    ammoYellow: '/zombicide-2nd/equipments/ammo-yellow.svg',
    backBlue: '/zombicide-2nd/equipments/back-blue.svg',
    backGray: '/zombicide-2nd/equipments/back-gray.svg',
    backRed: '/zombicide-2nd/equipments/back-red.svg',
    bgBlue: '/zombicide-2nd/equipments/bg-blue.svg',
    bgGray: '/zombicide-2nd/equipments/bg-gray.svg',
    bgOrange: '/zombicide-2nd/equipments/bg-orange.svg',
    bgRed: '/zombicide-2nd/equipments/bg-red.svg',
    doorLoud: '/zombicide-2nd/equipments/door-loud.svg',
    doorSilent: '/zombicide-2nd/equipments/door-silent.svg',
    dual: '/zombicide-2nd/equipments/dual.svg',
    stripes: '/zombicide-2nd/equipments/stripes.svg',
    weaponBoth: '/zombicide-2nd/equipments/weapon-both.svg',
    weaponLoud: '/zombicide-2nd/equipments/weapon-loud.svg',
    weaponSilent: '/zombicide-2nd/equipments/weapon-silent.svg',
};

const getDescriptionColor = (card: EquipmentCardData) => {
    switch (card.equipmentType) {
        case 'companion':
            return '#f60';

        case 'equipment':
            return '#08f';

        case 'pimp':
            return '#f00';

        case 'starter':
            return '#888';

        default:
            return '#888';
    }
};

const getBackgroundImage = (card: EquipmentCardData, images: Record<string, HTMLImageElement>) => {
    switch (card.equipmentType) {
        case 'companion':
            return images.bgOrange;

        case 'equipment':
            return images.bgBlue;

        case 'pimp':
            return images.bgRed;

        case 'starter':
            return images.bgGray;

        default:
            return images.bgGray;
    }
};

const getDoorImage = (card: EquipmentCardData, images: Record<string, HTMLImageElement>) => {
    if ('loud' === card.opensDoors) {
        return images.doorLoud;
    }

    if ('silent' === card.opensDoors) {
        return images.doorSilent;
    }

    return null;
};

const getWeaponImage = (card: EquipmentCardData, images: Record<string, HTMLImageElement>) => {
    if ('both' === card.weapon) {
        return images.weaponBoth;
    }

    if ('loud' === card.weapon) {
        return images.weaponLoud;
    }

    if ('silent' === card.weapon) {
        return images.weaponSilent;
    }

    return null;
};

function drawCenteredText({ ctx, fontSize, paddingTop, text }: { ctx: CanvasRenderingContext2D; fontSize: number; paddingTop: number; scale: number; text: string; }) {
    const topOffset = 0;

    ctx.save();
    ctx.font = `900 ${fontSize}px 'Piklet Caps', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const textWidth = ctx.measureText(text).width;
    ctx.translate((ctx.canvas.width - textWidth) / 2, paddingTop);
    ctx.fillText(text, 0, topOffset);
    ctx.restore();
}

const EquipmentCardFront: React.FC<EquipmentCardProps> = ({ bleed, card, exportMode = false, onChangeImagePosition }) => {
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState<null | { x: number; y: number }>(null);

    const imageUrls = useMemo(() => ({
        ...EQUIPMENT_ASSET_URLS,
        equipment: card.image || '',
    }), [card.image]);

    const { images, loaded: loadedImages } = useImages(imageUrls);

    const draw = useCallback(({ canvasHeight, canvasWidth, ctx, drawableHeight, drawableWidth, padding, scale }: DrawParams) => {
        if (!loadedImages) {
            return;
        }

        const backgroundImage = getBackgroundImage(card, images);
        const doorImage = getDoorImage(card, images);
        const weaponImage = getWeaponImage(card, images);

        ctx.drawImage(backgroundImage, padding, padding, drawableWidth, backgroundImage.height * (drawableWidth / backgroundImage.width));

        if (images.equipment) {
            const equipmentAspectRatio = images.equipment.width / images.equipment.height;
            const equipmentWidth = 40 * ((card.imageScale || 100) / 100) * scale;
            const equipmentHeight = equipmentWidth / equipmentAspectRatio;
            const equipmentX = ((canvasWidth - equipmentWidth) / 2) + ((card.imageOffsetX || 0) * scale);
            const equipmentY = (2 * scale) + ((card.imageOffsetY || 0) * scale);

            ctx.drawImage(images.equipment, equipmentX, equipmentY, equipmentWidth, equipmentHeight);
        }

        drawCenteredText({
            ctx,
            fontSize: 6.5 * scale,
            paddingTop: 13 * scale,
            scale,
            text: card.name,
        });

        if (card.flavorText) {
            drawCenteredText({
                ctx,
                fontSize: 4 * scale,
                paddingTop: 16.5 * scale,
                scale,
                text: card.flavorText,
            });
        }

        if (doorImage) {
            const width = 15 * scale;
            const doorY = card.dualWield ? (26 * scale) + padding : (18 * scale) + padding;
            ctx.drawImage(doorImage, padding, doorY, width, doorImage.height * (width / doorImage.width));
        }

        if (card.dualWield) {
            const width = 12 * scale;
            const dualY = (16 * scale) + padding;
            ctx.drawImage(images.dual, padding, dualY, width, images.dual.height * (width / images.dual.width));
        }

        if (weaponImage || card.description) {
            const words = card.description.split(' ');
            const lineHeight = 3.5 * scale;
            const maxLineWidth = drawableWidth * 0.7;
            const lines: string[] = [];
            const innerPadding = drawableWidth * 0.12;

            ctx.save();
            ctx.fillStyle = '#000';
            ctx.font = `400 ${3 * scale}px 'Titling Gothic', sans-serif`;
            ctx.textBaseline = 'bottom';

            for (const word of words) {
                const testLine = [...lines.slice(-1), word].join(' ');
                const testLineWidth = ctx.measureText(testLine).width;

                if (testLineWidth > maxLineWidth && 0 < lines.length) {
                    lines.push(word);
                } else if (0 === lines.length) {
                    lines.push(word);
                } else {
                    lines[lines.length - 1] = testLine;
                }
            }

            const linesHeight = lines.length * lineHeight;
            const width = 30 * scale;
            const height = weaponImage ? weaponImage.height * (width / weaponImage.width) : 0;
            const weaponsPadding = (weaponImage && height) ? height - (4 * scale) : 0;
            const totalContentHeight = linesHeight + innerPadding + weaponsPadding;

            ctx.translate(padding, padding);

            ctx.beginPath();
            ctx.rect(0, drawableHeight - totalContentHeight, drawableWidth, drawableHeight);
            ctx.clip();

            ctx.fillStyle = getDescriptionColor(card);
            ctx.fillRect(0, 0, drawableWidth, drawableHeight);
            ctx.drawImage(images.stripes, 0, 0, drawableWidth, drawableHeight);
            ctx.fillRect(innerPadding, 0, drawableWidth - (2 * innerPadding), drawableHeight - innerPadding);

            ctx.fillStyle = '#000';
            lines.forEach((line, index) => {
                const lineWidth = ctx.measureText(line).width;
                ctx.fillText(line, (drawableWidth - lineWidth) / 2, drawableHeight - padding - linesHeight + (index * lineHeight));
            });
            ctx.restore();

            if (weaponImage) {
                const weaponY = canvasHeight - padding - linesHeight - innerPadding - height;
                const weaponX = (ctx.canvas.width - width) / 2;
                ctx.drawImage(weaponImage, weaponX, weaponY, width, height);
            }
        }
    }, [loadedImages, images, card]);

    const handleMouseDown = useCallback<CardCanvasMouseHandler>((e, scale) => {
        if (!images.equipment) {
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const canvasWidth = e.currentTarget.width;

        const equipmentAspectRatio = images.equipment.width / images.equipment.height;
        const equipmentWidth = 40 * ((card.imageScale || 100) / 100) * scale;
        const equipmentHeight = equipmentWidth / equipmentAspectRatio;
        const equipmentX = ((canvasWidth - equipmentWidth) / 2) + ((card.imageOffsetX || 0) * scale);
        const equipmentY = (2 * scale) + ((card.imageOffsetY || 0) * scale);

        if (
            clickX >= equipmentX &&
            clickX <= equipmentX + equipmentWidth &&
            clickY >= equipmentY &&
            clickY <= equipmentY + equipmentHeight
        ) {
            setDragging(true);
            setDragStart({ x: clickX, y: clickY });
        }
    }, [images.equipment, card.imageScale, card.imageOffsetX, card.imageOffsetY]);

    const handleMouseMove = useCallback<CardCanvasMouseHandler>((e, scale) => {
        if (!dragging || !dragStart || !images.equipment) {
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const offsetX = (currentX - dragStart.x) / scale;
        const offsetY = (currentY - dragStart.y) / scale;

        onChangeImagePosition?.((card.imageOffsetX || 0) + offsetX, (card.imageOffsetY || 0) + offsetY);
        setDragStart({ x: currentX, y: currentY });
    }, [dragging, dragStart, images.equipment, onChangeImagePosition, card.imageOffsetX, card.imageOffsetY]);

    const handleMouseUp = useCallback<CardCanvasMouseHandler>(() => {
        setDragging(false);
    }, []);

    return (
        <CardCanvas
            bleed={bleed}
            cardDimensions={MINI_USA_CARD_DIMENSIONS}
            cursor={onChangeImagePosition ? 'move' : 'default'}
            draw={draw}
            exportMode={exportMode}
            fonts={ZOMBICIDE_FONTS}
            loading={!loadedImages}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        />
    );
};

export default EquipmentCardFront;
