import { Avatar, Badge, Box, Button, Card, Flex, Grid, Heading, Select, Spinner, Tabs, Text } from '@radix-ui/themes';
import { ArrowDownAZ, ArrowUpAZ, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import type { LikedProject, Project } from '../firebase/context';

import AppLayout from '../components/ui/AppLayout';
import ProjectCard, { CardThumbnail } from '../components/ui/ProjectCard';
import { useFirebase } from '../hooks/useFirebase';
import { useUserLikes } from '../hooks/useUserLikes';
import { useUserProjects } from '../hooks/useUserProjects';
import { SUPPORTED_GAMES } from '../types/game';

type CreatedSortField = 'createdAt' | 'name' | 'updatedAt';

interface EmptyStateProps {
    hasItems: boolean;
    message: string;
}

interface FilterToolbarProps {
    gameFilter: string;
    isNameSort: boolean;
    onGameFilterChange: (v: string) => void;
    onSortDirChange: (v: SortDir) => void;
    onSortFieldChange: (v: string) => void;
    sortDir: SortDir;
    sortField: string;
    sortOptions: { label: string; value: string }[];
    total: number;
    visible: number;
}

interface LikedProjectCardProps {
    onClick: () => void;
    project: LikedProject;
}

type LikedSortField = 'likedAt' | 'name' | 'updatedAt';

type SortDir = 'asc' | 'desc';

const ALL_GAMES = 'all';

export default function UserProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const { user } = useFirebase();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data: projects, isLoading: projectsLoading } = useUserProjects(userId);
    const { data: likes, isLoading: likesLoading } = useUserLikes(userId);

    const [createdGameFilter, setCreatedGameFilter] = useState(ALL_GAMES);
    const [createdSortField, setCreatedSortField] = useState<CreatedSortField>('updatedAt');
    const [createdSortDir, setCreatedSortDir] = useState<SortDir>('desc');

    const [likedGameFilter, setLikedGameFilter] = useState(ALL_GAMES);
    const [likedSortField, setLikedSortField] = useState<LikedSortField>('likedAt');
    const [likedSortDir, setLikedSortDir] = useState<SortDir>('desc');

    const filteredCreated = useMemo<Project[]>(() => {
        const list = projects ?? [];
        const byGame = ALL_GAMES === createdGameFilter ? list : list.filter((p) => p.gameId === createdGameFilter);
        return [...byGame].sort((a, b) => {
            let cmp = 0;
            if ('name' === createdSortField) {
                cmp = a.name.localeCompare(b.name);
            } else if ('createdAt' === createdSortField) {
                cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else {
                cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            }
            return 'asc' === createdSortDir ? cmp : -cmp;
        });
    }, [createdGameFilter, createdSortDir, createdSortField, projects]);

    const filteredLiked = useMemo<LikedProject[]>(() => {
        const list = likes ?? [];
        const byGame = ALL_GAMES === likedGameFilter ? list : list.filter((p) => p.gameId === likedGameFilter);
        return [...byGame].sort((a, b) => {
            let cmp = 0;
            if ('name' === likedSortField) {
                cmp = a.name.localeCompare(b.name);
            } else if ('likedAt' === likedSortField) {
                cmp = new Date(a.likedAt).getTime() - new Date(b.likedAt).getTime();
            } else {
                cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            }
            return 'asc' === likedSortDir ? cmp : -cmp;
        });
    }, [likedGameFilter, likedSortDir, likedSortField, likes]);

    const isOwnProfile = user?.uid === userId;
    const isLoading = projectsLoading || likesLoading;

    const displayName = isOwnProfile ? (user?.displayName || user?.email) : null;
    const nameSource = displayName ?? '?';
    const initials = nameSource
        .split(/[\s@]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0].toUpperCase())
        .join('');

    return (
        <AppLayout>
            <Box mb="6">
                <Flex align="center" gap="4" mb="2">
                    <Avatar
                        fallback={initials}
                        radius="full"
                        size="5"
                        src={isOwnProfile ? (user?.photoURL ?? undefined) : undefined}
                    />
                    <Box>
                        <Heading size="7">
                            {isOwnProfile ? t('userProfile.ownTitle') : t('userProfile.title')}
                        </Heading>
                        {displayName && (
                            <Text color="gray" size="3">{displayName}</Text>
                        )}
                    </Box>
                </Flex>
            </Box>

            {isLoading
                ? (
                    <Box py="9" style={{ textAlign: 'center' }}>
                        <Spinner size="3" />
                        <Text color="gray" ml="3">{t('userProfile.loading')}</Text>
                    </Box>
                )
                : (
                    <Tabs.Root defaultValue="created">
                        <Tabs.List>
                            <Tabs.Trigger value="created">
                                {t('userProfile.tab.created')}
                                {' '}
                                <Badge color="blue" ml="1" size="1" variant="soft">
                                    {projects?.length ?? 0}
                                </Badge>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="liked">
                                {t('userProfile.tab.liked')}
                                {' '}
                                <Badge color="red" ml="1" size="1" variant="soft">
                                    {likes?.length ?? 0}
                                </Badge>
                            </Tabs.Trigger>
                        </Tabs.List>

                        <Box pt="5">
                            <Tabs.Content value="created">
                                <FilterToolbar
                                    gameFilter={createdGameFilter}
                                    isNameSort={'name' === createdSortField}
                                    onGameFilterChange={setCreatedGameFilter}
                                    onSortDirChange={setCreatedSortDir}
                                    onSortFieldChange={(v) => setCreatedSortField(v as CreatedSortField)}
                                    sortDir={createdSortDir}
                                    sortField={createdSortField}
                                    sortOptions={[
                                        { label: t('likes.filter.sort.name'), value: 'name' },
                                        { label: t('likes.filter.sort.updatedDate'), value: 'updatedAt' },
                                        { label: t('userProfile.filter.sort.createdDate'), value: 'createdAt' },
                                    ]}
                                    total={projects?.length ?? 0}
                                    visible={filteredCreated.length}
                                />
                                {0 === filteredCreated.length
                                    ? (
                                        <EmptyState
                                            hasItems={0 < (projects?.length ?? 0)}
                                            message={t('userProfile.empty.noProjects')}
                                        />
                                    )
                                    : (
                                        <Grid columns={{ initial: '2', lg: '4', md: '3' }} gap="4">
                                            {filteredCreated.map((project) => (
                                                <ProjectCard
                                                    key={project.id}
                                                    onClick={() => navigate(`/project/${project.id}`)}
                                                    project={project}
                                                    showGame
                                                />
                                            ))}
                                        </Grid>
                                    )}
                            </Tabs.Content>

                            <Tabs.Content value="liked">
                                <FilterToolbar
                                    gameFilter={likedGameFilter}
                                    isNameSort={'name' === likedSortField}
                                    onGameFilterChange={setLikedGameFilter}
                                    onSortDirChange={setLikedSortDir}
                                    onSortFieldChange={(v) => setLikedSortField(v as LikedSortField)}
                                    sortDir={likedSortDir}
                                    sortField={likedSortField}
                                    sortOptions={[
                                        { label: t('likes.filter.sort.likedDate'), value: 'likedAt' },
                                        { label: t('likes.filter.sort.name'), value: 'name' },
                                        { label: t('likes.filter.sort.updatedDate'), value: 'updatedAt' },
                                    ]}
                                    total={likes?.length ?? 0}
                                    visible={filteredLiked.length}
                                />
                                {0 === filteredLiked.length
                                    ? (
                                        <EmptyState
                                            hasItems={0 < (likes?.length ?? 0)}
                                            message={t('userProfile.empty.noLikes')}
                                        />
                                    )
                                    : (
                                        <Grid columns={{ initial: '2', lg: '4', md: '3' }} gap="4">
                                            {filteredLiked.map((project) => (
                                                <LikedProjectCard
                                                    key={project.projectId}
                                                    onClick={() => navigate(`/project/${project.projectId}`)}
                                                    project={project}
                                                />
                                            ))}
                                        </Grid>
                                    )}
                            </Tabs.Content>
                        </Box>
                    </Tabs.Root>
                )}
        </AppLayout>
    );
}

