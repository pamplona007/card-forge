import type { ZombicideCardType } from 'games/zombicide/editors/ZombicideCardEditor';

import { Box, Button, Dialog, Flex, Grid, Text } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';
import { getCardTypesForGame } from 'types/game';

interface CardTypeSelectionModalProps {
    gameId: string;
    isOpen: boolean;
    onClose: () => void;
    onSelectCardType: (type: ZombicideCardType) => void;
}

const CARD_TYPE_DIMENSIONS: Record<string, string> = {
    'abomination': '63.5mm x 88.9mm',
    'equipment': '63.5mm x 88.9mm',
    'pimp-weapon': '63.5mm x 88.9mm',
    'survivor': '63.5mm x 88.9mm',
    'zombie-spawn': '63.5mm x 88.9mm',
};

const CARD_TYPE_DESCRIPTION_KEYS: Record<string, string> = {
    'abomination': 'zombicide.cardTypeDescription.abomination',
    'equipment': 'zombicide.cardTypeDescription.equipment',
    'pimp-weapon': 'zombicide.cardTypeDescription.pimpWeapon',
    'survivor': 'zombicide.cardTypeDescription.survivor',
    'zombie-spawn': 'zombicide.cardTypeDescription.zombieSpawn',
};

export default function CardTypeSelectionModal({
    gameId,
    isOpen,
    onClose,
    onSelectCardType,
}: CardTypeSelectionModalProps) {
    const { t } = useTranslation();
    const cardTypes = getCardTypesForGame(gameId);

    const getDisplayName = (typeId: string): string => {
        switch (typeId) {
            case 'abomination':
                return t('zombicide.editor.button.abomination');
            case 'equipment':
                return t('zombicide.editor.button.equipment');
            case 'pimp-weapon':
                return t('zombicide.editor.button.weapon');
            case 'survivor':
                return t('zombicide.editor.button.survivor');
            case 'zombie-spawn':
                return t('zombicide.editor.button.zombie');
            default:
                return typeId;
        }
    };

    const handleCardTypeSelect = (typeId: string) => {
        onSelectCardType(typeId as ZombicideCardType);
        onClose();
    };

    return (
        <Dialog.Root onOpenChange={(open) => !open && onClose()} open={isOpen}>
            <Dialog.Content maxWidth="600px">
                <Dialog.Title>{t('editor.selectCardType')}</Dialog.Title>
                <Grid columns={{ initial: '1', sm: '2' }} gap="3" mt="4">
                    {cardTypes.map((type) => {
                        const descriptionKey = CARD_TYPE_DESCRIPTION_KEYS[type.id];
                        const dimensions = CARD_TYPE_DIMENSIONS[type.id] ?? '63.5mm x 88.9mm';

                        return (
                            <Box
                                className="card-type-button"
                                key={type.id}
                                onClick={() => handleCardTypeSelect(type.id)}
                                style={{
                                    backgroundColor: 'var(--gray-3)',
                                    border: '1px solid var(--gray-5)',
                                    borderRadius: 'var(--radius-3)',
                                    cursor: 'pointer',
                                    padding: 'var(--space-4)',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Text size="3" weight="bold">
                                    {getDisplayName(type.id)}
                                </Text>
                                <Text as="p" color="gray" mt="2" size="2">
                                    {descriptionKey ? t(descriptionKey) : ''}
                                </Text>
                                <Text as="p" color="gray" mt="1" size="1">
                                    {dimensions}
                                </Text>
                            </Box>
                        );
                    })}
                </Grid>
                <Flex gap="3" justify="end" mt="5">
                    <Dialog.Close>
                        <Button color="gray" variant="soft">
                            {t('projects.button.cancel')}
                        </Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
