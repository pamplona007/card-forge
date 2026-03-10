/**
 * PDF Generator Utility for Zombicide Cards
 *
 * Generates printable PDFs with:
 * - Standard poker card dimensions (63.5mm x 88.9mm)
 * - 3mm bleed on all sides (69.5mm x 94.9mm total)
 * - 3x3 grid layout (9 cards per page for A4/Letter)
 * - Visible bleed marks/cut lines
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import type { ZombicideCardData } from '../components/editors/ZombicideCardEditor';

import { CARD_DIMENSIONS } from '../types/zombicide-card';

const CARD_WIDTH = CARD_DIMENSIONS.width;
const CARD_HEIGHT = CARD_DIMENSIONS.height;
const BLEED = CARD_DIMENSIONS.bleed;
const CARD_TOTAL_WIDTH = CARD_DIMENSIONS.totalWidth;
const CARD_TOTAL_HEIGHT = CARD_DIMENSIONS.totalHeight;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 5;

const CARDS_PER_ROW = 3;
const CARDS_PER_COL = 3;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

const AVAILABLE_WIDTH = PAGE_WIDTH - (2 * MARGIN);
const AVAILABLE_HEIGHT = PAGE_HEIGHT - (2 * MARGIN);
const GRID_WIDTH = CARDS_PER_ROW * CARD_TOTAL_WIDTH;
const GRID_HEIGHT = CARDS_PER_COL * CARD_TOTAL_HEIGHT;
const EXTRA_WIDTH = AVAILABLE_WIDTH - GRID_WIDTH;
const EXTRA_HEIGHT = AVAILABLE_HEIGHT - GRID_HEIGHT;
const SPACING_X = EXTRA_WIDTH / (CARDS_PER_ROW + 1);
const SPACING_Y = EXTRA_HEIGHT / (CARDS_PER_COL + 1);

const getCardPosition = (index: number): { x: number; y: number } => {
    const row = Math.floor(index / CARDS_PER_ROW);
    const col = index % CARDS_PER_ROW;

    return {
        x: MARGIN + SPACING_X + (col * (CARD_TOTAL_WIDTH + SPACING_X)),
        y: MARGIN + SPACING_Y + (row * (CARD_TOTAL_HEIGHT + SPACING_Y)),
    };
};

/**
 * Card element reference with optional ID
 */
export interface CardElement {
  card: ZombicideCardData;
  element?: HTMLElement | null;
}

/**
 * Options for PDF generation
 */
export interface PDFGeneratorOptions {
  /** Background color for the bleed area */
  backgroundColor?: string;
  /** File name for the downloaded PDF */
  fileName?: string;
  /** Quality of the card capture (higher = better quality but slower) */
  scale?: number;
  /** Include bleed marks/cut lines */
  showCutLines?: boolean;
}

/**
 * Generates a PDF with multiple cards in a 3x3 grid
 *
 * @param cards - Array of cards to include in the PDF
 * @param cardElements - Array of DOM elements corresponding to each card
 * @param options - PDF generation options
 * @returns Promise that resolves when the PDF is generated and downloaded
 */
export const generateCardPDF = async (
    cards: ZombicideCardData[],
    cardElements: CardElement[],
    options: PDFGeneratorOptions = {},
): Promise<void> => {
    const {
        backgroundColor = '#ffffff',
        fileName = 'zombicide-cards.pdf',
        scale = 3,
        showCutLines = true,
    } = options;

    if (0 === cards.length || 0 === cardElements.length) {
        console.warn('No cards to export');
        return;
    }

    // eslint-disable-next-line new-cap
    const pdf = new jsPDF({
        format: 'a4',
        orientation: 'portrait',
        unit: 'mm',
    });

    let currentPage = 0;

    for (let i = 0; i < cards.length; i++) {
        const cardIndex = i % CARDS_PER_PAGE;
        const pageIndex = Math.floor(i / CARDS_PER_PAGE);

        if (pageIndex > currentPage) {
            pdf.addPage();
            currentPage = pageIndex;
        }

        const cardElement = cardElements[i];
        if (!cardElement?.element) {
            console.warn(`Card element not found for index ${i}`);
            continue;
        }

        try {
            const canvas = await html2canvas(cardElement.element, {
                allowTaint: true,
                backgroundColor,
                logging: false,
                scale,
                useCORS: true,
            });

            const pos = getCardPosition(cardIndex);

            const imgData = canvas.toDataURL('image/png');

            pdf.addImage(
                imgData,
                'PNG',
                pos.x,
                pos.y,
                CARD_TOTAL_WIDTH,
                CARD_TOTAL_HEIGHT,
            );

            if (showCutLines) {
                drawCutLines(pdf, pos.x, pos.y);
            }

            console.log(`Card ${i + 1}/${cards.length} added to PDF (page ${currentPage + 1})`);
        } catch (error) {
            console.error(`Error processing card ${i}:`, error);
        }
    }

    pdf.save(fileName);
    console.log(`PDF generated: ${fileName}`);
};

