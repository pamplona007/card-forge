/**
 * Generic card dimension model used by the canvas renderer and PDF generator.
 *
 * All values are in millimetres. Computed getters derive canvas-level totals
 * (including bleed and padding) so callers never have to duplicate that math.
 */
export class CardDimensions {
    bleed: number;
    borderRadius: number;
    canvasPaddingPercent: number;
    height: number;
    width: number;

    get actualPadding() {
        const widthPercent = 1 - (this.canvasPaddingPercent * 2);
        const paddingValue = this.totalWidth * (1 - widthPercent) / 2;
        return Math.round(paddingValue * 100) / 100;
    }

    get totalCanvasHeight() {
        return this.totalHeight + (2 * this.actualPadding);
    }

    get totalCanvasWidth() {
        return this.totalWidth + (2 * this.actualPadding);
    }

    get totalHeight() {
        return this.height + (2 * this.bleed);
    }

    get totalWidth() {
        return this.width + (2 * this.bleed);
    }

    constructor({
        bleed,
        borderRadius = 5,
        canvasPaddingPercent = 0.05,
        height,
        width,
    }: {
        bleed: number;
        borderRadius?: number;
        canvasPaddingPercent?: number;
        height: number;
        width: number;
    }) {
        this.bleed = bleed;
        this.height = height;
        this.width = width;
        this.canvasPaddingPercent = canvasPaddingPercent;
        this.borderRadius = borderRadius;
    }

    pxCanvasDimensions(dpi = 300) {
        const pxHeight = Math.round(this.totalCanvasHeight * dpi);
        const pxWidth = Math.round(this.totalCanvasWidth * dpi);

        return {
            height: pxHeight,
            width: pxWidth,
        };
    }
}
