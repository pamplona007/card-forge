import CardCanvas, { type CardCanvasMouseHandler, type DrawParams } from 'components/canvas/CardCanvas';
import { hexToRgba, ZOMBICIDE_FONTS } from 'components/canvas/cardUtils';
import { useImages } from 'hooks/useImages';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

const BACKGROUND_NAME_MIN_FONT_SIZE = 3;
const BACKGROUND_NAME_MAX_FONT_SIZE = 10;
const BACKGROUND_NAME_GAP_X = 0;
const BACKGROUND_NAME_GAP_Y = 0;
const BACKGROUND_NAME_ALPHA = 0.2;

const generateBackgroundNamePlacements = (
    scale: number,
    card: SurvivorCardData,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D,
): Array<{ fontSize: number; rotation: number; x: number; y: number }> => {
    const text = (card.name || '').toLocaleUpperCase().trim() || 'SURVIVOR';
    const minFontSize = BACKGROUND_NAME_MIN_FONT_SIZE * scale;
    const maxFontSize = BACKGROUND_NAME_MAX_FONT_SIZE * scale;
    const padding = Math.max(1, BACKGROUND_NAME_GAP_X * scale, BACKGROUND_NAME_GAP_Y * scale);
    const margin = Math.max(4, padding * 2);

    const hash = (s: string) => {
        let h = 2166136261;
        for (let i = 0; s.length > i; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
    };

    const seedValue = (
        (hash(card.id) ^ Math.imul(Math.round(minFontSize), 1597334677)) ^
        (hash(text) ^ Math.imul(Math.round(maxFontSize), 2654435761)) ^
        (hash(card.color) ^ Math.imul(width >>> 0, 3812015801))
    ) >>> 0;

    const mulberry32 = (seed: number) => {
        let t = seed >>> 0;
        return () => {
            t += 0x6D2B79F5;
            let r = t;
            r = Math.imul(r ^ (r >>> 15), r | 1);
            r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    };

    const rand = mulberry32(seedValue);
    const rotations = [0, Math.PI / 2];

    const boxes: Array<{ bottom: number; left: number; right: number; top: number }> = [];
    const placements: Array<{ fontSize: number; rotation: number; x: number; y: number }> = [];

    const cellSize = Math.max(20, Math.round(maxFontSize * 0.3));
    const grid = new Map<string, number[]>();
    const cellKey = (cx: number, cy: number) => `${cx},${cy}`;

    const getCellRange = (box: { bottom: number; left: number; right: number; top: number }) => ({
        cx0: Math.floor(box.left / cellSize),
        cx1: Math.floor(box.right / cellSize),
        cy0: Math.floor(box.top / cellSize),
        cy1: Math.floor(box.bottom / cellSize),
    });

    const addToGrid = (box: { bottom: number; left: number; right: number; top: number }, index: number) => {
        const { cx0, cx1, cy0, cy1 } = getCellRange(box);
        for (let cy = cy0; cy1 >= cy; cy++) {
            for (let cx = cx0; cx1 >= cx; cx++) {
                const key = cellKey(cx, cy);
                const list = grid.get(key);
                if (list) {
                    list.push(index);
                } else {
                    grid.set(key, [index]);
                }
            }
        }
    };

    let gridMark = 0;
    const gridSeen: number[] = [];

    const collides = (box: { bottom: number; left: number; right: number; top: number }) => {
        const { cx0, cx1, cy0, cy1 } = getCellRange(box);
        gridMark++;
        for (let cy = cy0; cy1 >= cy; cy++) {
            for (let cx = cx0; cx1 >= cx; cx++) {
                const list = grid.get(cellKey(cx, cy));
                if (!list) {
                    continue;
                }
                for (const idx of list) {
                    if (gridSeen[idx] === gridMark) {
                        continue;
                    }
                    gridSeen[idx] = gridMark;
                    const other = boxes[idx];
                    if (!(
                        box.right < other.left ||
                        box.left > other.right ||
                        box.bottom < other.top ||
                        box.top > other.bottom
                    )) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const withinCanvas = (box: { bottom: number; left: number; right: number; top: number }) => (
        box.left >= -margin && box.top >= -margin && box.right <= (width + margin) && box.bottom <= (height + margin)
    );

    const measureAabb = (fontSize: number, rotationRad: number, x: number, y: number) => {
        ctx.font = `900 ${fontSize}px 'Piklet Caps', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        const metrics = ctx.measureText(text);
        const left = -(metrics.actualBoundingBoxLeft ?? 0);
        const right = metrics.actualBoundingBoxRight ?? metrics.width;
        const ascent = metrics.actualBoundingBoxAscent ?? fontSize;
        const descent = metrics.actualBoundingBoxDescent ?? (fontSize * 0.2);
        const top = -ascent;
        const bottom = descent;

        const sin = Math.sin(rotationRad);
        const cos = Math.cos(rotationRad);
        const corners = [
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom },
        ];

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const p of corners) {
            const rx = (p.x * cos) - (p.y * sin);
            const ry = (p.x * sin) + (p.y * cos);
            minX = Math.min(minX, rx);
            maxX = Math.max(maxX, rx);
            minY = Math.min(minY, ry);
            maxY = Math.max(maxY, ry);
        }

        return { bottom: y + maxY, left: x + minX, right: x + maxX, top: y + minY };
    };

    let remainingAttempts = Math.max(20000, Math.round((height * width) / 400));

    while (0 < remainingAttempts) {
        remainingAttempts--;

        const rotation = rotations[0.3 > rand() ? 1 : 0];
        const x = (rand() * width);
        const y = (rand() * height);

        let fontSize = minFontSize + (rand() * (maxFontSize - minFontSize));
        let shrinkSteps = 0;

        let placed = false;
        while (!placed && 15 > shrinkSteps && minFontSize <= fontSize) {
            const rawBox = measureAabb(fontSize, rotation, x, y);
            const box = {
                bottom: (rawBox.bottom + padding),
                left: (rawBox.left - padding),
                right: (rawBox.right + padding),
                top: (rawBox.top - padding),
            };

            if (withinCanvas(box) && !collides(box)) {
                const index = boxes.length;
                boxes.push(box);
                addToGrid(box, index);
                placements.push({ fontSize, rotation, x, y });
                placed = true;
            } else {
                fontSize *= 0.65;
                shrinkSteps++;
            }
        }
    }

    return placements;
};

function drawBackgroundName(
    ctx: CanvasRenderingContext2D,
    card: SurvivorCardData,
    placements: Array<{ fontSize: number; rotation: number; x: number; y: number }>,
) {
    const text = (card.name || '').toLocaleUpperCase().trim() || 'SURVIVOR';

    ctx.save();
    ctx.fillStyle = hexToRgba(card.color, BACKGROUND_NAME_ALPHA);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    for (const p of placements) {
        ctx.save();
        ctx.font = `900 ${p.fontSize}px 'Piklet Caps', sans-serif`;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    ctx.restore();
}

function drawDescriptions(
    scale: number,
    ctx: CanvasRenderingContext2D,
    card: SurvivorCardData,
    width: number,
    height: number,
    tagDescription?: { text: string; title: string },
) {
    const allDescriptions = [
        ...(tagDescription ? [tagDescription] : []),
        ...(card.descriptions || []),
    ];

    if (0 === allDescriptions.length) {
        return;
    }

    const descriptionBoxX = width * 0.525;
    const descriptionBoxY = height * 0.12;
    const descriptionBoxWidth = width * 0.35;
    const headingSize = 3 * scale;
    const descriptionSize = 2.5 * scale;

    const skewAngle = -0.3;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = `bold ${headingSize}px 'Titling Gothic', sans-serif`;
    const titleMetrics = ctx.measureText('A');
    const titleLineHeight = (titleMetrics.actualBoundingBoxAscent ?? headingSize) + (titleMetrics.actualBoundingBoxDescent ?? 0) + (1 * scale);

    ctx.font = `400 ${descriptionSize}px 'Titling Gothic', sans-serif`;
    const bodyMetrics = ctx.measureText('A');
    const bodyLineHeight = (bodyMetrics.actualBoundingBoxAscent ?? descriptionSize) + (bodyMetrics.actualBoundingBoxDescent ?? 0) + (1 * scale);

    const descPadding = 4 * scale;
    let currentY = descriptionBoxY;
    const descriptionLines: Array<{ text: string; type: 'body' | 'title'; x: number; y: number; }> = [];

    let lineX = descriptionBoxX;

    for (const desc of allDescriptions) {
        if (desc?.title) {
            ctx.font = `bold ${headingSize}px 'Titling Gothic', sans-serif`;
            const distanceFromTop = currentY - descriptionBoxY;
            const angledOffset = distanceFromTop * Math.tan(skewAngle);
            const adjustedX = descriptionBoxX + angledOffset + descPadding;
            descriptionLines.push({ text: desc.title, type: 'title', x: adjustedX, y: currentY });
            currentY += titleLineHeight;
        }

        if (desc?.text) {
            ctx.font = `400 ${descriptionSize}px 'Titling Gothic', sans-serif`;
            const words = desc.text.split(' ');
            let line = '';

            for (const word of words) {
                const testLine = line ? `${line} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                const availableWidth = (descriptionBoxX + descriptionBoxWidth) - lineX;

                const distanceFromTop = currentY - descriptionBoxY;
                const angledOffset = distanceFromTop * Math.tan(skewAngle);
                const adjustedX = descriptionBoxX + angledOffset + descPadding;

                if (metrics.width > availableWidth && line) {
                    descriptionLines.push({ text: line, type: 'body', x: adjustedX, y: currentY });
                    currentY += bodyLineHeight * 0.8;
                    lineX = adjustedX;
                    line = word;
                } else {
                    line = testLine;
                }
            }

            if (line) {
                const distanceFromTop = currentY - descriptionBoxY;
                const angledOffset = distanceFromTop * Math.tan(skewAngle);
                const adjustedX = descriptionBoxX + angledOffset + descPadding;
                descriptionLines.push({ text: line, type: 'body', x: adjustedX, y: currentY });
                currentY += bodyLineHeight;
            }

            currentY += bodyLineHeight * 0.5;
        }
    }

    for (const lineObj of descriptionLines) {
        if ('title' === lineObj.type) {
            ctx.font = `bold ${headingSize}px 'Titling Gothic', sans-serif`;
        } else {
            ctx.font = `400 ${descriptionSize}px 'Titling Gothic', sans-serif`;
        }
        ctx.fillText(lineObj.text, lineObj.x, lineObj.y);
    }

    ctx.restore();
}

const SurvivorCardBack: React.FC<SurvivorCardProps> = ({ bleed, card, exportMode = false, onChangeImagePosition }) => {
    const { t } = useTranslation();
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

    const placementsRef = useRef<{
        cache: Array<{ fontSize: number; rotation: number; x: number; y: number }> | null;
        cacheKey: null | string;
    }>({ cache: null, cacheKey: null });

    const draw = useCallback(({ canvasHeight, canvasWidth, ctx, drawableHeight, drawableWidth, padding, scale }: DrawParams) => {
        if (!loadedImages) {
            return;
        }

        const backgroundNameCacheKey = `${card.id}|${card.name}|${card.color}|${scale}|${canvasWidth}|${canvasHeight}`;

        if (placementsRef.current.cacheKey !== backgroundNameCacheKey) {
            placementsRef.current.cache = generateBackgroundNamePlacements(
                scale,
                card,
                canvasWidth,
                canvasHeight,
                ctx,
            );
            placementsRef.current.cacheKey = backgroundNameCacheKey;
        }
        const placements = placementsRef.current.cache || [];

        ctx.drawImage(
            images.background,
            0,
            0,
            canvasWidth,
            images.background.height * (canvasWidth / images.background.width),
        );

        drawBackgroundName(ctx, card, placements);

        if (images.character) {
            const characterAspectRatio = images.character.width / images.character.height;
            const characterWidth = 40 * ((card.imageScaleBack || 100) / 100) * scale;
            const characterHeight = characterWidth / characterAspectRatio;
            const characterX = (card.imageOffsetXBack || 0) * scale;
            const characterY = (24 * scale) + ((card.imageOffsetYBack || 0) * scale);
            ctx.drawImage(images.character, characterX, characterY, characterWidth, characterHeight);
        }

        const foregroundAspectRatio = images.foreground.width / images.foreground.height;
        const foregroundHeight = drawableHeight * 1.25;
        const foregroundWidth = foregroundHeight * foregroundAspectRatio;
        ctx.drawImage(
            images.foreground,
            canvasWidth - foregroundWidth,
            padding,
            foregroundWidth,
            foregroundHeight,
        );

        const hintAspectRatio = images.hint.width / images.hint.height;
        const hintWidth = drawableWidth;
        const hintHeight = hintWidth / hintAspectRatio;
        ctx.drawImage(
            images.hint,
            padding,
            drawableHeight - hintHeight + padding,
            hintWidth,
            hintHeight,
        );

        ctx.font = `500 ${2 * scale}px 'Titling Gothic', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        if (card.tag) {
            const tagIcon = images[`icon${card.tag.charAt(0).toUpperCase() + card.tag.slice(1)}` as keyof typeof images];
            const tagIconheight = 9 * scale;
            const tagIconWidth = tagIcon ? (tagIcon.height * (tagIconheight / tagIcon.height)) * (tagIcon.width / tagIcon.height) : 0;
            const tagIconLeft = canvasWidth - tagIconWidth - (47 * scale);
            const tagIconTop = 11.5 * scale;
            if (tagIcon) {
                ctx.drawImage(tagIcon, tagIconLeft, tagIconTop, tagIconWidth, tagIconheight);
            }
        }

        const tagDescription = (card.showTagDescription && card.tag)
            ? {
                text: t(`zombicide.tags.${card.tag}.description`),
                title: t(`zombicide.tags.${card.tag}.title`),
            }
            : undefined;

        drawDescriptions(scale, ctx, card, canvasWidth, canvasHeight, tagDescription);
    }, [loadedImages, images, card, t]);

    const handleMouseDown = useCallback<CardCanvasMouseHandler>((e, scale) => {
        if (!images.character) {
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const characterAspectRatio = images.character.width / images.character.height;
        const characterWidth = 40 * ((card.imageScale || 100) / 100) * scale;
        const characterHeight = characterWidth / characterAspectRatio;
        const characterX = (card.imageOffsetXBack || 0) * scale;
        const characterY = (24 * scale) + ((card.imageOffsetYBack || 0) * scale);

        if (
            clickX >= characterX &&
            clickX <= characterX + characterWidth &&
            clickY >= characterY &&
            clickY <= characterY + characterHeight
        ) {
            setDragging(true);
            setDragStart({ x: clickX, y: clickY });
        }
    }, [images.character, card.imageScale, card.imageOffsetXBack, card.imageOffsetYBack]);

    const handleMouseMove = useCallback<CardCanvasMouseHandler>((e, scale) => {
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
    }, [dragging, dragStart, images.character, onChangeImagePosition, card.imageOffsetXBack, card.imageOffsetYBack]);

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

export default SurvivorCardBack;
