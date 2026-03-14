import type { ZombicideCardData } from 'games/zombicide/editors/ZombicideCardEditor';

import { Box, Button, Checkbox, Dialog, Flex, RadioCards, ScrollArea, Text } from '@radix-ui/themes';
import { PAPER_SIZES, type PaperSize } from 'games/zombicide/utils/pdfGenerator';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface ExportOptions {
    cardQuantities: Record<string, number>;
    includeBacks: boolean;
    paperSize: PaperSize;
}

interface ExportOptionsModalProps {
    cards: ZombicideCardData[];
    defaultQuantities?: Record<string, number>;
    isExporting: boolean;
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => void;
}

export default function ExportOptionsModal({
    cards,
    defaultQuantities,
    isExporting,
    isOpen,
    onClose,
    onExport,
}: ExportOptionsModalProps) {
    const { t } = useTranslation();
    const [selectedSize, setSelectedSize] = useState<PaperSize>('a4');
    const [includeBacks, setIncludeBacks] = useState(true);
    const [cardQuantities, setCardQuantities] = useState<Record<string, number>>(
        () => Object.fromEntries(cards.map((card) => [card.id, defaultQuantities?.[card.id] ?? 1])),
    );

    const handleQuantityChange = (cardId: string, delta: number) => {
        setCardQuantities((prev) => ({
            ...prev,
            [cardId]: Math.max(0, (prev[cardId] ?? 1) + delta),
        }));
    };

    const handleExport = () => {
        onExport({
            cardQuantities,
            includeBacks,
            paperSize: selectedSize,
        });
    };

    return (
        <Dialog.Root onOpenChange={(open) => !open && onClose()} open={isOpen}>
            <Dialog.Content maxWidth="500px">
                <Dialog.Title>{t('editor.exportOptions.title')}</Dialog.Title>
                <Dialog.Description mb="4">
                    {t('editor.exportOptions.description')}
                </Dialog.Description>

                <Box mb="4">
                    <Text as="p" mb="2" size="2" weight="bold">
                        {t('editor.exportOptions.paperSize')}
                    </Text>
                    <RadioCards.Root
                        onValueChange={(value) => setSelectedSize(value as PaperSize)}
                        value={selectedSize}
                    >
                        {Object.values(PAPER_SIZES).map((size) => (
                            <RadioCards.Item
                                key={size.id}
                                style={{
                                    alignItems: 'center',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--space-3)',
                                }}
                                value={size.id}
                            >
                                <Box>
                                    <Text size="3" weight="bold">
                                        {size.id.toUpperCase()}
                                    </Text>
                                    <Text as="p" color="gray" size="1">
                                        {size.width} x {size.height} mm
                                    </Text>
                                </Box>
                            </RadioCards.Item>
                        ))}
                    </RadioCards.Root>
                </Box>

                <Box mb="4">
                    <Flex align="center" gap="2">
                        <Checkbox
                            checked={includeBacks}
                            disabled={isExporting}
                            id="include-backs"
                            onCheckedChange={(checked) => setIncludeBacks(true === checked)}
                        />
                        <Text as="label" htmlFor="include-backs" size="2">
                            {t('editor.exportOptions.includeBacks')}
                        </Text>
                    </Flex>
                </Box>

                {0 < cards.length && (
                    <Box mb="4">
                        <Text as="p" mb="2" size="2" weight="bold">
                            {t('editor.exportOptions.cardQuantities')}
                        </Text>
                        <ScrollArea style={{ maxHeight: '200px' }}>
                            <Flex direction="column" gap="2" pr="2">
                                {cards.map((card) => {
                                    const qty = cardQuantities[card.id] ?? 1;
                                    return (
                                        <Flex align="center" justify="between" key={card.id}>
                                            <Text
                                                color={0 === qty ? 'gray' : undefined}
                                                size="2"
                                                style={{
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textDecoration: 0 === qty ? 'line-through' : undefined,
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {card.name || t('editor.label.unnamed')}
                                            </Text>
                                            <Flex align="center" gap="2" ml="3" style={{ flexShrink: 0 }}>
                                                <Button
                                                    disabled={isExporting || 0 === qty}
                                                    onClick={() => handleQuantityChange(card.id, -1)}
                                                    size="1"
                                                    variant="soft"
                                                >
                                                    −
                                                </Button>
                                                <Text size="2" style={{ minWidth: '16px', textAlign: 'center' }}>
                                                    {qty}
                                                </Text>
                                                <Button
                                                    disabled={isExporting}
                                                    onClick={() => handleQuantityChange(card.id, 1)}
                                                    size="1"
                                                    variant="soft"
                                                >
                                                    +
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    );
                                })}
                            </Flex>
                        </ScrollArea>
                    </Box>
                )}

                <Flex gap="3" justify="end" mt="5">
                    <Dialog.Close>
                        <Button color="gray" disabled={isExporting} variant="soft">
                            {t('projects.button.cancel')}
                        </Button>
                    </Dialog.Close>
                    <Button
                        color="cyan"
                        disabled={isExporting}
                        onClick={handleExport}
                    >
                        {isExporting ? t('editor.button.exporting') : t('editor.button.exportPdf')}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
