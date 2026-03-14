import CardCanvas, { type CardCanvasMouseHandler, type DrawParams } from 'components/canvas/CardCanvas';
import { hexToRgba, ZOMBICIDE_FONTS } from 'components/canvas/cardUtils';
import { useImages } from 'hooks/useImages';
import React, { useCallback, useMemo, useState } from 'react';

import {
    type CardProps,
    SURVIVOR_CARD_DIMENSIONS,
    type SurvivorCardData,
} from '../types';

interface SurvivorCardProps extends CardProps {
    bleed?: boolean;
    card: SurvivorCardData;
    onChangeImagePosition?: (offsetX: number, offsetY: number) => void;
}

function drawBackgroundName(scale: number, ctx: CanvasRenderingContext2D, card: SurvivorCardData) {
    const fontSize = 19 * scale;
    const x = 8 * scale;
    const y = 24.5 * scale;
    const rotation = -0.086;
    const stretch = 1.1;
    const topOffset = 0;
    const color = card.color;

    ctx.save();
    ctx.font = `900 ${fontSize}px 'Piklet Caps', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(stretch, 1);
    ctx.fillStyle = hexToRgba(color, 0.3);
    ctx.fillText(card.name.toLocaleUpperCase(), 0, topOffset);
    ctx.restore();
}

function drawForegroundName(scale: number, ctx: CanvasRenderingContext2D, card: SurvivorCardData) {
    const fontSize = 6 * scale;
    const x = 13.3 * scale;
    const y = 21 * scale;
    const rotation = -0.086;
    const stretch = 1.1;
    const topOffset = 0;

    ctx.save();
    ctx.font = `900 ${fontSize}px 'Piklet Caps', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(stretch, 1);
    ctx.fillText(card.name.toLocaleUpperCase(), 0, topOffset);
    ctx.restore();
}

const calculateTrackX = (trackWidth: number, scale: number, abilityName: string, ctx: CanvasRenderingContext2D) => {
    const baseX = (16.5 * scale) - trackWidth;
    const padding = 1.8 * scale;
    const textMetrics = ctx.measureText(abilityName.toLocaleUpperCase());
    return baseX + textMetrics.width + padding;
};

