import { Box, Card, Checkbox, Flex, Grid, Popover, Slider, Text, TextArea, TextField } from '@radix-ui/themes';
import ImageUploader from 'components/editor/ImageUploader';
import React, { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resizeToDataUrl } from 'utils/imageUtils';

import type {
    SurvivorAbility,
    SurvivorCardData,
    SurvivorTag,
} from '../types';

import CardSideSwitch, { type CardSide } from '../../../components/ui/CardSideSwitch';
import SurvivorCardBack from '../cards/SurvivorCardBack';
import SurvivorCardFront from '../cards/SurvivorCardFront';
import { SURVIVOR_ABILITY_DATABASE } from '../data/survivorAbilities';
import {
    ABILITY_COLORS,
    SURVIVOR_TAGS,
} from '../types';

interface AbilityAutocompleteProps {
    onChange: (value: string) => void;
    onSelect?: (name: string, description?: string) => void;
    placeholder?: string;
    style?: React.CSSProperties;
    value: string;
}

interface SurvivorCardEditorProps {
    card: SurvivorCardData;
    onChange: (card: SurvivorCardData) => void;
}

const AbilityAutocomplete: React.FC<AbilityAutocompleteProps> = ({
    onChange,
    onSelect,
    placeholder,
    style,
    value,
}) => {
    const { t } = useTranslation();
    const listboxId = useId();
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const suggestions = useMemo(() => {
        if (!value.trim()) {
            return [];
        }
        const q = value.toLowerCase();
        return SURVIVOR_ABILITY_DATABASE
            .filter((a) => t(a.nameKey).toLowerCase()
                .includes(q))
            .slice(0, 8);
    }, [value, t]);

    const handleSelect = (nameKey: string, descriptionKey?: string) => {
        const name = t(nameKey);
        const description = descriptionKey ? t(descriptionKey) : undefined;
        (onSelect || onChange)(name, description);
        setOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if ('ArrowDown' === e.key && 0 < suggestions.length) {
                setOpen(true);
                setActiveIndex(0);
                e.preventDefault();
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, -1));
                break;
            case 'Enter':
                if (0 <= activeIndex) {
                    e.preventDefault();
                    handleSelect(suggestions[activeIndex].nameKey, suggestions[activeIndex].descriptionKey);
                }
                break;
            case 'Escape':
                setOpen(false);
                setActiveIndex(-1);
                break;
        }
    };

    return (
        <>
            <Popover.Root onOpenChange={setOpen} open={open && 0 < suggestions.length}>
                <Popover.Trigger>
                    <TextField.Root
                        aria-activedescendant={0 <= activeIndex ? `${listboxId}-option-${activeIndex}` : undefined}
                        aria-autocomplete="list"
                        aria-controls={open ? listboxId : undefined}
                        aria-expanded={open}
                        aria-haspopup="listbox"
                        onChange={(e) => {
                            onChange(e.target.value);
                            setActiveIndex(-1);
                            setOpen(true);
                        }}
                        onFocus={() => {
                            if (value.trim()) {
                                setOpen(true);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        role="combobox"
                        style={style}
                        type='text'
                        value={value}
                    />
                </Popover.Trigger>
                <Popover.Content
                    align="start"
                    aria-label={placeholder}
                    id={listboxId}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    role="listbox"
                    side="bottom"
                    style={{ maxHeight: '220px', overflowY: 'auto', padding: 0 }}
                >
                    {suggestions.map((ability, index) => (
                        <Box
                            aria-selected={index === activeIndex}
                            id={`${listboxId}-option-${index}`}
                            key={ability.nameKey}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(ability.nameKey, ability.descriptionKey);
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(-1)}
                            role="option"
                            style={{
                                background: index === activeIndex ? 'var(--gray-3)' : '',
                                cursor: 'pointer',
                                padding: '6px 10px',
                            }}
                        >
                            <Text size="2">{t(ability.nameKey)}</Text>
                            {ability.descriptionKey && (
                                <Text
                                    as="p"
                                    size="1"
                                    style={{ color: 'var(--gray-10)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                    {t(ability.descriptionKey)}
                                </Text>
                            )}
                        </Box>
                    ))}
                </Popover.Content>
            </Popover.Root>
        </>
    );
};

const SurvivorFrontEditor: React.FC<{
    card: SurvivorCardData;
    onChange: (card: SurvivorCardData) => void;
}> = ({ card, onChange }) => {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);

    const handleImageUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setUploading(true);
                try {
                    const url = await resizeToDataUrl(file);
                    onChange({ ...card, image: url });
                } catch (error) {
                    console.error('Error uploading image:', error);
                } finally {
                    setUploading(false);
                }
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

    const abilitySlots: Array<{ color: string; slot: keyof SurvivorCardData['abilities'] }> = [
        { color: ABILITY_COLORS.blue, slot: 'blue' },
        { color: ABILITY_COLORS.yellow, slot: 'yellow' },
        { color: ABILITY_COLORS.orange, slot: 'orange1' },
        { color: ABILITY_COLORS.orange, slot: 'orange2' },
        { color: ABILITY_COLORS.red, slot: 'red1' },
        { color: ABILITY_COLORS.red, slot: 'red2' },
        { color: ABILITY_COLORS.red, slot: 'red3' },
    ];

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
                uploading={uploading}
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

            <Box>
                <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>{t('editor.label.abilities')}</Text>
                <Flex direction="column" gap="2">
                    {abilitySlots.map(({ color, slot }) => (
                        <AbilityAutocomplete
                            key={slot}
                            onChange={(name) => {
                                const ability = card.abilities[slot]!;
                                updateAbility(slot, { ...ability, name });
                            }}
                            placeholder={t('editor.placeholder.abilityName')}
                            style={{ borderLeft: `3px solid ${color}` }}
                            value={card.abilities[slot]?.name ?? ''}
                        />
                    ))}
                </Flex>
            </Box>
        </Flex>
    );
};

const SurvivorBackEditor: React.FC<{
    card: SurvivorCardData;
    onChange: (card: SurvivorCardData) => void;
}> = ({ card, onChange }) => {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);

    const handleImageUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setUploading(true);
                try {
                    const url = await resizeToDataUrl(file);
                    onChange({ ...card, image: url });
                } catch (error) {
                    console.error('Error uploading image:', error);
                } finally {
                    setUploading(false);
                }
            }
        };
        input.click();
    };

    return (
        <Flex direction="column" gap="4">
            <ImageUploader
                onUpload={(url) => onChange({ ...card, image: url })}
                onUploadClick={handleImageUploadClick}
                uploading={uploading}
                value={card.image}
            />

            {card.tag && (
                <Box
                    style={{
                        background: 'var(--gray-2)',
                        borderRadius: 'var(--radius-2)',
                        padding: 'var(--space-3)',
                    }}
                >
                    <Flex align="center" gap="2">
                        <Checkbox
                            checked={card.showTagDescription ?? false}
                            id="show-tag-description"
                            onCheckedChange={(checked) => {
                                onChange({ ...card, showTagDescription: Boolean(checked) });
                            }}
                        />
                        <Text
                            as="label"
                            htmlFor="show-tag-description"
                            size="2"
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                            {t('editor.label.showTagDescription')}
                        </Text>
                    </Flex>
                </Box>
            )}

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

            {[0, 1, 2].map((index) => (
                <Box key={index}>
                    <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>
                        {t('editor.label.description')} {index + 1}
                    </Text>
                    <Flex direction="column" gap="2">
                        <AbilityAutocomplete
                            onChange={(title) => {
                                const description = card.descriptions?.[index] || { text: '', title: '' };
                                const descriptions = [...(card.descriptions || [])];
                                descriptions[index] = { ...description, title };
                                onChange({ ...card, descriptions });
                            }}
                            onSelect={(name, description) => {
                                const descriptions = [...(card.descriptions || [])];
                                const existing = descriptions[index] || { text: '', title: '' };
                                descriptions[index] = {
                                    text: description ?? existing.text,
                                    title: name,
                                };
                                onChange({ ...card, descriptions });
                            }}
                            placeholder={t('editor.placeholder.descriptionHeading')}
                            value={card.descriptions?.[index]?.title || ''}
                        />
                        <TextArea
                            onChange={(e) => {
                                const description = card.descriptions?.[index] || { text: '', title: '' };
                                const descriptions = [...(card.descriptions || [])];
                                descriptions[index] = { ...description, text: e.target.value };
                                onChange({ ...card, descriptions });
                            }}
                            placeholder={t('editor.placeholder.descriptionText')}
                            style={{ minHeight: '100px' }}
                            value={card.descriptions?.[index]?.text || ''}
                        />
                    </Flex>
                </Box>
            ))}
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
