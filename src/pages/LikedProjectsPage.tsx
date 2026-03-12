import { Badge, Box, Button, Card, Flex, Grid, Heading, Select, Spinner, Text } from '@radix-ui/themes';
import { ArrowDownAZ, ArrowUpAZ, Clock, Heart } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { LikedProject } from '../firebase/context';

import AppLayout from '../components/ui/AppLayout';
import { useFirebase } from '../hooks/useFirebase';
import { useLikes } from '../hooks/useLikes';
import { SUPPORTED_GAMES } from '../types/game';

type SortDir = 'asc' | 'desc';
type SortField = 'likedAt' | 'name' | 'updatedAt';

const ALL_GAMES = 'all';

interface LikedProjectCardProps {
    onNavigate: (projectId: string) => void;
    project: LikedProject;
}

export default function LikedProjectsPage() {
    const { user } = useFirebase();
    const { data: likedProjects, isLoading } = useLikes();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [gameFilter, setGameFilter] = useState<string>(ALL_GAMES);
    const [sortField, setSortField] = useState<SortField>('likedAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const filtered = useMemo<LikedProject[]>(() => {
        const list = likedProjects ?? [];
        const byGame = ALL_GAMES === gameFilter ? list : list.filter((p) => p.gameId === gameFilter);

        return [...byGame].sort((a, b) => {
            let cmp = 0;
            if ('name' === sortField) {
                cmp = a.name.localeCompare(b.name);
            } else if ('likedAt' === sortField) {
                cmp = new Date(a.likedAt).getTime() - new Date(b.likedAt).getTime();
            } else {
                cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            }
            return 'asc' === sortDir ? cmp : -cmp;
        });
    }, [gameFilter, likedProjects, sortDir, sortField]);

    if (!user) {
        return (
            <AppLayout>
                <Box p="9" style={{ textAlign: 'center' }}>
                    <Heart color="var(--gray-8)" size={40} />
                    <Heading color="gray" mb="2" mt="4" size="5">
                        {t('likes.page.signInTitle')}
                    </Heading>
                    <Text color="gray" size="3">
                        {t('likes.page.signInDescription')}
                    </Text>
                </Box>
            </AppLayout>
        );
    }

    const isAsc = 'asc' === sortDir;

    return (
        <AppLayout>
            <Box mb="6">
                <Flex align="center" gap="3" mb="1">
                    <Heading size="7">{t('likes.page.title')}</Heading>
                    {!isLoading && (
                        <Badge color="red" size="2" variant="soft">
                            {likedProjects?.length ?? 0}
                        </Badge>
                    )}
                </Flex>
                <Text color="gray" size="3">{t('likes.page.description')}</Text>
            </Box>

            {isLoading && (
                <Box py="9" style={{ textAlign: 'center' }}>
                    <Spinner size="3" />
                    <Text color="gray" ml="3">{t('likes.page.loading')}</Text>
                </Box>
            )}

            {!isLoading && (
                <>
                    {/* Toolbar */}
                    <Flex align="center" gap="3" mb="5" wrap="wrap">
                        <Flex align="center" gap="2">
                            <Text color="gray" size="2" weight="medium">{t('likes.filter.game')}</Text>
                            <Select.Root
                                onValueChange={setGameFilter}
                                value={gameFilter}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value={ALL_GAMES}>{t('likes.filter.allGames')}</Select.Item>
                                    {SUPPORTED_GAMES.map((g) => (
                                        <Select.Item key={g.id} value={g.id}>{g.name}</Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </Flex>

                        <Flex align="center" gap="2">
                            <Text color="gray" size="2" weight="medium">{t('likes.filter.sortBy')}</Text>
                            <Select.Root
                                onValueChange={(v: string) => setSortField(v as SortField)}
                                value={sortField}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="likedAt">{t('likes.filter.sort.likedDate')}</Select.Item>
                                    <Select.Item value="name">{t('likes.filter.sort.name')}</Select.Item>
                                    <Select.Item value="updatedAt">{t('likes.filter.sort.updatedDate')}</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Flex>

                        <Flex gap="1">
                            <Button
                                onClick={() => setSortDir('asc')}
                                size="2"
                                variant={isAsc ? 'solid' : 'ghost'}
                            >
                                {'name' === sortField ? <ArrowDownAZ size={16} /> : <Clock size={16} />}
                            </Button>
                            <Button
                                onClick={() => setSortDir('desc')}
                                size="2"
                                variant={isAsc ? 'ghost' : 'solid'}
                            >
                                {'name' === sortField ? <ArrowUpAZ size={16} /> : <Clock size={16} style={{ transform: 'scaleY(-1)' }} />}
                            </Button>
                        </Flex>

                        {0 < filtered.length && (
                            <Text color="gray" ml="auto" size="2">
                                {t('likes.filter.showing', { count: filtered.length, total: likedProjects?.length ?? 0 })}
                            </Text>
                        )}
                    </Flex>

                    {/* Empty state */}
                    {0 === (likedProjects?.length ?? 0) && (
                        <Box
                            style={{
                                backgroundColor: 'white',
                                border: '1px dashed var(--gray-6)',
                                borderRadius: 'var(--radius-4)',
                                padding: '60px 20px',
                                textAlign: 'center',
                            }}
                        >
                            <Heart color="var(--gray-7)" size={40} />
                            <Heading color="gray" mb="2" mt="4" size="5">
                                {t('likes.empty.title')}
                            </Heading>
                            <Text color="gray" size="3">
                                {t('likes.empty.description')}
                            </Text>
                        </Box>
                    )}

                    {/* No results after filter */}
                    {0 < (likedProjects?.length ?? 0) && 0 === filtered.length && (
                        <Box
                            style={{
                                backgroundColor: 'white',
                                border: '1px dashed var(--gray-6)',
                                borderRadius: 'var(--radius-4)',
                                padding: '40px 20px',
                                textAlign: 'center',
                            }}
                        >
                            <Text color="gray" size="3">{t('likes.empty.noResults')}</Text>
                        </Box>
                    )}

                    {/* Grid */}
                    {0 < filtered.length && (
                        <Grid columns={{ initial: '1', lg: '4', md: '3', sm: '2' }} gap="4">
                            {filtered.map((project) => (
                                <LikedProjectCard
                                    key={project.projectId}
                                    onNavigate={(id) => navigate(`/project/${id}`)}
                                    project={project}
                                />
                            ))}
                        </Grid>
                    )}
                </>
            )}
        </AppLayout>
    );
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function LikedProjectCard({ onNavigate, project }: LikedProjectCardProps) {
    const { t } = useTranslation();
    const game = SUPPORTED_GAMES.find((g) => g.id === project.gameId);

    return (
        <Card
            onClick={() => onNavigate(project.projectId)}
            size="2"
            style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
        >
            <Box
                style={{
                    alignItems: 'center',
                    backgroundColor: 'var(--gray-4)',
                    borderRadius: 'var(--radius-2)',
                    display: 'flex',
                    height: '100px',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    position: 'relative',
                }}
            >
                <Text color="gray" size="6">
                    {project.name.charAt(0).toUpperCase()}
                </Text>
                <Box style={{ bottom: '8px', position: 'absolute', right: '8px' }}>
                    <Heart fill="currentColor" size={14} style={{ color: 'var(--red-9)' }} />
                </Box>
            </Box>

            <Heading mb="1" size="3" trim="both">
                {project.name}
            </Heading>

            {project.description && (
                <Text color="gray" mb="2" size="2" style={{ display: 'block', lineHeight: 1.4 }}>
                    {project.description}
                </Text>
            )}

            <Flex align="center" gap="2" mt="2" wrap="wrap">
                {game && (
                    <Badge color="blue" size="1" variant="soft">
                        {game.name}
                    </Badge>
                )}
                {project.isPublic && (
                    <Badge color="green" size="1" variant="soft">
                        {t('likes.badge.public')}
                    </Badge>
                )}
            </Flex>

            <Flex direction="column" gap="1" mt="2">
                <Text color="gray" size="1">
                    {t('likes.card.liked', { date: formatDate(project.likedAt) })}
                </Text>
                <Text color="gray" size="1">
                    {t('projects.card.updated', { date: formatDate(project.updatedAt) })}
                </Text>
            </Flex>
        </Card>
    );
}
