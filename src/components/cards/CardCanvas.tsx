import { Box } from '@radix-ui/themes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CardDimensions, SURVIVOR_CARD_DIMENSIONS } from '../../types/zombicide-card';
import { hexToRgba } from './cardUtils';

const loadSingleFont = async (
    family: string,
    url: string,
    descriptors: object,
    weightCheck: string,
) => {
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

const createClipWithoutBleed = (ctx: CanvasRenderingContext2D, dims: CardDimensions, scale: number, padding: number) => {
    const borderRadius = dims.borderRadius * scale;
    const bleed = dims.bleed * scale;
    const width = dims.width * scale;
    const height = dims.height * scale;
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

const createClipWithBleed = (ctx: CanvasRenderingContext2D, dims: CardDimensions, scale: number, padding: number) => {
    const bleed = dims.bleed * scale;
    const width = dims.width * scale;
    const height = dims.height * scale;
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

/** Mouse handler that also receives the current scale so consumers can do
 *  hit-testing in canvas coordinates without needing to re-derive scale. */
export type CardCanvasMouseHandler = (
    e: React.MouseEvent<HTMLCanvasElement>,
    scale: number,
) => void;

export interface CardCanvasProps {
    /** Draw with the bleed area visible / include cut-marks. */
    bleed?: boolean;
    /** Card size definition. Defaults to SURVIVOR_CARD_DIMENSIONS. */
    cardDimensions?: CardDimensions;
    /** CSS cursor style for the canvas element. */
    cursor?: string;
    /**
     * Drawing callback executed on every render cycle after the clip path is
     * set up. Wrap in `useCallback` so the canvas only redraws when your card
     * data actually changes.
     */
    draw: (params: DrawParams) => void;
    /**
     * When true the canvas is initialised at the card's full print resolution
     * immediately (no resize listener). Dimensions are derived from
     * `cardDimensions.pxCanvasDimensions(12)`.
     */
    exportMode?: boolean;
    onMouseDown?: CardCanvasMouseHandler;
    onMouseMove?: CardCanvasMouseHandler;
    onMouseUp?: CardCanvasMouseHandler;
}

/** Values and helpers provided to the draw callback. */
export interface DrawParams {
    /** Canvas height in pixels (includes padding on both sides). */
    canvasHeight: number;
    /** Canvas width in pixels (includes padding on both sides). */
    canvasWidth: number;
    /** The 2D rendering context, ready to draw onto (clip already applied). */
    ctx: CanvasRenderingContext2D;
    /** Height of the drawable area (height + 2*bleed) in pixels. */
    drawableHeight: number;
    /** Width of the drawable area (width + 2*bleed) in pixels. */
    drawableWidth: number;
    /** Convert a hex color string to an rgba() string with the given alpha. */
    hexToRgba: (hex: string, alpha: number) => string;
    /** Canvas padding in pixels. */
    padding: number;
    /** Pixels per millimetre — multiply mm values by scale to get px. */
    scale: number;
}

const CardCanvas: React.FC<CardCanvasProps> = ({
    bleed,
    cardDimensions = SURVIVOR_CARD_DIMENSIONS,
    cursor,
    draw,
    exportMode = false,
    onMouseDown,
    onMouseMove,
    onMouseUp,
}) => {
    const [dimensions, setDimensions] = useState(() => {
        if (exportMode) {
            return cardDimensions.pxCanvasDimensions(12);
        }
        return { height: 0, width: 0 };
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const padding = useMemo(
        () => dimensions.width * cardDimensions.canvasPaddingPercent,
        [dimensions.width, cardDimensions.canvasPaddingPercent],
    );

    const scale = useMemo(
        () => (dimensions.width - (padding * 2)) / cardDimensions.totalWidth,
        [dimensions.width, padding, cardDimensions.totalWidth],
    );

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

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        ctx.save();

        if (bleed) {
            createClipWithBleed(ctx, cardDimensions, scale, padding);
        } else {
            createClipWithoutBleed(ctx, cardDimensions, scale, padding);
        }

        const drawableWidth = (cardDimensions.width + (cardDimensions.bleed * 2)) * scale;
        const drawableHeight = (cardDimensions.height + (cardDimensions.bleed * 2)) * scale;

        draw({
            canvasHeight: dimensions.height,
            canvasWidth: dimensions.width,
            ctx,
            drawableHeight,
            drawableWidth,
            hexToRgba,
            padding,
            scale,
        });

        ctx.restore();
    }, [bleed, cardDimensions, dimensions, draw, padding, scale]);

    useEffect(() => {
        render();
    }, [render]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => onMouseDown?.(e, scale),
        [onMouseDown, scale],
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => onMouseMove?.(e, scale),
        [onMouseMove, scale],
    );

    const handleMouseUp = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => onMouseUp?.(e, scale),
        [onMouseUp, scale],
    );

    return (
        <Box
            style={{
                border: '1px solid var(--gray-5)',
                borderRadius: 'var(--radius-4)',
            }}
        >
            <canvas
                height={dimensions.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                ref={canvasRef}
                style={{
                    aspectRatio: cardDimensions.totalCanvasWidth / cardDimensions.totalCanvasHeight,
                    cursor: cursor ?? 'default',
                    width: '100%',
                }}
                width={dimensions.width}
            />
        </Box>
    );
};

export default CardCanvas;
