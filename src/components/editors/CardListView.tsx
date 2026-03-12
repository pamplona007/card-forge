import type { ZombicideCardData, ZombicideCardType } from 'components/editors/zombicide/ZombicideCardEditor';

import { Box, Button, Flex, Grid, Text } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';

interface CardListViewProps {
    cards: ZombicideCardData[];
    onCardClick?: (card: ZombicideCardData) => void;
    onDeleteCard?: (index: number) => void;
}

const TYPE_BACKGROUNDS: Record<ZombicideCardType, { color: string; image?: string }> = {
    'abomination': { color: '#7c2d12' },
    'equipment': { color: '#1e3a5f' },
    'pimp-weapon': { color: '#3b1f5e' },
    'survivor': { color: '#1a2e1a', image: '/zombicide-2nd/survivor/card-background.png' },
    'zombie-spawn': { color: '#1f2d1a' },
};

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
                        onClick={() => onCardClick?.(card)}
                        style={{
                            cursor: onCardClick ? 'pointer' : 'default',
                        }}
                    >
                        <Box
                            style={{
                                aspectRatio: '1',
                                backgroundColor: TYPE_BACKGROUNDS[card.type].color,
                                border: '1px solid var(--gray-5)',
                                borderRadius: 'var(--radius-4)',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {TYPE_BACKGROUNDS[card.type].image && (
                                <img
                                    alt=""
                                    src={TYPE_BACKGROUNDS[card.type].image}
                                    style={{
                                        height: '100%',
                                        left: 0,
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                        position: 'absolute',
                                        scale: '1.2',
                                        top: 0,
                                        width: '100%',
                                    }}
                                />
                            )}
                            {'image' in card && card.image
                                ? (
                                    <img
                                        alt={card.name || t('editor.label.unnamed')}
                                        src={card.image}
                                        style={{
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'top center',
                                            position: 'relative',
                                            width: '100%',
                                        }}
                                    />
                                )
                                : (
                                    <Flex
                                        align="center"
                                        direction="column"
                                        justify="center"
                                        style={{ height: '100%', padding: 'var(--space-2)', position: 'relative' }}
                                    >
                                        <Text
                                            size="2"
                                            style={{
                                                color: 'white',
                                                display: 'block',
                                                overflow: 'hidden',
                                                textAlign: 'center',
                                                textOverflow: 'ellipsis',
                                                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                                whiteSpace: 'nowrap',
                                                width: '100%',
                                            }}
                                            weight="bold"
                                        >
                                            {card.name || t('editor.label.unnamed')}
                                        </Text>
                                        <Text
                                            size="1"
                                            style={{ color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                                        >
                                            {card.type}
                                        </Text>
                                    </Flex>
                                )}
                        </Box>
                        <Flex align="center" justify="between" mt="2">
                            <Text color="gray" size="1">
                                {card.name || t('editor.label.unnamed')}
                            </Text>
                            {onDeleteCard && (
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
                            )}
                        </Flex>
                    </Box>
                ))}
            </Grid>
        </>
    );
}
