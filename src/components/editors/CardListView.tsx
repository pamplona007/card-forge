import type { ZombicideCardData } from 'components/editors/zombicide/ZombicideCardEditor';

import { Box, Button, Flex, Grid, Text } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';

interface CardListViewProps {
    cards: ZombicideCardData[];
    onCardClick: (card: ZombicideCardData) => void;
    onDeleteCard: (index: number) => void;
}

export default function CardListView({
    cards,
    onCardClick,
    onDeleteCard,
}: CardListViewProps) {
    const { t } = useTranslation();

    if (0 === cards.length) {
        return (
            <Box
                p="6"
                style={{
                    backgroundColor: 'var(--gray-3)',
                    borderRadius: 'var(--radius-3)',
                    textAlign: 'center',
                }}
            >
                <Text color="gray" size="3">
                    {t('editor.noCards')}
                </Text>
            </Box>
        );
    }

    return (
        <>
            <Box mb="4">
                <Text color="gray" size="2">
                    {t('editor.cardsCount', { count: cards.length })}
                </Text>
            </Box>

            <Grid columns={{ initial: '2', lg: '5', md: '4', sm: '3' }} gap="3">
                {cards.map((card, index) => (
                    <Box
                        key={card.id || index}
                        onClick={() => onCardClick(card)}
                        style={{
                            cursor: 'pointer',
                        }}
                    >
                        <Box
                            p="2"
                            style={{
                                aspectRatio: '63.5/88.9',
                                backgroundColor: 'var(--gray-3)',
                                border: '1px solid var(--gray-5)',
                                borderRadius: 'var(--radius-2)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box>
                                <Text
                                    size="2"
                                    style={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                    weight="bold"
                                >
                                    {card.name || t('editor.label.unnamed')}
                                </Text>
                                <Text color="gray" size="1">
                                    {card.type}
                                </Text>
                            </Box>
                            <Text color="gray" size="1">
                                {card.type}
                            </Text>
                        </Box>
                        <Flex align="center" justify="between" mt="2">
                            <Text color="gray" size="1">
                                {card.name || t('editor.label.unnamed')}
                            </Text>
                            <Flex gap="1">
                                <Button
                                    color="red"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteCard(index);
                                    }}
                                    size="1"
                                    variant="soft"
                                >
                                    {t('projects.buttonRemove.remove')}
                                </Button>
                            </Flex>
                        </Flex>
                    </Box>
                ))}
            </Grid>
        </>
    );
}
