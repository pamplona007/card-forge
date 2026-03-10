import { Box, Button, Card, Flex, Grid, Slider, Text, TextField } from '@radix-ui/themes';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
    SurvivorAbility,
    SurvivorCardData,
    SurvivorTag,
} from '../../types/zombicide-card';

import {
    ABILITY_COLORS,
    SURVIVOR_TAGS,
} from '../../types/zombicide-card';
import SurvivorCardBack from '../cards/zombicide/SurvivorCardBack';
import SurvivorCardFront from '../cards/zombicide/SurvivorCardFront';
import CardSideSwitch, { type CardSide } from './CardSideSwitch';

interface SurvivorCardEditorProps {
    card: SurvivorCardData;
    onChange: (card: SurvivorCardData) => void;
}

const ImageUploader: React.FC<{
    label?: string;
    onUpload: (url: string) => void;
    onUploadClick: () => void;
    uploading?: boolean;
    value?: string;
}> = ({ label, onUpload, onUploadClick, uploading, value }) => {
    const { t } = useTranslation();
    return (
        <Box>
            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>
                {label || t('editor.label.cardImage')}
            </Text>
            {value
                ? (
                    <Flex direction="column" gap="2">
                        <Box
                            style={{
                                border: '1px solid var(--gray-6)',
                                borderRadius: 'var(--radius-2)',
                            }}
                        >
                            <img
                                alt={t('editor.alt.cardPreview')}
                                src={value}
                                style={{ height: '100%', objectFit: 'contain', width: '100%' }}
                            />
                        </Box>
                        <Button color="red" onClick={() => onUpload('')} size="1" variant="soft">
                            {t('editor.buttonRemove.removeImage')}
                        </Button>
                    </Flex>
                )
                : (
                    <Button disabled={uploading} onClick={onUploadClick} variant="soft">
                        {uploading ? t('editor.status.uploading') : t('editor.buttonUpload.uploadImage')}
                    </Button>
                )}
        </Box>
    );
};

const SurvivorFrontEditor: React.FC<{
    card: SurvivorCardData;
    onChange: (card: SurvivorCardData) => void;
}> = ({ card, onChange }) => {
    const { t } = useTranslation();
    const handleImageUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            const url = file ? URL.createObjectURL(file) : '';
            if (file) {
                onChange({ ...card, image: url });
            }
        };
        input.click();
    };

    const updateAbility = (slot: keyof SurvivorCardData['abilities'], ability: SurvivorAbility | undefined) => {
        onChange({
            ...card,
            abilities: {
                ...card.abilities,
                [slot]: ability,
            },
        });
    };

    const toggleTag = (tag: SurvivorTag) => {
        onChange({ ...card, tag });
    };

    return (
        <Flex direction="column" gap="4">
            <Box>
                <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.name')}</Text>
                <Grid align="start" columns="1fr auto" gap="2">
                    <TextField.Root
                        onChange={(e) => onChange({ ...card, name: e.target.value })}
                        placeholder={t('editor.placeholder.survivorName')}
                        value={card.name}
                    />
                    <input
                        onChange={(e) => onChange({ ...card, color: e.target.value })}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderRadius: 'var(--radius-3)',
                            outline: 'none',
                            padding: '0',
                            width: '50px',
                        }}
                        type="color"
                        value={card.color}
                    />
                </Grid>
            </Box>

            <ImageUploader
                onUpload={(url) => onChange({ ...card, image: url })}
                onUploadClick={handleImageUploadClick}
                value={card.image}
            />

            {card.image && (
                <Box>
                    <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.imageScale')}</Text>
                    <Flex align="center" gap="2">
                        <TextField.Root
                            max="200"
                            min="50"
                            onChange={(e) => {
                                const value = Math.max(50, Math.min(parseInt(e.target.value), 200));
                                onChange({ ...card, imageScale: value });
                            }}
                            step="1"
                            style={{ width: '80px' }}
                            type="number"
                            value={card.imageScale || 100}
                        />

                        <Slider
                            max={200}
                            min={50}
                            onValueChange={([value]) => onChange({ ...card, imageScale: value })}
                            step={1}
                            value={[card.imageScale || 100]}
                        />
                    </Flex>
                </Box>
            )}

            <Box>
                <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.health')}</Text>
                <Flex align="center" gap="2">
                    <TextField.Root
                        max="6"
                        min="1"
                        onChange={(e) => {
                            const value = Math.min(parseInt(e.target.value), 6);
                            onChange({ ...card, health: value });
                        }}
                        style={{ width: '80px' }}
                        type="number"
                        value={card.health}
                    />

                    <Slider
                        max={6}
                        min={1}
                        onValueChange={([value]) => onChange({ ...card, health: value })}
                        step={1}
                        value={[card.health]}
                    />
                </Flex>
            </Box>

            <Box>
                <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.tags')}</Text>
                <Box mt="4">
                    <Flex gap="2" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                        <Box
                            onClick={() => toggleTag(null)}
                            style={{
                                alignItems: 'center',
                                border: card.tag ? '2px solid transparent' : '2px solid var(--blue-9)',
                                borderRadius: 'var(--radius-2)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexShrink: 0,
                                height: '50px',
                                justifyContent: 'center',
                                width: '50px',
                            }}
                        >
                            <Text size="2" style={{ fontWeight: 'bold' }}>✕</Text>
                        </Box>
                        {Object.entries(SURVIVOR_TAGS).map(([tag, icon]) => (
                            <Box
                                key={tag}
                                onClick={() => toggleTag(tag as SurvivorTag)}
                                style={{
                                    border: card.tag === tag ? '2px solid var(--blue-9)' : '2px solid transparent',
                                    borderRadius: 'var(--radius-2)',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    height: '50px',
                                    overflow: 'hidden',
                                    width: '50px',
                                }}
                            >
                                <img
                                    alt={tag}
                                    src={icon}
                                    style={{ height: '100%', objectFit: 'contain', width: '100%' }}
                                />
                            </Box>
                        ))}
                    </Flex>
                </Box>
            </Box>

            <TextField.Root
                onChange={(e) => {
                    const ability = card.abilities.blue!;
                    updateAbility('blue', { ...ability, name: e.target.value });
                }}
                placeholder={t('editor.placeholder.abilityName')}
                style={{ borderLeft: `3px solid ${ABILITY_COLORS.blue}` }}
                value={card.abilities.blue?.name}
            />

            <TextField.Root
                onChange={(e) => {
                    const ability = card.abilities.yellow!;
                    updateAbility('yellow', { ...ability, name: e.target.value });
                }}
                placeholder={t('editor.placeholder.abilityName')}
                style={{ borderLeft: `3px solid ${ABILITY_COLORS.yellow}` }}
                value={card.abilities.yellow?.name}
            />

            <TextField.Root
                onChange={(e) => {
                    const ability = card.abilities.orange1!;
                    updateAbility('orange1', { ...ability, name: e.target.value });
                }}
                placeholder={t('editor.placeholder.abilityName')}
                style={{ borderLeft: `3px solid ${ABILITY_COLORS.orange}` }}
                value={card.abilities.orange1?.name}
            />

            <TextField.Root
                onChange={(e) => {
                    const ability = card.abilities.orange2!;
                    updateAbility('orange2', { ...ability, name: e.target.value });
                }}
                placeholder={t('editor.placeholder.abilityName')}
                style={{ borderLeft: `3px solid ${ABILITY_COLORS.orange}` }}
                value={card.abilities.orange2?.name}
            />

            <TextField.Root
                onChange={(e) => {
                    const ability = card.abilities.red1!;
                    updateAbility('red1', { ...ability, name: e.target.value });
                }}
                placeholder={t('editor.placeholder.abilityName')}
                style={{ borderLeft: `3px solid ${ABILITY_COLORS.red}` }}
                value={card.abilities.red1?.name}
            />

            <TextField.Root
                onChange={(e) => {
                    const ability = card.abilities.red2!;
                    updateAbility('red2', { ...ability, name: e.target.value });
                }}
                placeholder={t('editor.placeholder.abilityName')}
                style={{ borderLeft: `3px solid ${ABILITY_COLORS.red}` }}
                value={card.abilities.red2?.name}
            />

            <TextField.Root
                onChange={(e) => {
                    const ability = card.abilities.red3!;
                    updateAbility('red3', { ...ability, name: e.target.value });
                }}
                placeholder={t('editor.placeholder.abilityName')}
                style={{ borderLeft: `3px solid ${ABILITY_COLORS.red}` }}
                value={card.abilities.red3?.name}
            />
        </Flex>
    );
};