const SurvivorCardFront: React.FC<SurvivorCardProps> = ({ bleed, card, exportMode = false, onChangeImagePosition }) => {
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState<null | { x: number; y: number }>(null);

    const imageUrls = useMemo(() => ({
        arrows: '/zombicide-2nd/survivor/arrows.png',
        background: '/zombicide-2nd/survivor/card-background.png',
        blue: '/zombicide-2nd/survivor/track-blue.png',
        character: card.image || '',
        hp1: '/zombicide-2nd/survivor/hp-1.png',
        hp2: '/zombicide-2nd/survivor/hp-2.png',
        hp3: '/zombicide-2nd/survivor/hp-3.png',
        hp4: '/zombicide-2nd/survivor/hp-4.png',
        hp5: '/zombicide-2nd/survivor/hp-5.png',
        hp6: '/zombicide-2nd/survivor/hp-6.png',
        iconHoliday: '/zombicide-2nd/survivor/holiday-icon.png',
        iconKids: '/zombicide-2nd/survivor/kids-icon.png',
        iconPark: '/zombicide-2nd/survivor/park-icon.png',
        iconPolice: '/zombicide-2nd/survivor/police-icon.png',
        iconSupes: '/zombicide-2nd/survivor/supes-icon.png',
        iconZombvivor: '/zombicide-2nd/survivor/zombvivor-icon.png',
        o1: '/zombicide-2nd/survivor/track-orange-1.png',
        o2: '/zombicide-2nd/survivor/track-orange-2.png',
        r1: '/zombicide-2nd/survivor/track-red-1.png',
        r2: '/zombicide-2nd/survivor/track-red-2.png',
        r3: '/zombicide-2nd/survivor/track-red-3.png',
        yellow: '/zombicide-2nd/survivor/track-yellow.png',
    }), [card.image]);

    const { images, loaded: loadedImages } = useImages(imageUrls);

    const draw = useCallback(({ canvasWidth, ctx, drawableHeight, padding, scale }: DrawParams) => {
        if (!loadedImages) {
            return;
        }

        ctx.drawImage(images.background, 0, 0, canvasWidth, images.background.height * (canvasWidth / images.background.width));

        drawBackgroundName(scale, ctx, card);
        drawForegroundName(scale, ctx, card);

        if (images.character) {
            const characterAspectRatio = images.character.width / images.character.height;
            const characterWidth = 40 * ((card.imageScale || 100) / 100) * scale;
            const characterHeight = characterWidth / characterAspectRatio;
            const characterX = ((canvasWidth - characterWidth) + ((card.imageOffsetX || 0) * scale)) || ((canvasWidth - characterWidth) / 2);
            const characterY = (24 * scale) + (11 * scale) + (5 * scale) + ((card.imageOffsetY || 0) * scale);

            ctx.drawImage(images.character, characterX, characterY, characterWidth, characterHeight);
        }

        const trackHeight = 5.7 * scale;
        const trackGap = 2.08 * scale;
        const blueTrackWidth = images.blue.width * (trackHeight / images.blue.height);
        const yellowTrackWidth = images.yellow.width * (trackHeight / images.yellow.height);
        const o1TrackWidth = images.o1.width * (trackHeight / images.o1.height);
        const o2TrackWidth = images.o2.width * (trackHeight / images.o2.height);
        const r1TrackWidth = images.r1.width * (trackHeight / images.r1.height);
        const r2TrackWidth = images.r2.width * (trackHeight / images.r2.height);
        const r3TrackWidth = images.r3.width * (trackHeight / images.r3.height);

        const arrowsTop = 29 * scale;
        const yellowY = arrowsTop + trackHeight + trackGap;
        const o1Y = yellowY + trackHeight + trackGap;
        const o2Y = o1Y + trackHeight + trackGap;
        const r1Y = o2Y + trackHeight + trackGap;
        const r2Y = r1Y + trackHeight + trackGap;
        const r3Y = r2Y + trackHeight + trackGap;

        const abilitiesTextX = 16.5 * scale;

        const abilityTracks = [
            { image: images.blue, name: card.abilities.blue?.name || '', width: blueTrackWidth, y: arrowsTop },
            { image: images.yellow, name: card.abilities.yellow?.name || '', width: yellowTrackWidth, y: yellowY },
            { image: images.o1, name: card.abilities.orange1?.name || '', width: o1TrackWidth, y: o1Y },
            { image: images.o2, name: card.abilities.orange2?.name || '', width: o2TrackWidth, y: o2Y },
            { image: images.r1, name: card.abilities.red1?.name || '', width: r1TrackWidth, y: r1Y },
            { image: images.r2, name: card.abilities.red2?.name || '', width: r2TrackWidth, y: r2Y },
            { image: images.r3, name: card.abilities.red3?.name || '', width: r3TrackWidth, y: r3Y },
        ];

        const maxFontSize = 3.2 * scale;
        const minFontSize = 2.8 * scale;
        const minTextLength = 10;
        const maxTextLength = 20;

        ctx.font = `500 ${2 * scale}px 'Titling Gothic', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        function calculateFontSize(length: number) {
            if (length <= minTextLength) {
                return maxFontSize;
            }
            if (length >= maxTextLength) {
                return minFontSize;
            }
            return maxFontSize - (((length - minTextLength) / (maxTextLength - minTextLength)) * (maxFontSize - minFontSize));
        }

        abilityTracks.forEach((track) => {
            const fontSize = calculateFontSize(track.name.length);
            ctx.font = `500 ${fontSize}px 'Titling Gothic', sans-serif`;
            ctx.drawImage(track.image, calculateTrackX(track.width, scale, track.name, ctx), track.y, track.width, trackHeight);
            ctx.fillText(track.name.toLocaleUpperCase(), abilitiesTextX, track.y + ((trackHeight - (1 * scale)) / 2) + (fontSize / 2));
        });

        const arrowsWidth = 13 * scale;
        const arrowsLeft = 2.5 * scale;
        ctx.drawImage(images.arrows, arrowsLeft, arrowsTop, arrowsWidth, images.arrows.height * (arrowsWidth / images.arrows.width));

        const hpWidth = 16 * scale;
        const hpImages = [images.hp1, images.hp2, images.hp3, images.hp4, images.hp5, images.hp6];
        const hpImage = hpImages[Math.max(0, Math.min(card.health || 0, hpImages.length)) - 1];
        const hpLeft = canvasWidth - hpWidth - (2.5 * scale);

        if (hpImage) {
            const hpImageTop = (drawableHeight + padding) - (hpImage.height * (hpWidth / hpImage.width)) - (5 * scale);
            ctx.drawImage(hpImage, hpLeft, hpImageTop, hpWidth, hpImage.height * (hpWidth / hpImage.width));
        }

        if (card.tag) {
            const tagIcon = images[`icon${card.tag.charAt(0).toUpperCase() + card.tag.slice(1)}` as keyof typeof images];
            const tagIconheight = 10 * scale;
            const tagIconWidth = tagIcon ? (tagIcon.height * (tagIconheight / tagIcon.height)) * (tagIcon.width / tagIcon.height) : 0;
            const tagIconLeft = canvasWidth - tagIconWidth - (11 * scale);
            const tagIconTop = 11.5 * scale;
            if (tagIcon) {
                ctx.drawImage(tagIcon, tagIconLeft, tagIconTop, tagIconWidth, tagIconheight);
            }
        }
    }, [loadedImages, images, card]);

    const handleMouseDown = useCallback<CardCanvasMouseHandler>((e, scale) => {
        if (!images.character) {
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const canvasWidth = e.currentTarget.width;

        const characterAspectRatio = images.character.width / images.character.height;
        const characterWidth = 40 * ((card.imageScale || 100) / 100) * scale;
        const characterHeight = characterWidth / characterAspectRatio;
        const characterX = ((canvasWidth - characterWidth) + ((card.imageOffsetX || 0) * scale)) || ((canvasWidth - characterWidth) / 2);
        const characterY = (24 * scale) + (11 * scale) + (5 * scale) + ((card.imageOffsetY || 0) * scale);

        if (
            clickX >= characterX &&
            clickX <= characterX + characterWidth &&
            clickY >= characterY &&
            clickY <= characterY + characterHeight
        ) {
            setDragging(true);
            setDragStart({ x: clickX, y: clickY });
        }
    }, [images.character, card.imageScale, card.imageOffsetX, card.imageOffsetY]);

    const handleMouseMove = useCallback<CardCanvasMouseHandler>((e, scale) => {
        if (!dragging || !dragStart || !images.character) {
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const offsetX = (currentX - dragStart.x) / scale;
        const offsetY = (currentY - dragStart.y) / scale;

        onChangeImagePosition?.((card.imageOffsetX || 0) + offsetX, (card.imageOffsetY || 0) + offsetY);
        setDragStart({ x: currentX, y: currentY });
    }, [dragging, dragStart, images.character, onChangeImagePosition, card.imageOffsetX, card.imageOffsetY]);

    const handleMouseUp = useCallback<CardCanvasMouseHandler>(() => {
        setDragging(false);
    }, []);

    return (
        <CardCanvas
            bleed={bleed}
            cardDimensions={SURVIVOR_CARD_DIMENSIONS}
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

export default SurvivorCardFront;
