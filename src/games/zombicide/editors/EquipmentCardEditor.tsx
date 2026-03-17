import { Box, Checkbox, Flex, Grid, Select, Slider, Text, TextArea, TextField } from '@radix-ui/themes';
import ImageUploader from 'components/editor/ImageUploader';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type {
    EquipmentCardData,
} from '../types';

import EquipmentCard from '../cards/EquipmentCard';

interface EquipmentCardEditorProps {
    card: EquipmentCardData;
    onChange: (card: EquipmentCardData) => void;
    onImageUpload?: (file: File) => Promise<string>;
}

const EquipmentCardEditor: React.FC<EquipmentCardEditorProps> = ({
    card,
    onChange,
    onImageUpload,
}) => {
    const { t } = useTranslation();

    const parseOptionalNumber = (value: string) => {
        const parsedValue = Number(value);

        if (!value.trim() || Number.isNaN(parsedValue)) {
            return undefined;
        }

        return parsedValue;
    };

    const updateOptionalNumberField = (field: keyof EquipmentCardData, value: string) => {
        onChange({
            ...card,
            [field]: parseOptionalNumber(value),
        });
    };

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
        <Grid
            columns={{
                md: '400px 1fr',
                sm: '1fr',
            }}
            gap="4"
        >
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

                    <Box>
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.flavorText')}</Text>
                        <TextField.Root
                            onChange={(e) => onChange({ ...card, flavorText: e.target.value || undefined })}
                            placeholder={t('editor.placeholder.flavorTextOptional')}
                            value={card.flavorText || ''}
                        />
                    </Box>

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
                        <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.type')}</Text>
                        <Select.Root
                            onValueChange={(value) => onChange({ ...card, equipmentType: value as EquipmentCardData['equipmentType'] })}
                            value={card.equipmentType}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="starter">{t('editor.option.equipmentTypeStarter')}</Select.Item>
                                <Select.Item value="equipment">{t('editor.option.equipmentTypeEquipment')}</Select.Item>
                                <Select.Item value="companion">{t('editor.option.equipmentTypeCompanion')}</Select.Item>
                                <Select.Item value="pimp">{t('editor.option.equipmentTypePimp')}</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>

                    <ImageUploader
                        onUpload={(url) => onChange({ ...card, image: url })}
                        onUploadClick={handleImageUploadClick}
                        value={card.image}
                    />

                    {card.image && (
                        <>
                            <Box>
                                <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.imageScale')}</Text>
                                <Flex align="center" gap="2">
                                    <TextField.Root
                                        max="200"
                                        min="50"
                                        onChange={(e) => {
                                            const value = Math.max(50, Math.min(parseInt(e.target.value, 10) || 100, 200));
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
                        </>
                    )}

                    <label style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', gap: '8px' }}>
                        <Checkbox
                            checked={card.dualWield}
                            onCheckedChange={(checked) => onChange({ ...card, dualWield: Boolean(checked) })}
                        />
                        <Text size="2">{t('editor.label.dualWield')}</Text>
                    </label>

                    <Grid columns="1fr 1fr" gap="2">
                        <Box>
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.weapon')}</Text>
                            <Select.Root
                                onValueChange={(value) => onChange({ ...card, weapon: 'none' === value ? null : value as EquipmentCardData['weapon'] })}
                                value={card.weapon || 'none'}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="none">{t('editor.option.none')}</Select.Item>
                                    <Select.Item value="silent">{t('editor.option.silent')}</Select.Item>
                                    <Select.Item value="loud">{t('editor.option.loud')}</Select.Item>
                                    <Select.Item value="both">{t('editor.option.both')}</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                        <Box>
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.opensDoors')}</Text>
                            <Select.Root
                                onValueChange={(value) => onChange({ ...card, opensDoors: 'none' === value ? null : value as EquipmentCardData['opensDoors'] })}
                                value={card.opensDoors || 'none'}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="none">{t('editor.option.none')}</Select.Item>
                                    <Select.Item value="silent">{t('editor.option.silent')}</Select.Item>
                                    <Select.Item value="loud">{t('editor.option.loud')}</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                    </Grid>

                    <Box>
                        <Grid columns="1fr 1fr" gap="2">
                            <Box>
                                <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>{t('editor.label.damage')}</Text>
                                <TextField.Root
                                    onChange={(e) => updateOptionalNumberField('weaponDamage', e.target.value)}
                                    placeholder={t('editor.placeholder.optionalNumber')}
                                    type="number"
                                    value={card.weaponDamage ?? ''}
                                />
                            </Box>
                            <Box>
                                <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>{t('editor.label.range')}</Text>
                                <TextField.Root
                                    onChange={(e) => updateOptionalNumberField('weaponRange', e.target.value)}
                                    placeholder={t('editor.placeholder.optionalNumber')}
                                    type="number"
                                    value={card.weaponRange ?? ''}
                                />
                            </Box>
                            <Box>
                                <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>{t('editor.label.weaponDice')}</Text>
                                <TextField.Root
                                    onChange={(e) => updateOptionalNumberField('weaponDice', e.target.value)}
                                    placeholder={t('editor.placeholder.optionalNumber')}
                                    type="number"
                                    value={card.weaponDice ?? ''}
                                />
                            </Box>
                            <Box>
                                <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>{t('editor.label.weaponDiceResults')}</Text>
                                <TextField.Root
                                    onChange={(e) => updateOptionalNumberField('weaponDiceResults', e.target.value)}
                                    placeholder={t('editor.placeholder.optionalNumber')}
                                    type="number"
                                    value={card.weaponDiceResults ?? ''}
                                />
                            </Box>
                        </Grid>
                    </Box>

                    {'both' === card.weapon && (
                        <Box>
                            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.secondaryWeaponProfile')}</Text>
                            <Grid columns="1fr 1fr" gap="2">
                                <Box>
                                    <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>{t('editor.label.damage')}</Text>
                                    <TextField.Root
                                        onChange={(e) => updateOptionalNumberField('weaponDamageAlt', e.target.value)}
                                        placeholder={t('editor.placeholder.optionalNumber')}
                                        type="number"
                                        value={card.weaponDamageAlt ?? ''}
                                    />
                                </Box>
                                <Box>
                                    <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>{t('editor.label.range')}</Text>
                                    <TextField.Root
                                        onChange={(e) => updateOptionalNumberField('weaponRangeAlt', e.target.value)}
                                        placeholder={t('editor.placeholder.optionalNumber')}
                                        type="number"
                                        value={card.weaponRangeAlt ?? ''}
                                    />
                                </Box>
                                <Box>
                                    <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>{t('editor.label.weaponDice')}</Text>
                                    <TextField.Root
                                        onChange={(e) => updateOptionalNumberField('weaponDiceAlt', e.target.value)}
                                        placeholder={t('editor.placeholder.optionalNumber')}
                                        type="number"
                                        value={card.weaponDiceAlt ?? ''}
                                    />
                                </Box>
                                <Box>
                                    <Text as="p" mb="1" size="1" style={{ color: 'var(--gray-11)' }}>{t('editor.label.weaponDiceResults')}</Text>
                                    <TextField.Root
                                        onChange={(e) => updateOptionalNumberField('weaponDiceResultsAlt', e.target.value)}
                                        placeholder={t('editor.placeholder.optionalNumber')}
                                        type="number"
                                        value={card.weaponDiceResultsAlt ?? ''}
                                    />
                                </Box>
                            </Grid>
                        </Box>
                    )}
                </Flex>
            </Box>

            <Box>
                <EquipmentCard
                    card={card}
                    onChangeImagePosition={(offsetX, offsetY) => onChange({
                        ...card,
                        imageOffsetX: offsetX,
                        imageOffsetY: offsetY,
                    })}
                />
            </Box>
        </Grid>
    );
};

export default EquipmentCardEditor;
