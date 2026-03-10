import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import AppLayout from '../components/AppLayout';
import AbominationCardEditor from '../components/editors/AbominationCardEditor';
import EquipmentCardEditor from '../components/editors/EquipmentCardEditor';
import PimpWeaponCardEditor from '../components/editors/PimpWeaponCardEditor';
import SurvivorCardEditor from '../components/editors/SurvivorCardEditor';
import {
    type ZombicideCardData,
    type ZombicideCardType,
} from '../components/editors/ZombicideCardEditor';
import ZombieSpawnCardEditor from '../components/editors/ZombieSpawnCardEditor';
import { useFirebase } from '../hooks/useFirebase';
import {
    createDefaultAbominationCard,
    createDefaultEquipmentCard,
    createDefaultPimpWeaponCard,
    createDefaultSurvivorCard,
    createDefaultZombieSpawnCard,
} from '../types/zombicide-card';
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
    const { fetchProjectById, uploadImage, user } = useFirebase();
    const { t } = useTranslation();

    const [cards, setCards] = useState<ZombicideCardData[]>([]);
    const [currentCard, setCurrentCard] = useState<ZombicideCardData>(createCard('survivor'));
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<null | string>(null);
    const [projectName, setProjectName] = useState<string>(t('editor.defaultProjectName'));

    useEffect(() => {
        const loadProject = async () => {
            if (projectId) {
                const project = await fetchProjectById(projectId);
                if (project) {
                    setProjectName(project.name);
                }
            }
        };
        loadProject();
    }, [projectId, fetchProjectById]);

    const handleCardChange = useCallback((card: ZombicideCardData) => {
        setCurrentCard(card);
    }, []);

    const handleCreateCard = useCallback((type: ZombicideCardType) => {
        setCurrentCard(createCard(type));
    }, []);

    const handleAddToProject = useCallback(() => {
        const cardWithTimestamp = {
            ...currentCard,
        };
        setCards((prev) => [...prev, cardWithTimestamp]);
    }, [currentCard]);

    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        if (!user) {
            throw new Error(t('editor.error.notAuthenticated'));
        }
        const path = `users/${user.uid}/cards/${Date.now()}_${file.name}`;
        const url = await uploadImage(file, path);
        return url;
    }, [user, uploadImage, t]);

    const handleSaveCard = useCallback(() => {
        console.log('Saving card:', currentCard);
        alert(t('editor.alert.cardSaved', { name: currentCard.name }));
    }, [currentCard, t]);

    const handleExportCard = useCallback(() => {
        console.log('Exporting card:', currentCard);
        alert(t('editor.alert.cardExported', { name: currentCard.name }));
    }, [currentCard, t]);

    const handleExportToPDF = useCallback(async () => {
        if (0 === cards.length) {
            setExportError(t('editor.error.noCardsToExport'));
            return;
        }

        setIsExporting(true);
        setExportError(null);

        try {
            await generatePDFFromElements([], {
                fileName: `${projectName.replace(/\s+/g, '-').toLowerCase()}-cards.pdf`,
                scale: 3,
                showCutLines: true,
            });

            console.log('PDF exported successfully');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            setExportError(error instanceof Error ? error.message : t('editor.error.exportFailed'));
        } finally {
            setIsExporting(false);
        }
    }, [cards.length, projectName, t]);

    const handleRemoveFromProject = useCallback((index: number) => {
        setCards((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleSelectCard = useCallback((card: ZombicideCardData) => {
        setCurrentCard(card);
    }, []);

    return (
        <AppLayout>

            <Box mb="4">
                <Flex align="center" justify="between">
                    <Box>
                        <Heading mb="1" size="6">
                            {projectName}
                        </Heading>
                        <Text color="gray" size="2">
                            {t('zombicide.editor.subtitle')}
                        </Text>
                    </Box>
                    {!user && (
                        <Text color="orange" size="2">
                            {t('editor.prompt.signInToSave')}
                        </Text>
                    )}
                </Flex>
            </Box>

            <Box
                mb="4"
                p="3"
                style={{
                    backgroundColor: 'var(--gray-3)',
                    borderRadius: 'var(--radius-3)',
                }}
            >
                <Flex align="center" gap="3" wrap="wrap">
                    <Box>
                        <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>
                            {t('editor.toolbar.newCard')}
                        </Text>
                        <Flex gap="2">
                            <Button onClick={() => handleCreateCard('survivor')} size="1" variant="soft">
                                {t('zombicide.editor.button.survivor')}
                            </Button>
                            <Button onClick={() => handleCreateCard('equipment')} size="1" variant="soft">
                                {t('zombicide.editor.button.equipment')}
                            </Button>
                            <Button onClick={() => handleCreateCard('pimp-weapon')} size="1" variant="soft">
                                {t('zombicide.editor.button.weapon')}
                            </Button>
                            <Button onClick={() => handleCreateCard('zombie-spawn')} size="1" variant="soft">
                                {t('zombicide.editor.button.zombie')}
                            </Button>
                            <Button onClick={() => handleCreateCard('abomination')} size="1" variant="soft">
                                {t('zombicide.editor.button.abomination')}
                            </Button>
                        </Flex>
                    </Box>

                    <Box style={{ backgroundColor: 'var(--gray-6)', height: '40px', width: '1px' }} />

                    <Box>
                        <Button
                            color="blue"
                            disabled={!currentCard.name}
                            onClick={handleAddToProject}
                            size="2"
                        >
                            {t('editor.button.addToProject')}
                        </Button>
                    </Box>

                    <Box style={{ backgroundColor: 'var(--gray-6)', height: '40px', width: '1px' }} />

                    <Flex gap="2">
                        <Button onClick={handleSaveCard} variant="soft">
                            {t('editor.button.saveCard')}
                        </Button>
                        <Button onClick={handleExportCard} variant="soft">
              Export
                        </Button>
                        <Button
                            color="cyan"
                            disabled={isExporting || 0 === cards.length}
                            onClick={handleExportToPDF}
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

            <Box
                style={{
                    minHeight: '600px',
                }}
            >
                {'survivor' === currentCard.type && (
                    <SurvivorCardEditor
                        card={currentCard as import('../types/zombicide-card').SurvivorCardData}
                        onChange={(card) => handleCardChange({ ...card, type: 'survivor' } as ZombicideCardData)}
                    />
                )}
                {'equipment' === currentCard.type && (
                    <EquipmentCardEditor
                        card={currentCard as import('../types/zombicide-card').EquipmentCardData}
                        onChange={(card) => handleCardChange({ ...card, type: 'equipment' } as ZombicideCardData)}
                        onImageUpload={handleImageUpload}
                    />
                )}
                {'pimp-weapon' === currentCard.type && (
                    <PimpWeaponCardEditor
                        card={currentCard as import('../types/zombicide-card').PimpWeaponCardData}
                        onChange={(card) => handleCardChange({ ...card, type: 'pimp-weapon' } as ZombicideCardData)}
                        onImageUpload={handleImageUpload}
                    />
                )}
                {'zombie-spawn' === currentCard.type && (
                    <ZombieSpawnCardEditor
                        card={currentCard as import('../types/zombicide-card').ZombieSpawnCardData}
                        onChange={(card) => handleCardChange({ ...card, type: 'zombie-spawn' } as ZombicideCardData)}
                        onImageUpload={handleImageUpload}
                    />
                )}
                {'abomination' === currentCard.type && (
                    <AbominationCardEditor
                        card={currentCard as import('../types/zombicide-card').AbominationCardData}
                        onChange={(card) => handleCardChange({ ...card, type: 'abomination' } as ZombicideCardData)}
                        onImageUpload={handleImageUpload}
                    />
                )}
            </Box>

            {0 < cards.length && (
                <Box mt="6">
                    <Heading mb="3" size="4">
                        {t('editor.section.projectCards', { count: cards.length })}
                    </Heading>
                    <Flex gap="3" wrap="wrap">
                        {cards.map((card, index) => (
                            <Box
                                key={index}
                                onClick={() => handleSelectCard(card)}
                                style={{
                                    cursor: 'pointer',
                                    width: '120px',
                                }}
                            >
                                <Box
                                    p="2"
                                    style={{
                                        backgroundColor: card.type === currentCard.type && card.name === currentCard.name
                                            ? 'var(--blue-3)'
                                            : 'var(--gray-3)',
                                        border: '1px solid var(--gray-5)',
                                        borderRadius: 'var(--radius-2)',
                                    }}
                                >
                                    <Text size="1" style={{ display: 'block' }} weight="bold">
                                        {card.name || t('editor.label.unnamed')}
                                    </Text>
                                    <Text color="gray" size="1">
                                        {card.type}
                                    </Text>
                                </Box>
                                <Button
                                    color="red"
                                    mt="1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFromProject(index);
                                    }}
                                    size="1"
                                    variant="soft"
                                >
                                    {t('projects.buttonRemove.remove')}
                                </Button>
                            </Box>
                        ))}
                    </Flex>
                </Box>
            )}
        </AppLayout>
    );
}
