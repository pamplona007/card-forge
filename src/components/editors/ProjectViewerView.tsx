import type { ExportOptions } from 'components/editors/ExportOptionsModal';
import type { ZombicideCardData, ZombicideCardType } from 'components/editors/zombicide/ZombicideCardEditor';
import type { Project } from 'contexts/FirebaseContext';

import { Badge, Box, Button, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import CardPreview from 'components/editors/CardPreview';
import ExportOptionsModal from 'components/editors/ExportOptionsModal';
import LikeButton from 'components/LikeButton';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getGameById } from 'types/game';

import { generatePDFFromElements } from '../../utils/pdfGenerator';

interface ProjectViewerViewProps {
    project: Project;
}

const TYPE_BACKGROUNDS: Record<ZombicideCardType, { color: string; image?: string }> = {
    'abomination': { color: '#7c2d12' },
    'equipment': { color: '#1e3a5f' },
    'pimp-weapon': { color: '#3b1f5e' },
    'survivor': { color: '#1a2e1a', image: '/zombicide-2nd/survivor/card-background.png' },
    'zombie-spawn': { color: '#1f2d1a' },
};

export default function ProjectViewerView({ project }: ProjectViewerViewProps) {
    const { t } = useTranslation();
    const game = getGameById(project.gameId);

    const [exportError, setExportError] = useState<null | string>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<null | ZombicideCardData>(null);

    const handleExport = async (options?: ExportOptions) => {
        if (0 === project.cards.length) {
            setExportError(t('editor.error.noCardsToExport'));
            return;
        }

        setExportError(null);
        setIsExporting(true);
        setShowExportModal(false);

        try {
            await generatePDFFromElements(project.cards, {
                fileName: `${project.name.replace(/\s+/g, '-').toLowerCase()}-cards.pdf`,
                includeBacks: options?.includeBacks ?? true,
                paperSize: options?.paperSize ?? 'a4',
            });
        } catch (error) {
            setExportError(error instanceof Error ? error.message : t('editor.error.exportFailed'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {/* Header */}
            <Box mb="4">
                <Flex align="start" justify="between" wrap="wrap">
                    <Box>
                        <Flex align="center" gap="2" mb="1">
                            <Heading size="6">{project.name}</Heading>
                            {project.isPublic && (
                                <Badge color="green" variant="soft">
                                    {t('likes.badge.public')}
                                </Badge>
                            )}
                        </Flex>
                        <Text color="gray" size="2">
                            {game ? game.name : project.gameId}
                        </Text>
                        {project.description && (
                            <Text as="p" color="gray" mt="1" size="2">
                                {project.description}
                            </Text>
                        )}
                    </Box>
                    <Flex align="center" gap="2" mt="2">
                        <LikeButton project={project} />
                        <Button
                            color="cyan"
                            disabled={isExporting || 0 === project.cards.length}
                            onClick={() => setShowExportModal(true)}
                            variant="soft"
                        >
                            {isExporting ? t('editor.button.exporting') : t('editor.button.exportPdf')}
                        </Button>
                    </Flex>
                </Flex>
                {exportError && (
                    <Text color="red" mt="2" size="2">
                        {exportError}
                    </Text>
                )}
            </Box>

            <ExportOptionsModal
                isExporting={isExporting}
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
            />

            {0 === project.cards.length
                ? (
                    <Box
                        p="6"
                        style={{
                            backgroundColor: 'var(--gray-3)',
                            borderRadius: 'var(--radius-3)',
                            textAlign: 'center',
                        }}
                    >
                        <Text color="gray" size="3">{t('viewer.noCards')}</Text>
                    </Box>
                )
                : (
                    <Grid columns={'auto 1fr'} gap="4" style={{ alignItems: 'flex-start' }}>
                        {/* Card grid */}
                        <Box style={{ flexShrink: 0, width: '300px' }}>
                            <Text color="gray" mb="2" size="2">
                                {t('editor.cardsCount', { count: project.cards.length })}
                            </Text>
                            <Grid columns="2" gap="2">
                                {project.cards.map((card) => {
                                    const bg = TYPE_BACKGROUNDS[card.type];
                                    const isSelected = selectedCard?.id === card.id;
                                    return (
                                        <Box
                                            key={card.id}
                                            onClick={() => setSelectedCard(isSelected ? null : card)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Box
                                                style={{
                                                    aspectRatio: 'survivor' === card.type ? '88/76' : '63.5/88.9',
                                                    backgroundColor: bg.color,
                                                    border: isSelected
                                                        ? '2px solid var(--accent-9)'
                                                        : '2px solid transparent',
                                                    borderRadius: 'var(--radius-2)',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                }}
                                            >
                                                {bg.image && (
                                                    <img
                                                        alt=""
                                                        src={bg.image}
                                                        style={{
                                                            height: '100%',
                                                            left: 0,
                                                            objectFit: 'cover',
                                                            position: 'absolute',
                                                            top: 0,
                                                            width: '100%',
                                                        }}
                                                    />
                                                )}
                                                {'image' in card && card.image
                                                    ? (
                                                        <img
                                                            alt={card.name}
                                                            src={card.image}
                                                            style={{
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                objectPosition: 'top center',
                                                                position: 'relative',
                                                                width: '100%',
                                                            }}
                                                        />
                                                    )
                                                    : (
                                                        <Flex
                                                            align="center"
                                                            direction="column"
                                                            justify="center"
                                                            style={{ height: '100%', padding: 'var(--space-2)', position: 'relative' }}
                                                        >
                                                            <Text
                                                                size="1"
                                                                style={{
                                                                    color: 'white',
                                                                    overflow: 'hidden',
                                                                    textAlign: 'center',
                                                                    textOverflow: 'ellipsis',
                                                                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                                                    whiteSpace: 'nowrap',
                                                                    width: '100%',
                                                                }}
                                                                weight="bold"
                                                            >
                                                                {card.name || t('editor.label.unnamed')}
                                                            </Text>
                                                        </Flex>
                                                    )}
                                            </Box>
                                            <Text color="gray" mt="1" size="1" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {card.name || t('editor.label.unnamed')}
                                            </Text>
                                        </Box>
                                    );
                                })}
                            </Grid>
                        </Box>

                        {/* Preview panel */}
                        <Box>
                            {selectedCard
                                ? (
                                    <Box>
                                        <Flex align="baseline" gap="2" mb="3">
                                            <Heading size="4">
                                                {selectedCard.name || t('editor.label.unnamed')}
                                            </Heading>
                                            <Badge color="gray" variant="soft">
                                                {selectedCard.type}
                                            </Badge>
                                        </Flex>
                                        <CardPreview card={selectedCard} />
                                    </Box>
                                )
                                : (
                                    <Flex
                                        align="center"
                                        justify="center"
                                        style={{
                                            backgroundColor: 'var(--gray-2)',
                                            borderRadius: 'var(--radius-3)',
                                            height: '400px',
                                        }}
                                    >
                                        <Text color="gray" size="2">{t('viewer.selectCard')}</Text>
                                    </Flex>
                                )}
                        </Box>
                    </Grid>
                )}
        </>
    );
}
