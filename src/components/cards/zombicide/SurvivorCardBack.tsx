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

const BACKGROUND_NAME_MIN_FONT_SIZE = 4;
const BACKGROUND_NAME_MAX_FONT_SIZE = 10;
const BACKGROUND_NAME_GAP_X = 0;
const BACKGROUND_NAME_GAP_Y = 0;
const BACKGROUND_NAME_ALPHA = 0.2;

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
    const text = (card.name || '').toLocaleUpperCase().trim() || 'SURVIVOR';
    const color = card.color;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    let state = 1;
    const seedSource = `${card.id}-${text}-${color}`;
    for (let i = 0; i < seedSource.length; i++) {
        state = ((state * 31) + seedSource.charCodeAt(i)) % 2147483647;
    }
    if (0 === state) {
        state = 1;
    }

    const minFontSize = BACKGROUND_NAME_MIN_FONT_SIZE * scale;
    const maxFontSize = BACKGROUND_NAME_MAX_FONT_SIZE * scale;
    const gapX = BACKGROUND_NAME_GAP_X * scale;
    const gapY = BACKGROUND_NAME_GAP_Y * scale;
    const gap = Math.max(gapX, gapY);

    ctx.save();
    ctx.font = `900 ${maxFontSize}px 'Piklet Caps', sans-serif`;
    ctx.restore();

    const placedRects: Array<{ bottom: number; left: number; right: number; top: number }> = [];

    const overlaps = (left: number, top: number, right: number, bottom: number) => {
        for (const placed of placedRects) {
            if (left < placed.right && right > placed.left && top < placed.bottom && bottom > placed.top) {
                return true;
            }
        }
        return false;
    };

    let availableCoordinates: Array<[number, number]> = [[0, 0]];

    const sanitizeCoodinates = () => {
        availableCoordinates = availableCoordinates.filter(([x, y]) => {
            return x < width || y < height;
        });
    };

    while (0 < availableCoordinates.length) {
        const index = Math.floor(state / 31) % availableCoordinates.length;
        const [x, y] = availableCoordinates[index];
        availableCoordinates.splice(index, 1);

        ctx.font = `900 ${maxFontSize}px 'Piklet Caps', sans-serif`;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;

        if (textWidth > width || textHeight > height) {
            continue;
        }

        const left = x;
        const top = y;
        const right = left + textWidth;
        const bottom = top + textHeight;

        if (0 > left || right > width || 0 > top || bottom > height) {
            continue;
        }

        if (overlaps(left - gap, top - gap, right + gap, bottom + gap)) {
            continue;
        }

        ctx.fillStyle = hexToRgba(color, BACKGROUND_NAME_ALPHA);
        ctx.fillText(text, x, bottom);

        placedRects.push({ bottom, left, right, top });

        availableCoordinates.push([right, top]);
        availableCoordinates.push([left, bottom]);

        sanitizeCoodinates();
    }
}

const SurvivorCardBack: React.FC<SurvivorCardProps> = ({ bleed, card, exportMode = false, onChangeImagePosition }) => {
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
        background: '/zombicide-2nd/survivor/card-back.png',
        character: card.image || '',
        foreground: '/zombicide-2nd/survivor/card-back-foreground.png',
        hint: '/zombicide-2nd/survivor/card-back-hint.png',
        iconHoliday: '/zombicide-2nd/survivor/holiday-icon.png',
        iconKids: '/zombicide-2nd/survivor/kids-icon.png',
        iconPark: '/zombicide-2nd/survivor/park-icon.png',
        iconPolice: '/zombicide-2nd/survivor/police-icon.png',
        iconSupes: '/zombicide-2nd/survivor/supes-icon.png',
        iconZombvivor: '/zombicide-2nd/survivor/zombvivor-icon.png',
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
        const availableHeight = (SURVIVOR_CARD_DIMENSIONS.height + (SURVIVOR_CARD_DIMENSIONS.bleed * 2)) * scale;
        const availableWidth = (SURVIVOR_CARD_DIMENSIONS.width + (SURVIVOR_CARD_DIMENSIONS.bleed * 2)) * scale;

        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        if (bleed) {
            createClipWithBleed(ctx, scale, padding);
        } else {
            createClipWithoutBleed(ctx, scale, padding);
        }

        ctx.drawImage(
            images.background,
            0,
            0,
            dimensions.width,
            images.background.height * (dimensions.width / images.background.width),
        );

        drawBackgroundName(scale, ctx, card);

        if (images.character) {
            const characterAspectRatio = images.character.width / images.character.height;
            const characterWidth = 40 * ((card.imageScaleBack || 100) / 100) * scale;
            const characterHeight = characterWidth / characterAspectRatio;
            const characterX = ((dimensions.width - characterWidth) + ((card.imageOffsetXBack || 0) * scale)) || ((dimensions.width - characterWidth) / 2);
            const characterY = (24 * scale) + (11 * scale) + (5 * scale) + ((card.imageOffsetYBack || 0) * scale);
            ctx.drawImage(images.character, characterX, characterY, characterWidth, characterHeight);
        }

        const foregroundAspectRatio = images.foreground.width / images.foreground.height;
        const foregroundHeight = availableHeight * 1.25;
        const foregroundWidth = foregroundHeight * foregroundAspectRatio;
        ctx.drawImage(
            images.foreground,
            dimensions.width - foregroundWidth,
            padding,
            foregroundWidth,
            foregroundHeight,
        );

        const hintAspectRatio = images.hint.width / images.hint.height;
        const hintWidth = availableWidth;
        const hintHeight = hintWidth / hintAspectRatio;
        ctx.drawImage(
            images.hint,
            padding,
            availableHeight - hintHeight + padding,
            hintWidth,
            hintHeight,
        );

        ctx.font = `500 ${2 * scale}px 'Titling Gothic', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

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
                    const characterX = ((dimensions.width - characterWidth) + ((card.imageOffsetXBack || 0) * scale)) || ((dimensions.width - characterWidth) / 2);
                    const characterY = (24 * scale) + (11 * scale) + (5 * scale) + ((card.imageOffsetYBack || 0) * scale);

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

                    onChangeImagePosition?.((card.imageOffsetXBack || 0) + offsetX, (card.imageOffsetYBack || 0) + offsetY);
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

export default SurvivorCardBack;
