import type { Project } from 'firebase/context';

import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import CardListView from 'components/editor/CardListView';
import CardTypeSelectionModal from 'components/editor/CardTypeSelectionModal';
import { getEditor } from 'components/editor/editorRegistry';
import ExportOptionsModal, { type ExportOptions } from 'components/editor/ExportOptionsModal';
import ProjectSettingsModal from 'components/editor/ProjectSettingsModal';
import SaveStatusText from 'components/ui/SaveStatusText';
import {
    type ZombicideCardData,
    type ZombicideCardType,
} from 'games/zombicide/editors/ZombicideCardEditor';
import {
    createDefaultAbominationCard,
    createDefaultEquipmentCard,
    createDefaultPimpWeaponCard,
    createDefaultSurvivorCard,
    createDefaultZombieSpawnCard,
} from 'games/zombicide/types';
import { generatePDFFromElements } from 'games/zombicide/utils/pdfGenerator';
import { useFirebase } from 'hooks/useFirebase';
import { useUpdateCard } from 'hooks/useUpdateCard';
import { useUpdateProject } from 'hooks/useUpdateProject';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getGameById } from 'types/game';
import { resizeToDataUrl } from 'utils/imageUtils';

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

interface ProjectOwnerViewProps {
    initialProject: Project;
    projectId: string;
}

export default function ProjectOwnerView({ initialProject, projectId }: ProjectOwnerViewProps) {
    const { user } = useFirebase();
    const updateProjectMutation = useUpdateProject();
    const updateCardMutation = useUpdateCard();
    const { t } = useTranslation();

    const [viewMode, setViewMode] = useState<'editor' | 'list'>('list');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [project, setProject] = useState<Project>(initialProject);
    const [currentCard, setCurrentCard] = useState<ZombicideCardData>(createCard('survivor'));
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(
        initialProject.updatedAt ? new Date(initialProject.updatedAt) : null,
    );
    const saveTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<null | string>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const game = getGameById(project.gameId);

    useEffect(() => {
        setProject(initialProject);
        setLastSaved(initialProject.updatedAt ? new Date(initialProject.updatedAt) : null);
    }, [initialProject]);

    const persistProject = useCallback(async (proj: Project) => {
        if (!user) {
            return;
        }
        setIsSaving(true);
        updateProjectMutation.mutate({
            ...proj,
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
        setProject((prev) => ({
            ...prev,
            cards: prev.cards.map((card) => card.id === updatedCard.id ? updatedCard : card),
        }));
        setCurrentCard(updatedCard);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            if (!user) {
                return;
            }
            setIsSaving(true);
            updateCardMutation.mutate({ card: updatedCard, projectId }, {
                onError: (error) => {
                    console.error('Error auto-saving card:', error);
                    setIsSaving(false);
                },
                onSuccess: () => {
                    setIsSaving(false);
                    setLastSaved(new Date());
                },
            });
        }, 1000);
    }, [user, projectId, updateCardMutation]);

    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        if (!user) {
            throw new Error(t('editor.error.notAuthenticated'));
        }
        return resizeToDataUrl(file);
    }, [user, t]);

    const handleExportToPDF = useCallback(async (options?: ExportOptions) => {
        if (0 === project.cards.length) {
            setExportError(t('editor.error.noCardsToExport'));
            return;
        }

        setIsExporting(true);
        setExportError(null);
        setShowExportModal(false);

        try {
            await generatePDFFromElements(project.cards, {
                fileName: `${project.name.replace(/\s+/g, '-').toLowerCase()}-cards.pdf`,
                includeBacks: options?.includeBacks ?? true,
                paperSize: options?.paperSize || 'a4',
            });
        } catch (error) {
            setExportError(error instanceof Error ? error.message : t('editor.error.exportFailed'));
        } finally {
            setIsExporting(false);
        }
    }, [project, t]);

    const handleRemoveFromProject = useCallback((index: number) => {
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

        if (!user) {
            return;
        }

        setProject((prev) => ({ ...prev, cards: [...prev.cards, newCard] }));
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

    const handleSaveSettings = useCallback((updates: Pick<Project, 'description' | 'isPublic' | 'name'>) => {
        const updatedProject = { ...project, ...updates };
        setProject(updatedProject);
        setShowSettingsModal(false);
        persistProject(updatedProject);
    }, [project, persistProject]);

    const EditorComponent = currentCard.type
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
                        disabled={isExporting || 0 === project.cards.length}
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

    return (
        <>
            <Box mb="4">
                <Flex align="center" justify="between">
                    <Box>
                        <Heading mb="1" size="6">
                            {project.name || t('editor.label.untitledProject')}
                        </Heading>
                        <Text color="gray" size="2">
                            {game ? game.name : t('zombicide.editor.subtitle')}
                        </Text>
                    </Box>
                    <Flex align="center" gap="3">
                        <SaveStatusText
                            isSaving={isSaving}
                            isVisible={Boolean(user)}
                            lastSaved={lastSaved}
                        />
                        <Button onClick={() => setShowSettingsModal(true)} variant="soft">
                            {t('projects.button.settings')}
                        </Button>
                    </Flex>
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

            <ProjectSettingsModal
                isOpen={showSettingsModal}
                isSaving={isSaving}
                key={showSettingsModal ? 'open' : 'closed'}
                onClose={() => setShowSettingsModal(false)}
                onSave={handleSaveSettings}
                project={project}
            />

            {'editor' === viewMode && (
                <>
                    <Box mb="4">
                        <Button onClick={handleBackToList} variant="soft">
                            {t('editor.backToList')}
                        </Button>
                    </Box>
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
    );
}
