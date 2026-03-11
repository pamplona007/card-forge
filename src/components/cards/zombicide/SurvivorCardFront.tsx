import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useImages } from '../../../hooks/useImages';
import {
    type CardProps,
    SURVIVOR_CARD_DIMENSIONS,
    type SurvivorCardData,
} from '../../../types/zombicide-card';

interface SurvivorCardProps extends CardProps {
    bleed?: boolean;
    card: SurvivorCardData;
    onChangeImagePosition?: (offsetX: number, offsetY: number) => void;
}

const loadSingleFont = async (family: string, url: string, descriptors: object, weightCheck: string) => {
    let loaded = false;
    try {
        const face = new FontFace(family, `url(${url})`, {
            ...descriptors,
            display: 'block',
        });
        await face.load();
        document.fonts.add(face);
        loaded = true;
    } catch (err) {
        console.warn(`Failed to load font ${family} from ${url}`, err);
    }

    try {
        await document.fonts.ready;
        await document.fonts.load(weightCheck);
    } catch (err) {
        console.warn(`Font ready check failed for ${family}`, err);
    }

    const check =
        document.fonts.check(weightCheck) ||
        document.fonts.check(`1em "${family}"`);

    return loaded || check;
};

loadSingleFont(
    'Piklet Caps',
    '/fonts/piklet-caps-clean.otf',
    { style: 'normal', weight: '900' },
    '900 270px "Piklet Caps"',
);

loadSingleFont(
    'Titling Gothic',
    '/fonts/TITLINGGOTHICFBCOMP-MEDIUM.TTF',
    { style: 'normal', weight: '500' },
    '500 38px "Titling Gothic"',
);

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const createClipWithoutBleed = (ctx: CanvasRenderingContext2D, scale: number, padding: number) => {
    const borderRadius = SURVIVOR_CARD_DIMENSIONS.borderRadius * scale;
    const bleed = SURVIVOR_CARD_DIMENSIONS.bleed * scale;
    const width = SURVIVOR_CARD_DIMENSIONS.width * scale;
    const height = SURVIVOR_CARD_DIMENSIONS.height * scale;
    const left = padding + bleed;
    const top = padding + bleed;
    const bottom = top + height;
    const right = left + width;

    ctx.beginPath();
    ctx.moveTo(left + borderRadius, top);
    ctx.lineTo(right - borderRadius, top);
    ctx.quadraticCurveTo(right, top, right, top + borderRadius);
    ctx.lineTo(right, bottom - borderRadius);
    ctx.quadraticCurveTo(right, bottom, right - borderRadius, bottom);
    ctx.lineTo(left + borderRadius, bottom);
    ctx.quadraticCurveTo(left, bottom, left, bottom - borderRadius);
    ctx.lineTo(left, top + borderRadius);
    ctx.quadraticCurveTo(left, top, left + borderRadius, top);
    ctx.clip();
};

