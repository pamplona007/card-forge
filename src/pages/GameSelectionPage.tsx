import { Badge, Box, Button, Card, Grid, Heading, Text } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import AppLayout from '../components/ui/AppLayout';
import { COMING_SOON_GAMES, SUPPORTED_GAMES } from '../types/game';

export default function GameSelectionPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleViewProjects = (gameId: string) => {
        navigate(`/game/${gameId}`);
    };

    return (
        <AppLayout>
            <Box mb="6">
                <Heading mb="2" size="8">
                    {t('games.title')}
                </Heading>
                <Text color="gray" size="4">
                    {t('games.description')}
                </Text>
            </Box>

            <Grid
                columns={{ initial: '2', md: '4' }}
                gap="5"
            >
                {SUPPORTED_GAMES.map((game) => (
                    <Card
                        className="game-card"
                        key={game.id}
                        style={{
                            overflow: 'hidden',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                    >

                        <Box
                            style={{
                                backgroundColor: 'var(--gray-4)',
                                backgroundImage: `url(${game.imageUrl})`,
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                height: '160px',
                                position: 'relative',
                            }}
                        >
                            <Box
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: 'var(--gray-4)',
                                    display: 'flex',
                                    inset: 0,
                                    justifyContent: 'center',
                                    position: 'absolute',
                                }}
                            >
                                <Text color="gray" size="6">
                                    {game.name.charAt(0)}
                                </Text>
                            </Box>
                        </Box>

                        <Box mt={'2'}>
                            <Heading mb="1" size="5">
                                {game.name}
                            </Heading>
                            <Button
                                color="blue"
                                onClick={() => handleViewProjects(game.id)}
                                style={{ width: '100%' }}
                                variant="solid"
                            >
                                {t('games.button.viewProjects')}
                            </Button>
                        </Box>
                    </Card>
                ))}

                {COMING_SOON_GAMES.map((name) => (
                    <Card
                        key={name}
                        style={{
                            opacity: 0.6,
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            style={{
                                alignItems: 'center',
                                backgroundColor: 'var(--gray-4)',
                                display: 'flex',
                                height: '160px',
                                justifyContent: 'center',
                                position: 'relative',
                            }}
                        >
                            <Text color="gray" size="6">
                                {name.charAt(0)}
                            </Text>
                            <Box style={{ position: 'absolute', right: '8px', top: '8px' }}>
                                <Badge color="gray" variant="soft">
                                    {t('games.comingSoon')}
                                </Badge>
                            </Box>
                        </Box>
                        <Box mt={'2'}>
                            <Heading mb="1" size="5">
                                {name}
                            </Heading>
                            <Button
                                color="gray"
                                disabled
                                style={{ width: '100%' }}
                                variant="soft"
                            >
                                {t('games.comingSoon')}
                            </Button>
                        </Box>
                    </Card>
                ))}
            </Grid>

            {0 === SUPPORTED_GAMES.length && (
                <Box
                    style={{
                        backgroundColor: 'white',
                        border: '1px dashed var(--gray-6)',
                        borderRadius: 'var(--radius-4)',
                        padding: '60px 20px',
                        textAlign: 'center',
                    }}
                >
                    <Heading mb="2" size="5">
                        {t('games.empty.title')}
                    </Heading>
                    <Text color="gray">
                        {t('games.empty.description')}
                    </Text>
                </Box>
            )}
        </AppLayout>
    );
}
