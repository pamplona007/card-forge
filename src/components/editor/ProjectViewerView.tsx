import type { ExportOptions } from 'components/editor/ExportOptionsModal';
import type { Project } from 'firebase/context';
import type { ZombicideCardData } from 'games/zombicide/editors/ZombicideCardEditor';
import type { ZombicidePDFOptions } from 'games/zombicide/utils/pdfGenerator';

import { Badge, Box, Button, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import CardPreview from 'components/editor/CardPreview';
import ExportOptionsModal from 'components/editor/ExportOptionsModal';
import RemixModal from 'components/editor/RemixModal';
import LikeButton from 'components/ui/LikeButton';
import { generatePDFFromElements } from 'games/zombicide/utils/pdfGenerator';
import { useFirebase } from 'hooks/useFirebase';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCardType, getGameById } from 'types/game';

interface ProjectViewerViewProps {
    project: Project;
}

export default function ProjectViewerView({ project }: ProjectViewerViewProps) {
    const { t } = useTranslation();
    const { user } = useFirebase();
    const game = getGameById(project.gameId);

    const [exportError, setExportError] = useState<null | string>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showRemixModal, setShowRemixModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<null | ZombicideCardData>(null);

    const remixDefaultName = t('projects.remix.defaultName', {
        name: project.name,
        user: user?.displayName || user?.email,
    });

    const handleExport = async (options?: ExportOptions) => {
        if (0 === project.cards.length) {
            setExportError(t('editor.error.noCardsToExport'));
            return;
        }

        setExportError(null);
        setIsExporting(true);
        setShowExportModal(false);

        try {
            const pdfOptions: ZombicidePDFOptions = {
                cardQuantities: options?.cardQuantities,
                fileName: `${project.name.replace(/\s+/g, '-').toLowerCase()}-cards.pdf`,
                includeBacks: options?.includeBacks ?? true,
                paperSize: options?.paperSize ?? 'a4',
            };
            await generatePDFFromElements(project.cards, pdfOptions);
        } catch (error) {
            setExportError(error instanceof Error ? error.message : t('editor.error.exportFailed'));
        } finally {
            setIsExporting(false);
        }
    };

    const texts = [
        game ? game.name : project.gameId,
        project.description,
        t('editor.cardsCount', { count: project.cards.length }),
    ].filter(Boolean).join(' | ');

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
                            {texts}
                        </Text>
                    </Box>
                    <Flex align="center" gap="2" mt="2">
                        <LikeButton project={project} />
                        {user && (
                            <Button
                                onClick={() => setShowRemixModal(true)}
                                variant="soft"
                            >
                                {t('projects.button.remix')}
                            </Button>
                        )}
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
                cards={project.cards}
                isExporting={isExporting}
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
            />

            {user && (
                <RemixModal
                    defaultName={remixDefaultName}
                    isOpen={showRemixModal}
                    key={showRemixModal ? 'open' : 'closed'}
                    onClose={() => setShowRemixModal(false)}
                    project={project}
                />
            )}

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
                    <Grid
                        areas={{
                            initial: '"preview" "galery"',
                            md: '"galery preview"',
                        }}
                        columns={{ initial: '1', md: '1fr 2fr' }}
                        gap={'4'}
                        rows={{ initial: 'auto auto', md: '1fr' }}
                    >
                        <Box gridArea={'galery'}>
                            <Grid columns="2" gap="2">
                                {project.cards.map((card) => {
                                    const cardType = getCardType(project.gameId, card.type);
                                    const bg = cardType?.background ?? { color: 'var(--gray-5)' };
                                    const { height, width } = cardType?.dimensions ?? { height: 88.9, width: 63.5 };
                                    const isSelected = selectedCard?.id === card.id;
                                    return (
                                        <Box
                                            key={card.id}
                                            onClick={() => setSelectedCard(isSelected ? null : card)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Box
                                                style={{
                                                    aspectRatio: `${width}/${height}`,
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

                        <Box gridArea={'preview'}>
                            {selectedCard
                                ? (
                                    <CardPreview card={selectedCard} />
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