const createClipWithBleed = (ctx: CanvasRenderingContext2D, scale: number, padding: number) => {
    const bleed = SURVIVOR_CARD_DIMENSIONS.bleed * scale;
    const width = SURVIVOR_CARD_DIMENSIONS.width * scale;
    const height = SURVIVOR_CARD_DIMENSIONS.height * scale;
    const widthWithBleed = width + (bleed * 2);
    const heightWithBleed = height + (bleed * 2);
    const left = padding + bleed;
    const top = padding + bleed;
    const bottom = top + height;
    const right = left + width;

    const bottomBleed = padding + heightWithBleed;
    const rightBleed = padding + widthWithBleed;

    const bottom0 = (padding * 2) + heightWithBleed;
    const right0 = (padding * 2) + widthWithBleed;

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, 0);
    ctx.moveTo(right, top);
    ctx.lineTo(right, 0);
    ctx.moveTo(left, bottom);
    ctx.lineTo(left, bottom0);
    ctx.moveTo(right, bottom);
    ctx.lineTo(right, bottom0);
    ctx.moveTo(left, top);
    ctx.lineTo(0, top);
    ctx.moveTo(left, bottom);
    ctx.lineTo(0, bottom);
    ctx.moveTo(right, top);
    ctx.lineTo(right0, top);
    ctx.moveTo(right, bottom);
    ctx.lineTo(right0, bottom);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(rightBleed, padding);
    ctx.lineTo(rightBleed, bottomBleed);
    ctx.lineTo(padding, bottomBleed);
    ctx.closePath();
    ctx.clip();
};

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
    const [dimensions, setDimensions] = useState(() => {
        if (exportMode) {
            const { height, width } = SURVIVOR_CARD_DIMENSIONS.pxCanvasDimensions(12);

            return {
                height,
                width,
            };
        }
        return { height: 0, width: 0 };
    });

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

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const padding = dimensions.width * 0.05;
    const availableWidth = dimensions.width - (padding * 2);

    const scale = useMemo(() => {
        return availableWidth / (SURVIVOR_CARD_DIMENSIONS.width + (SURVIVOR_CARD_DIMENSIONS.bleed * 2));
    }, [availableWidth]);

    const updateCard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !loadedImages) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        if (bleed) {
            createClipWithBleed(ctx, scale, padding);
        } else {
            createClipWithoutBleed(ctx, scale, padding);
        }

        ctx.drawImage(images.background, 0, 0, dimensions.width, images.background.height * (dimensions.width / images.background.width));

        drawBackgroundName(scale, ctx, card);
        drawForegroundName(scale, ctx, card);

        if (images.character) {
            const characterAspectRatio = images.character.width / images.character.height;
            const characterWidth = 40 * ((card.imageScale || 100) / 100) * scale;
            const characterHeight = characterWidth / characterAspectRatio;
            const characterX = ((dimensions.width - characterWidth) + ((card.imageOffsetX || 0) * scale)) || ((dimensions.width - characterWidth) / 2);
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

        const availableHeight = ((SURVIVOR_CARD_DIMENSIONS.height + (SURVIVOR_CARD_DIMENSIONS.bleed * 2)) * scale) + padding;
        const hpWidth = 16 * scale;
        const hpImages = [images.hp1, images.hp2, images.hp3, images.hp4, images.hp5, images.hp6];
        const hpImage = hpImages[Math.max(0, Math.min(card.health || 0, hpImages.length)) - 1];
        const hpLeft = dimensions.width - hpWidth - (2.5 * scale);

        if (hpImage) {
            const hpImageTop = availableHeight - (hpImage.height * (hpWidth / hpImage.width)) - (5 * scale);
            ctx.drawImage(hpImage, hpLeft, hpImageTop, hpWidth, hpImage.height * (hpWidth / hpImage.width));
        }

        const tagIconWidth = 11 * scale;
        const tagIconLeft = dimensions.width - tagIconWidth - (11 * scale);
        const tagIconTop = 11.5 * scale;

        if (card.tag) {
            const tagIcon = images[`icon${card.tag.charAt(0).toUpperCase() + card.tag.slice(1)}` as keyof typeof images];
            if (tagIcon) {
                ctx.drawImage(tagIcon, tagIconLeft, tagIconTop, tagIconWidth, tagIcon.height * (tagIconWidth / tagIcon.width));
            }
        }
    }, [dimensions, loadedImages, images, card, bleed, scale, padding]);

    useEffect(() => {
        if (exportMode) {
            return;
        }

        const updateDimensions = () => {
            if (!canvasRef.current) {
                return;
            }
            setDimensions({
                height: canvasRef.current.clientHeight,
                width: canvasRef.current.clientWidth,
            });
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, [exportMode]);

    useEffect(() => {
        updateCard();
    }, [updateCard]);

    return (
        <div>
            <canvas
                height={dimensions.height}
                onMouseDown={(e) => {
                    if (!images.character) {
                        return;
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;

                    const characterAspectRatio = images.character.width / images.character.height;
                    const characterWidth = 40 * ((card.imageScale || 100) / 100) * scale;
                    const characterHeight = characterWidth / characterAspectRatio;
                    const characterX = ((dimensions.width - characterWidth) + ((card.imageOffsetX || 0) * scale)) || ((dimensions.width - characterWidth) / 2);
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
                }}
                onMouseMove={(e) => {
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
                }}
                onMouseUp={() => setDragging(false)}
                ref={canvasRef}
                style={{
                    aspectRatio: '1',
                    cursor: onChangeImagePosition ? 'move' : 'default',
                    width: '100%',
                }}
                width={dimensions.width}
            />
        </div>
    );
};

export default SurvivorCardFront;
