import type { Project } from 'contexts/FirebaseContext';

import { Box, Button, Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import AppLayout from 'components/AppLayout';
import CardListView from 'components/editors/CardListView';
import CardTypeSelectionModal from 'components/editors/CardTypeSelectionModal';
import { getEditor } from 'components/editors/editorRegistry';
import ExportOptionsModal, { type ExportOptions } from 'components/editors/ExportOptionsModal';
import {
    type ZombicideCardData,
    type ZombicideCardType,
} from 'components/editors/zombicide/ZombicideCardEditor';
import SaveStatusText from 'components/SaveStatusText';
import { useFirebase } from 'hooks/useFirebase';
import { useImageUpload } from 'hooks/useImageUpload';
import { useProject } from 'hooks/useProject';
import { useUpdateProject } from 'hooks/useUpdateProject';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getGameById } from 'types/game';
import {
    createDefaultAbominationCard,
    createDefaultEquipmentCard,
    createDefaultPimpWeaponCard,
    createDefaultSurvivorCard,
    createDefaultZombieSpawnCard,
} from 'types/zombicide-card';

import { generatePDFFromElements } from '../utils/pdfGenerator';

const createCard = (type: ZombicideCardType): ZombicideCardData => {
    switch (type) {
        case 'abomination':
            return { ...createDefaultAbominationCard(), type: 'abomination' };
        case 'equipment':
            return { ...createDefaultEquipmentCard(), type: 'equipment' };
        case 'pimp-weapon':
            return { ...createDefaultPimpWeaponCard(), type: 'pimp-weapon' };
        case 'survivor':
            return { ...createDefaultSurvivorCard(), type: 'survivor' };
        case 'zombie-spawn':
            return { ...createDefaultZombieSpawnCard(), type: 'zombie-spawn' };
        default:
            return { ...createDefaultSurvivorCard(), type: 'survivor' };
    }
};

