import { Badge, Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import LikeButton from 'components/ui/LikeButton';
import { useTranslation } from 'react-i18next';

import type { LikedProject, Project } from '../../firebase/context';

import { SUPPORTED_GAMES } from '../../types/game';

interface ProjectCardProps {
    isOwner?: boolean;
    onClick: () => void;
    project: Project;
    showGame?: boolean;
}

const TYPE_BACKGROUNDS: Record<string, { color: string; image?: string }> = {
    'zombicide-2e': { color: '#1a2e1a', image: '/zombicide-2nd/survivor/bg-front.svg' },
};

export const CardThumbnail = ({ project }: { project: LikedProject | Project }) => {
    const bg = TYPE_BACKGROUNDS[project.gameId] ?? { color: 'var(--gray-5)' };
    const { t } = useTranslation();

    return (
        <Flex
            align="center"
            justify="center"
            mb="3"
            style={{
                backgroundColor: bg.color,
                borderRadius: 'var(--radius-2)',
                height: '100px',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {bg.image && (
                <img
                    alt=""
                    src={bg.image}
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
            {project.cards?.map((card, index) => (
                <img
                    alt={card.name || t('editor.label.unnamed')}
                    key={card.id}
                    src={card.image}
                    style={{
                        height: '100%',
                        left: `calc(${index * 18}% + 10px)`,
                        objectFit: 'contain',
                        objectPosition: 'top left',
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                    }}
                />
            ))}
            {!project.cards?.length && (
                <Text color="gray" size="6" style={{ position: 'relative' }}>
                    {project.name.charAt(0).toUpperCase()}
                </Text>
            )}
            <Box style={{ bottom: '0px', position: 'absolute', right: '8px' }}>
                <LikeButton project={project} size="1" />
            </Box>
        </Flex>
    );
};

export default function ProjectCard({ isOwner, onClick, project, showGame }: ProjectCardProps) {
    const { i18n, t } = useTranslation();
    const game = SUPPORTED_GAMES.find((g) => g.id === project.gameId);

    const formatDate = (date: Date) => new Date(date).toLocaleDateString(i18n.resolvedLanguage, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <Card
            className="project-card"
            onClick={onClick}
            style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
        >
            <CardThumbnail project={project} />
            <Flex align="center" justify="between" mb="1">
                <Heading size="3" trim="both">{project.name}</Heading>
                <Flex align="center" gap="1">
                    {isOwner && (
                        <Text color="blue" size="1">{t('projects.card.yours')}</Text>
                    )}
                </Flex>
            </Flex>

            {project.description && (
                <Text color="gray" mb="2" size="2" style={{ display: 'block', lineHeight: 1.4 }}>
                    {project.description}
                </Text>
            )}

            {showGame && game && (
                <Flex align="center" gap="2" mb="1" wrap="wrap">
                    <Badge color="blue" size="1" variant="soft">{game.name}</Badge>
                </Flex>
            )}

            <Flex align="center" justify="between">
                <Text color="gray" size="1">
                    {t('projects.card.updated', { date: formatDate(project.updatedAt) })}
                </Text>
                {!!project.likesCount && (
                    <Text color="gray" size="1">
                        ♥ {t('projects.card.likes', { count: project.likesCount })}
                    </Text>
                )}
            </Flex>
        </Card>
    );
}
