import { Box, Button, Flex, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type {
    EquipmentCardData,
    EquipmentSlot,
    SurvivorAbility,
} from '../types';

import EquipmentCard from '../cards/EquipmentCard';
import { ABILITY_COLORS } from '../types';

interface EquipmentCardEditorProps {
  card: EquipmentCardData;
  onChange: (card: EquipmentCardData) => void;
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

const CheckboxField: React.FC<{
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}> = ({ checked, label, onChange }) => (
    <label style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', gap: '8px' }}>
        <input
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{ cursor: 'pointer', height: '16px', width: '16px' }}
            type="checkbox"
        />
        <Text size="2">{label}</Text>
    </label>
);

const EquipmentCardEditor: React.FC<EquipmentCardEditorProps> = ({
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
                            placeholder={t('editor.placeholder.equipmentName')}
                            value={card.name}
                        />
                    </Box>

                    <ImageUploader
                        onUpload={(url) => onChange({ ...card, image: url })}
                        onUploadClick={handleImageUploadClick}
                        value={card.image}
                    />

                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.equipmentDescription')}</Text>
                        <TextArea
                            onChange={(e) => onChange({ ...card, description: e.target.value })}
                            placeholder={t('editor.placeholder.equipmentDescription')}
                            rows={3}
                            value={card.description}
                        />
                    </Box>

                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.slot')}</Text>
                        <Select.Root
                            onValueChange={(value) => onChange({ ...card, slot: value as EquipmentSlot })}
                            value={card.slot}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="hand">{t('slot.hand')}</Select.Item>
                                <Select.Item value="body">{t('slot.body')}</Select.Item>
                                <Select.Item value="small">{t('slot.small')}</Select.Item>
                                <Select.Item value="big">{t('slot.big')}</Select.Item>
                                <Select.Item value="any">{t('slot.any')}</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>

                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.rarity')}</Text>
                        <Select.Root
                            onValueChange={(value) => onChange({ ...card, rarity: parseInt(value) })}
                            value={card.rarity.toString()}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="1">{t('rarity.common')}</Select.Item>
                                <Select.Item value="2">{t('rarity.uncommon')}</Select.Item>
                                <Select.Item value="3">{t('rarity.rare')}</Select.Item>
                                <Select.Item value="4">{t('rarity.epic')}</Select.Item>
                                <Select.Item value="5">{t('rarity.legendary')}</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>

                    <CheckboxField
                        checked={card.isUnique || false}
                        label={t('editor.checkbox.uniqueItem')}
                        onChange={(checked) => onChange({ ...card, isUnique: checked })}
                    />

                    <AbilityEditor
                        abilities={card.abilities || []}
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
                        <EquipmentCard card={card} />
                    </Box>
                </Box>
            </Box>
        </Flex>
    );
};

export default EquipmentCardEditor;