export default function CardEditorPage() {
    const { projectId } = useParams<{ projectId?: string }>();

    const { user } = useFirebase();
    const { data: projectData, isLoading: isLoadingProject } = useProject(projectId);
    const updateProjectMutation = useUpdateProject();
    const imageUploadMutation = useImageUpload();
    const { t } = useTranslation();

    const [viewMode, setViewMode] = useState<'editor' | 'list'>('list');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [project, setProject] = useState<null | Project>(null);

    const [currentCard, setCurrentCard] = useState<ZombicideCardData>(createCard('survivor'));

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);

    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<null | string>(null);
    const [showExportModal, setShowExportModal] = useState(false);

    const game = getGameById(project?.gameId || 'zombicide-2e');

    useEffect(() => {
        setProject(projectData || null);
        setLastSaved(projectData?.updatedAt ? new Date(projectData.updatedAt) : null);
    }, [projectData]);

    const persistProject = useCallback(async (project: Project) => {
        if (!user || !project) {
            return;
        }

        setIsSaving(true);

        updateProjectMutation.mutate({
            ...project,
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            onError: (error) => {
                console.error('Error auto-saving project:', error);
                setIsSaving(false);
            },
            onSuccess: () => {
                setIsSaving(false);
                setLastSaved(new Date());
            },
        });
    }, [user, updateProjectMutation]);

    const handleCardChange = useCallback((updatedCard: ZombicideCardData) => {
        if (!project) {
            return;
        }

        const newProject = {
            ...project,
            cards: project.cards.map((card) => card.id === updatedCard.id ? updatedCard : card),
        };

        setProject(newProject);
        setCurrentCard(updatedCard);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(async () => {
            await persistProject(newProject);
        }, 1000);
    }, [project, persistProject]);

    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        if (!user) {
            throw new Error(t('editor.error.notAuthenticated'));
        }
        const path = `users/${user.uid}/cards/${Date.now()}_${file.name}`;
        const url = await imageUploadMutation.mutateAsync({ file, path });
        return url;
    }, [user, imageUploadMutation, t]);

    const handleExportCard = useCallback(() => {
        console.log('Exporting card:', currentCard);
        toast.success(t('editor.alert.cardExported', { name: currentCard.name }));
    }, [currentCard, t]);

    const handleExportToPDF = useCallback(async (options?: ExportOptions) => {
        if (!project || 0 === project.cards.length) {
            setExportError(t('editor.error.noCardsToExport'));
            return;
        }

        const cardsToExport = project.cards;
        const projectName = project.name;

        setIsExporting(true);
        setExportError(null);

        setShowExportModal(false);

        try {
            await generatePDFFromElements(cardsToExport, {
                fileName: `${projectName.replace(/\s+/g, '-').toLowerCase()}-cards.pdf`,
                includeBacks: options?.includeBacks ?? true,
                paperSize: options?.paperSize || 'a4',
            });
            console.log('PDF exported successfully');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            setExportError(error instanceof Error ? error.message : t('editor.error.exportFailed'));
        } finally {
            setIsExporting(false);
        }
    }, [project, t]);

    const handleRemoveFromProject = useCallback((index: number) => {
        if (!project) {
            return;
        }

        const newCards = project.cards.filter((_, i) => i !== index);
        const newProject = { ...project, cards: newCards };

        setProject(newProject);
        persistProject(newProject);
    }, [project, persistProject]);

    const handleSelectCard = useCallback((card: ZombicideCardData) => {
        setCurrentCard(card);
        setViewMode('editor');
    }, []);

    const handleCardTypeSelect = useCallback(async (type: ZombicideCardType) => {
        const newCard = createCard(type);
        setCurrentCard(newCard);

        if (!project || !user) {
            return;
        }

        setProject((prev) => {
            if (!prev) {
                return prev;
            }
            return { ...prev, cards: [...prev.cards, newCard] };
        });
        setIsSaving(true);
        await updateProjectMutation.mutateAsync({
            ...project,
            cards: [...project.cards, newCard],
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            onError: (error) => {
                console.error('Error saving new card:', error);
                setIsSaving(false);
                toast.error(t('editor.error.saveFailed'));
            },
            onSuccess: () => {
                setIsSaving(false);
                setLastSaved(new Date());
            },
        });

        setCurrentCard(newCard);
        setViewMode('editor');
        setShowCreateModal(false);
    }, [project, user, updateProjectMutation, t]);

    const handleBackToList = useCallback(() => {
        setViewMode('list');
    }, []);

    const EditorComponent = currentCard.type && project?.gameId
        ? getEditor(project.gameId, currentCard.type)
        : null;

    const renderListToolbar = () => (
        <Box
            mb="4"
            p="3"
            style={{
                backgroundColor: 'var(--gray-3)',
                borderRadius: 'var(--radius-3)',
            }}
        >
            <Flex align="center" gap="3" justify="between" wrap="wrap">
                <Flex gap="2">
                    <Button
                        color="cyan"
                        disabled={isExporting || 0 === project?.cards.length}
                        onClick={() => setShowExportModal(true)}
                        variant="soft"
                    >
                        {isExporting ? t('editor.button.exporting') : t('editor.button.exportPdf')}
                    </Button>
                </Flex>

                <Button color="blue" onClick={() => setShowCreateModal(true)} size="3">
                    {t('editor.createNewCard')}
                </Button>
            </Flex>

            {exportError && (
                <Text color="red" mt="2" size="2">
                    {exportError}
                </Text>
            )}
        </Box>
    );

    const renderEditorToolbar = () => (
        <Box
            mb="4"
            p="3"
            style={{
                backgroundColor: 'var(--gray-3)',
                borderRadius: 'var(--radius-3)',
            }}
        >
            <Flex align="center" gap="3" wrap="wrap">
                <Flex gap="2">
                    <Button onClick={handleExportCard} variant="soft">
                        Export
                    </Button>
                    <Button
                        color="cyan"
                        disabled={isExporting || 0 === project?.cards.length}
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
    );

    return (
        <AppLayout>
            {isLoadingProject
                ? (
                    <Box py="9" style={{ textAlign: 'center' }}>
                        <Spinner size="3" />
                        <Text color="gray" ml="3">{t('projects.status.loading')}</Text>
                    </Box>
                )
                : project && (
                    <>
                        <Box mb="4">
                            <Flex align="center" justify="between">
                                <Box>
                                    <Heading mb="1" size="6">
                                        {project?.name || t('editor.label.untitledProject')}
                                    </Heading>
                                    <Text color="gray" size="2">
                                        {game ? game.name : t('zombicide.editor.subtitle')}
                                    </Text>
                                </Box>
                                <Box>
                                    <SaveStatusText
                                        isSaving={isSaving}
                                        isVisible={Boolean(projectId && user)}
                                        lastSaved={lastSaved}
                                    />
                                </Box>
                            </Flex>
                        </Box>

                        <CardTypeSelectionModal
                            gameId={project.gameId}
                            isOpen={showCreateModal}
                            onClose={() => setShowCreateModal(false)}
                            onSelectCardType={handleCardTypeSelect}
                        />

                        <ExportOptionsModal
                            isExporting={isExporting}
                            isOpen={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            onExport={handleExportToPDF}
                        />

                        {'editor' === viewMode && (
                            <>
                                <Box mb="4">
                                    <Button onClick={handleBackToList} variant="soft">
                                        {t('editor.backToList')}
                                    </Button>
                                </Box>

                                {renderEditorToolbar()}

                                <Box style={{ minHeight: '600px' }}>
                                    {EditorComponent
                                        ? (
                                            <EditorComponent
                                                card={currentCard}
                                                onChange={handleCardChange}
                                                {...('equipment' === currentCard.type || 'pimp-weapon' === currentCard.type || 'zombie-spawn' === currentCard.type || 'abomination' === currentCard.type
                                                    ? { onImageUpload: handleImageUpload }
                                                    : {})}
                                            />
                                        )
                                        : (
                                            <Text color="red">No editor available for card type: {currentCard.type}</Text>
                                        )}
                                </Box>
                            </>
                        )}

                        {'list' === viewMode && (
                            <>
                                {renderListToolbar()}

                                <CardListView
                                    cards={project.cards}
                                    onCardClick={handleSelectCard}
                                    onDeleteCard={handleRemoveFromProject}
                                />
                            </>
                        )}
                    </>
                )}
        </AppLayout>
    );
}