const SurvivorBackEditor: React.FC<{
    card: SurvivorCardData;
    onChange: (card: SurvivorCardData) => void;
}> = ({ card, onChange }) => {
    const { t } = useTranslation();
    const handleImageUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            const url = file ? URL.createObjectURL(file) : '';
            if (file) {
                onChange({ ...card, image: url });
            }
        };
        input.click();
    };

    return (
        <Flex direction="column" gap="4">
            <ImageUploader
                onUpload={(url) => onChange({ ...card, image: url })}
                onUploadClick={handleImageUploadClick}
                value={card.image}
            />

            {card.image && (
                <Box>
                    <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.imageScale')}</Text>
                    <Flex align="center" gap="2">
                        <TextField.Root
                            max="200"
                            min="50"
                            onChange={(e) => {
                                const value = Math.max(50, Math.min(parseInt(e.target.value), 200));
                                onChange({ ...card, imageScaleBack: value });
                            }}
                            step="1"
                            style={{ width: '80px' }}
                            type="number"
                            value={card.imageScaleBack || 100}
                        />

                        <Slider
                            max={200}
                            min={50}
                            onValueChange={([value]) => onChange({ ...card, imageScaleBack: value })}
                            step={1}
                            value={[card.imageScaleBack || 100]}
                        />
                    </Flex>
                </Box>
            )}
        </Flex>
    );
};

const SurvivorCardEditor: React.FC<SurvivorCardEditorProps> = ({
    card,
    onChange,
}) => {
    const [currentSide, setCurrentSide] = useState<CardSide>('front');

    return (
        <Grid
            columns={{
                md: '300px 1fr',
                sm: '1fr',
            }}
            gap="4"
        >
            <Card>
                <CardSideSwitch
                    currentSide={currentSide}
                    onSideChange={setCurrentSide}
                />
                {'front' === currentSide
                    ? (
                        <SurvivorFrontEditor
                            card={card}
                            onChange={onChange}
                        />
                    )
                    : (
                        <SurvivorBackEditor
                            card={card}
                            onChange={onChange}
                        />
                    )}
            </Card>

            {'front' === currentSide
                ? (
                    <SurvivorCardFront
                        card={card}
                        onChangeImagePosition={(offsetX, offsetY) => {
                            onChange({ ...card, imageOffsetX: offsetX, imageOffsetY: offsetY });
                        }}
                    />
                )
                : (
                    <SurvivorCardBack
                        card={card}
                        onChangeImagePosition={(offsetX, offsetY) => {
                            onChange({ ...card, imageOffsetXBack: offsetX, imageOffsetYBack: offsetY });
                        }}
                    />
                )}

        </Grid>
    );
};

export default SurvivorCardEditor;
