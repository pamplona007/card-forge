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

export default function CardTypeSelectionModal({
    gameId,
    isOpen,
    onClose,
    onSelectCardType,
}: CardTypeSelectionModalProps) {
    const { t } = useTranslation();
    const cardTypes = getCardTypesForGame(gameId);

    const handleCardTypeSelect = (typeId: string) => {
        onSelectCardType(typeId as ZombicideCardType);
        onClose();
    };

    return (
        <Dialog.Root onOpenChange={(open) => !open && onClose()} open={isOpen}>
            <Dialog.Content maxWidth="600px">
                <Dialog.Title>{t('editor.selectCardType')}</Dialog.Title>
                <Grid columns={{ initial: '1', sm: '2' }} gap="3" mt="4">
                    {cardTypes.map((type) => (
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
                                {type.nameKey ? t(type.nameKey) : type.name}
                            </Text>
                            <Text as="p" color="gray" mt="2" size="2">
                                {type.descriptionKey ? t(type.descriptionKey) : ''}
                            </Text>
                            <Text as="p" color="gray" mt="1" size="1">
                                {`${type.dimensions.width}mm x ${type.dimensions.height}mm`}
                            </Text>
                        </Box>
                    ))}
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
