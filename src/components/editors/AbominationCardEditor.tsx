import { Box, Button, Flex, Select, Text, TextField } from '@radix-ui/themes';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type {
    AbominationCardData,
    SurvivorAbility,
} from '../../types/zombicide-card';

import { ABILITY_COLORS } from '../../types/zombicide-card';
import AbominationCard from '../cards/zombicide/AbominationCard';

interface AbominationCardEditorProps {
  card: AbominationCardData;
  onChange: (card: AbominationCardData) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const ImageUploader: React.FC<{
  onUpload: (url: string) => void;
  onUploadClick: () => void;
  uploading?: boolean;
  value?: string;
}> = ({ onUpload, onUploadClick, uploading, value }) => {
    const { t } = useTranslation();
    return (
        <Box>
            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>
                {t('editor.label.cardImage')}
            </Text>
            {value
                ? (
                    <Flex direction="column" gap="2">
                        <Box
                            style={{
                                aspectRatio: '63.5/88.9',
                                border: '1px solid var(--gray-6)',
                                borderRadius: 'var(--radius-2)',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                width: '100%',
                            }}
                        >
                            <img
                                alt={t('editor.alt.cardPreview')}
                                src={value}
                                style={{ height: '100%', objectFit: 'cover', width: '100%' }}
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

const AbilityEditor: React.FC<{
  abilities: SurvivorAbility[];
  label?: string;
  onChange: (abilities: SurvivorAbility[]) => void;
}> = ({ abilities, label, onChange }) => {
    const { t } = useTranslation();
    const translatedLabel = label || t('editor.label.abilities');
    const addAbility = () => {
        const newAbility: SurvivorAbility = {
            color: 'blue',
            id: crypto.randomUUID(),
            name: '',
        };
        onChange([...abilities, newAbility]);
    };

    const updateAbility = (id: string, updates: Partial<SurvivorAbility>) => {
        onChange(abilities.map((a) => a.id === id ? { ...a, ...updates } : a));
    };

    const removeAbility = (id: string) => {
        onChange(abilities.filter((a) => a.id !== id));
    };

    return (
        <Box>
            <Flex align="center" justify="between" mb="2">
                <Text as="p" size="2" style={{ color: 'var(--gray-11)' }}>
                    {translatedLabel}
                </Text>
                <Button onClick={addAbility} size="1" variant="soft">
                    {t('editor.buttonAdd.addAbility')}
                </Button>
            </Flex>
            {abilities.map((ability) => (
                <Box
                    key={ability.id}
                    mb="2"
                    p="2"
                    style={{
                        backgroundColor: 'var(--gray-3)',
                        borderLeft: `3px solid ${ABILITY_COLORS[ability.color]}`,
                        borderRadius: 'var(--radius-2)',
                    }}
                >
                    <Flex direction="column" gap="2">
                        <Flex gap="2">
                            <TextField.Root
                                onChange={(e) => updateAbility(ability.id, { name: e.target.value })}
                                placeholder={t('editor.placeholder.abilityName')}
                                style={{ flex: 1 }}
                                value={ability.name}
                            />
                            <Select.Root
                                onValueChange={(value) => updateAbility(ability.id, { color: value as SurvivorAbility['color'] })}
                                value={ability.color}
                            >
                                <Select.Trigger style={{ width: '80px' }} />
                                <Select.Content>
                                    <Select.Item value="blue">{t('color.blue')}</Select.Item>
                                    <Select.Item value="yellow">{t('color.yellow')}</Select.Item>
                                    <Select.Item value="orange">{t('color.orange')}</Select.Item>
                                    <Select.Item value="red">{t('color.red')}</Select.Item>
                                </Select.Content>
                            </Select.Root>
                            <Button color="red" onClick={() => removeAbility(ability.id)} size="1" variant="soft">
                ×
                            </Button>
                        </Flex>
                    </Flex>
                </Box>
            ))}
        </Box>
    );
};

const AbominationCardEditor: React.FC<AbominationCardEditorProps> = ({
    card,
    onChange,
    onImageUpload,
}) => {
    const { t } = useTranslation();
    const handleImageUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && onImageUpload) {
                const url = await onImageUpload(file);
                onChange({ ...card, image: url });
            }
        };
        input.click();
    };

    return (
        <Flex direction="column" gap="4">
            <Box p="4" style={{ backgroundColor: 'white', borderRadius: 'var(--radius-2)' }}>
                <Flex direction="column" gap="4">
                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.name')}</Text>
                        <TextField.Root
                            onChange={(e) => onChange({ ...card, name: e.target.value })}
                            placeholder={t('editor.placeholder.abominationName')}
                            value={card.name}
                        />
                    </Box>

                    <ImageUploader
                        onUpload={(url) => onChange({ ...card, image: url })}
                        onUploadClick={handleImageUploadClick}
                        value={card.image}
                    />

                    <Flex gap="4">
                        <Box style={{ flex: 1 }}>
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.health')}</Text>
                            <TextField.Root
                                max="20"
                                min="1"
                                onChange={(e) => onChange({ ...card, health: parseInt(e.target.value) || 1 })}
                                type="number"
                                value={card.health}
                            />
                        </Box>
                        <Box style={{ flex: 1 }}>
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.speed')}</Text>
                            <TextField.Root
                                max="5"
                                min="0"
                                onChange={(e) => onChange({ ...card, speed: parseInt(e.target.value) || 0 })}
                                type="number"
                                value={card.speed}
                            />
                        </Box>
                        <Box style={{ flex: 1 }}>
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.attack')}</Text>
                            <TextField.Root
                                max="5"
                                min="0"
                                onChange={(e) => onChange({ ...card, attack: parseInt(e.target.value) || 0 })}
                                type="number"
                                value={card.attack}
                            />
                        </Box>
                        <Box style={{ flex: 1 }}>
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.defense')}</Text>
                            <TextField.Root
                                max="5"
                                min="0"
                                onChange={(e) => onChange({ ...card, defense: parseInt(e.target.value) || 0 })}
                                type="number"
                                value={card.defense}
                            />
                        </Box>
                    </Flex>

                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.xpValue')}</Text>
                        <TextField.Root
                            min="0"
                            onChange={(e) => onChange({ ...card, xpValue: parseInt(e.target.value) || 0 })}
                            type="number"
                            value={card.xpValue}
                        />
                    </Box>

                    <AbilityEditor
                        abilities={card.abilities}
                        label={t('editor.specialAbilities')}
                        onChange={(abilities) => onChange({ ...card, abilities })}
                    />

                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.flavorText')}</Text>
                        <TextField.Root
                            onChange={(e) => onChange({ ...card, flavorText: e.target.value })}
                            placeholder={t('editor.placeholder.flavorTextOptional')}
                            value={card.flavorText || ''}
                        />
                    </Box>

                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.copyright')}</Text>
                        <TextField.Root
                            onChange={(e) => onChange({ ...card, copyright: e.target.value })}
                            placeholder={t('editor.placeholder.copyright')}
                            value={card.copyright || ''}
                        />
                    </Box>
                </Flex>
            </Box>

            <Box>
                <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>
                    {t('editor.preview.title')}
                </Text>
                <Box
                    style={{
                        alignItems: 'center',
                        backgroundColor: 'var(--gray-3)',
                        borderRadius: 'var(--radius-4)',
                        display: 'flex',
                        justifyContent: 'center',
                        minHeight: '300px',
                        padding: '24px',
                    }}
                >
                    <Box
                        style={{
                            transform: 'scale(1.5)',
                            transformOrigin: 'center center',
                        }}
                    >
                        <AbominationCard card={card} />
                    </Box>
                </Box>
            </Box>
        </Flex>
    );
};

export default AbominationCardEditor;