/**
 * Draws cut lines around a card
 */
const drawCutLines = (
    pdf: jsPDF,
    x: number,
    y: number,
): void => {
    pdf.setLineDashPattern([2, 2], 0);
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(128, 128, 128);

    pdf.rect(x, y, CARD_TOTAL_WIDTH, CARD_TOTAL_HEIGHT);

    pdf.setLineDashPattern([], 0);
    pdf.setLineWidth(0.05);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x + BLEED, y + BLEED, CARD_WIDTH, CARD_HEIGHT);

    pdf.setLineDashPattern([], 0);
};

/**
 * Generates a PDF from card elements by capturing them directly
 *
 * @param cardElements - Array of DOM elements to capture
 * @param options - PDF generation options
 * @returns Promise that resolves when the PDF is generated
 */
export const generatePDFFromElements = async (
    cardElements: HTMLElement[],
    options: PDFGeneratorOptions = {},
): Promise<void> => {
    const {
        backgroundColor = '#ffffff',
        fileName = 'zombicide-cards.pdf',
        scale = 3,
        showCutLines = true,
    } = options;

    if (0 === cardElements.length) {
        console.warn('No card elements to export');
        return;
    }

    // eslint-disable-next-line new-cap
    const pdf = new jsPDF({
        format: 'a4',
        orientation: 'portrait',
        unit: 'mm',
    });

    let currentPage = 0;

    for (let i = 0; i < cardElements.length; i++) {
        const cardIndex = i % CARDS_PER_PAGE;
        const pageIndex = Math.floor(i / CARDS_PER_PAGE);

        if (pageIndex > currentPage) {
            pdf.addPage();
            currentPage = pageIndex;
        }

        const element = cardElements[i];

        try {
            const canvas = await html2canvas(element, {
                allowTaint: true,
                backgroundColor,
                logging: false,
                scale,
                useCORS: true,
            });

            const pos = getCardPosition(cardIndex);
            const imgData = canvas.toDataURL('image/png');

            pdf.addImage(
                imgData,
                'PNG',
                pos.x,
                pos.y,
                CARD_TOTAL_WIDTH,
                CARD_TOTAL_HEIGHT,
            );

            if (showCutLines) {
                drawCutLines(pdf, pos.x, pos.y);
            }

            console.log(`Card ${i + 1}/${cardElements.length} added to PDF`);
        } catch (error) {
            console.error(`Error processing card element ${i}:`, error);
        }
    }

    pdf.save(fileName);
};

/**
 * Creates a temporary card element for capturing
 * This is useful when you need to render cards specifically for PDF export
 */
export const createCardElementForCapture = async (
    card: ZombicideCardData,
    renderFunction: (card: ZombicideCardData) => HTMLElement,
): Promise<HTMLElement> => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';

    container.style.width = `${CARD_TOTAL_WIDTH}mm`;
    container.style.height = `${CARD_TOTAL_HEIGHT}mm`;

    const cardElement = renderFunction(card);
    container.appendChild(cardElement);
    document.body.appendChild(container);

    return container;
};

/**
 * Cleanup function for temporary card elements
 */
export const cleanupCardElements = (elements: HTMLElement[]): void => {
    elements.forEach((element) => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
};

export const PDF_CONSTANTS = {
    BLEED,
    CARD_HEIGHT,
    CARD_TOTAL_HEIGHT,
    CARD_TOTAL_WIDTH,
    CARD_WIDTH,
    CARDS_PER_COL,
    CARDS_PER_PAGE,
    CARDS_PER_ROW,
    MARGIN,
    PAGE_HEIGHT,
    PAGE_WIDTH,
};
