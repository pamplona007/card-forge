import { Box, Button, Flex, Select, Text, TextField } from '@radix-ui/themes';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type {
    PimpWeaponCardData,
} from '../types';

import PimpWeaponCard from '../cards/PimpWeaponCard';

interface PimpWeaponCardEditorProps {
  card: PimpWeaponCardData;
  onChange: (card: PimpWeaponCardData) => void;
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

const PimpWeaponCardEditor: React.FC<PimpWeaponCardEditorProps> = ({
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

    const addAbility = () => {
        const newAbility = {
            description: '',
            id: crypto.randomUUID(),
            name: '',
        };
        onChange({ ...card, abilities: [...card.abilities, newAbility] });
    };

    const updateAbility = (id: string, updates: Partial<PimpWeaponCardData['abilities'][0]>) => {
        onChange({
            ...card,
            abilities: card.abilities.map((a) => a.id === id ? { ...a, ...updates } : a),
        });
    };

    const removeAbility = (id: string) => {
        onChange({ ...card, abilities: card.abilities.filter((a) => a.id !== id) });
    };

    return (
        <Flex direction="column" gap="4">
            <Box p="4" style={{ backgroundColor: 'white', borderRadius: 'var(--radius-2)' }}>
                <Flex direction="column" gap="4">
                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.name')}</Text>
                        <TextField.Root
                            onChange={(e) => onChange({ ...card, name: e.target.value })}
                            placeholder={t('editor.placeholder.weaponName')}
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
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.damage')}</Text>
                            <TextField.Root
                                max="10"
                                min="0"
                                onChange={(e) => onChange({ ...card, damage: parseInt(e.target.value) || 0 })}
                                type="number"
                                value={card.damage}
                            />
                        </Box>
                        <Box style={{ flex: 1 }}>
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.range')}</Text>
                            <TextField.Root
                                max="10"
                                min="0"
                                onChange={(e) => onChange({ ...card, range: parseInt(e.target.value) || 0 })}
                                type="number"
                                value={card.range}
                            />
                        </Box>
                    </Flex>

                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.type')}</Text>
                        <Select.Root
                            onValueChange={(value) => onChange({ ...card, damageType: value as PimpWeaponCardData['damageType'] })}
                            value={card.damageType}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="melee">{t('zombicide.weaponType.melee')}</Select.Item>
                                <Select.Item value="ranged">{t('zombicide.weaponType.ranged')}</Select.Item>
                                <Select.Item value="explosive">{t('zombicide.weaponType.explosive')}</Select.Item>
                                <Select.Item value="fire">{t('zombicide.weaponType.fire')}</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>

                    <CheckboxField
                        checked={card.isTwoHanded || false}
                        label={t('editor.checkbox.twoHanded')}
                        onChange={(checked) => onChange({ ...card, isTwoHanded: checked })}
                    />

                    <Box>
                        <Flex align="center" justify="between" mb="2">
                            <Text as="p" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.abilities')}</Text>
                            <Button onClick={addAbility} size="1" variant="soft">
                                {t('editor.buttonAdd.addAbility')}
                            </Button>
                        </Flex>
                        {card.abilities.map((ability) => (
                            <Box
                                key={ability.id}
                                mb="2"
                                p="2"
                                style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-2)' }}
                            >
                                <Flex gap="2">
                                    <TextField.Root
                                        onChange={(e) => updateAbility(ability.id, { name: e.target.value })}
                                        placeholder={t('editor.placeholder.abilityName')}
                                        style={{ flex: 1 }}
                                        value={ability.name}
                                    />
                                    <Button color="red" onClick={() => removeAbility(ability.id)} size="1" variant="soft">
                    ×
                                    </Button>
                                </Flex>
                                <TextField.Root
                                    mt="2"
                                    onChange={(e) => updateAbility(ability.id, { description: e.target.value })}
                                    placeholder={t('editor.placeholder.description')}
                                    value={ability.description}
                                />
                            </Box>
                        ))}
                    </Box>

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
                        <PimpWeaponCard card={card} />
                    </Box>
                </Box>
            </Box>
        </Flex>
    );
};

export default PimpWeaponCardEditor;