function EmptyState({ hasItems, message }: EmptyStateProps) {
    const { t } = useTranslation();
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
                {hasItems ? t('likes.empty.noResults') : message}
            </Text>
        </Box>
    );
}

function FilterToolbar({
    gameFilter,
    isNameSort,
    onGameFilterChange,
    onSortDirChange,
    onSortFieldChange,
    sortDir,
    sortField,
    sortOptions,
    total,
    visible,
}: FilterToolbarProps) {
    const { t } = useTranslation();
    const isAsc = 'asc' === sortDir;

    return (
        <Flex align="center" gap="3" mb="5" wrap="wrap">
            <Flex align="center" gap="2">
                <Text color="gray" size="2" weight="medium">{t('likes.filter.game')}</Text>
                <Select.Root onValueChange={onGameFilterChange} value={gameFilter}>
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
                <Select.Root onValueChange={onSortFieldChange} value={sortField}>
                    <Select.Trigger />
                    <Select.Content>
                        {sortOptions.map((opt) => (
                            <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            </Flex>

            <Flex gap="1">
                <Button onClick={() => onSortDirChange('asc')} size="2" variant={isAsc ? 'solid' : 'ghost'}>
                    {isNameSort ? <ArrowDownAZ size={16} /> : <Clock size={16} />}
                </Button>
                <Button onClick={() => onSortDirChange('desc')} size="2" variant={isAsc ? 'ghost' : 'solid'}>
                    {isNameSort ? <ArrowUpAZ size={16} /> : <Clock size={16} style={{ transform: 'scaleY(-1)' }} />}
                </Button>
            </Flex>

            {0 < visible && (
                <Text color="gray" ml="auto" size="2">
                    {t('likes.filter.showing', { count: visible, total })}
                </Text>
            )}
        </Flex>
    );
}

function LikedProjectCard({ onClick, project }: LikedProjectCardProps) {
    const { i18n, t } = useTranslation();
    const game = SUPPORTED_GAMES.find((g) => g.id === project.gameId);

    const formatDate = (date: Date) => new Date(date).toLocaleDateString(i18n.resolvedLanguage, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <Card onClick={onClick} style={{ cursor: 'pointer' }}>

            <CardThumbnail project={project} />
            <Heading mb="1" size="3" trim="both">{project.name}</Heading>
            {project.description && (
                <Text color="gray" mb="2" size="2" style={{ display: 'block', lineHeight: 1.4 }}>
                    {project.description}
                </Text>
            )}
            <Flex align="center" gap="2" mt="1" wrap="wrap">
                {game && (
                    <Badge color="blue" size="1" variant="soft">{game.name}</Badge>
                )}
                {project.isPublic && (
                    <Badge color="green" size="1" variant="soft">{t('likes.badge.public')}</Badge>
                )}
            </Flex>
            <Text color="gray" mt="1" size="1" style={{ display: 'block' }}>
                {t('likes.card.liked', { date: formatDate(project.likedAt) })}
            </Text>
        </Card>
    );
}
