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

const BACKGROUND_NAME_MIN_FONT_SIZE = 3;
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
) {
    if (!card.descriptions || 0 === card.descriptions.length) {
        return;
    }

    const descriptionBoxX = width * 0.525;
    const descriptionBoxY = height * 0.12;
    const descriptionBoxWidth = width * 0.34;
    // Angle of the background image diagonal
    const skewAngle = -0.3;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Calculate line heights based on fonts
    ctx.font = `bold ${3 * scale}px 'Titling Gothic', sans-serif`;
    const titleMetrics = ctx.measureText('A');
    const titleLineHeight = (titleMetrics.actualBoundingBoxAscent ?? 3 * scale) + (titleMetrics.actualBoundingBoxDescent ?? 0) + (1 * scale);

    ctx.font = `400 ${2 * scale}px 'Titling Gothic', sans-serif`;
    const bodyMetrics = ctx.measureText('A');
    const bodyLineHeight = (bodyMetrics.actualBoundingBoxAscent ?? 2 * scale) + (bodyMetrics.actualBoundingBoxDescent ?? 0) + (1 * scale);

    const descPadding = 4 * scale;
    let currentY = descriptionBoxY;
    const descriptionLines: Array<{ text: string; type: 'body' | 'title'; x: number; y: number; }> = [];

    for (const desc of card.descriptions) {
        if (desc.title) {
            ctx.font = `bold ${3 * scale}px 'Titling Gothic', sans-serif`;
            const distanceFromTop = currentY - descriptionBoxY;
            const angledOffset = distanceFromTop * Math.tan(skewAngle);
            const adjustedX = descriptionBoxX + angledOffset + descPadding;
            descriptionLines.push({ text: desc.title, type: 'title', x: adjustedX, y: currentY });
            currentY += titleLineHeight;
        }

        if (desc.text) {
            ctx.font = `400 ${2 * scale}px 'Titling Gothic', sans-serif`;
            const words = desc.text.split(' ');
            let line = '';
            let lineX = descriptionBoxX;

            for (const word of words) {
                const testLine = line ? `${line} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                const availableWidth = (descriptionBoxX + descriptionBoxWidth) - lineX;

                // Calculate the angled boundary at the current Y position
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

    // Draw all lines
    for (const lineObj of descriptionLines) {
        if ('title' === lineObj.type) {
            ctx.font = `bold ${3 * scale}px 'Titling Gothic', sans-serif`;
        } else {
            ctx.font = `400 ${2 * scale}px 'Titling Gothic', sans-serif`;
        }
        ctx.fillText(lineObj.text, lineObj.x, lineObj.y);
    }

    ctx.restore();
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
    const placementsRef = useRef<{
        cache: Array<{ fontSize: number; rotation: number; x: number; y: number }> | null;
        cacheKey: null | string;
    }>({ cache: null, cacheKey: null });

    const padding = dimensions.width * 0.05;
    const availableWidth = dimensions.width - (padding * 2);

    const scale = useMemo(() => {
        return availableWidth / (SURVIVOR_CARD_DIMENSIONS.width + (SURVIVOR_CARD_DIMENSIONS.bleed * 2));
    }, [availableWidth]);

    const backgroundNameCacheKey = useMemo(() => {
        return `${card.id}|${card.name}|${card.color}|${scale}|${dimensions.width}|${dimensions.height}`;
    }, [card.id, card.name, card.color, scale, dimensions.width, dimensions.height]);

    const updateCard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !loadedImages) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        if (placementsRef.current.cacheKey !== backgroundNameCacheKey) {
            placementsRef.current.cache = generateBackgroundNamePlacements(
                scale,
                card,
                canvas.width,
                canvas.height,
                ctx,
            );
            placementsRef.current.cacheKey = backgroundNameCacheKey;
        }
        const placements = placementsRef.current.cache || [];

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

        drawBackgroundName(ctx, card, placements);

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

        drawDescriptions(scale, ctx, card, dimensions.width, dimensions.height);
    }, [dimensions, loadedImages, images, card, bleed, scale, padding, backgroundNameCacheKey]);

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
